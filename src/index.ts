import { Elysia, t } from "elysia";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, ilike } from "drizzle-orm";
// Власний парсер тегів (src/tags.ts) — чистий TS без зовнішніх залежностей.
// music-metadata прибрано: у неї (і в strtok3) роздвоєні умовні exports
// "node"/"default" без гілки "bun", через що Vercel NFT пакує не той файл,
// а Bun у рантаймі його не знаходить → 500 FUNCTION_INVOCATION_FAILED.
import { parseAudio } from "./tags";
import { files } from "./schema";
import { mainRoutes } from "./routes/main";
import { cors } from "@elysiajs/cors";

const PRODUCTION_URL = process.env.PRODUCTION_URL!;
const DEVELOPMENT_URL = process.env.DEVELOPMENT_URL!;
const DB_URL = process.env.DB_URL!;

const sql = neon(DB_URL);
const db = drizzle(sql);

const PORT = process.env.PORT!;
const app = new Elysia();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// Теги читаємо не з усього файлу, а точковим Range-запитом:
// у mp3 ID3-тег лежить на початку (його розмір є в перших 10 байтах),
// тому вистачає кількох сотень KB замість усього треку.
const AUDIO_PROBE_BYTES = 256 * 1024; // трохи аудіо після тегу — для бітрейту/тривалості
const MAX_TAG_BYTES = 4 * 1024 * 1024; // стеля на ID3-тег (обкладинки бувають важкі)
const MAX_FULL_FILE_BYTES = 16 * 1024 * 1024; // m4a з moov у хвості — доведеться качати цілком
const MAX_HEAD_BYTES = 1024 * 1024; // якщо файл завеликий — читаємо хоча б початок

async function telegramFilePath(fileId: string): Promise<string | null> {
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`,
  );
  const data = await res.json();
  return data.ok ? data.result.file_path : null;
}

function isId3v2(head: Uint8Array) {
  return head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33;
}

async function readTagBytes(url: string, fileSize: number | null) {
  const headRes = await fetch(url, { headers: { Range: "bytes=0-15" } });
  const head = new Uint8Array(await headRes.arrayBuffer());

  if (isId3v2(head) && headRes.status === 206) {
    const tagSize =
      ((head[6] & 0x7f) << 21) |
      ((head[7] & 0x7f) << 14) |
      ((head[8] & 0x7f) << 7) |
      (head[9] & 0x7f);
    const footer = head[5] & 0x10 ? 10 : 0;
    const end = Math.min(
      10 + tagSize + footer + AUDIO_PROBE_BYTES,
      MAX_TAG_BYTES,
    );
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${end - 1}` },
    });
    return new Uint8Array(await res.arrayBuffer());
  }

  // не mp3 з ID3: m4a/flac/ogg парсяться лише цілим файлом
  if (fileSize && fileSize > MAX_FULL_FILE_BYTES) {
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${MAX_HEAD_BYTES - 1}` },
    });
    return new Uint8Array(await res.arrayBuffer());
  }

  const res = await fetch(url);
  return new Uint8Array(await res.arrayBuffer());
}

// Postgres-поля year/duration_ms/bitrate/sample_rate — integer, тому NaN/Infinity
// туди потрапляти не мають (раніше це давало NeonDbError). Гарантуємо null.
function intOrNull(v: number | null): number | null {
  return v !== null && Number.isFinite(v) ? Math.round(v) : null;
}

async function parseTags(url: string, fileSize: number | null) {
  const buf = await readTagBytes(url, fileSize);
  const { tags } = parseAudio(buf, fileSize);

  return {
    title: tags.title,
    artist: tags.artist,
    album: tags.album,
    genre: tags.genre,
    year: intOrNull(tags.year),
    duration_ms: intOrNull(tags.duration_ms),
    bitrate: intOrNull(tags.bitrate),
    sample_rate: intOrNull(tags.sample_rate),
    has_cover: tags.has_cover,
    cover_mime: tags.cover_mime,
  };
}


app.onAfterHandle(({ set }) => {
  set.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";
});

app.use(
  cors({
    origin: [
      DEVELOPMENT_URL,
      PRODUCTION_URL,
      "https://maket-photon.vercel.app",
      "https://player-three-nu.vercel.app",
      /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(mainRoutes);

app.get("/robots.txt", ({ set }) => {
  set.headers["Content-Type"] = "text/plain; charset=utf-8";
  return "User-agent: *\nDisallow: /\n";
});

app.get("/api", () => {
  return {
    msg: "Elysia telegram cloude storage api",
  };
});

app.get("/api/files", async () => {
  return await db.select().from(files);
});

app.get("/api/music", async () => {
  const musicFiles = await db
    .select()
    .from(files)
    .where(ilike(files.mime_type, "audio/%"));
  const botToken = process.env.TELEGRAM_BOT_TOKEN!;

  const result = await Promise.all(
    musicFiles.map(async (file) => {
      try {
        const getFileRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getFile?file_id=${file.tg_file_id}`,
        );
        const getFileData = await getFileRes.json();

        if (getFileData.ok) {
          const filePath = getFileData.result.file_path;
          return {
            ...file,
            download_url: `https://api.telegram.org/file/bot${botToken}/${filePath}`,
          };
        }
        return { ...file, download_url: null };
      } catch {
        return { ...file, download_url: null };
      }
    }),
  );

  return result;
});

