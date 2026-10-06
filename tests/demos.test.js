import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const demos = JSON.parse(readFileSync(join(root, "demos.json"), "utf8"));

test("demos.json - массив", () => {
  assert.ok(Array.isArray(demos));
});

test("slug в реестре не повторяются", () => {
  const slugs = demos.map((demo) => demo.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

// Правило курса «тире = минус»: длинное, среднее тире и юникодный минус запрещены и в демо.
const DASHES = /[\u2014\u2013\u2212]/;
test("в демо нет длинного и среднего тире и юникодного минуса", () => {
  const files = ["index.html", "kit/kit.css", "kit/format.js", "kit/ui.js",
    ...demos.flatMap((demo) => [`${demo.slug}/index.html`, `${demo.slug}/logic.js`])];
  for (const file of files.filter((f) => existsSync(join(root, f)))) {
    assert.ok(!DASHES.test(readFileSync(join(root, file), "utf8")), `${file}: тире или юникодный минус`);
  }
});

for (const demo of demos) {
  test(`${demo.slug}: запись реестра корректна`, () => {
    assert.match(demo.slug, /^m\d{2}\/[a-z0-9-]+$/);
    assert.equal(Number(demo.slug.slice(1, 3)), demo.module, "номер модуля в slug и в module");
    assert.ok(Number.isInteger(demo.lesson) && demo.lesson >= 1, "lesson - номер урока");
    assert.ok(typeof demo.title === "string" && demo.title.length > 0, "title");
    assert.ok(Number.isInteger(demo.height) && demo.height >= 200 && demo.height <= 600, "height 200..600");
    for (const file of ["index.html", "logic.js", "golden.json"]) {
      assert.ok(existsSync(join(root, demo.slug, file)), `нет ${demo.slug}/${file}`);
    }
  });
}
