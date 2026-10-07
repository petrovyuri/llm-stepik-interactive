// Логика демо «Словарь, [UNK] и обратный путь» (модуль 5, урок «Пишем простой токенизатор»).
// Повторяет функции урока tokenize_words_with_unk и detokenize_words. Чистые функции
// без DOM - сверяются с golden.json (код урока, исполненный в Python) в tests/golden.test.js.

import { pySplit, reprList } from "../../kit/py.js";

/** word_vocab урока: токен(слово) -> ID, в порядке записи. */
export const VOCAB = [["Кот", 2], ["любит", 3], ["сметану", 4], ["Пробел", 99], ["[UNK]", 100]];
export const MAX_ADDED = 8;
export const MAX_WORDS = 10;   // больше слов не помещается в iframe высотой 600 px

/** Словарь урока плюс добавленные слова: каждое получает следующий свободный ID до 99. */
export function vocabWith(added) {
  const entries = VOCAB.map(([word, id]) => [word, id]);
  for (const word of added) {
    if (entries.some(([w]) => w === word)) continue;
    const next = Math.max(...entries.map(([, id]) => id).filter((id) => id < 99)) + 1;
    entries.push([word, next]);
  }
  return entries;
}

/** tokenize_words_with_unk: ID слов, между словами - ID «Пробел», чужие слова - [UNK]. */
function tokenize(words, vocab) {
  const ids = [];
  words.forEach((word, i) => {
    ids.push(vocab.has(word) ? vocab.get(word) : vocab.get("[UNK]"));
    if (i < words.length - 1) ids.push(vocab.get("Пробел"));
  });
  return ids;
}

/** detokenize_words: ID обратно в слова, «Пробел» выбрасывается, слова - через один пробел. */
function detokenize(ids, idToWord) {
  return ids.map((id) => idToWord.get(id)).filter((word) => word !== "Пробел").join(" ");
}

/** Всё, что показывает демо, для строки и добавленных слов. */
export function run(text, added) {
  const entries = vocabWith(added);
  const vocab = new Map(entries);
  const words = pySplit(text);
  const ids = tokenize(words, vocab);
  const restored = detokenize(ids, new Map(entries.map(([word, id]) => [id, word])));
  const unknown = [];
  for (const word of words) if (!vocab.has(word) && !unknown.includes(word)) unknown.push(word);
  const unk = ids.filter((id) => id === vocab.get("[UNK]")).length;
  let status;
  let message;
  if (restored === text) {
    [status, message] = ["same", "Строка восстановилась целиком."];
  } else if (restored === words.join(" ")) {
    [status, message] = ["spaces", "Слова вернулись, но пробелы стали одиночными: detokenize_words склеивает слова через один пробел."];
  } else if (unk) {
    [status, message] = ["lost", `Потеряно слов: ${unk}. Добавьте их в словарь кнопками «+».`];
  } else {
    [status, message] = ["lost", "Часть текста не вернулась: слово «Пробел» detokenize_words выбрасывает, как настоящий пробел."];
  }
  return {
    words, wordsLine: reprList(words),
    ids, idsLine: `Идентификаторы слов: [${ids.join(", ")}]`,
    restored, restoredLine: `Восстановленный текст: ${restored}`,
    unknown, unk, status, message,
  };
}
