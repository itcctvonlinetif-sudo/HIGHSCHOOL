import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { classesTable } from "./classes";

export const classGalleryTable = pgTable("class_gallery", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  imageUrl: text("image_url").notNull(),
  mediaType: text("media_type").notNull().default("image"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClassGallerySchema = createInsertSchema(classGalleryTable).omit({ id: true, createdAt: true });
export type InsertClassGallery = z.infer<typeof insertClassGallerySchema>;
export type ClassGalleryItem = typeof classGalleryTable.$inferSelect;