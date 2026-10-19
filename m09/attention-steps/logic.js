// Логика демо «Конвейер внимания с весами» (модуль 9, уроки «Q, K, V», «Attention Scores»,
// «Softmax», «Контекстные векторы», «Сравнение»). Две цепочки: «вручную» - как в уроках 4-8
// (ROUND_HALF_UP: Q, K, V точны, каждое произведение q·k и w·v и каждый шаг - до 4 знаков;
// целые числа: X в сотых, W в десятых, Q, K, V в тысячных, остальное в десятитысячных) и
// «код» - SelfAttention урока 10 без промежуточных округлений.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";

export const TOKENS = ["The", "cat", "loved"];
export const MATS = ["X", "Q", "K", "V"];
const LESSON_X = [[43, 15, 89], [55, 87, 66], [57, 85, 64]];
const LESSON_W = {
  Q: [[5, 2, 1], [3, 6, 2], [1, 1, 7]],
  K: [[4, 3, 2], [2, 5, 3], [3, 2, 6]],
  V: [[6, 1, 2], [1, 7, 1], [2, 2, 5]],
};
const EYE = [[10, 0, 0], [0, 10, 0], [0, 0, 10]];
const IDENTITY = { Q: EYE, K: EYE, V: EYE };
export const PRESETS = [
  { label: "урок", x: LESSON_X, w: LESSON_W },
  { label: "единичные W", x: LESSON_X, w: IDENTITY },
  { label: "W_K вдвое сильнее", x: LESSON_X, w: { ...LESSON_W, K: LESSON_W.K.map((row) => row.map((v) => 2 * v)) } },
];
const SUB = ["₁", "₂", "₃"];
const NAMES = { Q: "q", K: "k", V: "v" };
const S_MAX = 160000;   // score ≤ 16
const S_MIN = -20000;   // в строке есть score ≥ -2: при меньших экспоненты с 4 знаками теряют точность
const R3 = [0, 1, 2];

function parse(text, pattern, scale) {
  const t = String(text).trim().replace(",", ".");
  if (!pattern.test(t)) return null;
  const v = Math.round(Number(t) * scale);
  return Math.abs(v) <= 2 * scale ? v : null;
}

/** Клетка X → целое в сотых или null: до 2 знаков после точки (запятая тоже), |x| ≤ 2. */
export const parseX = (text) => parse(text, /^-?\d+(\.\d{1,2})?$/, 100);
/** Клетка W → целое в десятых или null: до 1 знака после точки, |w| ≤ 2. */
export const parseW = (text) => parse(text, /^-?\d+(\.\d)?$/, 10);

/** Целое в единицах 10^-k → строка с k знаками: units(3448) = «0.3448», units(-5, 1) = «-0.5». */
export function units(n, k = 4) {
  const s = String(Math.abs(n)).padStart(k + 1, "0");
  return `${n < 0 ? "-" : ""}${s.slice(0, -k)}.${s.slice(-k)}`;
}

const paren = (text) => (text.startsWith("-") ? `(${text})` : text);

/** num / den с округлением половины от нуля (den > 0), точно - через BigInt. */
function halfUp(num, den) {
  const q = Number((2n * BigInt(Math.abs(num)) + BigInt(den)) / (2n * BigInt(den)));
  return num < 0 ? -q : q;
}

const matmul = (X, W) => X.map((row) => R3.map((c) => row[0] * W[0][c] + row[1] * W[1][c] + row[2] * W[2][c]));

/** Q, K, V (тысячные), P[i][j][d] - округлённые произведения q·k, raw - их сумма (десятитысячные). */
function rawScores(X, W) {
  const [Q, K, V] = ["Q", "K", "V"].map((c) => matmul(X, W[c]));
  const P = Q.map((q) => K.map((k) => R3.map((d) => halfUp(q[d] * k[d], 100))));
  const raw = P.map((row) => row.map((p) => p[0] + p[1] + p[2]));
  return { Q, K, V, P, raw };
}

