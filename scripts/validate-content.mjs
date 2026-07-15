import { readFile } from "node:fs/promises";

const file = new URL("../content/posts.json", import.meta.url);
const raw = await readFile(file, "utf8");
const data = JSON.parse(raw);
const errors = [];

if (!Array.isArray(data.categories) || data.categories.length === 0) {
  errors.push("categories muss ein nicht-leeres Array sein.");
}
if (!Array.isArray(data.posts)) {
  errors.push("posts muss ein Array sein.");
}

const categoryIds = new Set((data.categories ?? []).map((item) => item.id));
const ids = new Set();

for (const [index, post] of (data.posts ?? []).entries()) {
  const prefix = `posts[${index}]`;
  for (const key of ["id", "title", "category", "excerpt", "image"]) {
    if (!post[key] || typeof post[key] !== "string") {
      errors.push(`${prefix}.${key} fehlt oder ist kein Text.`);
    }
  }
  if (ids.has(post.id)) errors.push(`${prefix}.id ist doppelt: ${post.id}`);
  ids.add(post.id);
  if (!categoryIds.has(post.category)) {
    errors.push(`${prefix}.category ist unbekannt: ${post.category}`);
  }
  if (post.url) {
    try {
      const url = new URL(post.url);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      errors.push(`${prefix}.url ist keine gültige HTTP(S)-Adresse.`);
    }
  }
}

if (errors.length) {
  console.error("Content-Prüfung fehlgeschlagen:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`OK: ${data.posts.length} Beiträge in ${data.categories.length} Kategorien.`);
