// Логика демо «Коробки и операции» (модуль 3, урок «Переменные, типы, операции»).
// Переменные a и b (int, float или str) и семь операторов - с результатами, типами
// и текстами ошибок ровно как в Python 3.11. Чистые функции без DOM - сверяются
// с golden.json (сам Python) в tests/golden.test.js.

export const OPS = ["+", "-", "*", "/", "//", "%", "**"];
export const TYPES = ["int", "float", "str"];

const DESC = { "+": "сложение", "-": "вычитание", "*": "умножение", "/": "деление, результат всегда float",
  "%": "остаток от деления", "**": "возведение в степень" };
const STR_DESC = { "+": "строки склеиваются, а не складываются", "*": "строка повторяется" };
const HINT = { ZeroDivisionError: "на ноль делить нельзя",
  TypeError: "такие типы так не сочетаются; число из строки получают через int()" };

/** repr(float) Python: кратчайшая запись, «.0» у целых, экспонента вне [1e-4, 1e16). */
export function reprFloat(x) {
  if (Object.is(x, -0)) return "-0.0";
  if (x === 0) return "0.0";
  const [mantissa, power] = x.toExponential().split("e");
  const exp = Number(power);
  const sign = x < 0 ? "-" : "";
  const digits = mantissa.replace("-", "").replace(".", "");
  if (exp < -4 || exp >= 16) {
    const m = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
    return `${sign}${m}e${exp < 0 ? "-" : "+"}${String(Math.abs(exp)).padStart(2, "0")}`;
  }
  if (exp < 0) return `${sign}0.${"0".repeat(-exp - 1)}${digits}`;
  if (digits.length <= exp + 1) return `${sign}${digits}${"0".repeat(exp + 1 - digits.length)}.0`;
  return `${sign}${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}`;
}

/** Значение в записи Python (repr). */
function repr({ type, v }) {
  if (type === "str") return `'${v}'`;
  return type === "float" ? reprFloat(v) : String(v);
}

const make = (n, type) => ({ type, v: type === "str" ? String(n) : n });

/** Как значение записано в коде: 10, 10.0, "10". */
export function literal(n, type) {
  return type === "str" ? `"${n}"` : repr(make(n, type));
}

const copysign = (x, y) => (y < 0 || Object.is(y, -0) ? -Math.abs(x) : Math.abs(x));

/** // и % для float - тот же алгоритм, что float_divmod в CPython. */
function floatDivmod(vx, wx) {
  let mod = vx % wx;                       // fmod
  let div = (vx - mod) / wx;
  if (mod) {
    if ((wx < 0) !== (mod < 0)) { mod += wx; div -= 1; }
  } else {
    mod = copysign(0, wx);
  }
  let floordiv;
  if (div) {
    floordiv = Math.floor(div);
    if (div - floordiv > 0.5) floordiv += 1;
  } else {
    floordiv = copysign(0, vx / wx);
  }
  return [floordiv, mod];
}

/** a ** b для целых значений: при отрицательной степени - деление на точную степень. */
const power = (a, b) => (b >= 0 ? a ** b : 1 / a ** -b);

class PyError extends Error {
  constructor(name, message) { super(message); this.pyName = name; }
}
const typeError = (message) => new PyError("TypeError", message);
const zeroError = (message) => new PyError("ZeroDivisionError", message);
const unsupported = (op, a, b) => typeError(`unsupported operand type(s) for ${op === "**" ? "** or pow()" : op}: '${a.type}' and '${b.type}'`);

function applyStr(op, a, b) {
  if (op === "+") {
    if (a.type === "str" && b.type === "str") return make(a.v + b.v, "str");
    if (a.type === "str") throw typeError(`can only concatenate str (not "${b.type}") to str`);
    throw unsupported(op, a, b);
  }
  if (op === "*") {
    const [text, count] = a.type === "str" ? [a, b] : [b, a];
    if (count.type !== "int") throw typeError(`can't multiply sequence by non-int of type '${count.type}'`);
    return make(text.v.repeat(Math.max(count.v, 0)), "str");
  }
  if (op === "%" && a.type === "str") throw typeError("not all arguments converted during string formatting");
  throw unsupported(op, a, b);
}

function applyNum(op, a, b) {
  const x = a.v;
  const y = b.v;
  const ints = a.type === "int" && b.type === "int";
  const num = (v, type) => ({ type, v });
  const kind = ints ? "int" : "float";
  switch (op) {
    case "+": return num(x + y, kind);
    case "-": return num(x - y, kind);
    case "*": return num(x * y, kind);
    case "/":
      if (y === 0) throw zeroError(ints ? "division by zero" : "float division by zero");
      return num(x / y, "float");
    case "//":
      if (y === 0) throw zeroError(ints ? "integer division or modulo by zero" : "float floor division by zero");
      return ints ? num(Math.floor(x / y), "int") : num(floatDivmod(x, y)[0], "float");
    case "%":
      if (y === 0) throw zeroError(ints ? "integer modulo by zero" : "float modulo");
      return ints ? num(x - y * Math.floor(x / y), "int") : num(floatDivmod(x, y)[1], "float");
    case "**":
      if (x === 0 && y < 0) throw zeroError("0.0 cannot be raised to a negative power");
      return num(power(x, y), ints && y >= 0 ? "int" : "float");
    default:
      throw new Error(`нет оператора ${op}`);
  }
}

function apply(op, a, b) {
  return a.type === "str" || b.type === "str" ? applyStr(op, a, b) : applyNum(op, a, b);
}

/** Семь строк таблицы: { op, ok, value, type } или { op, ok: false, error }. */
export function evaluate(na, ta, nb, tb) {
  const a = make(na, ta);
  const b = make(nb, tb);
  return OPS.map((op) => {
    try {
      const result = apply(op, a, b);
      return { op, ok: true, value: repr(result), type: result.type };
    } catch (error) {
      if (!(error instanceof PyError)) throw error;
      return { op, ok: false, error: `${error.pyName}: ${error.message}` };
    }
  });
}

/** a == b * (a // b) + a % b с подставленными числами; null для строк и при b = 0. */
export function check(na, ta, nb, tb) {
  if (ta === "str" || tb === "str" || nb === 0) return null;
  const a = make(na, ta);
  const b = make(nb, tb);
  const q = applyNum("//", a, b);
  const r = applyNum("%", a, b);
  return { text: `${repr(a)} == ${repr(b)} * ${repr(q)} + ${repr(r)}`, holds: a.v === b.v * q.v + r.v };
}

/** Подписи для «▶ по шагам»: строка таблицы и что произошло. */
export function captions(na, ta, nb, tb) {
  return evaluate(na, ta, nb, tb).map((row) => {
    const expr = `${literal(na, ta)} ${row.op} ${literal(nb, tb)}`;
    if (!row.ok) {
      const name = row.error.split(":")[0];
      return `${expr} - ошибка ${name}: ${HINT[name]}`;
    }
    if (row.type === "str") return `${expr} = ${row.value}: ${STR_DESC[row.op]}`;
    if (row.op === "//") return `${expr} = ${row.value}: делим, ${reprFloat(na / nb)}, и округляем вниз`;
    return `${expr} = ${row.value}: ${DESC[row.op]}`;
  });
}
