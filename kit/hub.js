// Главная страница сайта: карточки модулей со списком демо.
// Чистые функции без DOM - их проверяет tests/hub.test.js.

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
    return { module, title: entry.title, about: entry.about, demos: list };
  });
}

/** «29 демо в 8 модулях», «1 демо в 1 модуле». */
export function countText(demoCount, moduleCount) {
  const one = moduleCount % 10 === 1 && moduleCount % 100 !== 11;
  return `${demoCount} демо в ${moduleCount} ${one ? "модуле" : "модулях"}`;
}