// Теги треку: при першому зверненні парсимо файл і кешуємо в БД,
// далі віддаємо вже збережене (повторні запуски треку не смикають Telegram).
app.get(
  "/api/tags/:id",
  async ({ params, set }) => {
    const file = (
      await db.select().from(files).where(eq(files.id, params.id)).limit(1)
    )[0];

    if (!file) {
      set.status = 404;
      return { success: false, error: "File not found" };
    }

    if (file.tags_parsed_at) {
      const { id, tg_file_id, created_at, tags_parsed_at, ...tags } = file;
      return { success: true, cached: true, tags };
    }

    const filePath = await telegramFilePath(file.tg_file_id);
    if (!filePath) {
      set.status = 502;
      return { success: false, error: "Telegram getFile failed" };
    }

    try {
      const tags = await parseTags(
        `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
        file.file_size,
      );

      await db
        .update(files)
        .set({ ...tags, tags_parsed_at: new Date() })
        .where(eq(files.id, file.id));

      return { success: true, cached: false, tags };
    } catch (error) {
      // не 500: теги — це приємний бонус, плеєр має грати далі
      console.error(`Не вдалось прочитати теги ${file.file_name}:`, error);
      return { success: false, error: "Failed to parse tags" };
    }
  },
  {
    params: t.Object({
      id: t.String(),
    }),
  },
);

// Обкладинка окремим URL: браузер кешує її сам, тому Telegram смикається один раз.
app.get(
  "/api/cover/:id",
  async ({ params, set }) => {
    const file = (
      await db.select().from(files).where(eq(files.id, params.id)).limit(1)
    )[0];

    if (!file || !file.has_cover) {
      set.status = 404;
      return { success: false, error: "Cover not found" };
    }

    const filePath = await telegramFilePath(file.tg_file_id);
    if (!filePath) {
      set.status = 502;
      return { success: false, error: "Telegram getFile failed" };
    }

    try {
      const buf = await readTagBytes(
        `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`,
        file.file_size,
      );
      const { picture } = parseAudio(buf, file.file_size);

      if (!picture) {
        set.status = 404;
        return { success: false, error: "Cover not found" };
      }

      set.headers["Content-Type"] = picture.mime;
      set.headers["Cache-Control"] = "public, max-age=31536000, immutable";
      return picture.data;
    } catch (error) {
      console.error(`Не вдалось дістати обкладинку ${file.file_name}:`, error);
      set.status = 502;
      return { success: false, error: "Failed to read cover" };
    }
  },
  {
    params: t.Object({
      id: t.String(),
    }),
  },
);

app.post(
  "/api/webhook",
  async ({ body }: { body: any }) => {
    const post = body.channel_post;
    if (!post) return { ok: true };

    const fileData =
      post.document ||
      post.audio ||
      post.video ||
      (post.photo ? post.photo[post.photo.length - 1] : null);

    if (fileData) {
      await db
        .insert(files)
        .values({
          tg_file_id: fileData.file_id,
          file_name: fileData.file_name || `file_${Date.now()}`,
          file_size: fileData.file_size || 0,
          mime_type: fileData.mime_type || "image/jpeg",
        })
        .onConflictDoNothing();

      console.log(`Файл ${fileData.file_id} збережено в Neon`);
    }

    return { ok: true };
  },
  {
    body: t.Object({}, { additionalProperties: true }),
  },
);

app.get(
  "/api/download/:id",
  async ({ params, set }) => {
    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, params.id))
      .limit(1);

    if (!file.length) {
      set.status = 404;
      return { success: false, error: "File not found" };
    }

    const tgFile = file[0];
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;

    const getFileRes = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${tgFile.tg_file_id}`,
    );
    const getFileData = await getFileRes.json();

    if (!getFileData.ok) {
      set.status = 500;
      return { success: false, error: "Telegram getFile failed" };
    }

    const filePath = getFileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    const downloadRes = await fetch(fileUrl);
    set.headers["Content-Type"] =
      tgFile.mime_type || "application/octet-stream";
    set.headers["Content-Disposition"] =
      `attachment; filename="${tgFile.file_name}"`;

    return downloadRes.body;
  },
  {
    params: t.Object({
      id: t.String(),
    }),
  },
);

app.onError(({ code, error, set }) => {
  set.headers["X-Robots-Tag"] = "noindex, nofollow, noarchive";

  if (code === "VALIDATION") {
    set.status = 400;
    return {
      success: false,
      error: "Validation error",
      details: error.all,
    };
  }

  if (code === "NOT_FOUND") {
    set.status = 404;
    return {
      success: false,
      error: "Not found",
    };
  }

  set.status = 500;
  return {
    success: false,
    error: "Internal server error",
  };
});

app.listen(PORT, () => {
  console.log(`server run on http://localhost:${PORT}`);
});

export default app;
