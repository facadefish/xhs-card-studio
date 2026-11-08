import os
import zipfile

src = "dist/小红书图文助手-v0.0.1-windows"
out = "dist/小红书图文助手-v0.0.1-windows.zip"
if os.path.exists(out):
    os.remove(out)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for root, _, files in os.walk(src):
        for f in files:
            p = os.path.join(root, f)
            z.write(p, os.path.relpath(p, "dist"))
print("size:", os.path.getsize(out))
with zipfile.ZipFile(out) as z:
    for n in z.namelist():
        print(n)
