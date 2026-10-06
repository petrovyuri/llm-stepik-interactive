// Логика демо «Цикл по шагам» (модуль 3, урок «Условия и циклы»).
// Не интерпретатор Python, а точная модель четырёх программ урока: трасса совпадает
// с sys.settrace в Python 3.11 (событие - строка перед выполнением, снимок переменных
// и вывода). Чистые функции без DOM - сверяются с golden.json в tests/golden.test.js.

export const PROGRAMS = ["if", "while", "break", "continue"];
export const DEFAULTS = { if: { temp: 3 }, while: { limit: 3 }, break: { items: [1, 3, 7, 9] }, continue: { items: [1, 0, 2] } };
export const MAX_ITEMS = 8;

const listRepr = (items) => `[${items.join(", ")}]`;

/** Код программы построчно - как в уроке, с параметрами ученика. */
export function code(name, p) {
  switch (name) {
    case "if":
      return [`temp = ${p.temp}`, "", "if temp < 0:", '    print("Мороз")', "elif temp < 10:", '    print("Прохладно")', "else:", '    print("Тепло")'];
    case "while":
      return ["x = 0", `while x < ${p.limit}:`, '    print("x =", x)', "    x += 1"];
    case "break":
      return [`for n in ${listRepr(p.items)}:`, "    if n == 7:", '        print("Нашёл 7!")', "        break"];
    case "continue":
      return [`for n in ${listRepr(p.items)}:`, "    if n == 0:", "        continue", "    print(10 / n)"];
    default:
      throw new Error(`нет программы ${name}`);
  }
}

/** repr(float) Python для результатов 10 / n: целое - с «.0», иначе кратчайшая запись. */
export function reprFloat(v) {
  if (Number.isInteger(v)) return `${Object.is(v, -0) ? "-0" : v}.0`;
  return String(v);
}

/** Трасса как у sys.settrace: { events: [{ line, vars, out }], output, vars }. */
export function trace(name, p) {
  const events = [];
  const vars = {};
  let out = "";
  const emit = (line) => events.push({ line, vars: { ...vars }, out });
  const print = (text) => { out += `${text}\n`; };

  if (name === "if") {
    emit(1);
    vars.temp = String(p.temp);
    emit(3);
    if (p.temp < 0) {
      emit(4); print("Мороз");
    } else {
      emit(5);
      if (p.temp < 10) { emit(6); print("Прохладно"); } else { emit(8); print("Тепло"); }
    }
  } else if (name === "while") {
    emit(1);
    let x = 0;
    vars.x = "0";
    for (;;) {
      emit(2);
      if (!(x < p.limit)) break;
      emit(3); print(`x = ${x}`);
      emit(4); x += 1; vars.x = String(x);
    }
  } else if (name === "break") {
    let stopped = false;
    for (const n of p.items) {
      emit(1); vars.n = String(n);
      emit(2);
      if (n === 7) { emit(3); print("Нашёл 7!"); emit(4); stopped = true; break; }
    }
    if (!stopped) emit(1);
  } else if (name === "continue") {
    for (const n of p.items) {
      emit(1); vars.n = String(n);
      emit(2);
      if (n === 0) { emit(3); continue; }
      emit(4); print(reprFloat(10 / n));
    }
    emit(1);
  } else {
    throw new Error(`нет программы ${name}`);
  }
  return { events, output: out, vars: { ...vars } };
}

/** Список из поля ввода: «1, 3, 7, 9» или «[1, 3, 7, 9]», целые от -9 до 9, не больше MAX_ITEMS. */
export function parseItems(text) {
  let body = text.trim();
  if (body.startsWith("[")) body = body.slice(1);
  if (body.endsWith("]")) body = body.slice(0, -1);
  body = body.trim();
  if (body === "") return { ok: true, items: [] };
  const parts = body.split(",").map((part) => part.trim());
  if (parts.length > MAX_ITEMS) return { ok: false, error: `не больше ${MAX_ITEMS} чисел` };
  const items = [];
  for (const part of parts) {
    if (!/^-?[0-9]+$/.test(part)) return { ok: false, error: `«${part}» - не целое число` };
    const n = Number(part);
    if (n < -9 || n > 9) return { ok: false, error: "числа от -9 до 9" };
    items.push(n === 0 ? 0 : n);
  }
  return { ok: true, items };
}
