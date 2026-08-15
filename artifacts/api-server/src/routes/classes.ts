import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, classesTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();
const DEFAULT_ACCESS_PASSWORD = "kelas123";

router.get("/classes", async (req, res) => {
  try {
    const published = req.query.published;
    const where = published === "true"
      ? eq(classesTable.isPublished, true)
      : published === "false"
        ? eq(classesTable.isPublished, false)
        : undefined;
    const items = await db.select().from(classesTable).where(where).orderBy(classesTable.createdAt);
    res.json(items);
  } catch (err) {
    req.log.error({ err }, "Failed to get classes");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function getSettingsMap() {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

router.get("/classes/access-settings", async (req, res) => {
  try {
    const map = await getSettingsMap();
    res.json({
      classesPageTitle: map.classesPageTitle ?? "Kelas",
      classesPageDescription: map.classesPageDescription ?? "Kumpulan kelas dan pembelajaran warga.",
      hasPassword: true,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get classes access settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/classes/verify-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ success: false, message: "Password diperlukan" });
    const map = await getSettingsMap();
    const hash = map.classesAccessPasswordHash;
    const valid = hash
      ? await bcrypt.compare(password, hash)
      : password === DEFAULT_ACCESS_PASSWORD;
    if (!valid) return res.status(401).json({ success: false, message: "Password salah" });
    res.json({ success: true, message: "Akses diberikan" });
  } catch (err) {
    req.log.error({ err }, "Failed to verify classes password");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/classes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [item] = await db.select().from(classesTable).where(eq(classesTable.id, id));
    if (!item) return res.status(404).json({ error: "Class not found" });
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to get class");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/classes", async (req, res) => {
  try {
    const { title, slug, content, excerpt, imageUrl, author, isPublished, publishedAt } = req.body;
    const [item] = await db.insert(classesTable).values({
      title,
      slug,
      content,
      excerpt,
      imageUrl: imageUrl ?? null,
      author,
      isPublished: isPublished ?? false,
      publishedAt: publishedAt ? new Date(publishedAt) : null,
    }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to create class");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/classes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, slug, content, excerpt, imageUrl, author, isPublished, publishedAt } = req.body;
    const [item] = await db.update(classesTable)
      .set({
        title,
        slug,
        content,
        excerpt,
        imageUrl: imageUrl ?? null,
        author,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(classesTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "Class not found" });
    res.json(item);
  } catch (err) {
    req.log.error({ err }, "Failed to update class");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/classes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(classesTable).where(eq(classesTable.id, id));
    res.json({ success: true, message: "Class deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete class");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/classes-access", async (req, res) => {
  try {
    const map = await getSettingsMap();
    res.json({
      classesPageTitle: map.classesPageTitle ?? "Kelas",
      classesPageDescription: map.classesPageDescription ?? "Kumpulan kelas dan pembelajaran warga.",
      hasPassword: true,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin classes access settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/classes-access", async (req, res) => {
  try {
    const { classesPageTitle, classesPageDescription, classesAccessPassword } = req.body;
    const values = [
      ["classesPageTitle", classesPageTitle],
      ["classesPageDescription", classesPageDescription],
    ] as const;
    for (const [key, value] of values) {
      if (value !== undefined) {
        await db.insert(settingsTable)
          .values({ key, value: String(value) })
          .onConflictDoUpdate({ target: settingsTable.key, set: { value: String(value) } });
      }
    }
    if (classesAccessPassword !== undefined && classesAccessPassword !== "") {
      const hash = await bcrypt.hash(classesAccessPassword, 10);
      await db.insert(settingsTable)
        .values({ key: "classesAccessPasswordHash", value: hash })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: hash } });
    }
    res.json({ success: true, message: "Pengaturan Kelas berhasil disimpan" });
  } catch (err) {
    req.log.error({ err }, "Failed to save classes access settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;