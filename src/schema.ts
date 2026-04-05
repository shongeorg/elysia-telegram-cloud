import { pgTable, uuid, text, bigint, timestamp } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  tg_file_id: text("tg_file_id").unique().notNull(),
  file_name: text("file_name").notNull(),
  file_size: bigint("file_size", { mode: "number" }),
  mime_type: text("mime_type"),
  created_at: timestamp("created_at").defaultNow(),
});
