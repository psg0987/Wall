// Impairment shows up where the player looks: when a distressed company writes down assets, that quarter's record
// (fq) carries the write-down, net income already includes it, and the income statement in the company sheet shows
// an "자산 손상차손" row with the amount. Plays fixed seeds until the first real impairment happens.
let errs = 0, fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL', m) } };
// quarter records are rounded like the game rounds them (r1: whole numbers from 10 up, one decimal below)
const near = (rec, x) => Math.abs(rec - x) <= (Math.abs(x) >= 10 ? 0.5 : 0.05);
let hit = null;
for (const SEED of [12345, 777, 4242]) {
  init(Object.assign(defCfg(), { tut: 0, seed: SEED })); mdl = null;
  const i0 = impair;
  impair = function (c, wd) { i0(c, wd); if (!hit) hit = { c, wd, day: S.day, seed: SEED } };
  for (let d = 0; d < 720 && !hit; d++) { step(); if (mdl) G.mk(mdl.o.length - 1) }
  impair = i0;
  if (hit) break;
}
ok(hit, 'an impairment happened within 720 days on the test seeds (pick another seed if the model changed)');
if (hit) {
  const c = hit.c, q = fqL(c), last = q[q.length - 1];
  console.log('seed', hit.seed, 'day', hit.day, c.tk, 'write-down', hit.wd.toFixed(1), 'dead', !!c.dead);
  ok(last && last.d === hit.day, 'quarter record made on the impairment day');
  ok(last && near(last.imp, hit.wd), 'quarter record keeps the write-down ' + (last && last.imp) + ' vs ' + hit.wd.toFixed(2));
  ok(last && near(last.ni, c.er.ni) && c.er.ni < 0, 'net income includes it (' + (last && last.ni) + ')');
  if (!c.dead) {
    sel = -1; pg = ''; tab = 'h'; S.spd = 0;
    G.pick(c.id); G.stab('f'); G.fseg(1); render();
    const h = document.getElementById('sh').innerHTML;
    ok(h.includes('자산 손상차손'), 'income statement shows the impairment row');
    // EPS is per share in won: a big loss must read like "-15,637", not as an amount in 억 ("-1.56조")
    const row = (h.split('<td>EPS (원)</td>')[1] || '').split('</tr>')[0], cells = [...row.matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map(m => m[1]);
    const want = Math.round(last.ni * 1e4 / last.sh).toLocaleString();
    ok(cells.length >= 2 && !cells.some(x => x.includes('조')), 'EPS row has no 조: ' + cells.slice(0, 3).join(' | '));
    ok(cells[1] === want, 'EPS of the impairment quarter shows ' + want + ' (got ' + cells[1] + ')');
    ok(!/NaN|undefined|Infinity|\[object/.test(h), 'sheet renders clean');
  }
}
console.log('errs', errs, 'fails', fails);
