# RT-AUTO-RISK-07-IMPL — Claude용 원본 인계 패키지

**상태:** 원본 복구 및 사전 인계 검증 완료. GitHub 코드 수정·브랜치 생성·커밋·배포는 수행하지 않음.

- **대상 저장소:** `psg0987/Wall`
- **원본 기준 main SHA:** `8b6ed6e6695e0d042836a54f301076c533b55d53`
- **실제 검증 규칙:** RT-AUTO-RISK-06의 `A4R` (A4G, A5 아님)
- **러너 SHA-256:** `4093762398e09a12e2ac82d7dd621ea27b3d92818bf469e347b680a87d74ba63`
- **적용 대상:** 비금융회사 `c.kd === 0 && c.i !== HOLD`만
- **기존 정책 유지:** 은행·보험사 등 `c.kd !== 0`, 지주사 `c.i === HOLD`, 수동 경영, 기존 저장 데이터
- **분리:** 연구의 정책 비교 하네스는 금융사 A4R 코드도 포함하지만, 이번 실제 게임 통합에서는 절대로 그 분기를 채택하지 않음.

## 원본 파일 위치

1. `rt_risk06_work/rt_auto_risk06_runner.js` — **권위 있는 검증 당시의 A4R 규칙 원문.** 상단 `const candidatePolicy=String.raw` 안 `function __riskPolicy(x,arm)`의 `if(arm==='A4R'||arm==='A4G')` 내 `else`가 비금융 A4R이다. `A4G` 전용 `if(arm==='A4G'...)` 문장은 이번 적용에 포함하지 않는다.
2. `rt_risk_work/repo/src/sim.js` — 기준 SHA에서 `function autop(c)`가 정의된 원본 엔진.
3. `A4R_NONFIN_INTEGRATION_REFERENCE.js` — 위 원본과 동치가 되는 **추천 최소 변경 참고 구현** `autopMerged(c)`. 실제 저장소에서는 `autop(c)` 함수 본문을 변경하며 다른 부위는 유지할 것.
4. `verify_A4R_formula_equivalence.js` — 정확한 동치성 경계조건 회귀검사 코드.
5. `rt_risk06_work/raw/*.json` — 실험 당시 원시 결과 100개.
6. `rt_risk06_work/{PROTOCOL_LOCK.json,PROTOCOL_EXECUTION_LOCK.json,CATALOG_LOCK.json,PAIRED06.csv,SUMMARY06.json,VERIFICATION06.json,REPORT_RISK06.md}` — 표본, 실험, 분석, 검산 원본.
7. `RT_AUTO_ENGINE_V22_REVIEW/rt_auto_engine_harness_v2_2.js` — 실험 러너가 로드하는 JS 하네스.
8. `rt_risk_work/repo/` — 원본 핵심 소스 및 stub 테스트의 소스 스냅샷.

## A4R 정확한 비금융 의사결정 규칙 (연구 소스 코드와 동일)

```js
const r = rating(c);
const roa = c.ni * 4 / Math.max(1,c.A);
const gap = c.kd ? 0 : S.dg[c.i] - S.cg[c.i];
const tc = c.A * .06;
const halt = r>=4 ||
             (r===3 && (c.ni<=0 || c.cs<tc*.5 || gap<-.02)) ||
             (c.ni<0 && c.cs<tc);
c.g = halt ? 0 : roa>.1 && r<=2 && gap>-.01 ? .1 : .04;
c.pay = (r>=4 || c.ni<=0 || c.nol>c.A*.05 || (r===3 && c.cs<tc))
        ? 0 : r===3 ? .15 : .3;
c.sweep = r>=3 || c.ni<=0 ? 2 : 1;
c.ps = r<=3 && roa>.06 && (r<=2 || c.cs>=tc*.5) ? 1 : 0;
```

- **호출 방식:** 기존 `autop(c)`가 호출되는 바로 그 자리에서 적용. 기준 코드의 Day 0/분기 호출 경로를 변경하지 않는다.
- **중복 조건:** JavaScript 논리·삼항 연산자의 우선순위는 위 코드와 동일해야 한다. `halt`는 성장률만 0으로 만들고, 배당/상환/품질 규칙은 별도로 평가한다.
- **정상 경영:** `r<=2 && ni>0`에서는 기존 A2의 `g,pay,sweep,ps`와 동일하다.
- **금융·HOLD:** `autop(c)`의 원래 계산을 유지하며 A4R override를 적용하지 않는다. `HOLD` 말미의 `g=0,ps=0,pay=0` 기존 처리 유지.
- **A4G 제외:** 수익이 있는 r=3 기업의 `g`를 `.04`로 강제 복구하는 민감도 코드를 포함하지 않는다.

