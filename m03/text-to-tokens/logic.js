// Логика демо «От строки к токенам» (модуль 3, урок «Функции»).
// Строковые методы ведут себя как в Python: strip() и split() без аргументов режут по
// пробельным символам Python (str.isspace), результат показывается в записи Python (repr).
// Чистые функции без DOM - сверяются с golden.json (сам Python) в tests/golden.test.js.

export const STEPS = ["strip", "lower", "replace", "split"];

// Пробельные символы Python: [c for c in map(chr, range(0x110000)) if c.isspace()].
const SPACES = new Set([
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x85, 0xa0, 0x1680,
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
  0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
]);
const isSpace = (ch) => SPACES.has(ch.codePointAt(0));

/** str.strip() без аргументов. */
export function pyStrip(s) {
  const chars = [...s];
  let start = 0;
  let end = chars.length;
  while (start < end && isSpace(chars[start])) start += 1;
  while (end > start && isSpace(chars[end - 1])) end -= 1;
  return chars.slice(start, end).join("");
}

/** str.split() без аргументов: режет по любым пробелам, пустых слов нет. */
export function pySplit(s) {
  const words = [];
  let word = "";
  for (const ch of s) {
    if (isSpace(ch)) {
      if (word) words.push(word);
      word = "";
    } else {
      word += ch;
    }
  }
  if (word) words.push(word);
  return words;
}

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

const hex = (code, width) => code.toString(16).padStart(width, "0");
const isPrintable = (ch) => ch === " " || !/[\p{C}\p{Z}]/u.test(ch);

/** repr() строки, как в Python 3: выбор кавычек, \t \n \r \\, непечатные символы - \x, \u, \U. */
export function reprStr(s) {
  const quote = s.includes("'") && !s.includes('"') ? '"' : "'";
  let out = quote;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (ch === quote || ch === "\\") out += `\\${ch}`;
    else if (ch === "\t") out += "\\t";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (!isPrintable(ch)) {
      if (code < 0x100) out += `\\x${hex(code, 2)}`;
      else if (code < 0x10000) out += `\\u${hex(code, 4)}`;
      else out += `\\U${hex(code, 8)}`;
    } else out += ch;
  }
  return out + quote;
}

/** Как значение выглядит в Python: строка - repr, список строк - как печатает print. */
export function view(value) {
  return Array.isArray(value) ? `[${value.map(reprStr).join(", ")}]` : reprStr(value);
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
