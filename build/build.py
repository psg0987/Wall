"""Assemble the game from src/ into dist/raider.html (the published page body) and dist/game.js (for tests).
usage: python3 build/build.py"""
import os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, DIST = os.path.join(R, 'src'), os.path.join(R, 'dist')
PARTS = ['data.js', 'core.js', 'sim.js', 'act1.js', 'act2.js', 'ui1.js', 'ui2.js']
rd = lambda f: open(os.path.join(SRC, f), encoding='utf-8').read()
os.makedirs(DIST, exist_ok=True)
base, parts = rd('base_v5.js'), [rd(f) for f in PARTS]
open(os.path.join(DIST, 'raider.html'), 'w', encoding='utf-8').write(rd('head.html') + '<script>\n' + base + '\n' + '\n'.join(parts) + '\n</script>\n')
open(os.path.join(DIST, 'game.js'), 'w', encoding='utf-8').write(base + '\n' + '\n'.join(parts))
print('built dist/raider.html', os.path.getsize(os.path.join(DIST, 'raider.html')), 'bytes')
