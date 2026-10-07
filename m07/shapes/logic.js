// Логика демо «Формы и параметры» (модуль 7, урок «Код. Слои эмбеддингов»).
// Формы тензоров EmbeddingLayer урока 3 на первом пакете DataLoader (cat_story.txt,
// stride = 1) и число параметров слоя. Чистые функции без DOM - сверяются с golden.json.
import { fixed } from "../../kit/format.js";
import { IDS } from "../../m06/sliding-window/logic.js";

export const VOCAB = 50257;
export const DIMS = [4, 8, 16, 32];
export const MAX_BATCH = 4;
export const MAX_LEN = 8;
export const REFERENCE = [
  { name: "наш курс", vocab: 50257, positions: 4, dim: 16 },
  { name: "GPT-2 small", vocab: 50257, positions: 1024, dim: 768 },
  { name: "DeepSeek-V3.2", vocab: 129280, positions: 0, dim: 7168 },   // таблицы позиций нет: RoPE
];

/** Первый пакет DataLoader(shuffle=False): пример b - токены с b по b + L - 1. */
export const batchIds = (B, L) => Array.from({ length: B }, (_, b) => IDS.slice(b, b + L));

const size = (dims) => `torch.Size([${dims.join(", ")}])`;

/** Формы: batch_x [B, L], token_emb [B, L, D], pos_emb [1, L, D], сумма [B, L, D]. */
export const shapes = (B, L, D) => ({ x: size([B, L]), tok: size([B, L, D]), pos: size([1, L, D]), out: size([B, L, D]) });

/** get_num_parameters(): таблица токенов vocab × dim плюс таблица позиций positions × dim. */
export const params = (vocab, positions, dim) => vocab * dim + positions * dim;

const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

/** Память во float32 (4 байта на число): «3.2 МБ», от миллиарда байт - «3.7 ГБ». */
const memory = (n) => (n * 4 >= 1e9 ? `${fixed((n * 4) / 1e9, 1)} ГБ` : `${fixed((n * 4) / 1e6, 1)} МБ`);

export function paramsText(vocab, positions, dim) {
  const n = params(vocab, positions, dim);
  return { params: grouped(n), memory: memory(n) };
}

export const referenceRows = () => REFERENCE.map((r) => ({ ...r, params: params(r.vocab, r.positions, r.dim) }));
