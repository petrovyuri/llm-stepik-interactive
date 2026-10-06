# -*- coding: utf-8 -*-
"""Локальный сервер для проверки демо: как http.server, но без кеша браузера.

Без этого браузер отдаёт из кеша старые страницы, logic.js и kit/*, и стенд
tests/layout.html проверяет не то, что лежит на диске.

Запуск: py -3.11 tests/serve.py [порт]   (по умолчанию 8765, корень - папка репозитория)
"""
import functools
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    # На Windows реестр иногда сопоставляет .js с text/plain - тогда ES-модули не грузятся.
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    handler = functools.partial(NoCacheHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
        print(f"http://127.0.0.1:{port}/ ({ROOT})", flush=True)
        server.serve_forever()


if __name__ == "__main__":
    main()
