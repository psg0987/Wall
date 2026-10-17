"""Download and rebuild every file in android/tools from npm and PyPI (the only registries this kind of container reaches).
usage: python3 android/tools/provenance/fetch_tools.py [--no-d8]
Checks each file against the sha256 the shipped build used (android/TOOLS.md). --no-d8 skips the slow D8 rebuild."""
import os, sys, subprocess, tarfile, zipfile, hashlib, tempfile, shutil

P = os.path.dirname(os.path.abspath(__file__))
T = os.path.dirname(P)
WANT = {'aapt2': '1cf3df7b8a2e8d3d', 'apktool.jar': 'ceca3e49bfc697c9', 'android-framework.jar': 'da9774dcff5a57ee',
        'd8jvm52f.jar': '213f21bccee1f9a1'}


def run(cmd, cwd=None):
    subprocess.run(cmd, check=True, cwd=cwd, stdout=subprocess.DEVNULL)


def npm_file(pkg, inner, tmp):
    run(['npm', 'pack', pkg, '--silent'], cwd=tmp)
    tgz = [f for f in os.listdir(tmp) if f.endswith('.tgz') and f.startswith(pkg.split('@')[0])][0]
    with tarfile.open(os.path.join(tmp, tgz)) as t:
        return t.extractfile('package/' + inner).read()


def main():
    with tempfile.TemporaryDirectory() as tmp:
        run([sys.executable, '-m', 'pip', 'download', 'aapt2==0.2.1', '--no-deps', '-q', '-d', tmp])
        whl = [f for f in os.listdir(tmp) if f.endswith('.whl')][0]
        open(os.path.join(T, 'aapt2'), 'wb').write(zipfile.ZipFile(os.path.join(tmp, whl)).read('aapt2/bin/Linux/aapt2'))
        os.chmod(os.path.join(T, 'aapt2'), 0o755)
        open(os.path.join(T, 'apktool.jar'), 'wb').write(npm_file('apktool@2.0.3', 'bin/apktool.jar', tmp))
        open(os.path.join(T, 'android-framework.jar'), 'wb').write(
            zipfile.ZipFile(os.path.join(T, 'apktool.jar')).read('brut/androlib/android-framework.jar'))
        run(['javac', '--release', '8', '-nowarn', '-cp', os.path.join(T, 'apktool.jar'), '-d', T, os.path.join(T, 'SmaliB.java')])
        if '--no-d8' not in sys.argv:
            d8 = os.path.join(tmp, 'd8.jar')
            open(d8, 'wb').write(npm_file('d8-termux@1.0.0', 'd8.jar', tmp))
            enj = os.path.join(tmp, 'enj')   # private install: nothing is added to the system Python
            run([sys.executable, '-m', 'pip', 'install', '-q', '--no-deps', '--target', enj, 'enjarify-adapter==1.0.2'])
            subprocess.run([sys.executable, os.path.join(P, 'make_d8.py'), d8, os.path.join(T, 'd8jvm52f.jar')],
                           check=True, stdout=subprocess.DEVNULL, env=dict(os.environ, PYTHONPATH=enj))
    bad = 0
    for f, w in WANT.items():
        p = os.path.join(T, f)
        h = hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16] if os.path.exists(p) else 'missing'
        ok = h == w
        bad += not ok
        print(('ok   ' if ok else 'DIFF ') + f, h)
    sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
