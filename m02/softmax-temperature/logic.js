// Логика демо «Softmax и температура» (модуль 2, урок 2).
// Чистые функции без DOM - сверяются с golden.json (torch) в tests/golden.test.js.
import { expo, fixed, num, percent } from "../../kit/format.js";

function sum(values) {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/** Шаг 1: делим логиты на температуру. */
export function scaled(logits, T) {
  return logits.map((x) => x / T);
}

/** Шаг 2: экспоненты - именно их урок выписывает в таблицу (без вычитания максимума). */
export function exps(logits, T) {
  return scaled(logits, T).map(Math.exp);
}

/** Шаг 3: сумма экспонент. */
export function expSum(logits, T) {
  return sum(exps(logits, T));
}

/** Шаг 4: вероятности. Считаем устойчиво - с вычитанием максимума, как сказано в уроке. */
export function softmax(logits, T) {
  const s = scaled(logits, T);
  const max = Math.max(...s);
  const e = s.map((x) => Math.exp(x - max));
  const total = sum(e);
  return e.map((v) => v / total);
}

/** Вероятности в процентах по правилам урока: «73.1%», «0.0245%», «≈0%». */
export function percents(logits, T) {
  return softmax(logits, T).map(percent);
}

/** Подписи для «▶ по шагам». */
export function steps(logits, T) {
  return [
    `1. Делим каждый логит на T = ${num(T)}: ${scaled(logits, T).map((x) => num(x, 3)).join(", ")}`,
    `2. Берём экспоненту - она всегда положительна: ${exps(logits, T).map(expo).join(", ")}`,
    `3. Складываем экспоненты: ${expo(expSum(logits, T))}`,
    `4. Делим каждую экспоненту на сумму: ${softmax(logits, T).map((p) => fixed(p, 3)).join(", ")}`,
    `Проверка: сумма вероятностей = ${fixed(sum(softmax(logits, T)), 3)}`,
  ];
}

export const display = {
  scaled: (logits, T) => scaled(logits, T).map((x) => num(x, 3)).join(" / "),
  exps: (logits, T) => exps(logits, T).map(expo).join(" / "),
  expSum: (logits, T) => expo(expSum(logits, T)),
  softmax: (logits, T) => softmax(logits, T).map((p) => fixed(p, 3)).join(" / "),
  percents: (logits, T) => percents(logits, T).join(" / "),
};
