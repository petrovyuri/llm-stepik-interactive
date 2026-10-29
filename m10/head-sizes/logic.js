// Логика демо «Размеры и параметры» (модуль 10, уроки «Весовые матрицы для каждой головы» и
// «Сравнение голов нашей модели с GPT-3»). head_dim = embed_dim / num_heads, проверка делимости
// как assert в MultiHeadAttention урока 12, параметры: одна голова (SelfAttention) - 3 × d²,
// Multi-Head - 4 × d² (W_O добавляет d²).
// Чистые функции без DOM - сверяются с golden.json.

export const MAX_DIM = 12288;
export const MAX_HEADS = 128;
export const PRESETS = [
  { label: "4/2 из уроков", d: 4, h: 2 },
  { label: "наша модель", d: 16, h: 2 },
  { label: "GPT-3", d: 12288, h: 96 },
];
export const PARSE = "embed_dim - целое от 1 до 12288, num_heads - от 1 до 128.";

function parseInt_(text, top) {
  const t = String(text).trim();
  if (!/^\d+$/.test(t)) return null;
  const v = Number(t);
  return v >= 1 && v <= top ? v : null;
}

/** Поле embed_dim → целое 1…12288 или null. */
export const parseDim = (text) => parseInt_(text, MAX_DIM);
/** Поле num_heads → целое 1…128 или null. */
export const parseHeads = (text) => parseInt_(text, MAX_HEADS);

/** Разряды через пробел: 603979776 → «603 979 776». */
export const group = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

function plural(n, one, few, many) {
  if (n % 10 === 1 && n % 100 !== 11) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return few;
  return many;
}

/** head_dim или текст assert урока 12, если embed_dim не делится на num_heads. */
export function headDimText(d, h) {
  if (d % h) return `embed_dim (${d}) должен делиться на num_heads (${h}) без остатка`;
  return `head_dim = ${d} / ${h} = ${d / h}`;
}

export const singleText = (d) => `Одна голова: 3 × ${d}² = ${group(3 * d * d)}`;
export const multiText = (d) => `Multi-Head: 4 × ${d}² = ${group(4 * d * d)}`;
export const extraText = (d) => `W_O добавляет ${d}² = ${group(d * d)}`;

export function divisorsText(d) {
  const list = [];
  for (let k = 1; k <= Math.min(d, MAX_HEADS); k++) if (d % k === 0) list.push(k);
  return `На что делится ${d} (до ${MAX_HEADS}): ${list.join(", ")}`;
}

export function captionText(d, h) {
  if (d % h) return divisorsText(d);
  const hd = d / h;
  return `${h} ${plural(h, "голова", "головы", "голов")} по ${hd} ${plural(hd, "число", "числа", "чисел")}. `
    + `Число голов на параметры не влияет: матрицы всё равно ${d} × ${d}.`;
}
