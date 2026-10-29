// Логика демо «Разрезать на головы и склеить» (модуль 10, уроки «Архитектура» и «Код»).
// Пять состояний тензора Q в методах _split_heads и _combine_heads класса MultiHeadAttention
// урока 12: (1, L, d) → view → transpose → transpose → contiguous().view. Клетка помнит своё место
// в исходном тензоре: [i, c] - токен и столбец.
// Чистые функции без DOM - сверяются с golden.json.

export const PRESETS = [
  { label: "4/2 из уроков", d: 4, L: 3, heads: [2] },
  { label: "код: embed_dim = 16", d: 16, L: 4, heads: [1, 2, 4, 8] },
];
// Q примера уроков в тысячных: столбцы 0-1 - голова 0, 2-3 - голова 1.
export const Q_LESSON = [[393, 331, 579, 404], [668, 797, 757, 765], [692, 820, 810, 768]];
export const STEPS = 5;
const CODE = [
  "Q = self.W_query(x)  # Query\n# Q: [batch, seq_len, embed_dim]",
  "def _split_heads(self, x, batch_size):\nx = x.view(batch_size, -1, self.num_heads, self.head_dim)\n# x.shape: [batch, seq_len, num_heads, head_dim]",
  "def _split_heads(self, x, batch_size):\nx = x.transpose(1, 2)\n# x.shape: [batch, num_heads, seq_len, head_dim]",
  "def _combine_heads(self, x, batch_size):\nx = x.transpose(1, 2)\n# x.shape: [batch, seq_len, num_heads, head_dim]",
  "def _combine_heads(self, x, batch_size):\nx = x.contiguous().view(batch_size, -1, self.embed_dim)\n# x.shape: [batch, seq_len, embed_dim]",
];

const range = (n) => Array.from({ length: n }, (_, k) => k);

/** Номера [i, c] исходного тензора в порядке осей формы шага step (без оси batch). */
export function layout(step, d, L, H) {
  const hd = d / H;
  if (step === 0 || step === 4) return range(L).map((i) => range(d).map((c) => [i, c]));
  if (step === 2) return range(H).map((h) => range(L).map((i) => range(hd).map((k) => [i, h * hd + k])));
  return range(L).map((i) => range(H).map((h) => range(hd).map((k) => [i, h * hd + k])));
}

/** Форма тензора на шаге step: «(1, 3, 4)», «(1, 2, 3, 2)». */
export function shapeText(step, d, L, H) {
  const hd = d / H;
  const dims = [[1, L, d], [1, L, H, hd], [1, H, L, hd], [1, L, H, hd], [1, L, d]][step];
  return `(${dims.join(", ")})`;
}

export const codeText = (step) => CODE[step];

/** Голова, которой принадлежит столбец c. */
export const headOf = (c, d, H) => Math.floor(c / (d / H));

/** Текст клетки: у пресета уроков - число Q (3 знака), у пресета «код» - номер столбца. */
export function cellText(preset, i, c) {
  if (preset !== 0) return String(c);
  const n = Q_LESSON[i][c];
  return `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, "0")}`;
}

export function captionText(step, d, H) {
  const hd = d / H;
  if (step === 0) {
    if (H === 1) return `Голова одна: все ${d} столбцов Q принадлежат ей, разрезать нечего.`;
    const tail = H === 2 ? "." : " и так далее.";
    return `Q всех голов лежит в одном тензоре: столбцы 0…${hd - 1} - голова 0, следующие ${hd} - голова 1${tail}`;
  }
  return [
    null,
    `view ничего не переставляет в памяти: последняя ось ${d} стала двумя осями (${H}, ${hd}).`,
    `transpose меняет оси seq_len и num_heads: теперь у каждой головы своя матрица seq_len × ${hd}, и внимание считается для всех голов сразу.`,
    "После внимания головы возвращаем на место: снова (batch, seq_len, num_heads, head_dim).",
    `contiguous().view склеивает головы обратно в embed_dim = ${d} чисел - то же, что concat в уроке 9.`,
  ][step];
}
