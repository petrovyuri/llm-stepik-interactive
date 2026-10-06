// Логика демо «Autograd: y = w · x» (модуль 3, урок «PyTorch»).
// Строки - ровно как печатают Python и PyTorch. Чистые функции без DOM -
// сверяются с golden.json (torch) в tests/golden.test.js.

import { num } from "../../kit/format.js";

/** repr(float) Python для чисел с шагом 0.25: «2.0», «2.5», «-0.0». */
export function lit(v) {
  if (Number.isInteger(v)) return `${Object.is(v, -0) ? "-0" : v}.0`;
  return String(v);
}

/** Как torch печатает скаляр float32 с шагом 0.25: «3.», «2.5000», «-0.». */
export function torchScalar(v) {
  if (Object.is(v, -0)) return "-0.";
  return Number.isInteger(v) ? `${v}.` : v.toFixed(4);
}

export function tensorStr(v, gradFn = null) {
  return `tensor(${torchScalar(v)}${gradFn ? `, grad_fn=<${gradFn}>` : ""})`;
}

/** Что напечатают y, w.grad до backward и после. */
export function outputs(w, x) {
  return { y: tensorStr(w * x, "MulBackward0"), gradBefore: "None", gradAfter: tensorStr(x) };
}

/** Подписи для «▶ по шагам». */
export function steps(w, x) {
  const out = outputs(w, x);
  return [
    `Прямой проход: y = w · x = ${lit(w)} · ${lit(x)} = ${lit(w * x)} → ${out.y}`,
    `Обратный проход: dy/dw = x = ${lit(x)}`,
    `print(w.grad) → ${out.gradAfter}`,
  ];
}

/** Смысл градиента: как изменится y, если w вырастет на 0.5. Числа - как в тексте урока. */
export function nudge(x) {
  const head = "Если w вырастет на 0.5, y ";
  if (x > 0) return `${head}вырастет на 0.5 · ${num(x)} = ${num(0.5 * x)}`;
  if (x < 0) return `${head}уменьшится на 0.5 · ${num(-x)} = ${num(-0.5 * x)}`;
  return `${head}не изменится: 0.5 · 0 = 0`;
}
