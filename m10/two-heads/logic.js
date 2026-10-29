// Логика демо «Две головы по шагам» (модуль 10, уроки «Шаг 2» - «Шаг 8»). Две цепочки:
// «вручную» - как в уроках 4-10 (ROUND_HALF_UP: Q, K, V точны, каждое произведение q·k, w·v и
// concat·W_O и каждый шаг - до 4 знаков, деление на 1.4142; целые числа: X в сотых, W в десятых,
// Q, K, V в тысячных, остальное в десятитысячных) и «код» - MultiHeadAttention урока 12 без
// промежуточных округлений. Числа примера урока не меняются, редактора нет.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";

export const TOKENS = ["The", "cat", "loved"];
export const X = [[43, 15, 89, 22], [55, 87, 66, 33], [57, 85, 64, 44]];
export const HEADS = [
  { Q: [[5, 2], [3, 6], [1, 1], [2, 3]], K: [[4, 3], [2, 5], [3, 2], [1, 4]], V: [[6, 1], [1, 7], [2, 2], [3, 1]] },
  { Q: [[4, 3], [2, 5], [3, 2], [5, 1]], K: [[5, 2], [3, 4], [2, 3], [4, 2]], V: [[7, 2], [2, 6], [1, 3], [2, 4]] },
];
export const WO = [[5, 2, 1, 3], [3, 6, 2, 1], [1, 1, 7, 2], [2, 3, 1, 5]];
export const SINGLE = { Q: WO, K: [[4, 3, 2, 1], [2, 5, 3, 4], [3, 2, 6, 1], [1, 4, 2, 5]] };   // урок 3, W 4×4
export const STAGES = ["qkv", "scores", "softmax", "context", "concat", "wo"];
const SQ2 = 14142;   // √2 с 4 знаками, как в уроке 5
const SUB = ["₁", "₂", "₃", "₄"];
const NAMES = { Q: "q", K: "k", V: "v" };
const R2 = [0, 1];
const R3 = [0, 1, 2];
const R4 = [0, 1, 2, 3];

/** Целое в единицах 10^-k → строка с k знаками: units(3448) = «0.3448», units(-5, 1) = «-0.5». */
export function units(n, k = 4) {
  const s = String(Math.abs(n)).padStart(k + 1, "0");
  return `${n < 0 ? "-" : ""}${s.slice(0, -k)}.${s.slice(-k)}`;
}

/** num / den с округлением половины от нуля (den > 0), точно - через BigInt. */
function halfUp(num, den) {
  const q = Number((2n * BigInt(Math.abs(num)) + BigInt(den)) / (2n * BigInt(den)));
  return num < 0 ? -q : q;
}

const matmul = (A, W) => A.map((row) => W[0].map((_, c) => row.reduce((s, a, t) => s + a * W[t][c], 0)));
const vec = (values, k = 4) => `[${values.map((v) => units(v, k)).join(", ")}]`;

/** Экспоненты, их суммы и веса строк (всё в десятитысячных). */
function softmax(S) {
  const E = S.map((row) => row.map((s) => Math.round(Number(fixed(Math.exp(s / 1e4), 4)) * 1e4)));
  const sum = E.map((row) => row.reduce((a, b) => a + b, 0));
  const A = E.map((row, i) => row.map((e) => halfUp(e * 1e4, sum[i])));
  return { E, sum, A };
}

/** Ручная цепочка уроков 4-8 для головы h: P[i][j][d] - произведения q·k, T[i][d][j] - слагаемые w·v. */
export function manual(h) {
  const [Q, K, V] = ["Q", "K", "V"].map((c) => matmul(X, HEADS[h][c]));
  const P = Q.map((q) => K.map((k) => R2.map((d) => halfUp(q[d] * k[d], 100))));
  const raw = P.map((row) => row.map((p) => p[0] + p[1]));
  const S = raw.map((row) => row.map((r) => halfUp(r * 10000, SQ2)));
  const { E, sum, A } = softmax(S);
  const T = A.map((a) => R2.map((d) => R3.map((j) => halfUp(a[j] * V[j][d], 1000))));
  const Z = T.map((rows) => rows.map((t) => t[0] + t[1] + t[2]));
  return { Q, K, V, P, raw, S, E, sum, A, T, Z };
}

