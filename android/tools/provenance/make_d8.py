"""Rebuild android/tools/d8jvm52f.jar (the D8 dex compiler, runnable on a normal JVM) from public packages.
usage: python3 make_d8.py D8_JAR OUT.jar [--from-step2 D8JVM_JAR]

  D8_JAR comes from npm:  npm pack d8-termux@1.0.0 && tar xzf d8-termux-1.0.0.tgz package/d8.jar
  enjarify comes from PyPI: pip install enjarify-adapter==1.0.2

Steps
  1. enjarify (default options): the dex inside d8.jar -> JVM class files (class version 49)
  2. class version 49 -> 52 (Java 8), entries and zip layout kept
  3. fixcp.py: method refs whose owner is an interface become InterfaceMethodref (extif.txt lists JDK interfaces)
The result has no stack maps, so run it with -XX:+UnlockDiagnosticVMOptions -XX:-BytecodeVerificationRemote."""
import sys, os, shutil, subprocess, tempfile, zipfile, hashlib

H = os.path.dirname(os.path.abspath(__file__))
WANT = '213f21bccee1f9a1'   # first 16 hex of sha256 of the shipped tools/d8jvm52f.jar


def to_v52(src, dst):
    with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, 'w') as zo:
        for inf in zi.infolist():
            d = zi.read(inf.filename)
            if inf.filename.endswith('.class'):
                d = d[:6] + b'\x00\x34' + d[8:]
            zo.writestr(inf, d)


def main():
    a = sys.argv[1:]
    out = os.path.abspath(a[1])
    with tempfile.TemporaryDirectory() as t:
        if '--from-step2' in a:
            j1 = os.path.abspath(a[a.index('--from-step2') + 1])
        else:
            apk = os.path.join(t, 'd8in.apk')
            shutil.copyfile(a[0], apk)
            j1 = os.path.join(t, 'd8jvm.jar')
            subprocess.run([sys.executable, '-m', 'enjarify.main', apk, '-o', j1, '-f'], check=True)
        j2 = os.path.join(t, 'd8jvm52.jar')
        to_v52(j1, j2)
        subprocess.run([sys.executable, os.path.join(H, 'fixcp.py'), j2, out], check=True, cwd=H)
    h = hashlib.sha256(open(out, 'rb').read()).hexdigest()
    print(out, h[:16], 'same as shipped' if h.startswith(WANT) else 'DIFFERENT from shipped ' + WANT)


if __name__ == '__main__':
    main()
