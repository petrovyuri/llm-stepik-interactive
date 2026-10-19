// Логика демо «Научите «он» смотреть на «сметану»» (модуль 9, урок «Обучаемые матрицы W_Q, W_K, W_V»).
// Фраза «Кот любил сметану … он» с игрушечными векторами по 3 числа. Запрос - «он»:
// q = x_он @ W_Q, k_j = x_j @ W_K, веса softmax(q · k_j) без деления на √d и без V.
// Градиентный спуск по W_Q и W_K уменьшает ошибку -ln(вес «сметану»); градиент выведен вручную,
// эталон - тот же спуск в torch через autograd. Чистые функции без DOM - сверяются с golden.json.
import { fixed, percent } from "../../kit/format.js";

export const TOKENS = ["Кот", "любил", "сметану", "он"];
export const X = [[0.9, 0.2, 0.1], [0.1, 0.9, 0.2], [0.8, 0.3, 0.2], [0.7, 0.2, 0.3]];
export const QUERY = 3;
export const TARGET = 2;
export const LR = 2;
export const STEPS = 60;
const R3 = [0, 1, 2];
const EYE = () => R3.map((i) => R3.map((j) => (i === j ? 1 : 0)));
const times = (x, W) => R3.map((c) => x[0] * W[0][c] + x[1] * W[1][c] + x[2] * W[2][c]);

function forward(WQ, WK) {
  const q = times(X[QUERY], WQ);
  const k = X.map((x) => times(x, WK));
  const s = k.map((kj) => q[0] * kj[0] + q[1] * kj[1] + q[2] * kj[2]);
  const top = Math.max(...s);
  const e = s.map((v) => Math.exp(v - top));
  const total = e.reduce((a, b) => a + b, 0);
  return { q, k, p: e.map((v) => v / total) };
}

/** Веса внимания «он» на каждый токен. */
export const weights = (WQ, WK) => forward(WQ, WK).p;

/** Один шаг спуска: g_j = p_j - [j = сметану], dq = Σ g_j k_j, dk_j = g_j q. */
export function step(WQ, WK) {
  const { q, k, p } = forward(WQ, WK);
  const g = p.map((v, j) => v - (j === TARGET ? 1 : 0));
  const dq = R3.map((c) => g.reduce((acc, gj, j) => acc + gj * k[j][c], 0));
  const dWQ = R3.map((t) => R3.map((c) => X[QUERY][t] * dq[c]));
  const dWK = R3.map((t) => R3.map((c) => X.reduce((acc, x, j) => acc + x[t] * g[j] * q[c], 0)));
  return {
    WQ: WQ.map((row, t) => row.map((w, c) => w - LR * dWQ[t][c])),
    WK: WK.map((row, t) => row.map((w, c) => w - LR * dWK[t][c])),
  };
}

let path = null;

/** Состояние после n шагов (0…60): матрицы, веса и ошибка. Траектория считается один раз. */
export function state(n) {
  if (path === null) {
    path = [];
    let WQ = EYE();
    let WK = EYE();
    for (let i = 0; i <= STEPS; i += 1) {
      const w = weights(WQ, WK);
      path.push({ WQ, WK, weights: w, loss: -Math.log(w[TARGET]) });
      ({ WQ, WK } = step(WQ, WK));
    }
  }
  return path[n];
}

export const percentTexts = (n) => state(n).weights.map((w) => percent(w));
export const lossText = (n) => `Ошибка -log(вес «сметану») = ${fixed(state(n).loss, 3)}`;

export function captionText(n) {
  const w = state(n).weights;
  if (n === 0) return "До обучения W_Q и W_K единичные: «он» смотрит почти поровну на «Кот» и «сметану».";
  if (w[TARGET] >= 0.9) return `Готово: «он» смотрит на «сметану» - ${percent(w[TARGET])}. Модель выучила, к чему относится «он».`;
  if (w[0] > w[TARGET]) return "Сначала растёт вес «Кот»: векторы «Кот» и «сметану» похожи, и модель тянет вверх оба.";
  return "W_Q и W_K начали различать «Кот» и «сметану»: теперь «он» смотрит на «сметану» больше всего.";
}
