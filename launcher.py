"""小红书图文助手 — 免安装启动器。

双击「小红书图文助手.exe」（PyInstaller 打包）或 `python launcher.py` 均可：
托管 web/ 目录并自动打开浏览器。web/ 是纯前端应用，serve.py 只做静态托管。
"""

import os
import sys
from pathlib import Path

# PyInstaller 冻结时 web/ 在临时解包目录（--add-data web;web）；源码运行时在项目根
BASE = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
if getattr(sys, "frozen", False):
    os.environ["MD2XHS_WEB_ROOT"] = str(BASE / "web")

sys.path.insert(0, str(BASE / "web"))

from serve import main

main()
