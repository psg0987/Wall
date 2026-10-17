"""Write the website page (index.html at the repository root, served by GitHub Pages) from dist/raider.html.
usage: python3 build/site.py      (after python3 build/build.py)

The wrapper is the same document skeleton claude.ai puts around the published artifact, so the site and the
artifact run the same page in the same way."""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKELETON = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
            'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;'
            'background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>')
page = open(os.path.join(R, 'dist', 'raider.html'), encoding='utf-8').read()
out = os.path.join(R, 'index.html')
open(out, 'w', encoding='utf-8').write(SKELETON + page + '\n</body></html>\n')
print('wrote index.html', os.path.getsize(out), 'bytes')
