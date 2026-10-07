// Логика демо «Скользящее окно» (модуль 6, уроки «Первый датасет» и «Класс Dataset»).
// Повторяет SimpleDataset урока 3 (__len__, __getitem__) и цикл «растущего контекста»
// урока 2 на тексте cat_story.txt. Чистые функции без DOM - сверяются с golden.json
// (код уроков, исполненный в Python с настоящим токенизатором gpt2).

/** ID токенов cat_story.txt (gpt2, 66 штук) и их тексты - tokenizer.decode([id]). */
export const IDS = [464, 3797, 6151, 11348, 8566, 13, 679, 373, 5586, 287, 262, 9592, 4953, 329, 465, 4870, 13, 220, 198, 464, 4870, 1625, 422, 262, 1910, 290, 19036, 617, 8566, 329, 262, 3797, 656, 257, 9396, 13, 198, 464, 3797, 373, 3772, 290, 1308, 1806, 351, 9476, 13, 220, 198, 6109, 1110, 262, 3797, 373, 4953, 329, 262, 11348, 8566, 13, 632, 373, 465, 4004, 2057, 13];
export const PIECES = ["The", " cat", " loved", " sour", " cream", ".", " He", " was", " sitting", " in", " the", " kitchen", " waiting", " for", " his", " owner", ".", " ", "\n", "The", " owner", " came", " from", " the", " market", " and", " poured", " some", " cream", " for", " the", " cat", " into", " a", " bowl", ".", "\n", "The", " cat", " was", " happy", " and", " pur", "ring", " with", " pleasure", ".", " ", "\n", "Every", " day", " the", " cat", " was", " waiting", " for", " the", " sour", " cream", ".", " It", " was", " his", " favorite", " food", "."];
export const MAX_LEN = 8;
export const MAX_STRIDE = 8;
export const MAX_CONTEXT = 8;

const PIECE = new Map(IDS.map((id, i) => [id, PIECES[i]]));

export const tokens = () => ({ ids: IDS, pieces: PIECES });

/** tokenizer.decode(ids): для этого (ASCII) текста - склейка кусочков. */
export const decode = (ids) => ids.map((id) => PIECE.get(id)).join("");

/** SimpleDataset.__len__: (len(input_ids) - max_length - 1) // stride + 1. */
export function length(L, s) {
  return Math.floor((IDS.length - L - 1) / s) + 1;
}

export function formula(L, s) {
  return `len(dataset) = (${IDS.length} - ${L} - 1) // ${s} + 1 = ${length(L, s)}`;
}

/** SimpleDataset.__getitem__(idx): chunk (X) и targets (Y, сдвиг на 1). */
export function item(L, s, idx) {
  const start = idx * s;
  const x = IDS.slice(start, start + L);
  const y = IDS.slice(start + 1, start + L + 1);
  return { start, x, y, xText: decode(x), yText: decode(y) };
}

/** Номера токенов, которые не попадают ни в X, ни в Y ни одного примера. */
export function skipped(L, s) {
  const covered = new Set();
  for (let idx = 0; idx < length(L, s); idx += 1) {
    for (let i = idx * s; i <= idx * s + L; i += 1) covered.add(i);
  }
  return IDS.map((_, i) => i).filter((i) => !covered.has(i));
}

/** Вывод цикла «растущего контекста» урока 2 для window_context = n. */
export function growingLines(n) {
  const lines = ["=".repeat(60), "Пары 'Вход → Цель' для обучения модели", "=".repeat(60)];
  for (let i = 1; i <= n; i += 1) {
    const context = IDS.slice(0, i);
    lines.push(`${decode(context).padEnd(40)} → ${PIECE.get(IDS[i])}`);
    lines.push(`${`[${context.join(", ")}]`.padEnd(40)} → ${IDS[i]}`);
  }
  return lines;
}
