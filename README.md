# llm-stepik-interactive

Интерактивные демо для курса Stepik «LLM своими руками» (#276236).
Страницы публикуются через GitHub Pages и встраиваются в шаги курса через `<iframe>`.

Адрес: https://petrovyuri.github.io/llm-stepik-interactive/

## Структура

- `demos.json` - реестр демо: slug, модуль, урок, заголовок, высота iframe.
- `kit/` - общие стили (`kit.css`), разбор и форматирование чисел (`format.js`), компоненты интерфейса (`ui.js`).
- `mNN/<slug>/` - демо: `index.html` (страница), `logic.js` (вычисления), `golden.json` (эталоны).
- `tests/` - проверки `node --test` (реестр, форматирование, эталоны) и `layout.html` (вёрстка в браузере).

Эталоны `golden.json` руками не правятся: их пишут скрипты `golden_<slug>.py` в проекте курса.

## Проверка

    node --test

Вёрстка: запустить `py -3.11 tests/serve.py 8767` (сервер без кеша браузера) и открыть
http://localhost:8767/tests/layout.html - стенд проверяет первый экран и сценарии `stress` из `demos.json`.
