// Логика демо «Зачем делить на √d» (модуль 9, урок «Код: внимание с обучаемыми весами»).
// Один запрос и 6 ключей со случайными числами из N(0, 1); scores = K @ q посчитал эталон
// (torch, seed 42) для 8 значений d и 5 наборов, они лежат в data.js. Веса - softmax(scores)
// или softmax(scores / √d), как scale в SelfAttention урока 10.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed, percent } from "../../kit/format.js";
import { SCORES } from "./data.js";

export const DIMS = [3, 8, 16, 64, 128, 256, 512, 768];
export const SETS = 5;
export const DEFAULT_DIM = 5;   // d = 256

export function weights(di, set, scale) {
  const div = scale ? Math.sqrt(DIMS[di]) : 1;
  const s = SCORES[di][set].map((v) => v / div);
  const top = Math.max(...s);
  const e = s.map((v) => Math.exp(v - top));
  const total = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / total);
}

/** 196608 → «196 608». */
export const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export const scoreTexts = (di, set) => SCORES[di][set].map((v) => fixed(v, 2));
export const percentTexts = (di, set, scale) => weights(di, set, scale).map((w) => percent(w));
export const topText = (di, set, scale) => `Наибольший вес: ${percent(Math.max(...weights(di, set, scale)))}`;

export function spreadText(di, scale) {
  const r = fixed(Math.sqrt(DIMS[di]), 1);
  return scale ? `Типичный разброс scores ≈ 1 (делим на √d = ${r})` : `Типичный разброс scores ≈ √d = ${r}`;
}

export function paramsText(di) {
  const d = DIMS[di];
  return `Параметров в W_Q, W_K, W_V: 3 × d² = 3 × ${d}² = ${group(3 * d * d)}`;
}

export function captionText(di, set, scale) {
  if (scale) return "С делением на √d разброс scores около 1 при любом d, и softmax не отдаёт всё одному ключу.";
  if (Math.max(...weights(di, set, false)) >= 0.9) return "Без деления scores растут вместе с d, и почти весь вес ушёл одному ключу. Включите «÷√d».";
  return "Без деления scores растут вместе с d. Здесь вес ещё делится между ключами - попробуйте d побольше или другой набор.";
}