/** Ручная цепочка посчитается: все scores ≤ 16, и в каждой строке среди j ≤ i есть score ≥ -2. */
export function fits(X, W) {
  const { raw } = rawScores(X, W);
  return raw.every((row) => row.every((s) => s <= S_MAX)) && raw.every((row, i) => Math.max(...row.slice(0, i + 1)) >= S_MIN);
}

const closed = (opts, i, j) => Boolean(opts.mask) && j > i;

/** Ручная цепочка уроков 4-8 (только при fits): закрытые маской - S = null, E = 0, A = 0. */
export function manual(X, W, opts = {}) {
  const { Q, K, V, P, raw } = rawScores(X, W);
  const S = raw.map((row, i) => row.map((r, j) => {
    if (closed(opts, i, j)) return null;
    return opts.scale ? Math.sign(r) * Math.round(Math.abs(r) / Math.sqrt(3)) : r;
  }));
  const E = S.map((row) => row.map((s) => (s === null ? 0 : Math.round(Number(fixed(Math.exp(s / 1e4), 4)) * 1e4))));
  const sum = E.map((row) => row[0] + row[1] + row[2]);
  const A = E.map((row, i) => row.map((e) => halfUp(e * 1e4, sum[i])));
  const T = A.map((a) => R3.map((d) => R3.map((j) => halfUp(a[j] * V[j][d], 1000))));
  const Z = T.map((rows) => rows.map((t) => t[0] + t[1] + t[2]));
  return { Q, K, V, P, raw, S, E, sum, A, T, Z };
}

/** Как SelfAttention урока 10 в float64: деление на sqrt в float32 (scale_factor урока), маска - -inf. */
export function exact(X, W, opts = {}) {
  const x = X.map((row) => row.map((v) => v / 100));
  const [Q, K, V] = ["Q", "K", "V"].map((c) => matmul(x, W[c].map((row) => row.map((v) => v / 10))));
  const div = opts.scale ? Math.fround(Math.sqrt(3)) : 1;
  const S = Q.map((q, i) => K.map((k, j) => (closed(opts, i, j) ? null : (q[0] * k[0] + q[1] * k[1] + q[2] * k[2]) / div)));
  const A = S.map((row) => {
    const top = Math.max(...row.filter((s) => s !== null));
    const e = row.map((s) => (s === null ? 0 : Math.exp(s - top)));
    const total = e[0] + e[1] + e[2];
    return e.map((v) => v / total);
  });
  const Z = A.map((a) => R3.map((d) => a[0] * V[0][d] + a[1] * V[1][d] + a[2] * V[2][d]));
  return { Q, K, V, S, A, Z };
}

/** Пометка, если код даёт другое число, чем ручная цепочка. */
function mark(text, value) {
  const code = fixed(value, 4);
  return code === text ? "" : ` (код: ${code})`;
}

const weightText = (m, i, j) => (m.S[i][j] === null ? "0" : units(m.A[i][j]));

/** Строки урока 4: q, k и v токена i по координатам. */
export function qkvLines(X, W, i) {
  const m = manual(X, W);
  return ["Q", "K", "V"].flatMap((c) => R3.map((d) => {
    const prods = R3.map((t) => `${paren(units(X[i][t], 2))}×${paren(units(W[c][t][d], 1))}`).join(" + ");
    const terms = R3.map((t) => paren(units(X[i][t] * W[c][t][d], 3))).join(" + ");
    return `${NAMES[c]}${SUB[d]} = ${prods} = ${terms} = ${units(m[c][i][d], 3)}`;
  }));
}

/** Строки урока 5: q токена i на k каждого токена (с делением на √3 и маской - по флажкам). */
export function scoreLines(X, W, i, opts = {}) {
  const m = manual(X, W, opts);
  const c = exact(X, W, opts);
  return R3.map((j) => {
    if (closed(opts, i, j)) return `${TOKENS[i]} · ${TOKENS[j]}: «${TOKENS[j]}» - будущий токен, маска ставит -∞`;
    const prods = R3.map((d) => `${paren(units(m.Q[i][d], 3))}×${paren(units(m.K[j][d], 3))}`).join(" + ");
    const terms = m.P[i][j].map((p) => paren(units(p))).join(" + ");
    let line = `${TOKENS[i]} · ${TOKENS[j]} = ${prods} = ${terms} = ${units(m.raw[i][j])}`;
    if (opts.scale) line += `, ÷√3 = ${units(m.S[i][j])}`;
    return line + mark(units(m.S[i][j]), c.S[i][j]);
  });
}

