// Логика демо «От ID к вектору» (модуль 7, урок «Векторные представления»).
// Кусок таблицы token_embedding слоя EmbeddingLayer урока 3 (seed 42) около токенов
// фразы «The cat loved sour cream». Числа - в data.js (генерирует эталон), функции
// чистые, без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";
import { ROWS, TOKENS } from "./data.js";

export const VOCAB = 50257;
export const EMBED_DIM = 16;

export const tokens = () => TOKENS;

/** Строки таблицы от id-2 до id+2: weight[id-2 : id+3]. */
export function around(id) {
  const ids = [id - 2, id - 1, id, id + 1, id + 2];
  return { ids, rows: ids.map((r) => ROWS[r]) };
}

/** Числа строки id с 4 знаками, как их печатает torch. */
export const cells = (id) => ROWS[id].map((v) => fixed(v, 4));

/** Форма token_embedding(torch.tensor(первые n ID фразы)): torch.Size([n, 16]). */
export const shape = (n) => `torch.Size([${n}, ${EMBED_DIM}])`;
