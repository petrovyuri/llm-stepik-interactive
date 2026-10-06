// Логика демо «Форма тензора и reshape» (модуль 2, урок 1).
// Чистые функции без DOM - сверяются с golden.json (torch) в tests/golden.test.js.

/** Ранги из таблицы урока (шаг 5). */
export const RANKS = [
  { rank: 0, name: "Скаляр", shape: "()", example: "Loss, Learning Rate" },
  { rank: 1, name: "Вектор", shape: "(d)", example: "Эмбеддинг одного слова" },
  { rank: 2, name: "Матрица", shape: "(seq, d)", example: "Веса слоя или предложение" },
  { rank: 3, name: "Тензор", shape: "(batch, seq, d)", example: "Основной формат данных!" },
];

/** Число элементов: произведение размеров (у скаляра - 1). */
export function numel(shape) {
  return shape.reduce((product, n) => product * n, 1);
}

/** Форма как tuple в Python: «()», «(6,)», «(2, 3)». */
export function shapeStr(shape) {
  if (shape.length === 0) return "()";
  if (shape.length === 1) return `(${shape[0]},)`;
  return `(${shape.join(", ")})`;
}

/** Как печатает PyTorch: «torch.Size([2, 2, 2])». */
export function torchSize(shape) {
  return `torch.Size([${shape.join(", ")}])`;
}

/** Раскладывает числа flat по форме shape построчно (flat заранее нужной длины). */
function fill(flat, shape) {
  let k = 0;
  const build = (dims) => (dims.length === 0
    ? flat[k++]
    : Array.from({ length: dims[0] }, () => build(dims.slice(1))));
  return build(shape);
}

/** Тензор формы shape с числами 1, 2, 3, ... - как torch.arange(1, n + 1).reshape(shape). */
export function makeTensor(shape) {
  return fill(Array.from({ length: numel(shape) }, (_, i) => i + 1), shape);
}

/** Все числа подряд, построчно. */
export function flatten(x) {
  return Array.isArray(x) ? x.flatMap(flatten) : [x];
}

/** reshape как в PyTorch: те же числа в новой упаковке или текст ошибки torch. */
export function reshape(flat, shape) {
  if (numel(shape) !== flat.length) {
    return { ok: false, error: `shape '[${shape.join(", ")}]' is invalid for input of size ${flat.length}` };
  }
  return { ok: true, value: fill(flat, shape) };
}
