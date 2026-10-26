"""RT-AUTO-RELEASE-02-CANDIDATE: independent check of an APK candidate against a released APK (no apksigner in this workspace).
For each APK: find the APK Signing Block (v2, id 0x7109871a), read the signer's certificate, public key, signed data and signature;
verify the RSA signature over the signed data with the signer's public key; recompute the v2 content digest (1 MiB chunks of the
three zip sections, EOCD's central-directory offset rewritten as if no signing block) and compare with the signed digest; check that
the certificate's public key equals the signer's public key. Then compare both APKs' certificate SHA-256, package name, and print
versionCode/versionName (aapt2) and the sha256 of assets/index.html inside the APK. Prints no key material beyond public certificate hashes.
usage: python3 verify/rt-auto-release-02/verify_apk.py NEW.apk OLD.apk [expected assets/index.html sha256]"""
import hashlib, struct, subprocess, sys, zipfile, pathlib
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
REPO = pathlib.Path(__file__).resolve().parents[2]

def lp_list(b):
    out, i = [], 0
    while i < len(b):
        n = struct.unpack('<I', b[i:i + 4])[0]; out.append(b[i + 4:i + 4 + n]); i += 4 + n
    assert i == len(b); return out

def check(path):
    data = open(path, 'rb').read()
    eocd = data.rfind(b'PK\x05\x06', max(0, len(data) - 65557)); assert eocd >= 0
    cd_size, cd_off = struct.unpack('<II', data[eocd + 12:eocd + 20]); assert cd_off + cd_size == eocd
    assert data[cd_off - 16:cd_off] == b'APK Sig Block 42', 'no APK Signing Block'
    size2 = struct.unpack('<Q', data[cd_off - 24:cd_off - 16])[0]; start = cd_off - size2 - 8
    assert struct.unpack('<Q', data[start:start + 8])[0] == size2
    pairs, i, blocks = data[start + 8:cd_off - 24], 0, {}
    while i < len(pairs):
        n = struct.unpack('<Q', pairs[i:i + 8])[0]; pid = struct.unpack('<I', pairs[i + 8:i + 12])[0]; blocks[pid] = pairs[i + 12:i + 8 + n]; i += 8 + n
    assert 0x7109871a in blocks, 'no v2 signature'
    signers = lp_list(lp_list(blocks[0x7109871a])[0])
    assert len(signers) == 1, 'expected one signer'
    signed, sigs, pub = lp_list(signers[0])
    digests, certs, _attrs = lp_list(signed)
    certs = lp_list(certs); assert len(certs) == 1
    cert = x509.load_der_x509_certificate(certs[0])
    alg, sig = (lambda s: (struct.unpack('<I', s[:4])[0], lp_list(s[4:])[0]))(lp_list(sigs)[0])
    assert alg == 0x0103, hex(alg)
    pk = serialization.load_der_public_key(pub)
    pk.verify(sig, signed, padding.PKCS1v15(), hashes.SHA256())   # raises if the signature is wrong
    assert cert.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) == pub, 'cert key != signer key'
    d = lp_list(digests)[0]; dalg = struct.unpack('<I', d[:4])[0]; dig = lp_list(d[4:])[0]; assert dalg == 0x0103
    e = bytearray(data[eocd:]); e[16:20] = struct.pack('<I', start)
    chunks = []
    for sec in (data[:start], data[cd_off:eocd], bytes(e)):
        for j in range(0, len(sec), 1 << 20):
            ch = sec[j:j + (1 << 20)]; chunks.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(ch)) + ch).digest())
    top = hashlib.sha256(b'\x5a' + struct.pack('<I', len(chunks)) + b''.join(chunks)).digest()
    assert top == dig, 'content digest mismatch'
    badge = subprocess.run([str(REPO / 'android/tools/aapt2'), 'dump', 'badging', path], capture_output=True, text=True).stdout.splitlines()[0]
    with zipfile.ZipFile(path) as z: asset = hashlib.sha256(z.read('assets/index.html')).hexdigest()
    return dict(apk_sha256=hashlib.sha256(data).hexdigest(), bytes=len(data), badging=badge, cert_sha256=hashlib.sha256(certs[0]).hexdigest(),
                cert_subject=cert.subject.rfc4514_string(), cert_valid=f'{cert.not_valid_before_utc:%Y-%m-%d}..{cert.not_valid_after_utc:%Y-%m-%d}', asset_sha256=asset,
                v2='signature OK, content digest OK, cert key = signer key')

new, old = sys.argv[1], sys.argv[2]; exp = sys.argv[3] if len(sys.argv) > 3 else None
rn, ro = check(new), check(old)
for name, r in ((new, rn), (old, ro)):
    print(name); [print('  %-13s %s' % (k, v)) for k, v in r.items()]
pkg = lambda r: r['badging'].split("'")[1]
ok = [('same signing certificate', rn['cert_sha256'] == ro['cert_sha256']), ('same package', pkg(rn) == pkg(ro))]
if exp: ok.append(('asset = expected ' + exp[:16], rn['asset_sha256'] == exp))
for k, v in ok: print(('PASS ' if v else 'FAIL ') + k)
sys.exit(0 if all(v for _, v in ok) else 1)
