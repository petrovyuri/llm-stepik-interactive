// Логика демо «BPE по шагам» (модуль 5, урок «BPE»).
// Повторяет код урока 7: word_freqs = Counter(corpus), get_stats, merge_vocab (склеивает
// только точную пару), max(stats, key=stats.get) - первая пара с наибольшей частотой.
// Чистые функции без DOM - сверяются с golden.json (код урока, исполненный в Python).

import { isSpace, pyStrip, reprList, reprStr } from "../../kit/py.js";

export const MAX_WORDS = 8;
export const MAX_LEN = 10;   // 12 букв не влезают в строку на 700 px
export const DEFAULT_MERGES = 10;
export const MAX_MERGES = 20;

/** Корпус из поля ввода: слова через запятую. */
export function parseCorpus(text) {
  const words = text.split(",").map(pyStrip).filter((word) => word);
  if (!words.length) return { ok: false, error: "Введите хотя бы одно слово." };
  if (words.length > MAX_WORDS) return { ok: false, error: `Не больше ${MAX_WORDS} слов.` };
  for (const word of words) {
    if ([...word].some(isSpace)) return { ok: false, error: `«${word}» - слово с пробелом; слова разделяются запятыми.` };
    if ([...word].length > MAX_LEN) return { ok: false, error: `«${word}» длиннее ${MAX_LEN} символов.` };
  }
  return { ok: true, words };
}

/** get_stats: частоты пар соседних символов с учётом частот слов, в порядке появления (как Counter). */
function getStats(vocab, freqs) {
  const pairs = new Map();
  for (const [word, symbols] of vocab) {
    for (let i = 0; i < symbols.length - 1; i += 1) {
      const key = JSON.stringify([symbols[i], symbols[i + 1]]);
      const item = pairs.get(key) ?? [symbols[i], symbols[i + 1], 0];
      item[2] += freqs.get(word);
      pairs.set(key, item);
    }
  }
  return [...pairs.values()];
}

/** merge_vocab: склеить только два соседних символа, совпадающих с парой. */
function mergeVocab([a, b], vocab) {
  return vocab.map(([word, symbols]) => {
    const merged = [];
    let i = 0;
    while (i < symbols.length) {
      if (i < symbols.length - 1 && symbols[i] === a && symbols[i + 1] === b) {
        merged.push(a + b);
        i += 2;
      } else {
        merged.push(symbols[i]);
        i += 1;
      }
    }
    return [word, merged];
  });
}

/** Восемь самых частых пар; при равенстве - в порядке появления (сортировка устойчивая). */
const top = (stats) => [...stats].sort((x, y) => y[2] - x[2]).slice(0, 8).map((item) => [...item]);

/** Обучение по шагам: начальное разбиение, каждое слияние и пары, что остались. */
export function train(words, merges) {
  const freqs = new Map();
  for (const word of words) freqs.set(word, (freqs.get(word) ?? 0) + 1);
  let vocab = [...freqs.keys()].map((word) => [word, [...word, "</w>"]]);
  const initial = vocab.map(([word, symbols]) => [word, [...symbols]]);
  const steps = [];
  for (let k = 0; k < merges; k += 1) {
    const stats = getStats(vocab, freqs);
    if (!stats.length) break;
    const best = stats.reduce((acc, item) => (item[2] > acc[2] ? item : acc));
    const pair = [best[0], best[1]];
    vocab = mergeVocab(pair, vocab);
    steps.push({ pair, count: best[2], top: top(stats), vocab: vocab.map(([word, symbols]) => [word, [...symbols]]) });
  }
  return { initial, steps, after: top(getStats(vocab, freqs)) };
}

/** Строка, которую печатает урок на шаге k. */
export function stepLine(k, [a, b]) {
  return `Шаг ${k}: объединяем пару (${reprStr(a)}, ${reprStr(b)})`;
}

const wordLine = ([word, symbols]) => `${word}: ${reprList(symbols)}`;

/** Весь вывод программы урока для корпуса и числа слияний. */
export function lines(words, merges) {
  const { initial, steps } = train(words, merges);
  const final = steps.length ? steps[steps.length - 1].vocab : initial;
  return [
    "Начальный словарь подслов (каждое слово как список символов):",
    ...initial.map(wordLine),
    ...steps.map((step, i) => stepLine(i + 1, step.pair)),
    "",
    "Итоговое разбиение:",
    ...final.map(wordLine),
  ];
}
