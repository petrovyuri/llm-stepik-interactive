// Логика демо «Карта слов GPT-2» (модуль 7, урок «Векторные представления»).
// 25 слов на настоящих векторах wte модели gpt2 и на случайной таблице «до обучения».
// Координаты (PCA), соседи и близости посчитал эталон, они лежат в data.js; здесь -
// выборка и подписи. Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";
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

const DIRECTIONS = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]];

/**
 * Подписи без наложений. points - точки на экране, widths - ширина подписей. Для каждой точки
 * по порядку берётся первое свободное место: справа, слева, сверху, снизу, по диагонали, всё
 * дальше от точки. Возвращает [{ x, y, leader }]: сдвиг начала базовой линии текста от точки
 * и нужна ли линия-выноска (подпись отодвинута от точки).
 */
export function placeLabels(points, widths, { r = 5, height = LABEL_HEIGHT, steps = [0, 8, 16, 24, 32, 40] } = {}) {
  const [W, H] = MAP_SIZE;
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const dots = points.map(([x, y]) => ({ x: x - r, y: y - r, w: 2 * r, h: 2 * r }));
  const placed = [];
  const cost = (box) => (box.x < 0 || box.y < 0 || box.x + box.w > W || box.y + box.h > H ? 1000 : 0)
    + placed.filter((b) => hit(box, b)).length + dots.filter((d) => hit(box, d)).length;
  return points.map(([px, py], i) => {
    const w = widths[i];
    let best = null;
    for (const d of steps) {
      const gap = r + 2 + d;
      for (const [ax, ay] of DIRECTIONS) {
        const box = {
          x: ax > 0 ? px + gap : ax < 0 ? px - gap - w : px - w / 2,
          y: ay > 0 ? py + gap : ay < 0 ? py - gap - height : py - height / 2,
          w,
          h: height,
        };
        const c = cost(box);
        if (!best || c < best.c) best = { box, c, d };
        if (c === 0) break;
      }
      if (best.c === 0) break;
    }
    placed.push(best.box);
    return { x: best.box.x - px, y: best.box.y + height * 0.8 - py, leader: best.d > 0 };
  });
}

/** Пять ближайших по смыслу во всём словаре gpt2: текст токена, ID, близость с двумя знаками. */
export const neighborRows = (mode, i) => NEIGHBORS[mode][i].map((n) => ({ text: label(n.piece), id: n.id, sim: fixed(n.sim, 2) }));

/** Слово из 25 с ближайшим номером (ID), близость к нему в режиме mode и из той же ли оно группы
 *  (у частых слов одной темы номера бывают рядом - это надо пояснить). */
export function nearestById(mode, i) {
  const { index, sim } = BY_ID[mode][i];
  return { text: `␣${WORDS[index].word}`, id: WORDS[index].id, sim: fixed(sim, 2), sameGroup: WORDS[index].group === WORDS[i].group };
}