/** Одна голова урока 6: W 4×4 урока 3, деление на √4 = 2. */
export function manualSingle() {
  const Q = matmul(X, SINGLE.Q);
  const K = matmul(X, SINGLE.K);
  const P = Q.map((q) => K.map((k) => R4.map((d) => halfUp(q[d] * k[d], 100))));
  const raw = P.map((row) => row.map((p) => p[0] + p[1] + p[2] + p[3]));
  const S = raw.map((row) => row.map((r) => halfUp(r, 2)));
  return { Q, K, P, raw, S, ...softmax(S) };
}

/** Уроки 9-10: concat контекстов голов, слагаемые OT[i][c][t] и выход через W_O. */
export function combined() {
  const z0 = manual(0).Z;
  const z1 = manual(1).Z;
  const C = R3.map((i) => [...z0[i], ...z1[i]]);
  const OT = C.map((row) => R4.map((c) => R4.map((t) => halfUp(row[t] * WO[t][c], 10))));
  const O = OT.map((rows) => rows.map((t) => t[0] + t[1] + t[2] + t[3]));
  return { C, OT, O };
}

/** Как MultiHeadAttention урока 12 в double: деление на √2 в float32 (scale урока), softmax с вычитанием максимума. */
export function exact() {
  const x = X.map((row) => row.map((v) => v / 100));
  const scale = Math.fround(Math.sqrt(2));
  const S = [];
  const A = [];
  const Z = [];
  for (const h of R2) {
    const [Q, K, V] = ["Q", "K", "V"].map((c) => matmul(x, HEADS[h][c].map((row) => row.map((v) => v / 10))));
    const s = Q.map((q) => K.map((k) => (q[0] * k[0] + q[1] * k[1]) / scale));
    const a = s.map((row) => {
      const top = Math.max(...row);
      const e = row.map((v) => Math.exp(v - top));
      const total = e[0] + e[1] + e[2];
      return e.map((v) => v / total);
    });
    S.push(s);
    A.push(a);
    Z.push(a.map((w) => R2.map((d) => w[0] * V[0][d] + w[1] * V[1][d] + w[2] * V[2][d])));
  }
  const C = R3.map((i) => [...Z[0][i], ...Z[1][i]]);
  const O = matmul(C, WO.map((row) => row.map((v) => v / 10)));
  return { S, A, Z, O };
}

/** Пометка, если код даёт другое число, чем ручная цепочка. */
function mark(text, value) {
  const code = fixed(value, 4);
  return code === text ? "" : ` (код: ${code})`;
}

/** Урок 4: q₁, q₂, k₁, k₂, v₁, v₂ токена i в голове h. */
export function qkvLines(h, i) {
  const m = manual(h);
  return ["Q", "K", "V"].flatMap((c) => R2.map((d) => {
    const W = HEADS[h][c];
    const prods = R4.map((t) => `${units(X[i][t], 2)}×${units(W[t][d], 1)}`).join(" + ");
    const terms = R4.map((t) => units(X[i][t] * W[t][d], 3)).join(" + ");
    return `${NAMES[c]}${SUB[d]} = ${prods} = ${terms} = ${units(m[c][i][d], 3)}`;
  }));
}

/** Урок 5: q токена i на k каждого токена, деление на 1.4142. */
export function scoreLines(h, i) {
  const m = manual(h);
  const c = exact();
  return R3.map((j) => {
    const q = m.Q[i];
    const k = m.K[j];
    const p = m.P[i][j];
    const s = units(m.S[i][j]);
    return `${TOKENS[i]} · ${TOKENS[j]} = (${units(q[0], 3)}×${units(k[0], 3)} + ${units(q[1], 3)}×${units(k[1], 3)}) / 1.4142`
      + ` = (${units(p[0])} + ${units(p[1])}) / 1.4142 = ${units(m.raw[i][j])} / 1.4142 = ${s}${mark(s, c.S[h][i][j])}`;
  });
}

/** Урок 6: экспоненты, сумма, деления и проверка суммы весов строки i. */
export function softmaxLines(h, i) {
  const m = manual(h);
  const c = exact();
  const E = m.E[i].map((e) => units(e));
  const S = units(m.sum[i]);
  const total = m.A[i][0] + m.A[i][1] + m.A[i][2];
  return {
    exps: R3.map((j) => `e^${units(m.S[i][j])} = ${E[j]}`),
    sum: `Сумма = ${E.join(" + ")} = ${S}`,
    divs: R3.map((j) => {
      const a = units(m.A[i][j]);
      return `w_${i}${j} = ${E[j]} / ${S} = ${a}${mark(a, c.A[h][i][j])}`;
    }),
    check: `${m.A[i].map((a) => units(a)).join(" + ")} = ${units(total)}${total === 10000 ? "" : " (каждый вес округлён до 4 знаков)"}`,
  };
}

