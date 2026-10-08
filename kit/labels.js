// Подписи точек на SVG-карте без наложений (демо m07/word-map, m08/attention-plane).
// Чистая функция без DOM.

const DIRECTIONS = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]];

/**
 * points - точки на экране, widths - ширина подписей, size - [ширина, высота] поля.
 * Для каждой точки по порядку берётся первое свободное место: справа, слева, сверху, снизу,
 * по диагонали, всё дальше от точки. Возвращает [{ x, y, leader }]: сдвиг начала базовой
 * линии текста от точки и нужна ли линия-выноска (подпись отодвинута от точки).
 */
export function placeLabels(points, widths, { size, r = 5, height = 15, steps = [0, 8, 16, 24, 32, 40] }) {
  const [W, H] = size;
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
