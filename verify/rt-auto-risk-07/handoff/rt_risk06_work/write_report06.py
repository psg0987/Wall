from pathlib import Path
import json
R=Path(__file__).resolve().parent;s=json.loads((R/'SUMMARY06.json').read_text());v=json.loads((R/'VERIFICATION06.json').read_text())
p=s['protocol'];n=s['normal'];c=s['combined']
f=lambda x:f'{x:+.3f}'
def table(x):
 return f"| 법정관리 A2→A4R | {x['A2_ch11']} → {x['A4R_ch11']} |\n| A4R만 회피 / A4R에서 신규 발생 | {x['rescued']} / {x['newHarm']} |\n| 양쪽 모두 법정관리 / 모두 생존 | {x['bothChapter11']} / {x['neitherChapter11']} |\n| 고정 지분·세전 장부지표 평균(A4R−A2) | {f(x['cleanDelta']['mean'])}%p |\n| 중앙값 | {f(x['cleanDelta']['median'])}%p |\n| 승/무/패 | {'/'.join(map(str,x['cleanWinTieLoss']))} |\n| 최초 이벤트 로그 일치 / 경영결정 일치 | {x['eventLogSame']}/{x['nPairs']} · {x['decisionLogSame']}/{x['nPairs']} |\n| 현금 부족금액 평균 변화(A4R−A2) | {f(x['cashShortfallMeanDelta'])} 게임 단위 |\n"
text=f"""# RT-AUTO-RISK-06 | 사전등록된 신규 시드 실제 엔진 검증

**실행 상태: 실제 엔진 {s['actualWorlds']}/{p['totalWorlds']} 완료. 검증: 원시 JSON {v['rawChecks']}/{p['totalWorlds']} 및 독립 재실행 {len(v['replays'])}/2 일치.**

## 1. 실행 규약

- 저장소 기준: `{p['baseline']}`, 핵심 소스 10개 Git blob 해시 검증. 원본 코드 변경 및 배포 없음.
- 실험 러너 SHA-256: `{s['runnerSHA256']}`.
- **사전 고정한 신규 시드:** {', '.join(map(str,p['seeds']))}. 이전 탐색 시드와 겹치지 않음.
- 시드당 5개 기업, normal·combined 2환경, A2·A4R 2정책: 총 **100개 실제 세계, 50쌍, 720일**.
- 결과를 보기 전 시드 및 기업 선택 방식, 충격(-0.035 마진 2항, prime +2, 현금 A의 2%, 목표 D/E 최소 1.15), 평가 지표 및 정책 규칙 고정.
- 본 실험은 **직접 EV2 이벤트 발생 차단** (`S.cfg.evf=0`, 예약 큐 제거) 조건. 시장·경쟁회사·기업 확률적 행동 등 모든 난수 제거가 아님.
- 금융회사 대상이 아니며 연구용 플레이어 지배권 60%가 취득 비용 없이 부여됨.

## 2. 정상 기업 (normal, {n['nPairs']}쌍)

| 지표 | 값 |
|---|---:|
{table(n)}

## 3. 복합 위기 (combined, {c['nPairs']}쌍)

| 지표 | 값 |
|---|---:|
{table(c)}

### 법정관리 회피 사례

"""
for case in c['rescuedCases']:
 text+=f"- seed {case['seed']} · slot {case['slot']} · **{case['tk']}**: A2 {case['A2_day']}일 법정관리 / A4R 720일 내 미발생\n"
if not c['rescuedCases']:text+='- 없음\n'
text+='\n### A4R만 법정관리 발생한 사례\n\n'
for case in c['newHarmCases']:
 text+=f"- seed {case['seed']} · slot {case['slot']} · **{case['tk']}**: A4R {case['A4R_day']}일 법정관리 / A2 720일 내 미발생\n"
if not c['newHarmCases']:text+='- 없음\n'
text+='\n## 4. 시드별 복합 위기 결과\n\n| 새 시드 | A2 법정관리 | A4R 법정관리 | 표준화 장부 평균 차이 |\n|---|---:|---:|---:|\n'
for b in c['bySeed']:text+=f"| {b['seed']} | {b['A2_ch11']} | {b['A4R_ch11']} | {f(b['cleanMeanDelta'])}%p |\n"
text+='''
## 5. 해석의 제약 및 게임 반영 판단

- **서로 독립적인 거시 시드는 다섯 개뿐**이므로 유의미한 통계적 우월성이나 자연 파산확률 개선을 확정할 수 없음.
- 정상 코호트도 게임 중 발생한 상황에 따라 위험 구간에 들어갈 가능성은 있으므로, 정상 결과가 다르다면 해당 로그를 검토해야 함.
- 최초 법정관리 일자와 지배권 상실 일자는 1차 엔드포인트. 종료 시 회사 장부수익률은 법정관리 후에 부풀어 보일 수 있으므로 채택 판정에 직접 사용하지 않음.
- `cleanPlayerBookReturnPct`는 초기 60% 지분을 고정하고 세전 배당을 가산한 **진단용** 장부 대리지표. 사건·경기 경로 차이까지 제거한 순수 인과 추정치가 아님.
- `stakeAdjustedPlayerBookReturnPct`는 실측 지분과 세후 배당 반영. 취득 비용·잔여 소수지분·인수 보상금 등이 누락될 수 있음.
- 직접 EV2 차단은 게임 환경의 일부 메커니즘을 제거하므로 통상 게임에서의 효과가 그대로 나타난다고 단정할 수 없음.
- 법정관리 이후 위험일수는 `preWipeout...` 필드로 따로 절단 집계. 기업 회생 이후 일수와 비교되지 않도록 주의.
- **원본 main 및 배포본은 변경하지 않음. 채택 결정은 독립 감사 전 보류.**

## 6. 파일 구성

`PROTOCOL_LOCK.json`, `CATALOG_LOCK.json`, `PROTOCOL_EXECUTION_LOCK.json`, `rt_auto_risk06_runner.js`, `run_batch06.py`, `analyze06.py`, `verify06.py`, `VERIFICATION06.json`, `SUMMARY06.json`, `PAIRED06.csv`, `RUN_LOG.json`, `raw/*.json`, 검증된 실제 게임 소스 스냅샷 및 원본 테스트 하네스. 독립 실행 방법은 `README_REPRODUCE.md` 참조.
'''
(R/'REPORT_RISK06.md').write_text(text)
print(text[:5000])
