import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Все папки демо с эталоном: mNN/<slug>/golden.json. */
function goldenDirs() {
  const dirs = [];
  for (const mod of readdirSync(root).filter((name) => /^m\d{2}$/.test(name)).sort()) {
    for (const slug of readdirSync(join(root, mod)).sort()) {
      if (existsSync(join(root, mod, slug, "golden.json"))) dirs.push(`${mod}/${slug}`);
    }
  }
  return dirs;
}

/** Сравнение с эталоном: числа - с допуском, массивы и объекты - поэлементно, остальное - точно. */
function close(actual, expected, where) {
  if (typeof expected === "number") {
    assert.equal(typeof actual, "number", `${where}: ожидалось число, пришло ${JSON.stringify(actual)}`);
    const tolerance = 1e-9 * Math.max(1, Math.abs(expected));
    assert.ok(Math.abs(actual - expected) <= tolerance, `${where}: ${actual} != ${expected}`);
  } else if (Array.isArray(expected)) {
    assert.ok(Array.isArray(actual), `${where}: ожидался массив, пришло ${JSON.stringify(actual)}`);
    assert.equal(actual.length, expected.length, `${where}: длина`);
    expected.forEach((item, i) => close(actual[i], item, `${where}[${i}]`));
  } else if (expected !== null && typeof expected === "object") {
    assert.ok(actual !== null && typeof actual === "object", `${where}: ожидался объект`);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${where}: ключи`);
    for (const key of Object.keys(expected)) close(actual[key], expected[key], `${where}.${key}`);
  } else {
    assert.equal(actual, expected, where);
  }
}

test("есть хотя бы один эталон", () => {
  assert.ok(goldenDirs().length > 0);
});

for (const dir of goldenDirs()) {
  const golden = JSON.parse(readFileSync(join(root, dir, "golden.json"), "utf8"));
  test(`${dir}: logic.js совпадает с эталоном (${golden.cases.length} случаев)`, async () => {
    const logic = await import(pathToFileURL(join(root, dir, "logic.js")).href);
    golden.cases.forEach((c, i) => {
      const where = `${dir} #${i} ${c.fn}(${JSON.stringify(c.args)})`;
      assert.equal(typeof logic[c.fn], "function", `${where}: в logic.js нет функции ${c.fn}`);
      close(logic[c.fn](...c.args), c.expect, where);
      if ("display" in c) {
        assert.equal(typeof logic.display?.[c.fn], "function", `${where}: нет display.${c.fn}`);
        assert.equal(logic.display[c.fn](...c.args), c.display, `${where}: display`);
      }
    });
  });
}
