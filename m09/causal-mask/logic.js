// Логика демо «Каузальная маска» (модуль 9, урок «Causal Mask»). Scores 4×4 для
// «Кот любил сметану .»: строка «любил» - пример урока [1.2, 0.8, 2.1, 0.5], остальные - пример демо.
// Маска CausalMask урока 10 ставит -∞ выше диагонали, softmax даёт там вес 0.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed, num, percent } from "../../kit/format.js";

export const TOKENS = ["Кот", "любил", "сметану", "."];
export const LIMIT = 500;   // |s| ≤ 5, в сотых
export const PRESET = [[90, 150, 30, 110], [120, 80, 210, 50], [40, 170, 130, 60], [20, 50, 160, 90]];
const R4 = [0, 1, 2, 3];

/** Клетка scores → целое в сотых или null: до 2 знаков после точки (запятая тоже), |s| ≤ 5. */
export function parseCell(text) {
  const t = String(text).trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const v = Math.round(Number(t) * 100);
  return Math.abs(v) <= LIMIT ? v : null;
}

const quoted = (names) => {
  const q = names.map((n) => `«${n}»`);
  return q.length === 1 ? q[0] : `${q.slice(0, -1).join(", ")} и ${q[q.length - 1]}`;
};

export const scoresText = (S) => S.map((row) => row.map((v) => num(v / 100, 2)));
export const maskText = () => R4.map((i) => R4.map((j) => (j > i ? "-∞" : "0")));
export const maskedText = (S) => S.map((row, i) => row.map((v, j) => (j > i ? "-∞" : num(v / 100, 2))));

/** Softmax по строкам; с маской клетки выше диагонали получают вес 0. */
export function weights(S, on) {
  return S.map((row, i) => {
    const s = row.map((v, j) => (on && j > i ? -Infinity : v / 100));
    const top = Math.max(...s);
    const e = s.map((v) => Math.exp(v - top));
    const total = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / total);
  });
}

export function weightText(S, on) {
  const w = weights(S, on);
  return R4.map((i) => R4.map((j) => (on && j > i ? "0" : fixed(w[i][j], 4))));
}

/** Кого видит токен t (с маской) или сколько внимания уходит будущему (без маски). */
export function seesText(S, t, on) {
  const name = `«${TOKENS[t]}»`;
  if (t === 3) return on ? `${name} видит все 4 токена: будущих у него нет.` : `${name} - последний токен: будущего у него нет, маска ничего не меняет.`;
  const future = TOKENS.slice(t + 1);
  if (on) {
    const seen = t === 0 ? "только себя" : quoted(TOKENS.slice(0, t + 1));
    return `${name} видит ${seen}, а ${quoted(future)} ${future.length === 1 ? "закрыт" : "закрыты"} маской.`;
  }
  const share = weights(S, false)[t].slice(t + 1).reduce((a, b) => a + b, 0);
  return `Без маски ${name} видит и будущее: ${quoted(future)} ${future.length === 1 ? "получает" : "получают"} ${percent(share)} внимания.`;
}

export const softmaxLine = (S, t, on) =>
  `softmax([${(on ? maskedText(S) : scoresText(S))[t].join(", ")}]) = [${weightText(S, on)[t].join(", ")}]`;

/** Что печатает CausalMask.visualize(CausalMask.create(4)) урока 10. */
export function visualizeText() {
  const header = " ".repeat(9) + R4.map((j) => String(j).padStart(8)).join("");
  const rows = R4.map((i) => String(i).padStart(8) + R4.map((j) => (j > i ? "-inf" : "0").padStart(8)).join(""));
  return ["Каузальная маска:", header, ...rows].join("\n");
}
