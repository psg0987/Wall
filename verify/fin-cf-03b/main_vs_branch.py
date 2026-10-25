"""FIN-CF-03B (A): the branch against main 40a4d7f on the same seeds, whole game state every day and the game's random streams at the end.
It runs verify/fin-cf-02-save01/main_vs_branch.py (same 20 cases, same separate node processes, same daily hashes) with two changes made in memory:
the main commit is 40a4d7f, and NOTHING is left out of the hashed state (FIN-CF-03B only changes fqDerive, which the simulation never calls, so even
the ledger fields eqq / isq / ncq / rlf must be identical). The 'four ledger fields' column of that script is then the same comparison again.
usage: python3 verify/fin-cf-03b/main_vs_branch.py [out-dir]"""
import os, sys
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V)); SRC = os.path.join(R, 'verify', 'fin-cf-02-save01', 'main_vs_branch.py')
src = open(SRC, encoding='utf-8').read()
for a, b in [("MAIN = 'd82f84764fdf242de4956ed9d53521a479cc80a9'", "MAIN = '40a4d7fab6fae51c53bf0d6b6fd84c96bfbe058a'"),
             ("const LEDGER = new Set(['eqq', 'isq', 'ncq', 'rlf']);", "const LEDGER = new Set([]);")]:
    assert src.count(a) == 1, a; src = src.replace(a, b)
sys.argv = [SRC] + sys.argv[1:]
exec(compile(src, 'main_vs_branch(fin-cf-03b)', 'exec'), {'__name__': '__main__', '__file__': SRC})
