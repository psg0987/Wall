/*
 * RT-AUTO-RISK-07-IMPL integration reference.
 * Intended minimal replacement for src/sim.js autop(c) at SHA 8b6ed6e6695e0d042836a54f301076c533b55d53.
 * Not modified in GitHub; validate and implement on separate development branch.
 * The nonfinancial A4R formulas below are transcribed unchanged from frozen RISK-06
 * rt_risk06_work/rt_auto_risk06_runner.js's __riskPolicy(c,'A4R') branch.
 * Base A2 path and HOLD override intentionally preserved.
 */
function autopMerged(c){
 const r=rating(c),roa=c.ni*4/Math.max(1,c.A),gap=c.kd?0:S.dg[c.i]-S.cg[c.i];
 // Original A2, unchanged for all companies unless nonfinancial override follows.
 c.g=r>=4?0:roa>.1&&r<=2&&gap>-.01?.1:.04;
 c.pay=r>=4||c.nol>c.A*.05?0:.3;
 c.sweep=r>=3?2:1;
 if(!c.kd)c.ps=r<=3&&roa>.06?1:0;

 // Frozen A4R only applies to nonfinancial, non-HOLD companies.
 if(!c.kd && c.i!==HOLD){
  const tc=c.A*.06;
  const halt=r>=4||(r===3&&(c.ni<=0||c.cs<tc*.5||gap<-.02))||(c.ni<0&&c.cs<tc);
  c.g=halt?0:roa>.1&&r<=2&&gap>-.01?.1:.04;
  c.pay=(r>=4||c.ni<=0||c.nol>c.A*.05||(r===3&&c.cs<tc))?0:r===3?.15:.3;
  c.sweep=r>=3||c.ni<=0?2:1;
  c.ps=r<=3&&roa>.06&&(r<=2||c.cs>=tc*.5)?1:0;
 }
 if(c.i===HOLD){c.g=0;c.ps=0;c.pay=0}
}
