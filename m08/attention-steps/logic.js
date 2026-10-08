// Логика демо «Конвейер внимания» (модуль 8, уроки «Attention Scores», «Softmax»,
// «Контекстные векторы»). Две цепочки: «вручную» - как в уроках, каждый шаг округлён до
// 4 знаков (ROUND_HALF_UP; целые числа: входы в сотых, остальное в десятитысячных), и
// «код» - SimpleSelfAttention урока 6 без промежуточных округлений.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";

export const TOKENS = ["The", "cat", "loved"];
export const LIMIT = 200;   // |x| ≤ 2, в сотых
export const PRESETS = [
  { label: "урок", x: [[43, 15, 89], [55, 87, 66], [57, 85, 64]] },
  { label: "все одинаковые", x: [[50, 50, 50], [50, 50, 50], [50, 50, 50]] },
  { label: "один длинный", x: [[43, 15, 89], [110, 174, 132], [57, 85, 64]] },
  { label: "с минусами", x: [[43, 15, 89], [-55, -87, -66], [57, 85, 64]] },
];
const SUB = ["₁", "₂", "₃"];

/** Текст клетки → целое в сотых или null: до 2 знаков после точки (запятая тоже), |x| ≤ 2. */
export function parseCell(text) {
  const t = String(text).trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const v = Math.round(Number(t) * 100);
  return Math.abs(v) <= LIMIT ? v : null;
}

/** Целое в единицах 10^-k → строка с k знаками: units(3448) = «0.3448», units(-55, 2) = «-0.55». */
export function units(n, k = 4) {
  const s = String(Math.abs(n)).padStart(k + 1, "0");
  return `${n < 0 ? "-" : ""}${s.slice(0, -k)}.${s.slice(-k)}`;
}

const paren = (text) => (text.startsWith("-") ? `(${text})` : text);

/** num / den с округлением половины от нуля (den > 0). */
function halfUp(num, den) {
  const q = Math.floor((2 * Math.abs(num) + den) / (2 * den));
  return num < 0 ? -q : q;
}

/** Ручная цепочка уроков 3-5: S, E (экспоненты), sum, W, T[i][d][j] (слагаемые), Z - в десятитысячных. */
export function manual(X) {
  const S = X.map((a) => X.map((b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const E = S.map((row) => row.map((s) => Math.round(Number(fixed(Math.exp(s / 1e4), 4)) * 1e4)));
  const sum = E.map((row) => row[0] + row[1] + row[2]);
  const W = E.map((row, i) => row.map((e) => halfUp(e * 1e4, sum[i])));
  const T = W.map((w) => [0, 1, 2].map((d) => [0, 1, 2].map((j) => halfUp(w[j] * X[j][d], 100))));
  const Z = T.map((rows) => rows.map((t) => t[0] + t[1] + t[2]));
  return { S, E, sum, W, T, Z };
}

/** Как SimpleSelfAttention урока 6 (без округлений): scores, softmax по строкам, weights @ X. */
export function exact(X) {
  const x = X.map((row) => row.map((v) => v / 100));
  const S = x.map((a) => x.map((b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const W = S.map((row) => {
    const top = Math.max(...row);
    const e = row.map((s) => Math.exp(s - top));
    const total = e[0] + e[1] + e[2];
    return e.map((v) => v / total);
  });
  const Z = W.map((w) => [0, 1, 2].map((d) => w[0] * x[0][d] + w[1] * x[1][d] + w[2] * x[2][d]));
  return { S, W, Z };
}

/** Пометка, если код даёт другое число, чем ручная цепочка. */
function mark(text, value) {
  const code = fixed(value, 4);
  return code === text ? "" : ` (код: ${code})`;
}

/** Строки урока 3: скалярные произведения запроса i со всеми токенами. */
export function scoreLines(X, i) {
  const m = manual(X);
  return [0, 1, 2].map((j) => {
    const prods = [0, 1, 2].map((d) => `${paren(units(X[i][d], 2))}×${paren(units(X[j][d], 2))}`).join(" + ");
    const terms = [0, 1, 2].map((d) => paren(units(X[i][d] * X[j][d]))).join(" + ");
    return `${TOKENS[i]} · ${TOKENS[j]} = ${prods} = ${terms} = ${units(m.S[i][j])}`;
  });
}

/** Строки урока 4: экспоненты, сумма, деления и проверка суммы весов для строки i. */
export function softmaxLines(X, i) {
  const m = manual(X);
  const c = exact(X);
  const E = m.E[i].map((e) => units(e));
  const S = units(m.sum[i]);
  const W = m.W[i].map((w) => units(w));
  return {
    exps: m.S[i].map((s, j) => `e^${paren(units(s))} = ${E[j]}`),
    sum: `Сумма = ${E.join(" + ")} = ${S}`,
    divs: W.map((w, j) => `weight_${j + 1} = ${E[j]} / ${S} = ${w}${mark(w, c.W[i][j])}`),
    check: `${W.join(" + ")} = ${units(m.W[i][0] + m.W[i][1] + m.W[i][2])}`,
  };
}

/** Строки урока 5: z₁, z₂, z₃ контекстного вектора токена i. */
export function contextLines(X, i) {
  const m = manual(X);
  const c = exact(X);
  return [0, 1, 2].map((d) => {
    const prods = [0, 1, 2].map((j) => `${units(m.W[i][j])}×${paren(units(X[j][d], 2))}`).join(" + ");
    const terms = m.T[i][d].map((t) => paren(units(t))).join(" + ");
    const z = units(m.Z[i][d]);
    return `z${SUB[d]} = ${prods} = ${terms} = ${z}${mark(z, c.Z[i][d])}`;
  });
}

export const scoreMatrix = (X) => manual(X).S.map((row) => row.map((s) => units(s)));

const table = (manualRows, codeRows) => ({
  manual: manualRows.map((row) => row.map((v) => units(v))),
  code: codeRows.map((row) => row.map((v) => fixed(v, 4))),
});

export const weightMatrix = (X) => table(manual(X).W, exact(X).W);
export const contextMatrix = (X) => table(manual(X).Z, exact(X).Z);
