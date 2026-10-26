from pathlib import Path
import json,csv,statistics,collections,math,hashlib
R=Path(__file__).resolve().parent
LOCK=json.loads((R/'PROTOCOL_EXECUTION_LOCK.json').read_text())
RAW=R/'raw'; worlds={}; errors=[]
for s in LOCK['seeds']:
 for tr in LOCK['tracks']:
  for slot in LOCK['firmSlots']:
   for arm in LOCK['arms']:
    p=RAW/f'{s}_{tr}_slot{slot}_{arm}.json'
    try: z=json.loads(p.read_text())
    except Exception as e: errors.append(str(p)+' '+str(e));continue
    assert z['sourceSHA']==LOCK['baseline'] and z['days']==720 and z['risk05Mode']=='direct_ev2_disabled'
    assert (z['seed'],z['track'],z['firmSlot'],z['arm'])==(s,tr,slot,arm)
    worlds[(s,tr,slot,arm)]=z
if errors:raise RuntimeError('Missing / corrupt files '+str(errors[:10]))
assert len(worlds)==100
fields=['seed','track','slot','firm','industry','initialRating','sameInitial','A2_ch11Day','A4R_ch11Day','A2_controlLossDay','A4R_controlLossDay','A2_dead','A4R_dead','A2_playerPct','A4R_playerPct','cleanDeltaPp','afterTaxDeltaPp','companyBookDeltaPp','shortfallDelta','A2_shortfall','A4R_shortfall','A2_preRiskDays','A4R_preRiskDays','preRiskDaysDelta','A2_preInsolventDays','A4R_preInsolventDays','A2_worstRating','A4R_worstRating','A2_maxDE','A4R_maxDE','A2_controlFinal','A4R_controlFinal','sameEventLog','sameDecisions','A2_playerStake','A4R_playerStake']
rows=[]
for s in LOCK['seeds']:
 for tr in LOCK['tracks']:
  for slot in LOCK['firmSlots']:
   a=worlds[s,tr,slot,'A2'];b=worlds[s,tr,slot,'A4R']
   assert (a['firmId'],a['tk'],a['industry']) == (b['firmId'],b['tk'],b['industry'])
   # same start balance sheet and stress; programmatic check, no rounding
   assert a['stress']==b['stress'],f'initial stress mismatch {s} {tr} {slot}'
   assert a['initialEq']==b['initialEq']
   if tr=='combined':assert a['stress']['rating']==3 and b['stress']['rating']==3
   ra=a['risk']; rb=b['risk']
   e=lambda z: z.get('eventLog',[])
   identicalDecisions=(len(a['decisions'])==len(b['decisions']) and all(all(da.get(k)==db.get(k) for k in ('day','g','pay','sweep','ps')) for da,db in zip(a['decisions'],b['decisions'])))
   r=dict(seed=s,track=tr,slot=slot,firm=a['tk'],industry=a['industry'],initialRating=a['stress']['rating'],sameInitial=True,
    A2_ch11Day=ra['firstChapter11Day'],A4R_ch11Day=rb['firstChapter11Day'],
    A2_controlLossDay=ra['firstControlLostDay'],A4R_controlLossDay=rb['firstControlLostDay'],
    A2_dead=a['dead'],A4R_dead=b['dead'],
    A2_playerPct=a['stakeAdjustedPlayerBookReturnPct'],A4R_playerPct=b['stakeAdjustedPlayerBookReturnPct'],
    cleanDeltaPp=b['cleanPlayerBookReturnPct']-a['cleanPlayerBookReturnPct'],
    afterTaxDeltaPp=b['stakeAdjustedPlayerBookReturnPct']-a['stakeAdjustedPlayerBookReturnPct'],
    companyBookDeltaPp=b['bookReturnPct']-a['bookReturnPct'],
    shortfallDelta=b['cashShortAmount']-a['cashShortAmount'],
    A2_shortfall=a['cashShortAmount'],A4R_shortfall=b['cashShortAmount'],
    A2_preRiskDays=ra['preWipeoutDaysRating4'],A4R_preRiskDays=rb['preWipeoutDaysRating4'],preRiskDaysDelta=rb['preWipeoutDaysRating4']-ra['preWipeoutDaysRating4'],
    A2_preInsolventDays=ra['preWipeoutInsolventDays'],A4R_preInsolventDays=rb['preWipeoutInsolventDays'],
    A2_worstRating=a['worstRating'],A4R_worstRating=b['worstRating'],
    A2_maxDE=a['maxDE'],A4R_maxDE=b['maxDE'],
    A2_controlFinal=a['finalControl'],A4R_controlFinal=b['finalControl'],
    sameEventLog=(e(a)==e(b)),sameDecisions=identicalDecisions,
    A2_playerStake=a['remainingPlayerStake'],A4R_playerStake=b['remainingPlayerStake'])
   rows.append(r)
