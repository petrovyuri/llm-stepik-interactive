// Python-зеркала строковых функций для демо: str.split() и str.strip() без аргументов,
// repr() строки и списка строк. Чистые функции без DOM. Нужны двум демо
// (m03/text-to-tokens, m05/word-vocab) и сверяются с их эталонами.

// Пробельные символы Python: [c for c in map(chr, range(0x110000)) if c.isspace()].
const SPACES = new Set([
  0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x85, 0xa0, 0x1680,
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200a,
  0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
]);
export const isSpace = (ch) => SPACES.has(ch.codePointAt(0));

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

/** repr() списка строк, как печатает print: ['я', 'люблю']. */
export function reprList(items) {
  return `[${items.map(reprStr).join(", ")}]`;
}
