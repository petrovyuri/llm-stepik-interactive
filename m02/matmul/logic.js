// Логика демо «Умножение матриц по шагам» (модуль 2, урок 1).
// Чистые функции без DOM - сверяются с golden.json (torch) в tests/golden.test.js.
import { listStr, sumOfProducts } from "../../kit/format.js";

/** Форма матрицы: [строк, столбцов]. */
export function shape(m) {
  return [m.length, m[0].length];
}

/** Умножать можно, если столбцов в A столько же, сколько строк в B. */
export function canMultiply(a, b) {
  return a[0].length === b.length;
}

export function mismatchText(a, b) {
  return `Столбцов в A (${a[0].length}) ≠ строк в B (${b.length}): умножать нельзя`;
}

export function shapesText(a, b) {
  const [ar, ac] = shape(a);
  const [br, bc] = shape(b);
  return `(${ar}×${ac}) × (${br}×${bc})`;
}

/** C[i][j] = строка i матрицы A · столбец j матрицы B. */
export function matmul(a, b) {
  if (!canMultiply(a, b)) throw new Error(mismatchText(a, b));
  return a.map((row) => b[0].map((_, j) => {
    let total = 0;
    for (let k = 0; k < row.length; k += 1) total += row[k] * b[k][j];
    return total;
  }));
}

/** Строки становятся столбцами. Работает и с числами, и с текстом ячеек. */
export function transpose(m) {
  return m[0].map((_, j) => m.map((row) => row[j]));
}

export function column(m, j) {
  return m.map((row) => row[j]);
}

/** Как считается одна ячейка: «(1×6) + (2×8) = 6 + 16 = 22». */
export function cellFormula(a, b, i, j) {
  return sumOfProducts(a[i], column(b, j));
}

/** Подписи для «▶ по шагам»: ячейки C по строкам, номера с 1, как в уроке. */
export function steps(a, b) {
  const lines = [];
  a.forEach((_, i) => b[0].forEach((__, j) => {
    lines.push(`строка ${i + 1} · столбец ${j + 1} = ${cellFormula(a, b, i, j)}`);
  }));
  return lines;
}

export const display = {
  matmul: (a, b) => listStr(matmul(a, b)),
  transpose: (m) => listStr(transpose(m)),
};
