"""Put back the big binary files that the source backup leaves out, taken from a released APK.
usage: python3 android/restore_from_apk.py raider-tycoon-2.3.apk

Restores android/proj/lib/arm64-v8a/*.so (AI engine, see native/README.md) and android/static/ (fonts, wllama).
The build tools in android/tools are not inside the APK; their sources are in android/TOOLS.md."""
import os, sys, zipfile, hashlib

H = os.path.dirname(os.path.abspath(__file__))
z = zipfile.ZipFile(sys.argv[1])
n = 0
for name in z.namelist():
    if name.startswith('lib/arm64-v8a/') and name.endswith('.so'):
        dst = os.path.join(H, 'proj', name)
    elif name.startswith('assets/fonts/') or name.startswith('assets/wllama/'):
        dst = os.path.join(H, 'static', name[len('assets/'):])
    else:
        continue
    if name.endswith('/'):
        continue
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    data = z.read(name)
    open(dst, 'wb').write(data)
    n += 1
    if name.endswith('.so'):
        print(name, hashlib.sha256(data).hexdigest()[:16])
print('restored', n, 'files')
