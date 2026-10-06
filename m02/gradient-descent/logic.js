// Логика демо «Градиентный спуск» (модуль 2, урок 3): L(w) = (w - 3)², dL/dw = 2(w - 3).
// Чистые функции без DOM - сверяются с golden.json (torch.autograd) в tests/golden.test.js.
import { num } from "../../kit/format.js";

export const TARGET = 3;

export function loss(w) {
  return (w - TARGET) ** 2;
}

export function grad(w) {
  return 2 * (w - TARGET);
}

/** Один шаг: w_нов = w - η · dL/dw. */
export function step(w, lr) {
  return w - lr * grad(w);
}

/** n шагов от w0: строки таблицы { n, w, loss, grad, next }. */
export function run(w0, lr, n) {
  const rows = [];
  let w = w0;
  for (let k = 1; k <= n; k += 1) {
    const next = step(w, lr);
    rows.push({ n: k, w, loss: loss(w), grad: grad(w), next });
    w = next;
  }
  return rows;
}

/** Спуск разлетелся: отклонение от минимума больше миллиона. */
export function diverged(w) {
  return Math.abs(w - TARGET) > 1e6;
}

/** Что говорит знак производной. */
export function verdict(w) {
  const g = grad(w);
  if (Math.abs(g) < 1e-9) return "dL/dw = 0: мы в минимуме, шагать некуда";
  if (g > 0) return `dL/dw = +${num(g)} > 0: ошибка растёт при росте w → уменьшаем w`;
  return `dL/dw = ${num(g)} < 0: ошибка падает при росте w → увеличиваем w`;
}

/** Формула шага, как в уроке: «w_нов = 5 - 0.1·4 = 4.6». */
export function stepFormula(w, lr) {
  const g = grad(w);
  const gText = g < 0 ? `(${num(g)})` : num(g);
  return `w_нов = ${num(w)} - ${num(lr)}·${gText} = ${num(step(w, lr))}`;
}

export const display = {
  loss: (w) => num(loss(w)),
};
