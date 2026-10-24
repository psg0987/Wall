"""FIN-CF-02-SAVE-01: why the four ledger fields differ in case 11 of main_vs_branch.py (a founded company's cash contribution, then an export on
day 275). Runs main_vs_branch.py with its cases 0..11 unchanged (same order in one process = the same worlds, see its docstring) and case 11's actions
'cap;pending;export;pending' instead of 'cap;export' ('pending' only lists the waiting eqq / ncq of every company; it changes nothing), so the log shows
what was waiting right before and right after the export restore on both builds.
usage: python3 verify/fin-cf-02-save01/main_vs_branch_case11.py [out-dir]
WRITE_ONLY=<file> writes the patched script instead of running it (used to check it is the code that produced the log)."""
import os, sys
V = os.path.dirname(os.path.abspath(__file__)); R = os.path.dirname(os.path.dirname(V))
src = open(os.path.join(V, 'main_vs_branch.py'), encoding='utf-8').read()
old = "[20261016, 500, [[0, 'found'], [275, 'cap;export']]],"
assert src.count(old) == 1
i = src.index('CASES = [[20261016, 720, []]'); j = src.index(old) + len(old); k = src.index('\nprocs = {}')
cases = src[i:j].rstrip(',').replace(old.rstrip(','), "[20261016, 500, [[0, 'found'], [275, 'cap;pending;export;pending']]]") + ']'
code = src[:i] + cases + src[k:]
code = code.replace("R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))", "R = %r" % R)
if os.environ.get('WRITE_ONLY'):
    open(os.environ['WRITE_ONLY'], 'w', encoding='utf-8').write(code); sys.exit(0)
sys.argv = [os.path.join(V, 'main_vs_branch.py')] + sys.argv[1:]
exec(compile(code, 'main_vs_branch_case11', 'exec'), {'__name__': '__main__', '__file__': os.path.join(V, 'main_vs_branch.py')})
