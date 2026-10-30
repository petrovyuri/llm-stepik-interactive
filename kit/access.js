// Доступ к демо вне курса. Бесплатны первые пять карточек главной; остальные демо
// показываются в уроках Stepik, а по прямой ссылке - заглушка с кнопкой курса.
// Защита мягкая: сайт и код публичные, правило отсекает случайных посетителей.
// Чистые функции без DOM - их проверяет tests/access.test.js.

export const COURSE_URL = "https://stepik.org/a/276236";
export const FREE_MODULES = [2, 3, 5, 6, 7];   // первые пять карточек главной (у модулей 1 и 4 демо нет)

const STEPIK = /^https:\/\/([a-z0-9-]+\.)*stepik\.org(\/|$)/;
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isFree(module) {
  return FREE_MODULES.includes(module);
}

/** Номер модуля из адреса страницы демо: «/…/m08/attention-steps/» → 8, вне mNN/ → null. */
export function moduleOf(pathname) {
  const match = /\/m(\d{2})\/[a-z0-9-]+\//.exec(pathname);
  return match ? Number(match[1]) : null;
}

/** Адрес родительской страницы iframe: ancestorOrigins (Chrome, Safari), иначе referrer, иначе null. */
export function parentOrigin(ancestorOrigins, referrer) {
  const first = ancestorOrigins?.[0];
  if (first && first !== "null") return first;
  if (!referrer) return null;
  try {
    return new URL(referrer).origin;
  } catch {
    return null;
  }
}

/**
 * Можно ли показать демо. Закрытый модуль открыт: на локальном сервере, по ссылке со Stepik
 * и в iframe на Stepik. В iframe с неизвестным родителем тоже открыт: приложение Stepik и
 * Firefox родителя могут не сообщить, а ломать урок оплатившим нельзя.
 */
export function canShow({ module, host, framed, parent, referrer }) {
  if (module === null || isFree(module) || LOCAL.has(host)) return true;
  if (STEPIK.test(referrer ?? "")) return true;
  if (framed) return parent === null || STEPIK.test(parent);
  return false;
}
