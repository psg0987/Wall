"""Compile the app's Java classes into smali for proj/smali (javac -> D8 -> baksmali), fully offline.
usage: python3 android/java2smali.py [--check]
  --check  only compare with proj/smali and report differences (exit 1 if any)

Java sources: android/java/com/wsr/tycoon/ (Json, Lm, Web, Wipe). MainActivity.java there is only a compile stub:
the real MainActivity.smali and Bridge.smali in proj/smali are hand-written smali and are never overwritten here.
android/java/stub/ holds the few Android API classes javac needs (not packaged).
d8jvm52f.jar is D8 converted from dex back to JVM bytecode without stack maps, so it runs with verification off."""
import os, sys, glob, shutil, subprocess, tempfile, filecmp
H = os.path.dirname(os.path.abspath(__file__))
J, T, P = os.path.join(H, 'java'), os.path.join(H, 'tools'), os.path.join(H, 'proj', 'smali', 'com', 'wsr', 'tycoon')
GENERATED = ('Json', 'Lm', 'Web', 'Wipe')          # classes (and their inner classes) that come from Java


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    out = '\n'.join(l for l in (r.stdout + r.stderr).splitlines() if 'JAVA_TOOL_OPTIONS' not in l)
    if r.returncode:
        raise SystemExit('FAILED: ' + ' '.join(cmd) + '\n' + out)
    return out


def build(tmp):
    stubs, cls, dex, sm = (os.path.join(tmp, d) for d in ('stubs', 'cls', 'dex', 'smali'))
    for d in (stubs, cls, dex, sm):
        os.makedirs(d)
    run(['javac', '--release', '8', '-nowarn', '-d', stubs] + glob.glob(os.path.join(J, 'stub', '**', '*.java'), recursive=True))
    run(['javac', '--release', '8', '-nowarn', '-cp', stubs, '-d', cls] + glob.glob(os.path.join(J, 'com', 'wsr', 'tycoon', '*.java')))
    classes = [f for f in glob.glob(os.path.join(cls, 'com', 'wsr', 'tycoon', '*.class'))
               if os.path.basename(f).split('$')[0].split('.')[0] in GENERATED]
    run(['java', '-XX:+UnlockDiagnosticVMOptions', '-XX:-BytecodeVerificationRemote', '-cp', os.path.join(T, 'd8jvm52f.jar'), 'com.android.tools.r8.D8', '--release', '--min-api', '21',
         '--classpath', cls, '--classpath', stubs, '--output', dex] + classes)
    run(['javac', '--release', '8', '-nowarn', '-cp', os.path.join(T, 'apktool.jar'), '-d', tmp, os.path.join(J, 'BakS.java')])
    run(['java', '-cp', os.path.join(T, 'apktool.jar') + os.pathsep + tmp, 'BakS', os.path.join(dex, 'classes.dex'), sm])
    return os.path.join(sm, 'com', 'wsr', 'tycoon')


def main():
    check = '--check' in sys.argv
    with tempfile.TemporaryDirectory() as tmp:
        out = build(tmp)
        made = sorted(os.listdir(out))
        bad = [f for f in made if not os.path.exists(os.path.join(P, f)) or not filecmp.cmp(os.path.join(out, f), os.path.join(P, f), shallow=False)]
        if check:
            print('smali up to date' if not bad else 'differs from proj/smali: ' + ', '.join(bad))
            sys.exit(1 if bad else 0)
        for f in made:
            shutil.copyfile(os.path.join(out, f), os.path.join(P, f))
        print('wrote', len(made), 'smali files:', ', '.join(made), '| changed:', ', '.join(bad) or 'none')


if __name__ == '__main__':
    main()
