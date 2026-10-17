"""Turn the built page (dist/raider.html) into the app's assets: full HTML document, bundled fonts, wllama engine.
usage: python3 android/mkassets.py   (after python3 build/build.py)"""
import re, os, shutil
H = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(H)
A = os.path.join(H, 'proj', 'assets')
shutil.rmtree(A, ignore_errors=True)
shutil.copytree(os.path.join(H, 'static'), A)
page = open(os.path.join(R, 'dist', 'raider.html'), encoding='utf-8').read()
# drop Google Fonts (no network needed in the app): the bundled copies in fonts/ are used instead
page = re.sub(r'<link rel="preconnect"[^>]*>', '', page)
page = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^"]*">', '', page)
i = page.index('</style>') + len('</style>')
head, body = page[:i], page[i:]
doc = ('<!doctype html>\n<html lang="ko" class="app" data-theme="dark"><head><meta charset="utf-8">'
       '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
       '<meta name="color-scheme" content="dark"><meta name="theme-color" content="#060b13">'
       '<link rel="stylesheet" href="fonts/fonts.css">'
       '<style>body{margin:0}[hidden]{display:none!important}</style>\n'
       + head + '\n</head><body>' + body + '</body></html>\n')
assert 'fonts.googleapis.com' not in doc
open(os.path.join(A, 'index.html'), 'w', encoding='utf-8').write(doc)
print('assets ok:', len(doc), 'chars of html')
