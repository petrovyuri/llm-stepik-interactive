// Логика демо «Внимание на плоскости» (модуль 8, урок «Контекстные векторы»).
// Три токена - точки на плоскости (2-е и 3-е измерения векторов урока), внимание -
// как SimpleSelfAttention урока 6: scores, softmax по строкам, weights @ X.
// Чистые функции без DOM - сверяются с golden.json.
import { fixed, percent } from "../../kit/format.js";
import { placeLabels } from "../../kit/labels.js";

export const TOKENS = ["The", "cat", "loved"];
export const PLANE = 300;        // поле 300×300 px
export const SCALE = 90;         // 1 единица = 90 px
export const MID = 150;          // начало координат в центре
export const DOT = 6;            // радиус точки
export const LABEL_HEIGHT = 16;  // рамка текста 12 px в браузере, базовая линия - на 0.8 высоты
export const LIMIT = 150;   // |x| ≤ 1.5, в сотых
export const PRESETS = [
  { label: "из урока", p: [[15, 89], [87, 66], [85, 64]] },
  { label: "в одну сторону", p: [[60, 80], [70, 70], [80, 60]] },
  { label: "один длинный", p: [[15, 89], [130, 100], [85, 64]] },
  { label: "противоположные", p: [[90, 30], [-90, -30], [30, -90]] },
];

/** Текст поля → целое в сотых или null: до 2 знаков после точки (запятая тоже), |x| ≤ 1.5. */
export function parseCoord(text) {
  const t = String(text).trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return null;
  const v = Math.round(Number(t) * 100);
  return Math.abs(v) <= LIMIT ? v : null;
}

/** Целое в сотых → «0.15», «-0.09». */
export function coordText(v) {
  const s = String(Math.abs(v)).padStart(3, "0");
  return `${v < 0 ? "-" : ""}${s.slice(0, -2)}.${s.slice(-2)}`;
}

/** Внимание без весов: веса (softmax строк X·Xᵀ) и контекстные векторы (weights @ X). */
export function attend(P) {
  const x = P.map(([a, b]) => [a / 100, b / 100]);
  const S = x.map((u) => x.map((v) => u[0] * v[0] + u[1] * v[1]));
  const weights = S.map((row) => {
    const top = Math.max(...row);
    const e = row.map((s) => Math.exp(s - top));
    const total = e[0] + e[1] + e[2];
    return e.map((v) => v / total);
  });
  const context = weights.map((w) => [0, 1].map((d) => w[0] * x[0][d] + w[1] * x[1][d] + w[2] * x[2][d]));
  return { weights, context };
}

/** Точка в сотых → координаты на поле (y вниз). */
export const toPx = ([x, y]) => [MID + (x / 100) * SCALE, MID - (y / 100) * SCALE];

/** Подписи точек «имя вес» (вес - внимание запроса q к токену) на местах без наложений.
 *  Возвращает [{ text, x, y, w }]: начало базовой линии текста на поле и ширина подписи. */
export function labels(P, q) {
  const { weights } = attend(P);
  const px = P.map(toPx);
  const texts = TOKENS.map((t, j) => `${t} ${percent(weights[q][j])}`);
  const widths = texts.map((t) => t.length * 7 + 2);   // 12 px шрифта - не больше 7 px на знак
  const spots = placeLabels(px, widths, { size: [PLANE, PLANE], r: DOT, height: LABEL_HEIGHT });
  return texts.map((text, j) => ({ text, x: px[j][0] + spots[j].x, y: px[j][1] + spots[j].y, w: widths[j] }));
}

/** Подпись: на кого смотрит токен i (по убыванию веса) и его контекстный вектор. */
export function captionText(P, i) {
  const { weights, context } = attend(P);
  const w = weights[i];
  const order = [0, 1, 2].sort((a, b) => Math.round(w[b] * 1e9) - Math.round(w[a] * 1e9));
  const parts = order.map((j) => `${j === i ? "на себя" : `на «${TOKENS[j]}»`} ${percent(w[j])}`);
  return `«${TOKENS[i]}» смотрит ${parts.join(", ")}. Его контекстный вектор - смесь: [${fixed(context[i][0], 2)}, ${fixed(context[i][1], 2)}].`;
}
