// Логика демо «Без весов на настоящих векторах» (модуль 8, урок «Код»).
// SimpleSelfAttention урока 6 на «The cat loved sour cream»: векторы wte модели gpt2 и наш
// EmbeddingLayer модуля 7 (seed 42). Матрицы посчитал эталон, они лежат в data.js.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed, percent } from "../../kit/format.js";
import { MODES, PIECES } from "./data.js";

export const MODES_LIST = ["gpt2", "ours"];
export const pieces = () => PIECES;

/** Как показать токен: пробел в начале - «␣». */
export const label = (piece) => piece.replace(/^ /, "␣");

const digits = (mode, view) => (view === "weights" ? 2 : mode === "gpt2" ? 2 : 4);

export const value = (mode, view, i, j) => MODES[mode][view][i][j];
export const cellText = (mode, view, i, j) => fixed(value(mode, view, i, j), digits(mode, view));
export const normText = (mode, i) => fixed(MODES[mode].norms[i], digits(mode, "scores"));

/** Вывод под таблицей: сколько внимания слово уделяет себе в среднем. */
export function captionText(mode) {
  const w = MODES[mode].weights;
  let d = 0;
  for (let i = 0; i < 5; i += 1) d += w[i][i];
  d /= 5;
  return mode === "gpt2"
    ? `Векторы GPT-2 длинные: x·x намного больше остальных scores, и softmax отдаёт почти всё внимание самому слову - в среднем ${percent(d)}.`
    : `Наши векторы пока случайные и короткие: все scores почти нули, и внимание делится поровну - на себя в среднем ${percent(d)}, как и на любое другое слово.`;
}
