"""Compare an independent result with the sealed game values for one verification case.
usage: python3 verify/compare.py verify/earn-case-1/gpt_result.json
Passes when every sealed item that the result reports is within 0.01 (억 원), the threshold in the plan.
Sealed items the card did not ask for are listed as not compared (make the next card's result format cover them)."""
import json, os, sys
TOL = 0.01
res_path = sys.argv[1]
case = os.path.dirname(os.path.abspath(res_path))
got = json.load(open(res_path, encoding='utf-8'))
want = json.load(open(os.path.join(case, 'expected_SEALED.json'), encoding='utf-8'))
inter = os.path.join(case, 'game_intermediates.json')   # optional: the game's own intermediate values of the same close
if os.path.exists(inter):
    want.update({k: v for k, v in json.load(open(inter, encoding='utf-8')).items() if not k.startswith('_')})
worst, missing = 0.0, []
print(f"{'item':24} {'sealed (game)':>20} {'independent':>20} {'abs error':>12}")
for k, w in want.items():
    if k not in got:
        missing.append(k); continue
    e = abs(float(got[k]) - float(w)); worst = max(worst, e)
    print(f"{k:24} {w:20.8f} {float(got[k]):20.8f} {e:12.2e}")
ok = len(want) > len(missing) and worst <= TOL
print('not compared (not in the result):', ', '.join(missing) or 'none')
print(f'compared {len(want) - len(missing)} items, max abs error {worst:.2e} (tolerance {TOL}) ->', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
