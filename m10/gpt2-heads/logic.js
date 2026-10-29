// Логика демо «Головы настоящей GPT-2» (модуль 10, урок «Зачем нужно Multi-Head Attention?»).
// Веса внимания обученной GPT-2 на фразе «The cat loved sour cream» (12 слоёв × 12 голов, 4 знака)
// посчитаны в эталоне и лежат в data.js. Подписи считаются по этим данным.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";
import { ATT, TOKENS } from "./data.js";

export { ATT, TOKENS };
export const LAYERS = 12;
export const HEADS = 12;
const LAST = 4;   // строка «cream»

/** Вес в клетке карты: выше диагонали (будущее) пусто, иначе 2 знака. */
export const cellText = (l, h, i, j) => (j > i ? "" : fixed(ATT[l][h][i][j], 2));

export const cellRow = (l, h, i) => TOKENS.map((_, j) => cellText(l, h, i, j));

/** На кого «cream» смотрит сильнее всего в голове h слоя l (при равенстве - первый). */
export function topText(l, h) {
  const row = ATT[l][h][LAST];
  let j = 0;
  for (let k = 1; k < row.length; k++) if (row[k] > row[j]) j = k;
  const who = j === LAST ? "на себя" : `на «${TOKENS[j]}»`;
  return `Голова ${h}: «cream» сильнее всего смотрит ${who} (${fixed(row[j], 2)})`;
}

/** Сколько голов слоя отдают первому токену больше половины внимания строки «cream». */
export const sinkCount = (l) => ATT[l].filter((m) => m[LAST][0] > 0.5).length;

export const sinkText = (l) =>
  `Слой ${l}: у ${sinkCount(l)} из ${HEADS} голов «cream» отдаёт первому токену «The» больше половины внимания.`;

export function captionText(l) {
  const f = (h, j) => fixed(ATT[l][h][LAST][j], 2);
  if (l === 0) return `Слой 0: голова 1 смотрит только на себя, голова 7 от «cream» смотрит на соседнее «sour» (${f(7, 3)}).`;
  if (l === 5) return `Слой 5: голова 4 от «cream» смотрит на «loved» (${f(4, 2)}), голова 6 - на «sour» (${f(6, 3)}).`;
  return "Головы одного слоя смотрят по-разному. Нажмите на карту, чтобы увидеть числа.";
}
