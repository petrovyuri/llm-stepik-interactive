// Главная страница сайта: карточки модулей со списком демо.
// Чистые функции без DOM - их проверяет tests/hub.test.js.
import { isFree } from "./access.js";

/**
 * Карточки: модули с демо по номеру, демо внутри - по уроку (при равенстве - в порядке реестра).
 * demos - записи demos.json, modules - modules.json ({ module, title, about }).
 */
export function buildCatalog(demos, modules) {
  const numbers = [...new Set(demos.map((demo) => demo.module))].sort((a, b) => a - b);
  return numbers.map((module) => {
    const entry = modules.find((m) => m.module === module);
    if (!entry) throw new Error(`modules.json: нет описания, модуль ${module}`);
    const list = demos.filter((demo) => demo.module === module)
      .map((demo, order) => ({ demo, order }))
      .sort((a, b) => a.demo.lesson - b.demo.lesson || a.order - b.order)
      .map(({ demo }) => ({ slug: demo.slug, title: demo.title, about: demo.about, lesson: demo.lesson, href: `${demo.slug}/` }));
    return { module, title: entry.title, about: entry.about, free: isFree(module), demos: list };
  });
}

/** Плашка перед закрытыми карточками: «Ещё 12 демо в 3 модулях открываются в уроках курса на Stepik.» */
export function lockedText(catalog) {
  const locked = catalog.filter((card) => !card.free);
  if (locked.length === 0) return "";
  const demos = locked.reduce((sum, card) => sum + card.demos.length, 0);
  return `Ещё ${countText(demos, locked.length)} ${demos === 1 ? "открывается" : "открываются"} в уроках курса на Stepik.`;
}

/** «29 демо в 8 модулях», «1 демо в 1 модуле». */
export function countText(demoCount, moduleCount) {
  const one = moduleCount % 10 === 1 && moduleCount % 100 !== 11;
  return `${demoCount} демо в ${moduleCount} ${one ? "модуле" : "модулях"}`;
}
