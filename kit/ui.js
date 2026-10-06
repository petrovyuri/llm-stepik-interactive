// Общие компоненты демо: элементы, SVG, кнопка «по шагам», пресеты,
// ползунки и сетка чисел. Без зависимостей. Компонент попадает сюда,
// только когда он нужен хотя бы двум демо.

export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/** HTML-элемент: el("button", { class: "chip", onclick }, "текст"). */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else if (key === "class") node.className = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  node.append(...children.flat().filter((c) => c !== undefined && c !== null && c !== false));
  return node;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** SVG-элемент: svg("line", { x1: 0, y1: 0, x2: 10, y2: 10 }). */
export function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/** Скрипт демо отработал до конца - это проверяет tests/layout.html. */
export function ready() {
  document.documentElement.dataset.ready = "1";
}

/**
 * Кнопка «▶ по шагам». steps() - подписи шагов (берутся в момент запуска),
 * onStep(i, caption) рисует шаг i, onStep(-1, null) - обычный вид.
 * Повторное нажатие во время показа останавливает его. При reduced motion
 * каждое нажатие показывает следующий шаг.
 */
export function stepPlayer(button, { steps, onStep, interval = 1100 }) {
  const label = button.textContent;
  let list = [];
  let index = -1;
  let timer = null;

  function idle() {
    clearTimeout(timer);
    timer = null;
    index = -1;
    button.textContent = label;
    button.setAttribute("aria-pressed", "false");
  }

  function finish() {
    idle();
    onStep(-1, null);
  }

  function go(i) {
    index = i;
    onStep(i, list[i]);
  }

  function tick() {
    if (index + 1 < list.length) {
      go(index + 1);
      timer = setTimeout(tick, interval);
    } else {
      finish();
    }
  }

  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => {
    if (reducedMotion) {
      if (index === -1) list = steps();
      if (index + 1 < list.length) {
        go(index + 1);
        button.textContent = `шаг ${index + 1} из ${list.length} ▶`;
        button.setAttribute("aria-pressed", "true");
      } else {
        finish();
      }
      return;
    }
    if (timer !== null) {
      finish();
      return;
    }
    list = steps();
    if (list.length === 0) return;
    button.textContent = "■ стоп";
    button.setAttribute("aria-pressed", "true");
    go(0);
    timer = setTimeout(tick, interval);
  });

  return {
    /** Прервать показ (например, ученик начал менять данные). */
    stop() {
      if (index !== -1) finish();
    },
    active: () => index !== -1,
  };
}

/** Ряд кнопок-пресетов. items: [{ label, value }]; onPick(value, index). */
export function presets(container, items, onPick) {
  const buttons = items.map((item, i) => el("button", {
    type: "button",
    class: "chip",
    "aria-pressed": "false",
    onclick: () => {
      setActive(i);
      onPick(item.value, i);
    },
  }, item.label));
  container.replaceChildren(...buttons);

  function setActive(index) {
    buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === index)));
  }

  return { setActive };
}

let sliderCount = 0;

/** Ползунок с подписью значения. format(v) - текст значения, onInput(v) - при движении. */
export function slider(container, { label, min, max, step, value, format = String, onInput }) {
  sliderCount += 1;
  const id = `slider-${sliderCount}`;
  const output = el("output", { for: id, class: "slider__value" }, format(value));
  const input = el("input", { type: "range", id, min, max, step, value });
  input.addEventListener("input", () => {
    const v = Number(input.value);
    output.textContent = format(v);
    onInput(v);
  });
  container.append(el("label", { class: "slider", for: id },
    el("span", { class: "slider__top" }, el("span", {}, label), output),
    input));
  return {
    get: () => Number(input.value),
    set(v) {
      input.value = String(v);
      output.textContent = format(Number(input.value));
    },
  };
}

/**
 * Сетка чисел. values - массив строк (числа или строки; null рисуется как «?»).
 * editable - ячейки-поля ввода, onEdit(i, j, text) - ввод в ячейку.
 */
export function matrixView(container, values, { editable = false, onEdit = () => {}, format = String, label = "" } = {}) {
  const grid = el("div", { class: "matrix", role: "group", "aria-label": label });
  container.replaceChildren(grid);
  let cells = [];
  const show = (v) => (v === null ? "?" : format(v));

  function build(m) {
    const cols = m.length ? m[0].length : 0;
    grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell))`;
    cells = m.map((row, i) => row.map((v, j) => (editable
      ? el("input", {
        class: "matrix__cell",
        type: "text",
        inputmode: "decimal",
        autocomplete: "off",
        value: show(v),
        "aria-label": `${label} [${i + 1}, ${j + 1}]`,
        oninput: (e) => onEdit(i, j, e.target.value),
      })
      : el("span", { class: "matrix__cell" }, show(v)))));
    grid.replaceChildren(...cells.flat());
  }

  /** Новые значения; если форма та же - без пересоздания ячеек (фокус ввода не теряется). */
  function set(m) {
    const same = m.length === cells.length && m.every((row, i) => row.length === cells[i].length);
    if (!same) {
      build(m);
      return;
    }
    m.forEach((row, i) => row.forEach((v, j) => {
      const cell = cells[i][j];
      if (editable) {
        if (document.activeElement !== cell) cell.value = show(v);
      } else {
        cell.textContent = show(v);
      }
    }));
  }

  /** Переключает класс у ячеек: mark("is-row", (i, j) => i === 0). */
  function mark(className, predicate) {
    cells.forEach((row, i) => row.forEach((cell, j) => cell.classList.toggle(className, Boolean(predicate(i, j)))));
  }

  build(values);
  return { set, mark };
}
