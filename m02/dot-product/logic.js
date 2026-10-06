// Логика демо «Скалярное произведение = похожесть» (модуль 2, урок 1).
// Чистые функции без DOM - сверяются с golden.json (torch) в tests/golden.test.js.
import { num, sumOfProducts } from "../../kit/format.js";

const ORDINALS = ["первые", "вторые", "третьи", "четвёртые"];

/** Скалярное произведение: сумма попарных произведений координат. */
export function dot(a, b) {
  if (a.length !== b.length) throw new Error("векторы разной длины");
  let total = 0;
  for (let i = 0; i < a.length; i += 1) total += a[i] * b[i];
  return total;
}

/** Что значит знак: same (> 0), orthogonal (= 0), opposite (< 0), zero (есть нулевой вектор). */
export function verdict(a, b) {
  if (a.every((x) => x === 0) || b.every((x) => x === 0)) return "zero";
  const value = dot(a, b);
  if (Math.abs(value) < 1e-9) return "orthogonal";
  return value > 0 ? "same" : "opposite";
}

/** Подписи шагов для «▶ по шагам»: по произведению на координату, затем сумма. */
export function steps(a, b) {
  const lines = a.map((x, i) => `Умножаем ${ORDINALS[i]} координаты: ${num(x)} × ${num(b[i])} = ${num(x * b[i])}`);
  const [, ...rest] = display.dot(a, b).split(" = ");
  lines.push(`Складываем: ${rest.join(" = ")}`);
  return lines;
}

export const display = {
  dot: (a, b) => sumOfProducts(a, b),
};
