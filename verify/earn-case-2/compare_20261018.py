"""Item-by-item comparison of the 2026-10-18 GPT result for card A2 with the game values (read only).
Sealed = expected_SEALED.json (pre-sealed 2026-10-17 10:12). Post-hoc = game_intermediates.json (extracted 12:48, after GPT's first result), reference only.
usage: python3 verify/earn-case-2/compare_20261018.py"""
import json, os
D = os.path.dirname(os.path.abspath(__file__)); TOL = 0.01
L = lambda f: json.load(open(os.path.join(D, f), encoding='utf-8'))
got, sealed, post = L('gpt_result_2026-10-18.json'), L('expected_SEALED.json'), {k: v for k, v in L('game_intermediates.json').items() if not k.startswith('_')}
rows = [(k, 'sealed', v) for k, v in sealed.items()] + [(k, 'post-hoc', v) for k, v in post.items()]
print(f"{'item':22}{'basis':9}{'game value':>22}{'GPT value':>16}{'abs error':>11}  verdict")
bad = {'sealed': 0, 'post-hoc': 0}; mx = {'sealed': 0.0, 'post-hoc': 0.0}; miss = []
for k, b, w in rows:
    if k not in got: miss.append(k); print(f'{k:22}{b:9}{w:22.12f}{"-":>16}{"-":>11}  not comparable (missing in result)'); continue
    e = abs(got[k] - w); mx[b] = max(mx[b], e); ok = e <= TOL; bad[b] += not ok
    print(f'{k:22}{b:9}{w:22.12f}{got[k]:16.8f}{e:11.2e}  ' + (('PASS' if ok else 'FAIL') if b == 'sealed' else ('match (reference only, not pre-sealed)' if ok else 'MISMATCH (reference only)')))
extra = [k for k in got if k != 'source' and k not in sealed and k not in post]
print(f'\nsealed items: {len(sealed)}, compared {len(sealed) - sum(k in miss for k in sealed)}, fail {bad["sealed"]}, max abs error {mx["sealed"]:.2e} (tolerance {TOL})')
print(f'post-hoc items: {len(post)}, mismatches {bad["post-hoc"]}, max abs error {mx["post-hoc"]:.2e}')
print('result items without a game value:', ', '.join(extra) or 'none', '| game items missing in result:', ', '.join(miss) or 'none')
print('VERDICT (10 pre-sealed items):', 'PASS' if not bad['sealed'] and not any(k in miss for k in sealed) else 'FAIL')
