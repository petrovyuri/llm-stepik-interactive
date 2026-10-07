// Логика демо «От строки к токенам» (модуль 3, урок «Функции»).
// Строковые методы ведут себя как в Python: strip() и split() без аргументов режут по
// пробельным символам Python (str.isspace), результат показывается в записи Python (repr).
// Чистые функции без DOM - сверяются с golden.json (сам Python) в tests/golden.test.js.

import { pyStrip, pySplit, reprList, reprStr } from "../../kit/py.js";

export { pyStrip, pySplit, reprStr };   // эталон m03/text-to-tokens проверяет их напрямую

export const STEPS = ["strip", "lower", "replace", "split"];

const APPLY = {
  strip: (s) => pyStrip(s),
  lower: (s) => s.toLowerCase(),
  replace: (s) => s.split("!").join(""),
  split: (s) => pySplit(s),
};

/** Включённые шаги по порядку: { stages: [{ step, value }], result }. */
export function pipeline(text, flags) {
  let value = text;
  const stages = [];
  for (const step of STEPS) {
    if (!flags[step]) continue;
    value = APPLY[step](value);
    stages.push({ step, value });
  }
  return { stages, result: value };
}

/** Как значение выглядит в Python: строка - repr, список строк - как печатает print. */
export function view(value) {
  return Array.isArray(value) ? reprList(value) : reprStr(value);
}

export function stageViews(text, flags) {
  return pipeline(text, flags).stages.map((stage) => view(stage.value));
}

/** Что напечатает print(s): строку - как есть, список - в записи Python. */
export function printed(text, flags) {
  const { result } = pipeline(text, flags);
  return Array.isArray(result) ? view(result) : result;
}

const TITLES = {
  strip: "strip() убирает пробелы по краям",
  lower: "lower() делает все буквы строчными",
  replace: 'replace("!", "") убирает восклицательные знаки',
  split: "split() режет строку по пробелам на список слов",
};

/** Подписи для «▶ по шагам». */
export function captions(text, flags) {
  return pipeline(text, flags).stages.map((stage) => `${TITLES[stage.step]}: ${view(stage.value)}`);
}
