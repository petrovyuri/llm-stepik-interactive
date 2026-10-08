// Логика демо «Карта слов GPT-2» (модуль 7, урок «Векторные представления»).
// 25 слов на настоящих векторах wte модели gpt2 и на случайной таблице «до обучения».
// Координаты (PCA), соседи и близости посчитал эталон, они лежат в data.js; здесь -
// выборка и подписи. Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";
import { placeLabels as place } from "../../kit/labels.js";
import { BY_ID, MAPS, NEIGHBORS, WORDS } from "./data.js";

export const GROUPS = ["животные", "еда", "цвета", "числа", "чувства"];
export const MODES = ["trained", "random"];

export const words = () => WORDS;

/** Как показать токен: пробел в начале - «␣», перевод строки - «↵». */
export const label = (piece) => piece.replace(/^ /, "␣").replace(/\n/g, "↵");

/** Точка слова i на карте режима mode: [x, y] в квадрате [-1, 1], y - вверх. */
export const point = (mode, i) => MAPS[mode][i];

/** Карта на экране - viewBox 400×300 (y вниз), поля по 16. */
export const MAP_SIZE = [400, 300];
const PAD = 16;

/** Точка слова i на экране карты режима mode. */
export function screen(mode, i) {
  const [x, y] = MAPS[mode][i];
  return [PAD + ((x + 1) / 2) * (MAP_SIZE[0] - 2 * PAD), PAD + ((1 - y) / 2) * (MAP_SIZE[1] - 2 * PAD)];
}

/** Высота подписи как у рамки текста 11 px в браузере (14.5), базовая линия - на 0.8 высоты. */
export const LABEL_HEIGHT = 15;

/** Подписи без наложений на карте 400×300 - общая раскладка kit/labels.js. */
export const placeLabels = (points, widths, options = {}) =>
  place(points, widths, { size: MAP_SIZE, height: LABEL_HEIGHT, ...options });

/** Пять ближайших по смыслу во всём словаре gpt2: текст токена, ID, близость с двумя знаками. */
export const neighborRows = (mode, i) => NEIGHBORS[mode][i].map((n) => ({ text: label(n.piece), id: n.id, sim: fixed(n.sim, 2) }));

/** Слово из 25 с ближайшим номером (ID), близость к нему в режиме mode и из той же ли оно группы
 *  (у частых слов одной темы номера бывают рядом - это надо пояснить). */
export function nearestById(mode, i) {
  const { index, sim } = BY_ID[mode][i];
  return { text: `␣${WORDS[index].word}`, id: WORDS[index].id, sim: fixed(sim, 2), sameGroup: WORDS[index].group === WORDS[i].group };
}
