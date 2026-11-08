"""Release 便捷包 zip 生成（CI 与本地共用）。

用法：python scripts/make_release_zip.py <包目录> <输出.zip>
"""

import os
import sys
import zipfile

src, out = sys.argv[1], sys.argv[2]
if os.path.exists(out):
    os.remove(out)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, _, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, os.path.dirname(src)))
print("size:", os.path.getsize(out))
with zipfile.ZipFile(out) as z:
    for n in z.namelist():
        print(n)
