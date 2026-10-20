"""RT-BANK-R4C helper: run a probe .js against main (553d2f6) or the working-tree branch bundle. usage: python3 verify/r4c/run_bundle.py main|branch probe.js"""
import ast, subprocess, sys, tempfile, os
R='/home/claude/wall'; MAIN='553d2f6aa703a20b3486f39c8667b1fa04124a28'
rd=lambda p: open(p,encoding='utf-8').read()
b=ast.parse(rd(R+'/build/build.py')); PARTS=[ast.literal_eval(n.value) for n in b.body if isinstance(n,ast.Assign) and any(getattr(t,'id','')=='PARTS' for t in n.targets)][0]
t=ast.parse(rd(R+'/tests/run.py')); SEED=[ast.literal_eval(n.value) for n in t.body if isinstance(n,ast.Assign) and any(getattr(x,'id','')=='SEED' for x in n.targets)][0]
git=lambda *a: subprocess.run(['git','-C',R]+list(a),capture_output=True,text=True,check=True).stdout
which=sys.argv[1]
if which=='main': game=git('show',MAIN+':src/base_v5.js')+'\n'+'\n'.join(git('show',MAIN+':src/'+f) for f in PARTS)
else: game=rd(R+'/src/base_v5.js')+'\n'+'\n'.join(rd(R+'/src/'+f) for f in PARTS)
code=SEED+rd(R+'/tests/stub.js')+'\n'+game+'\n'+rd(sys.argv[2])
f=tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8'); f.write(code); f.close()
o=subprocess.run(['node',f.name],capture_output=True,text=True,timeout=900,env=dict(os.environ,TESTS_DIR=R+'/tests')); os.unlink(f.name)
print(o.stdout+o.stderr)