/** Урок 6, сравнение: одна голова (W 4×4, ÷2) для строки i рядом с весами головы h. */
export function singleLines(i, h) {
  const one = manualSingle();
  return [
    `Одна голова (W 4×4, ÷2): scores ${vec(one.S[i])}`,
    `e^… = ${vec(one.E[i])}, сумма ${units(one.sum[i])}`,
    `веса ${vec(one.A[i])}, у головы ${h} - ${vec(manual(h).A[i])}`,
  ];
}

/** Урок 7: z₁ и z₂ контекста токена i в голове h. */
export function contextLines(h, i) {
  const m = manual(h);
  const c = exact();
  return R2.map((d) => {
    const prods = R3.map((j) => `${units(m.A[i][j])}×${units(m.V[j][d], 3)}`).join(" + ");
    const terms = m.T[i][d].map((t) => units(t)).join(" + ");
    const z = units(m.Z[i][d]);
    return `z${SUB[d]} = ${prods} = ${terms} = ${z}${mark(z, c.Z[h][i][d])}`;
  });
}

/** Урок 9: склейка контекстов двух голов. */
export function concatLine(i) {
  return `concat = ${vec(manual(0).Z[i])} + ${vec(manual(1).Z[i])} = ${vec(combined().C[i])}`;
}

/** Урок 10: четыре числа выхода токена i через W_O. */
export function woLines(i) {
  const cb = combined();
  const c = exact();
  return R4.map((col) => {
    const prods = R4.map((t) => `${units(cb.C[i][t])}×${units(WO[t][col], 1)}`).join(" + ");
    const terms = cb.OT[i][col].map((x) => units(x)).join(" + ");
    const o = units(cb.O[i][col]);
    return `out${SUB[col]} = ${prods} = ${terms} = ${o}${mark(o, c.O[i][col])}`;
  });
}

export function qkvMatrix(h) {
  const m = manual(h);
  return Object.fromEntries(["Q", "K", "V"].map((c) => [c, m[c].map((row) => row.map((v) => units(v, 3)))]));
}

export const scoreMatrix = (h) => manual(h).S.map((row) => row.map((s) => units(s)));

export function weightMatrix(h) {
  return {
    manual: manual(h).A.map((row) => row.map((a) => units(a))),
    code: exact().A[h].map((row) => row.map((a) => fixed(a, 4))),
  };
}

export function contextMatrix(h) {
  return {
    manual: manual(h).Z.map((row) => row.map((z) => units(z))),
    code: exact().Z[h].map((row) => row.map((z) => fixed(z, 4))),
  };
}

export const concatMatrix = () => combined().C.map((row) => row.map((v) => units(v)));

export function outMatrix() {
  return {
    manual: combined().O.map((row) => row.map((o) => units(o))),
    code: exact().O.map((row) => row.map((o) => fixed(o, 4))),
  };
}

const CAPTIONS = {
  qkv: (H, t) => `${H}: q, k и v токена «${t}» - его вектор x (4 числа), умноженный на матрицы 4×2. Получается по 2 числа: head_dim = 2.`,
  scores: (H, t) => `${H}: q токена «${t}» на k каждого токена, деление на √2 = 1.4142 - корень из head_dim, а не из embed_dim.`,
  softmax: (H, t) => `${H}: экспоненты делим на сумму - веса строки «${t}» в сумме дают 1.`,
  context: (H, t) => `${H}: контекст «${t}» - смесь векторов V этой головы с весами из softmax, 2 числа.`,
  concat: () => "Склеиваем контексты двух голов: 2 + 2 = 4 числа, снова embed_dim.",
  wo: () => "W_O смешивает числа двух голов: каждое число выхода собрано из всех четырёх чисел concat.",
};

/** Подпись под демо: вкладка stage, голова h, токен i. */
export const captionText = (stage, h, i) => CAPTIONS[stage](`Голова ${h}`, TOKENS[i]);
