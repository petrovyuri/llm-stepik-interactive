// Логика демо «DataLoader: пакеты» (модуль 6, урок «DataLoader»).
// Повторяет DataLoader(dataset, batch_size, shuffle=False, drop_last) над SimpleDataset
// урока 3 и печать цикла урока 4 (форма, тензоры как у torch, текст первой строки).
// Чистые функции без DOM - сверяются с golden.json (код уроков, исполненный в Python).

import { IDS, decode, length } from "../sliding-window/logic.js";

export const MAX_LEN = 6;
export const MAX_STRIDE = 6;
export const MAX_BATCH = 4;

/** len(dataloader): без drop_last неполный последний пакет считается, с ним - нет. */
export function count(L, s, b, drop) {
  const n = length(L, s);
  return drop ? Math.floor(n / b) : Math.ceil(n / b);
}

/** str(tensor) torch для двумерного целого тензора: ширина - по самому длинному числу. */
export function tensorStr(rows) {
  const width = Math.max(...rows.flat().map((v) => String(v).length));
  const row = (values) => `[${values.map((v) => String(v).padStart(width)).join(", ")}]`;
  return `tensor([${rows.map(row).join(",\n        ")}])`;
}

/** Что печатает цикл урока 4 для пакета k. */
export function batchText(L, s, b, drop, k) {
  const n = length(L, s);
  const xs = [];
  const ys = [];
  for (let idx = k * b; idx < Math.min(k * b + b, n); idx += 1) {
    const start = idx * s;
    xs.push(IDS.slice(start, start + L));
    ys.push(IDS.slice(start + 1, start + L + 1));
  }
  return [
    `Пакет №${k}:`,
    `Вход (X): torch.Size([${xs.length}, ${L}])`,
    `Цель (Y): torch.Size([${ys.length}, ${L}])`,
    `X: ${tensorStr(xs)}`,
    `Y: ${tensorStr(ys)}`,
    `Текст X: ${decode(xs[0])}`,
    `Текст Y: ${decode(ys[0])}`,
  ].join("\n");
}

/** Сколько примеров, сколько пакетов и что стало с неполным. */
export function summary(L, s, b, drop) {
  const n = length(L, s);
  const full = Math.floor(n / b);
  const rest = n % b;
  if (rest === 0 && drop) return `Примеров: ${n}, пакетов: ${full} по ${b}; неполного пакета нет - drop_last отбрасывать нечего.`;
  if (rest === 0) return `Примеров: ${n}, пакетов: ${full} по ${b}.`;
  if (drop) return `Примеров: ${n}, пакетов: ${full} по ${b}; неполный пакет из ${rest} отброшен (drop_last=True).`;
  return `Примеров: ${n}, пакетов: ${full + 1}: ${full} по ${b} и неполный из ${rest}.`;
}
