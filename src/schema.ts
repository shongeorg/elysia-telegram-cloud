import {
  pgTable,
  uuid,
  text,
  bigint,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  tg_file_id: text("tg_file_id").unique().notNull(),
  file_name: text("file_name").notNull(),
  file_size: bigint("file_size", { mode: "number" }),
  mime_type: text("mime_type"),
  created_at: timestamp("created_at").defaultNow(),

  // теги з аудіофайлу — заповнює /api/tags/:id при першому програванні
  title: text("title"),
  artist: text("artist"),
  album: text("album"),
  genre: text("genre"),
  year: integer("year"),
  duration_ms: integer("duration_ms"),
  bitrate: integer("bitrate"),
  sample_rate: integer("sample_rate"),
  has_cover: boolean("has_cover").default(false).notNull(),
  cover_mime: text("cover_mime"),
  tags_parsed_at: timestamp("tags_parsed_at"),
});