assert len(rows)==50
with (R/'PAIRED06.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)

def summarize(sub):
 n=len(sub);aLoss=sum(r['A2_ch11Day'] is not None for r in sub);bLoss=sum(r['A4R_ch11Day'] is not None for r in sub)
 rescue=[r for r in sub if r['A2_ch11Day'] is not None and r['A4R_ch11Day'] is None]
 harm=[r for r in sub if r['A2_ch11Day'] is None and r['A4R_ch11Day'] is not None]
 both=[r for r in sub if r['A2_ch11Day'] is not None and r['A4R_ch11Day'] is not None]
 neither=[r for r in sub if r['A2_ch11Day'] is None and r['A4R_ch11Day'] is None]
 gains=[r['cleanDeltaPp'] for r in sub]
 def vals(nums):return {'mean':statistics.mean(nums),'median':statistics.median(nums),'min':min(nums),'max':max(nums)} if nums else None
 return {'nPairs':n,'A2_ch11':aLoss,'A4R_ch11':bLoss,'rescued':len(rescue),'newHarm':len(harm),'bothChapter11':len(both),'neitherChapter11':len(neither),
  'rescuedCases':[{'seed':r['seed'],'slot':r['slot'],'tk':r['firm'],'A2_day':r['A2_ch11Day']} for r in rescue],
  'newHarmCases':[{'seed':r['seed'],'slot':r['slot'],'tk':r['firm'],'A4R_day':r['A4R_ch11Day']} for r in harm],
  'cleanDelta':vals(gains),'cleanWinTieLoss':[sum(x>1e-9 for x in gains),sum(abs(x)<=1e-9 for x in gains),sum(x< -1e-9 for x in gains)],
  'cleanAmongBothSurvive':vals([r['cleanDeltaPp'] for r in neither]),
  'afterTaxDelta':vals([r['afterTaxDeltaPp'] for r in sub]),
  'cashShortfallMeanDelta':statistics.mean(r['shortfallDelta'] for r in sub),
  'preWipeoutRiskDaysMeanDelta':statistics.mean(r['preRiskDaysDelta'] for r in sub),
  'eventLogSame':sum(r['sameEventLog'] for r in sub),
  'decisionLogSame':sum(r['sameDecisions'] for r in sub),
  'bySeed':[{'seed':s,'n':sum(r['seed']==s for r in sub),'A2_ch11':sum(r['seed']==s and r['A2_ch11Day'] is not None for r in sub),'A4R_ch11':sum(r['seed']==s and r['A4R_ch11Day'] is not None for r in sub),'cleanMeanDelta':statistics.mean(r['cleanDeltaPp'] for r in sub if r['seed']==s)} for s in LOCK['seeds']]
 }
summary={'task':'RT-AUTO-RISK-06','baseline':LOCK['baseline'],'runnerSHA256':LOCK['runnerSHA256'],'protocol':LOCK,'actualWorlds':len(worlds),'actualPairs':len(rows),
'normal':summarize([r for r in rows if r['track']=='normal']),
'combined':summarize([r for r in rows if r['track']=='combined']),
'sourceHashChecks':True,'allInitialConditionsPairMatched':True,
'limitations':['Only 5 independent seed clusters','Each world grants player firm control without acquisition cost','Direct EV2 event shutdown is sensitivity condition, not natural game world','RNG and macro state may diverge after policy changes','PreWipeout risk days are exposure durations with competing chapter11 censoring','Clean fixed-stake pre-tax book is only a diagnostic, not actual shareholder wealth','Only nonfinancial firms examined']}
(R/'SUMMARY06.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False))
print('ANALYSIS',json.dumps({k:summary[k] for k in ('actualWorlds','actualPairs','normal','combined')},ensure_ascii=False,indent=2))
