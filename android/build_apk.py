"""Offline APK build: aapt2 (resources/manifest) + smali (dex) + native libs + zipalign + APK Signature Scheme v2.
Run android/mkassets.py first (it puts the built game into proj/assets).
usage: python3 android/build_apk.py VERSION_CODE VERSION_NAME OUT.apk
The signing key is NOT in the repository: put it at android/keys/wsr-tycoon-signing.p12 (or set RAIDER_KEYSTORE).
A different key cannot update the installed app."""
import os, sys, subprocess, struct, hashlib, zipfile, datetime, shutil, tempfile
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.serialization import pkcs12

H = os.path.dirname(os.path.abspath(__file__))
T, P, O = os.path.join(H, 'tools'), os.path.join(H, 'proj'), os.path.join(H, 'out')
KEYDIR = os.path.join(H, 'keys')
KS = os.environ.get('RAIDER_KEYSTORE') or os.path.join(KEYDIR, 'wsr-tycoon-signing.p12')
# the keystore password is not in the repository either: RAIDER_KEYPASS, or android/keys/keypass.txt next to the key
_kp = os.path.join(KEYDIR, 'keypass.txt')
KSPASS = (os.environ.get('RAIDER_KEYPASS') or (open(_kp, encoding='utf-8').read().strip() if os.path.exists(_kp) else '')).encode()

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    out = '\n'.join(l for l in (r.stdout + r.stderr).splitlines() if 'JAVA_TOOL_OPTIONS' not in l)
    if r.returncode:
        raise SystemExit('FAILED: ' + ' '.join(cmd) + '\n' + out)
    return out

def load_or_make_key():
    os.makedirs(KEYDIR, exist_ok=True)
    if os.path.exists(KS):
        if not KSPASS:
            raise SystemExit('keystore password missing: set RAIDER_KEYPASS or write it to android/keys/keypass.txt')
        key, cert, _ = pkcs12.load_key_and_certificates(open(KS, 'rb').read(), KSPASS)
        return key, cert
    if not os.environ.get('RAIDER_NEW_KEY'):
        raise SystemExit('signing key not found at ' + KS + ' (set RAIDER_NEW_KEY=1 only if you really want a new key)')
    if not KSPASS:
        raise SystemExit('choose a keystore password first: RAIDER_KEYPASS or android/keys/keypass.txt')
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    name = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'Raider Tycoon'), x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'Raider Tycoon (personal build)'), x509.NameAttribute(NameOID.COUNTRY_NAME, 'KR')])
    now = datetime.datetime(2026, 10, 1, tzinfo=datetime.timezone.utc)
    cert = (x509.CertificateBuilder().subject_name(name).issuer_name(name).public_key(key.public_key())
            .serial_number(x509.random_serial_number()).not_valid_before(now).not_valid_after(now + datetime.timedelta(days=365 * 40))
            .sign(key, hashes.SHA256()))
    open(KS, 'wb').write(pkcs12.serialize_key_and_certificates(b'wsr-tycoon', key, cert, None, serialization.BestAvailableEncryption(KSPASS)))
    return key, cert

def v2_sign(data, key, cert_der):
    eocd = data.rfind(b'PK\x05\x06', max(0, len(data) - 65557))
    assert eocd >= 0
    cd_size, cd_off = struct.unpack('<II', data[eocd + 12:eocd + 20])
    assert cd_off + cd_size == eocd, 'zip has trailing data or comment issues'
    assert data[cd_off - 16:cd_off] != b'APK Sig Block 42', 'already signed'
    secs = (data[:cd_off], data[cd_off:eocd], data[eocd:])
    dig = []
    for sec in secs:
        for i in range(0, len(sec), 1 << 20):
            ch = sec[i:i + (1 << 20)]
            dig.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(ch)) + ch).digest())
    top = hashlib.sha256(b'\x5a' + struct.pack('<I', len(dig)) + b''.join(dig)).digest()
    lp = lambda b: struct.pack('<I', len(b)) + b
    ALG = 0x0103  # RSASSA-PKCS1-v1_5 + SHA2-256
    signed = lp(lp(struct.pack('<I', ALG) + lp(top))) + lp(lp(cert_der)) + lp(b'')
    sig = key.sign(signed, padding.PKCS1v15(), hashes.SHA256())
    pub = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    signer = lp(signed) + lp(lp(struct.pack('<I', ALG) + lp(sig))) + lp(pub)
    val = lp(lp(signer))
    pair = struct.pack('<Q', 4 + len(val)) + struct.pack('<I', 0x7109871a) + val
    size = len(pair) + 8 + 16
    block = struct.pack('<Q', size) + pair + struct.pack('<Q', size) + b'APK Sig Block 42'
    e = bytearray(secs[2]); e[16:20] = struct.pack('<I', cd_off + len(block))
    return secs[0] + block + secs[1] + bytes(e)

