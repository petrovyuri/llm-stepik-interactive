# Интерактивные демо к курсу «LLM своими руками»

Живые схемы к курсу [«LLM своими руками»](https://stepik.org/a/276236) на Stepik. На курсе с нуля пишут маленькую языковую модель: токенизатор, механизм внимания, трансформер, обучение и генерацию текста.

Каждое демо разбирает один механизм из урока. Числа можно менять, векторы и ползунки двигать, а кнопка «▶ по шагам» проигрывает вычисление в том же порядке, что и урок. Первый экран всегда повторяет пример из урока, поэтому любое число легко сверить с текстом.

Демо встроены в шаги курса, но открываются и сами по себе, по ссылкам ниже.

## Демо

Модуль 2 «Мини-математика»:

- [Скалярное произведение = похожесть](https://petrovyuri.github.io/llm-stepik-interactive/m02/dot-product/) - урок «Скаляр → Вектор → Матрица → Тензор»
- [Умножение матриц по шагам](https://petrovyuri.github.io/llm-stepik-interactive/m02/matmul/) - тот же урок
- [Форма тензора и reshape](https://petrovyuri.github.io/llm-stepik-interactive/m02/tensor-shape/) - тот же урок
- [Softmax и температура](https://petrovyuri.github.io/llm-stepik-interactive/m02/softmax-temperature/) - урок «softmax и temperature»
- [Градиентный спуск](https://petrovyuri.github.io/llm-stepik-interactive/m02/gradient-descent/) - урок «Производная (очень упрощённо)»

Модуль 3 «Мини-курс Python»:

- [Коробки и операции](https://petrovyuri.github.io/llm-stepik-interactive/m03/arithmetic/) - урок «Переменные, типы, операции»
- [Цикл по шагам](https://petrovyuri.github.io/llm-stepik-interactive/m03/loop-trace/) - урок «Условия и циклы»
- [От строки к токенам](https://petrovyuri.github.io/llm-stepik-interactive/m03/text-to-tokens/) - урок «Функции»
- [Autograd: y = w · x](https://petrovyuri.github.io/llm-stepik-interactive/m03/autograd/) - урок «PyTorch самое нужное»

Модуль 5 «Токенизация»:

- [BPE по шагам](https://petrovyuri.github.io/llm-stepik-interactive/m05/bpe-merges/) - урок «BPE»
- [Словарь, [UNK] и обратный путь](https://petrovyuri.github.io/llm-stepik-interactive/m05/word-vocab/) - урок «Пишем простой токенизатор»

## Как это устроено

Обычные HTML-страницы без сборки и сторонних библиотек, опубликованные через GitHub Pages. В `kit/` лежат общие стили и компоненты, в `mNN/<демо>/` - страница демо и файл `logic.js` с её вычислениями.

Здесь только готовые страницы. Исходники, тесты и эталонные расчёты на Python и PyTorch, с которыми сверяются числа в демо, лежат в рабочем репозитории автора курса.