## 검증 지표 정의 (게임 UI 구현 요구사항 아님)

기초 `initialPlayerBook = initialEq * 0.60`, 기초 플레이어 지분은 실험 가정상 60%이다. `dv`는 `payDiv(x,dv)` 호출의 **회사 총배당금**이며, 각 시점의 실제 지분율 `own.P / 100`을 사용한다.

- `playerCashDiv = Σ (dv * actualStake * 0.60)` — 플레이어의 세후 배당, 실험의 세율 40% 적용.
- `fixedStakeGrossDiv = Σ (dv * 0.60)` — 플레이어 지배 상태에서 지급된 회사 배당에 고정 60% 지분을 적용한 세전 진단액.
- `wipeout = finish.dead || firstChapter11Day !== null || firstControlLostDay !== null`.
- `nonNegFinalEq = Math.max(0, finalEq)`.
- `stakeAdjustedPlayerBookReturnPct = 100 * (( (wipeout?0:nonNegFinalEq * finalStake/100) + playerCashDiv) - initialPlayerBook) / initialPlayerBook`.
- `cleanPlayerBookReturnPct = 100 * (( (wipeout?0:nonNegFinalEq * 0.60) + fixedStakeGrossDiv) - initialPlayerBook) / initialPlayerBook`.
- `bookReturnPct`(기업 전체 대리지표)는 연구 원시 결과의 별개 항목이며 주주 성과와 혼동하면 안 된다.

**중요 제한:** `wipeout`으로 단순 경영권 상실까지 기말 지분가치를 0으로 처리하는 것은 연구 전용 **보수적인 대리지표**다. 일반 투자자의 실제 현금 청산·피인수 대가, 남은 소수지분 가치, 거래원가를 포함하지 않으므로 게임 투자 수익 계산의 공식으로 도입하지 말 것. 지표 3종은 실험/보고서 전용이며 UI 추가 불필요.

## 재현 명령 (압축 풀고 세 디렉터리를 같은 상위 경로에 유지)

```bash
node verify_A4R_formula_equivalence.js
node rt_risk06_work/rt_auto_risk06_runner.js 864628880 combined A4R 180 '' 0 --validate-stress
python rt_risk06_work/verify06.py
python rt_risk06_work/analyze06.py
```

인계 작성 과정에서 **직접 재실행 확인한 결과**:

- 원본 ZIP 압축 무결성 PASS; raw 100개 존재.
- `verify_A4R_formula_equivalence.js` **23,814 경계조건 대조 PASS** (금융/HOLD 보존 18,522건, 정상 비금융 경계 1,296건 포함).
- Day 0 스트레스 검증: 시드 `864628880`, `combined`, `A4R`, slot 0에서 rating=3, g=0, pay=0, sweep=2, ps=0 확인.
- `python rt_risk06_work/verify06.py` 재실행: **100개 원본 세계 검산 PASS, 지정된 두 세계의 720일 독립 재실행 결과 일치 PASS**.

## Claude 구현 명령

1. 실제 GitHub main SHA 확인; 기준이 바뀌었으면 임의로 덮어쓰지 말고 차이 보고.
2. `rt-auto-risk-a4r` 별도 브랜치에서 **비금융 비HOLD `autop(c)`만 최소 변경**. 참고 코드는 검증 동치용일 뿐, 실제 통합의 테스트·호출 경로는 Claude가 독립 확인.
3. 은행, 보험, HOLD, 수동 경영, 저장 호환은 별도 회귀 테스트.
4. Node 기존 테스트 전부 실행 및 정상/적자/rating3/현금 부족 동작 테스트.
5. 원본 연구의 기준 사례 결과와 대조할 수 있으면 실제 엔진 재현 실행. 단 테스트 환경이 달라지면 차이 보고.
6. 실제 main 병합, Pages, APK 배포 금지. 브랜치에만 커밋·푸시한 뒤 정확한 base/head SHA와 변경 파일, PASS/FAIL, 한계를 보고하고 GPT-6 독립 리뷰로 넘기기.

**이번 패키지는 실험 코드를 발견하지 못했던 MISSING 문제를 해결하기 위한 파일 인계다.** ZIP에 저장된 연구 스냅샷을 현재 서비스 코드와 같은 것으로 무조건 가정하지 말고 SHA 확인 후 작업하라.