/** Строки урока 7: экспоненты, сумма, деления и проверка суммы весов строки i. */
export function softmaxLines(X, W, i, opts = {}) {
  const m = manual(X, W, opts);
  const c = exact(X, W, opts);
  const open = R3.filter((j) => m.S[i][j] !== null);
  const E = m.E[i].map((e) => units(e));
  const S = units(m.sum[i]);
  return {
    exps: R3.map((j) => (m.S[i][j] === null ? "e^(-∞) = 0" : `e^${paren(units(m.S[i][j]))} = ${E[j]}`)),
    sum: open.length === 1 ? `Сумма = ${S}` : `Сумма = ${open.map((j) => E[j]).join(" + ")} = ${S}`,
    divs: R3.map((j) => {
      if (m.S[i][j] === null) return `w_${i}${j} = 0 (маска)`;
      const a = units(m.A[i][j]);
      return `w_${i}${j} = ${E[j]} / ${S} = ${a}${mark(a, c.A[i][j])}`;
    }),
    check: `${R3.map((j) => weightText(m, i, j)).join(" + ")} = ${units(m.A[i][0] + m.A[i][1] + m.A[i][2])}`,
  };
}

/** Строки урока 8: z₁, z₂, z₃ контекстного вектора токена i. */
export function contextLines(X, W, i, opts = {}) {
  const m = manual(X, W, opts);
  const c = exact(X, W, opts);
  return R3.map((d) => {
    const prods = R3.map((j) => `${weightText(m, i, j)}×${paren(units(m.V[j][d], 3))}`).join(" + ");
    const terms = R3.map((j) => (m.S[i][j] === null ? "0" : paren(units(m.T[i][d][j])))).join(" + ");
    const z = units(m.Z[i][d]);
    return `z${SUB[d]} = ${prods} = ${terms} = ${z}${mark(z, c.Z[i][d])}`;
  });
}

export function qkvMatrix(X, W) {
  const m = manual(X, W);
  return Object.fromEntries(["Q", "K", "V"].map((c) => [c, m[c].map((row) => row.map((v) => units(v, 3)))]));
}

export const scoreMatrix = (X, W, opts = {}) => manual(X, W, opts).S.map((row) => row.map((s) => (s === null ? "-∞" : units(s))));

export function weightMatrix(X, W, opts = {}) {
  const m = manual(X, W, opts);
  const c = exact(X, W, opts);
  return {
    manual: R3.map((i) => R3.map((j) => weightText(m, i, j))),
    code: R3.map((i) => R3.map((j) => (closed(opts, i, j) ? "0" : fixed(c.A[i][j], 4)))),
  };
}

export function contextMatrix(X, W, opts = {}) {
  return {
    manual: manual(X, W, opts).Z.map((row) => row.map((z) => units(z))),
    code: exact(X, W, opts).Z.map((row) => row.map((z) => fixed(z, 4))),
  };
}

function selfNames(A) {
  const names = TOKENS.filter((_, i) => A[i].every((a) => A[i][i] >= a));
  return names.length ? names.join(", ") : "никто";
}

/** Урок 9: веса без матриц (как в модуле 8) и с матрицами W - без деления и без маски. */
export function compare(X, W) {
  const plain = manual(X, IDENTITY);
  const trained = manual(X, W);
  return {
    plain: plain.A.map((row) => row.map((a) => units(a))),
    trained: trained.A.map((row) => row.map((a) => units(a))),
    self: `Сильнее всего на себя смотрят: без весов - ${selfNames(plain.A)}; с весами - ${selfNames(trained.A)}.`,
    rows: [
      ...[0, 1].map((j) => `Scores[0,${j}]: без весов ${units(plain.raw[0][j])}, с весами ${units(trained.raw[0][j])}`),
      ...[0, 1].map((j) => `Weights[0,${j}]: без весов ${units(plain.A[0][j])}, с весами ${units(trained.A[0][j])}`),
    ],
  };
}