def main():
    vc, vn, outp = sys.argv[1], sys.argv[2], sys.argv[3]
    os.makedirs(O, exist_ok=True)
    tmp = tempfile.mkdtemp(dir=O)
    aapt2 = os.path.join(T, 'aapt2')
    run([aapt2, 'compile', '--dir', os.path.join(P, 'res'), '-o', os.path.join(tmp, 'res.zip')])
    base = os.path.join(tmp, 'base.apk')
    run([aapt2, 'link', '-o', base, '-I', os.path.join(T, 'android-framework.jar'), '--manifest', os.path.join(P, 'AndroidManifest.xml'),
         '--min-sdk-version', '24', '--target-sdk-version', '34', '--version-code', vc, '--version-name', vn,
         '-A', os.path.join(P, 'assets'), '-0', 'woff2', '-0', 'png', '-0', 'wasm', os.path.join(tmp, 'res.zip')])
    dex = os.path.join(tmp, 'classes.dex')
    run(['java', '-cp', os.path.join(T, 'apktool.jar') + ':' + T, 'SmaliB', os.path.join(P, 'smali'), dex])
    # rebuild the zip: AndroidManifest first, resources.arsc stored, add classes.dex
    full = os.path.join(tmp, 'full.apk')
    with zipfile.ZipFile(base) as zi, zipfile.ZipFile(full, 'w') as zo:
        names = zi.namelist()
        order = ['AndroidManifest.xml'] + [n for n in names if n != 'AndroidManifest.xml']
        for n in order:
            info = zi.getinfo(n)
            ni = zipfile.ZipInfo(n, date_time=(2026, 10, 1, 0, 0, 0))
            ni.external_attr = 0o644 << 16
            stored = n == 'resources.arsc' or n.endswith(('.png', '.woff2')) or info.compress_type == zipfile.ZIP_STORED
            ni.compress_type = zipfile.ZIP_STORED if stored else zipfile.ZIP_DEFLATED
            zo.writestr(ni, zi.read(n), compresslevel=9 if not stored else None)
        ni = zipfile.ZipInfo('classes.dex', date_time=(2026, 10, 1, 0, 0, 0)); ni.external_attr = 0o644 << 16; ni.compress_type = zipfile.ZIP_DEFLATED
        zo.writestr(ni, open(dex, 'rb').read(), compresslevel=9)
        # native executables (the on-device language model server), extracted at install (extractNativeLibs="true")
        libs = os.path.join(P, 'lib')
        for root, _, files in sorted(os.walk(libs)):
            for f in sorted(files):
                full_path = os.path.join(root, f)
                ni = zipfile.ZipInfo(os.path.relpath(full_path, P).replace(os.sep, '/'), date_time=(2026, 10, 1, 0, 0, 0))
                ni.external_attr = 0o755 << 16; ni.compress_type = zipfile.ZIP_DEFLATED
                zo.writestr(ni, open(full_path, 'rb').read(), compresslevel=9)
    aligned = os.path.join(tmp, 'aligned.apk')
    run([sys.executable, '-m', 'repro_apk.zipalign', '-p', '4', full, aligned])
    key, cert = load_or_make_key()
    signed = v2_sign(open(aligned, 'rb').read(), key, cert.public_bytes(serialization.Encoding.DER))
    open(outp, 'wb').write(signed)
    shutil.rmtree(tmp)
    print('built', outp, len(signed), 'bytes; cert sha256', hashlib.sha256(cert.public_bytes(serialization.Encoding.DER)).hexdigest()[:16])

if __name__ == '__main__':
    main()
