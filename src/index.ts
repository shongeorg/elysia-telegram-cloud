import { Elysia, t } from "elysia";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, ilike } from "drizzle-orm";
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
