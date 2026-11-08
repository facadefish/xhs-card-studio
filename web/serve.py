"""小红书图文工作室 — 本地静态服务。

纯前端应用，本脚本只做两件事：托管 web/ 目录、自动打开浏览器。
双击 启动工作台.bat 等效。端口 8321 被占用时自动向后找（8321-8330）。
"""

import http.server
import os
import socketserver
import threading
import webbrowser
from functools import partial
from pathlib import Path

ROOT = Path(os.environ.get("MD2XHS_WEB_ROOT", Path(__file__).resolve().parent))


def free_port(start=8321, end=8331):
    import socket
    for p in range(start, end):
        with socket.socket() as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    raise SystemExit("8321-8330 端口都被占用，请关闭冲突程序后重试")


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    os.chdir(ROOT)
    port = free_port()
    url = f"http://127.0.0.1:{port}/"
    with socketserver.TCPServer(("127.0.0.1", port), Handler) as srv:
        print(f"工作室已启动：{url}（关闭此窗口即停止）", flush=True)
        if not os.environ.get("MD2XHS_NO_BROWSER"):
            threading.Timer(0.6, lambda: webbrowser.open(url)).start()
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
