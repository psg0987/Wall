// Golden run: a fixed seed played for 720 days with no player actions must give exactly the recorded summary.
// A difference means the simulation changed: intended -> regenerate with UPDATE_GOLDEN=1 and say why in docs/CHANGELOG.md.
let errs = 0, fails = 0;
init(Object.assign(defCfg(), { tut: 0, seed: 20261016 })); mdl = null;
for (let d = 0; d < 720; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
const liveCos = S.co.filter(c => !c.dead), r = x => Math.round(x * 1e6) / 1e6;
const sum = {
  day: S.day, companies: S.co.length, alive: liveCos.length, listed: liveCos.filter(c => !c.priv).length,
  netWorth: r(nw()), totalMarketCap: r(liveCos.reduce((a, c) => a + mc(c), 0)),
  totalBookAssets: r(liveCos.reduce((a, c) => a + c.A, 0)), totalDebt: r(liveCos.reduce((a, c) => a + c.D, 0)),
  lastQuarterNI: r(liveCos.reduce((a, c) => a + (c.er ? c.er.ni : 0), 0)), prime: r(S.prime),
  firstPrices: liveCos.slice(0, 5).map(c => c.tk + ':' + r(c.p))
};
const fs = require('fs'), path = require('path'), f = path.join(process.env.TESTS_DIR, 'golden.json');
if (process.env.UPDATE_GOLDEN || !fs.existsSync(f)) { fs.writeFileSync(f, JSON.stringify(sum, null, 1)); console.log('golden written', f) }
else {
  const g = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const k in g) if (JSON.stringify(g[k]) !== JSON.stringify(sum[k])) { fails++; console.log('FAIL', k, 'expected', JSON.stringify(g[k]), 'got', JSON.stringify(sum[k])) }
}
console.log('errs', errs, 'fails', fails);
