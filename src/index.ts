import { Elysia, t } from "elysia";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
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
    origin: [DEVELOPMENT_URL, PRODUCTION_URL],
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
