// Логика демо «Переставьте слова» (модуль 7, урок «Positional Encoding»).
// Слой EmbeddingLayer урока 3 (seed 42) на первых четырёх токенах «The cat loved sour»:
// вектор токена + вектор позиции = вход модели. Строки токенов - из data.js демо
// embedding-table, строки позиций - из своего data.js (их генерируют эталоны).
import { fixed } from "../../kit/format.js";
import { ROWS, TOKENS } from "../embedding-table/data.js";
import { POS } from "./data.js";

export const ORDER = [464, 3797, 6151, 11348];
export const PRESETS = [
  { label: "как в тексте", order: ORDER },
  { label: "задом наперёд", order: [11348, 6151, 3797, 464] },
  { label: "перемешано", order: [3797, 464, 11348, 6151] },
];
const SHOWN = 5;   // урок печатает первые 5 чисел из 16
const PIECE = new Map(TOKENS.map((t) => [t.id, t.piece]));

export const piece = (id) => PIECE.get(id);

/** По позициям: первые 5 чисел вектора токена, вектора позиции и суммы.
 *  Сумма - во float32 (Math.fround), как token_emb + pos_emb в torch. */
export function vectors(order) {
  return order.map((id, p) => {
    const tok = ROWS[id].slice(0, SHOWN);
    const pos = POS[p].slice(0, SHOWN);
    return { id, tok, pos, sum: tok.map((t, k) => Math.fround(t + pos[k])) };
  });
}

/** Те же числа строками с 4 знаками, как их печатает torch. */
export const vectorTexts = (order) => vectors(order).map((r) => ({
  tok: r.tok.map((v) => fixed(v, 4)), pos: r.pos.map((v) => fixed(v, 4)), sum: r.sum.map((v) => fixed(v, 4)),
}));

/** Сколько слов стоят не на своей позиции - у стольких вектор на входе стал другим. */
export const changed = (order) => order.filter((id, p) => id !== ORDER[p]).length;

export function changedText(order) {
  const n = changed(order);
  if (n === 0) return "С позициями: порядок исходный - векторы те же, что в тексте.";
  return `С позициями: у ${n} ${n === 1 ? "слова" : "слов"} из 4 вектор стал другим.`;
}

/** Порядок, в котором слова на позициях a и b поменялись местами. */
export function swap(order, a, b) {
  const next = [...order];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
