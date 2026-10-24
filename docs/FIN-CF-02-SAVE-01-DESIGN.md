# RT-FIN-CF-02-SAVE-01 원인 조사 및 수정 설계

- 작업 ID: RT-FIN-CF-02-SAVE-01
- 작성: Claude (Opus 5.5)
- 기준: main `d82f84764fdf242de4956ed9d53521a479cc80a9` (게임 소스는 FIN-CF-03A 병합 커밋 `d9600e9`와 같음, `git diff d9600e9 d82f847 -- src` 0줄)
- 상태: 조사·설계 문서. 게임 소스와 기존 테스트는 바꾸지 않았다. main 병합, 웹·APK 빌드·배포 없음. 수정안은 확정하지 않았다(GPT-6 독립 설계 검토와 사용자 승인 뒤 구현).
- 근거: 이 문서의 수치는 모두 main `d82f847`의 게임 코드(조립한 game.js sha256 앞자리 `6930de85162a9dbf`)에서 Claude가 직접 실행한 읽기 전용 스크립트의 출력이다. 스크립트는 `verify/fin-cf-02-save01/`에 함께 올렸고, 출력 원문은 같은 폴더의 `*_d82f847_2026-10-24.log`와 부록 A에 있다. GPT-6가 실행한 결과는 이 문서에 없다.
- 스크립트의 "A" 표기: 같은 세계에서 내보내기 복원 직후 qBack이 다시 만든 회사의 `eqq`만 0으로 바꾼 것(수정안 A를 흉내 낸 것). 게임 함수는 바꾸지 않았다.

용어

| 용어 | 뜻 |
|------|----|
| 일반 저장(full) | `packS()`. 슬롯 저장(`G.sv`, act2.js:127), 자동 저장 `raider7`(ui2.js:1690). 분기 행 `fq`와 지수 `IX`를 그대로 둔다 |
| 내보내기 저장(strip) | `packS(1)`. 코드 복사(`G.exp`, act2.js:250), 클라우드 저장(`G.cSave`, ui2.js:1163), 파일 저장(`G.fSave`, ui2.js:1167). `hr`·`hv`·`fq`·`IX`·`hm`·`w10`·`wd`를 지운다(act2.js:246) |
| 다시 만든 행(합성 행) | 내보내기 복원 때 `qBack`이 복원 시점의 현금·부채·주식 수로 만든 과거 8분기 행 |
| 첫 실제 행 | 복원 뒤 그 회사의 첫 결산 행. 직전 행은 다시 만든 마지막 행(복원일 L − 90일) |
| X | 내보내기 전에 생겨 결산을 기다리던 증자·자사주·출자 현금(`eqq`) |
| Z | 복원 뒤에 생긴 같은 종류의 현금 |

---

## 0. 요약

**[현재 동작]** 내보내기 저장을 복원하면 `qBack`(sim.js:293)이 과거 8분기 행을 복원 시점의 현금·주식 수로 다시 만든다. 이 행에는 저장 전 증자 현금 X가 이미 들어 있다. 그런데 `qBack`은 결산을 기다리는 `eqq`(= X)를 지우지 않는다. 첫 실제 결산(`earn`, sim.js:32)이 X를 `isq[결산일]`로 확정하고, 현금흐름표(`fqDerive`, ui1.js:86)는 그 분기 증자·출자(자사주)로 X를 보여 준다. X는 직전 행 현금 안에 이미 있으므로 현금 증감에는 없다. 그 결과 재무활동이 X만큼 크고 기타·투자 매매가 X만큼 작다. 차입 증감과 현금 증감은 그대로다. 보고된 460.60억은 main `d82f847`의 실제 내보내기 경로(`packS(1)` → `loadStr` → `v8fix`)에서 같은 값으로 재현됐다(1-1절). 플레이어 행동 없이 AI 회사의 이벤트·은행 증자로도 생긴다(1-5절).

**[예상 동작]** 다시 만든 직전 행과 비교하는 첫 실제 분기의 증자·출자는 복원 뒤 기록된 현금 Z만이어야 한다. 그래야 그 분기의 줄들이 현금 증감과 맞는다(같은 현금을 직전 행 현금과 증자 줄에 두 번 세지 않는다). 일반 저장은 지금 동작이 맞다. 직전 행이 실제 결산 행이므로 X는 다음 분기 증자에 들어가야 한다(1-2절).

**[최초 원인]** `qBack`이 기준선(다시 만든 행)을 새로 만들면서 장부 시작일 `isd`와 확정 기록 `isq`는 정리하지만 대기 금액 `eqq`는 남긴다. FIN-CF-02 설계가 이 동작을 명시했고("qBack ... drops isq, keeps a pending eqq", tests/t_fincf02_issue.js:16), 같은 파일 174·183줄이 내보내기 저장에서도 X가 다음 분기 증자로 나오는 것을 기대값으로 고정했다. FIN-CF-03A는 같은 경계에서 대기 기록을 비우도록 설계·구현했다(`c.acq=null`, sim.js:297, R2 설계서 4-2절).

**[설계 선택 — 권장, 확정 아님]** A안: `qBack`에서 `c.eqq=0` 한 줄. 03A와 같은 규칙이고, 게임 상태·난수에 영향이 없으며(대조 실험 6개 시나리오×360일 동일, 5-2절), 이미 만들어진 내보내기 코드도 복원할 때 바로잡힌다. FIN-CF-01의 대기 감면 `ncq`에도 같은 구조의 결함이 있다(대출 회수 경로 재현 1,786.57, 6-2절). 이번에 함께 고칠지(A1)는 결정 사항이다.

**결정이 필요한 사항**(7-4절): D1 A안 채택, D2 FIN-CF-01 같은 결함(A1)을 함께 고칠지, D3 기존 테스트 기대값 변경 범위, D4 첫 실제 분기 각주 보강, D5 수정 전 빌드가 쓴 전체 자동 저장에 남는 사례를 기록만 할지.

---

## 1. [현재 동작] 재현

재현 절차는 모두 같다: 시드 20261016 새 게임(`tut:0`) → 조건(`!dead && !kd && !priv && !mine && !own.P && bk===0 && A>3000`)을 처음 만족하는 회사 PNPL → 플레이어 60% 지배 → 결산 두 번 → 거래 → 저장·복원 → 다음 결산 → `fqDerive(T, 마지막 행, 직전 행)`. 거래 현금은 실제 게임 함수 호출 직전·직후의 `(현금 변화) − (부채 변화)`로 잰다(FIN-CF-02 테스트와 같은 방식). 명세는 `verify/fin-cf-02-save01/repro.js`·`boundary.js`.

### 1-1. 보고 사례 460.60 (repro.js [R0])

결산 117일 → 122일 `G.mg(PNPL,'iss',.1)` → 127일 내보내기·복원 → 207일 결산.

| 항목 | 값 |
|------|----|
| 증자 현금(측정) | +460.60 |
| 복원 직후 `eqq` | 460.60 (남음) |
| 복원 직후 `isd` | −593 (= 127 − 720) |
| 복원일 현금·주식 수 | 1,001.58 (증자 현금 460.60 포함), 3,601.95 (증자 뒤) |
| 다시 만든 마지막 행 | 37일, 현금 965 (= 1,001.58 × 축소 계수 0.9635, 반올림), 주식 수 3,602 (= 복원일 값, 축소 없음) |
| 첫 실제 행 | 207일 (직전 행 37일) |
| 결산 뒤 `isq` | `{"207": 460.5987…}` |

| 줄 | 현재 | A | 현재 − A |
|----|-----:|--:|--------:|
| 증자·출자(자사주) | 460.60 | 0.00 | 460.60 |
| 재무활동 현금흐름 | 534.60 | 74.00 | 460.60 |
| 기타·투자 매매 | −538.60 | −78.00 | −460.60 |
| 현금 증감 | 64.00 | 64.00 | 0 |

이전 보고는 내보내기를 JSON으로 흉내 냈다. 실제 `packS(1)` → `loadStr` 경로도 같은 값이다. A에서 남는 기타 −78.00은 다시 만든 행과 비교하는 데서 오는 기존 근사 오차다(7-3절 R3).

### 1-2. 대조: 일반 저장 (repro.js [E2])

같은 증자(147일, X = 433.45)를 일반 저장으로 복원하면 행이 그대로 남는다(마지막 행 = 117일 실제 결산, 증자 전). 207일 결산: 증자 433.45, 재무활동 393.45, 기타 −0.45. 측정한 X로 계산한 재무활동·기타와 일치한다. **일반 저장은 결함이 없다.**

### 1-3. 다른 거래 (repro.js [E1]·[E3]·[E4], boundary.js [E10])

| 사례 | 현재 증자 | A 증자 | 맞는 값(복원 뒤 기록 현금) | 현재 기타 | A 기타 |
|------|---------:|------:|------------------------:|---------:|------:|
| E1 증자, 147일 내보내기·같은 날 복원 (X 433.45) | 433.45 | 0.00 | 0 | −531.45 | −98.00 |
| E3 자사주 5% (X −312.52) | −312.52 | 0.00 | 0 | 478.52 | 166.00 |
| E4 저장 전 X 463.80 + 복원 10일 뒤 Z 453.66 | 917.45 | 453.66 | 453.66 | — | — |
| E10 저장 전 X 433.45 + 복원 당일 직후 Z 462.49 | 895.95 | 462.49 | 462.49 | −530.95 | −97.49 |

E1에서 현재 − A의 차이는 증자 +433.45, 재무활동 +433.45, 기타 −433.45, 현금 증감 0, 차입 증감 0이다. 자사주(음수)도 같은 방식으로 반대 부호로 틀린다. A는 복원 뒤의 거래(Z)를 그대로 남긴다.

### 1-4. 화면 (boundary.js [E13])

첫 실제 분기(27.3Q, 최신 열) 칸:

| 칸 | 현재 | A |
|----|------|---|
| 증자·출자(자사주) | `433` | `–` |
| 차입 증감 | `◐141` | `◐141` |
| 재무활동 현금흐름 | `◐534` | `◐101` |
| 기타·투자 매매 | `◐-531` | `◐-98.0` |
| 현금 증감 | `71.0` | `71.0` |

◐와 각주 "※ ◐ 부분 기록 분기(27.3Q)"는 03A가 붙인다(복원 때 `acd`가 복원일로 올라가 첫 실제 행이 `part`). 증자 칸에는 표시가 없어서, 현재 화면에서 433은 기록된 금액처럼 보인다. 주식 수가 다시 만든 행과 같아서(`dsh` 거짓) `≈` 추정 표시도 붙지 않는다.

### 1-5. 누가 겪나: 플레이어 행동 없이도 생긴다 (natural.js, repro.js [E6])

`eqCash` 호출처 15곳(act2.js 8곳, ui2.js 7곳) 중 AI 회사에서 저절로 일어날 수 있는 곳:

| 위치 | 경로 | 부호 |
|------|------|------|
| ui2.js:593 | AI 은행 BIS 비율 9% 미만 → 자본 확충 유상증자(`bankQ`) | + |
| ui2.js:674 | 이벤트 "행동주의 펀드 등장" → "요구 수용" 자사주 매입 | − |
| ui2.js:683 | 이벤트 "신용등급 강등 경고" → "유상증자 10%" | + |
| ui2.js:688 | 이벤트 "자사주 매입 제안" | − |
| ui2.js:691 | 이벤트 "국유화 위협" → "협상" 신주 30%를 정부에 발행 | + |
| ui2.js:807 | 경쟁 행동주의 펀드 요구 관철 → AI 회사 자사주 매입 | − |

674·683·688·691은 이벤트 처리 함수(`go`)다. AI 회사에는 `aiEvent`(ui2.js:720)가 무작위로 이벤트를 골라 AI 선택으로 실행하고, 플레이어 회사에는 플레이어가 고른다. 나머지(act2.js:10·12 경영 메뉴 증자·자사주, 44 그린메일, 67 구제금융 수락(`G.evPick`), 163 사모증자, 165 백기사, 228·230 자금 이동 출자·신주 인수, ui2.js:525 옵션 행사)는 플레이어 행동이다.

자연 실행(플레이어 행동 없음, 720일, 매일 점검):

| 시드 | 대기 `eqq`가 있는 날 | 회사·일 | `eqCash` 호출 (위치, 횟수, 합계, 예) |
|------|------------------:|-------:|---------------------------|
| 20261016 | 145 / 720 | 145 | ui2.js:674 1회 −251.18 (NTRX 208일), ui2.js:691 1회 +197.30 (BABX 515일) |
| 777 | 0 / 720 | 0 | 없음 |
| 12345 | 211 / 720 | 269 | ui2.js:593 은행 5회 +40.03 (BOAX 450일 14.56 등), ui2.js:688 금융사 1회 −2.70 (AXAX 661일) |

대기 금액은 그 회사의 다음 결산까지(최대 89일) 남는다. 그래서 호출이 몇 번뿐이어도 내보내기 시점에 걸리는 날이 많다(이 세 시드에서 0%, 20%, 29%의 날). 시드 20261016을 아무 조작 없이 540일까지 돌려 내보내면 BABX의 대기 197.30이 571일 첫 실제 분기 증자로 나온다(복원 뒤 기록 0, 기타 −218.30). A이면 증자 0, 기타 −21.00이다. 은행도 같다: 시드 12345를 555일에 내보내면 BOAX 5.44, SHFN 10.91(둘 다 자본 확충 증자)이 각자 첫 실제 분기 증자로 나오고, A이면 0이다(repro.js [E6]).

---

## 2. 실제 호출 순서와 위치 (조사 1·3)

### 2-1. 순서

아래 순서는 코드를 읽어 정리하고, `verify/fin-cf-02-save01/trace.js`로 실제 실행 순서를 확인했다(R0 사례의 PNPL 한 회사에 대해 실제 함수를 감싼 기록용 래퍼로 호출 순서와 그때의 `eqq`·`isq`·`isd`·행 수를 찍음, 부록 A-0).

| # | 시점 | 함수 (파일:줄) | eqq·isq·isd에 하는 일 |
|---|------|---------------|---------------------|
| 1 | 거래 | `eqCash(c,x)` (sim.js:282), 호출처 15곳 | `c.eqq += x` |
| 2 | 결산일 `step()` (sim.js:114) → `earn(c)` | sim.js:30 자본잠식 검사(→ `ch11`, `ncq`에 감면 R) | — |
| 3 | 같은 `earn` | sim.js:32 확정: `ncq → rlf{d,R}`, `eqq → isq[결산일]`, `acq → acr[결산일]`, 이어서 `qPush` | `isq[d] += eqq; eqq = 0` |
| 4 | 같은 `earn` | `qPush` (sim.js:291) | `isq`·`acr`에서 가장 오래된 행보다 앞선 날짜 삭제 |
| 5 | 내보내기 | `packS(1)` (act2.js:246) | `fq`·`IX` 등을 지움. `eqq`·`isq`·`isd`·`ncq`·`rlf`·`cfd`·`acq`·`acr`·`acd`는 파일에 남음 |
| 6 | 복원 | `unpackS`(act2.js:248) / `loadStr`(ui2.js:1689) → `migrate` → `S = s` → `v8fix()` (core.js:101) | — |
| 7 | `v8fix` 안 | `bankFix` (core.js:97) → 회사마다 `v8prep` (core.js:96) | 필드가 **없을 때만** `eqq=0`, `isd=S.day` (`ncq`·`cfd`·`acd`도 같음). `bankFix`는 게임 중에도 30일마다 돈다(sim.js:115). 그래서 `v8prep`에 무엇을 지우는 코드를 넣으면 매달 실행된다 |
| 8 | `v8fix` 안 | `v11prep` (sim.js:195): `S.IX`가 없으면 `full=1` → 살아 있는 회사 `coPrep` → `bfill` (sim.js:254) | — |
| 9 | `bfill` 끝 | sim.js:271: 살아 있고 `fq`가 빈 회사마다 `qBack(c)` | — |
| 10 | `qBack` | sim.js:293: `priv&&fo`면 바로 반환. 아니면 `fq=[]`, `delete rlf`, `cfd=S.day−720`, `delete isq`, `isd=S.day−720`, (03A) `delete acr`, `acq=null`, `S.day>0`이면 `acd=S.day`, 합성 8행(`S.day−720`…`S.day−90`; 현금·부채는 오늘 값×`sc`, 주식 수는 오늘 값 그대로), `eh`·`est` | **`eqq`는 건드리지 않음** |
| 11 | 복원 직후 | 붙여넣기(act2.js:254)·클라우드(ui2.js:1166)·파일(ui2.js:1168) 경로는 곧바로 `save()` → `raider7` 일반 저장 | 10의 상태(대기 X 포함)가 일반 저장으로 옮겨 감 |
| 12 | 첫 실제 결산 | 3과 같음 | `isq[q.d] = X (+ Z)` |
| 13 | 표시 | `fqL` → `fqDerive(c,q,prev)` (ui1.js:86): `led = prev.d > isd`, `dsh = q.sh ≠ prev.sh`, `iss = led‖!dsh ? isq[q.d] : (q.sh−prev.sh)×q.p/1e4`, `est = !led && dsh`. `cff = dD + nc − ncA − dv + iss`, `dc = q.cs − prev.cs`, `oth = dc − cfo + capex − cff − maN − inN` | `prev.d = L−90 > isd = L−720` → `led` 참 → `iss = X + Z` |

`step()`은 날짜를 먼저 올리고(sim.js:114) 결산을 돌리므로, 저장은 항상 그날 결산이 끝난 뒤다. 복원한 날에는 결산이 다시 돌지 않는다. 첫 실제 결산은 빨라도 다음 날이다.

### 2-2. 일반 저장과 내보내기 저장의 차이 (조사 3)

| | 일반 저장 | 내보내기 저장 |
|--|----------|--------------|
| 쓰는 곳 | 슬롯(act2.js:127), 자동 저장 8초마다·화면 숨김 때(ui2.js:1690·1691·1697) | 코드 복사(act2.js:250), 클라우드(ui2.js:1163), 파일(ui2.js:1167) |
| 읽는 곳 | 슬롯(act2.js:128), 시작 시 자동 저장(ui2.js:1699) | 붙여넣기(act2.js:254), 클라우드(ui2.js:1166), 파일(ui2.js:1168) |
| `fq`, `IX` | 남음 | 지움 |
| `v11prep`의 `full` | 0 → `bfill`·`qBack` 안 돎 | 1 → `bfill` → `qBack` |
| 복원 때 게임 자체 난수 사용 | 0번 | 474,413번 (probes.js [P2], 200일째) |
| 직전 행 | 실제 마지막 결산 행(거래 전) | 다시 만든 행(거래 뒤 상태로 만듦) |
| 대기 X의 결과 | 다음 분기 증자로 정확히 나옴(1-2절) | 다음 분기 증자로 다시 나옴 → 중복 |
| 크기(시드 20261016, 200일째) | 827,141자 | 291,197자 |

게임은 매일 시작할 때 자체 난수를 (시드, 날짜)로 다시 만든다(`dayR`, ui2.js:124: `_R=wR(1)`). 그래서 복원 때 쓴 난수 개수는 그다음 날부터의 게임에 영향을 주지 않는다. `Math.random`은 새 게임과 진행 중에 한 번도 쓰이지 않는다(probes.js [P1]).

### 2-3. 복원 직후 자동 저장 (boundary.js [E11])

붙여넣기·클라우드·파일 복원은 복원 직후 `save()`로 일반 저장을 쓴다. 따라서 수정 전 빌드에서는 "다시 만든 행 + 대기 X" 상태가 곧바로 `raider7`에 들어간다. 이 일반 저장을 다시 열면(`qBack`이 돌지 않음) 첫 실제 결산에서 같은 중복이 난다(현재: 증자 433.45). 복원 때 A가 적용됐다면 일반 저장의 `eqq`는 0이고 증자도 0이다. 수정 후 빌드가 이런 "수정 전 빌드가 쓴 일반 저장"을 열 때는 A가 돌 자리가 없다(7-3절 R1).

---

## 3. 중복 분류의 정확한 조건, 최초 원인, 예상 동작 (조사 2)

### 3-1. 조건 (모두 성립해야 생김)

1. 회사 c에 내보내기 시점에 결산 대기 `eqq ≠ 0`이 있다(그 회사의 마지막 결산 뒤 `eqCash` 호출. 결산 당일 결산 뒤 거래 포함).
2. 그 저장을 내보내기 경로(붙여넣기·클라우드·파일)로 복원한다. 또는 그렇게 복원한 직후 쓰인 일반 저장을 복원한다(2-3절).
3. c가 살아 있고 `priv && fo`(직접 세운 비상장사)가 아니어서 `qBack`이 행을 다시 만든다.
4. 복원 뒤 c의 첫 결산이 대기 금액을 `isq[q.d]`로 확정한다.
5. 그 행의 직전 행이 다시 만든 마지막 행이고 `prev.d = L−90 > isd = L−720`이라 장부 금액을 쓴다(`led` 참).

조건 1이 없으면(대기 0) 생기지 않는다(경계 b, e). 조건 3이 없으면 행이 없어 첫 행에 현금흐름 칸이 없다(E9).

### 3-2. 식으로 본 중복

`prev.cs = r1(L일 현금 × sc)`이고 L일 현금에는 X가 이미 들어 있다. 그래서 `dc = q.cs − prev.cs`에는 X 유입이 없다. 그런데 `iss = X`이므로

- `cff = dD + nc − ncA − dv + iss` → X만큼 큼
- `oth = dc − cfo + capex − cff − maN − inN` → X만큼 작음
- 차입 증감 `= cff + dv − iss = dD + nc − ncA` → 그대로
- 현금 증감 → 그대로

다시 만든 행은 8행 모두 오늘 주식 수(거래 뒤)를 쓰므로 `dsh`가 거짓이고 `est`도 거짓이다. 그래서 틀린 금액이 `≈` 없이 기록된 금액처럼 보인다.

### 3-3. 최초 원인

`qBack`(sim.js:293)은 기준선을 다시 만들면서 "그 기준선과 맞지 않는 장부"를 정리한다. 확정 기록 `isq`는 지운 행을 설명하므로 지우고, 장부 시작일 `isd`는 다시 만든 행이 장부 안에 들도록 `L−720`으로 내린다. 그런데 대기 `eqq`는 다시 만든 기준선 안에 이미 들어간 현금인데도 남긴다. 그 결과 같은 현금이 직전 행 현금과 다음 분기 증자에 두 번 들어간다.

FIN-CF-02 설계는 이 동작을 의도로 적었다("qBack (export import rebuilds the past rows) drops isq, keeps a pending eqq", tests/t_fincf02_issue.js:16; docs/MODEL.md:114 "내보내기는 `eqq`·`isd`를 보존하며 `isq`는 과거 분기와 함께 새로 만들어진다"). 대기 금액은 "다음 결산 분기의 거래"라는 전제였는데, 이 전제는 직전 행이 실제 마지막 결산 행일 때(일반 저장)만 맞다. 내보내기 복원에서는 직전 행이 거래 뒤 상태로 만들어진다. 같은 파일의 테스트가 이 전제를 기대값으로 고정했다:

- 174줄: 두 형식 모두 "the pending issue cash survives the save" (`T.eqq ≈ m.real`)
- 183줄: 내보내기 형식에서 "the next close shows the real cash" (`d.iss ≈ m.real`). 이 분기는 기타·재무활동을 검산하지 않아서(일반 저장 분기만 `rowCheck`) 중복이 잡히지 않았다.
- 187줄: 그렇게 확정된 기록이 다음 내보내기에서 행과 함께 사라지는지 본다. 저장 전 거래가 확정 기록이 된다는 전제 위에 있다.

FIN-CF-03A R2 설계는 같은 경계에서 대기 인수 기록을 비웠다(4-2절: "qBack은 불러온 시점의 부채·현금에 축소 계수를 곱해 합성 행을 만든다. 저장 전 인수로 들어온 부채는 이미 그 합성 직전 행 안에 있으므로, pending을 남겨 다음 결산에서 빼면 같은 부채를 한 번 더 빼게 된다"). 같은 설계서 9-1 R1이 이 FIN-CF-02 결함을 별도 작업으로 넘겼다.

### 3-4. 예상 동작 (규칙)

현금흐름표의 한 분기 열은 그 행과 직전 행의 차이를 나눠 보여 준다. 그래서 어떤 현금이 직전 행 현금에 이미 들어 있으면, 그 분기의 증자·출자(자사주) 줄에 다시 들어가면 안 된다. 이 규칙을 두 저장 형식에 적용하면:

- 일반 저장: 직전 행은 실제 마지막 결산 행이고 대기 X는 그 뒤 거래다 → X는 다음 분기 증자에 들어간다(지금과 같음).
- 내보내기 저장: 직전 행은 복원 시점 상태(X 포함)로 다시 만든 행이다 → X는 들어가지 않고, 복원 뒤 거래 Z만 들어간다.

어느 쪽을 고쳐 이 규칙을 맞출지(장부 쪽 A, 기준선 쪽 B 등)는 설계 선택이다(5절).

---

## 4. 결산 전후·같은 날 경계 (조사 4)

repro.js [E5]·[E9], boundary.js [E10]·[E11]·[E14]. "잘못 놓인 금액" = 첫 실제 분기 증자 − 복원 뒤 기록 현금.

| # | 사례 | 내보내기 시 대기 | 첫 실제 행 (직전 행) | 현재 잘못 놓인 금액 | A |
|---|------|---------------|-------------------|-----------------:|---|
| a | 증자 후 결산 하루 전(206일) 내보내기·복원 | 453.38 | 207 (116) | 453.38 | 0 (기타 −610.38 → −157.00) |
| b | 결산 당일(207일) 결산 직후 내보내기, 거래 없음 | 0 | 297 (117) | 0 | 0 (변화 없음) |
| c | 결산 당일 결산 직후 증자, 같은 날 내보내기 | 454.92 | 297 (117) | 454.92 | 0 (기타 −429.92 → 25.00) |
| d | 증자 후 내보내기·복원을 두 번(결산 전, 137일) | 463.80 | 207 (47) | 463.80 (두 번 거쳐도 남음) | 0 (첫 복원에서 비움; 기타 −464.80 → −1.00) |
| e | 증자 → 결산이 확정 → 내보내기 | 0 | 297 (117) | 0 (확정 기록은 행과 함께 사라짐, 기존 동작) | 0 (변화 없음) |
| E10 | 복원 당일(147일), 날이 지나기 전 새 증자 Z 462.49 | X 433.45 | 207 (57) | 433.45 (증자 895.95) | 0 (증자 462.49 = Z) |
| E11 | 내보내기 복원 직후 쓰인 일반 저장을 다시 복원 | X 433.45 | 207 (57) | 433.45 | 0 (복원 때 A가 적용됐을 때) |
| E14 | 0일째 증자 후 0일째 내보내기·복원 | X 401.54 | 27 (−90) | 401.54 | 0 (A는 날짜 조건 없음). 0일째는 `acd`를 올리지 않아 ◐ 없음(`st` full) |
| E9 | 직접 세운 비상장사(`priv&&fo`)에 현금 출자 50 후 내보내기 | 50 | 행 없음 → 첫 행(255일)에 현금흐름 칸 없음, 둘째 결산(345일) 증자 0 | 해당 없음 | 해당 없음 (`qBack`이 돌지 않음) |

수치는 repro.js·boundary.js 실행값이다(부록 A). 첫 실제 행의 기간은 복원 시점에 따라 91~180일이다(직전 행이 L−90일이고 다음 결산은 L 뒤 첫 결산일). 예: (c) 117→297은 180일. 이 기간 차이는 기존 근사이고 이번 결함과 별개다(7-3절 R3).

같은 날 경계를 정리하면: 결산은 저장 전에 끝나 있으므로(2-1절), "결산 뒤 같은 날 거래"는 다음 분기 대기 금액이 되고 내보내기 복원에서 기준선에 들어간다(c). 복원 당일 날이 지나기 전의 거래는 복원 뒤 거래이므로 표시해야 한다(E10). A는 복원 처리(`qBack`) 안에서만 비우므로 두 경우를 정확히 가른다. 복원이 끝난 뒤 생긴 Z는 `qBack` 뒤에 쌓이기 때문이다.

---

## 5. [설계 선택] 수정안 비교 (조사 5)

### 5-1. 요약

| 안 | 내용 | 결함 해소 | 이미 만든 내보내기 코드 | 수정 전 빌드가 쓴 일반 저장(2-3절) | 게임 상태·난수 | 기존 테스트 기대값 | 판단 |
|----|------|---------|---------------------|-------------------------------|--------------|-----------------|------|
| **A** | `qBack`에서 `c.eqq=0` | 예 | 복원 때 해소 | 해소 못 함 | 변화 없음(5-2) | t_fincf02 3곳(8-4) | **권장 후보** |
| A1 | A + `qBack`에서 `c.ncq=0` | 예 + FIN-CF-01 같은 결함 | 복원 때 해소 | 해소 못 함 | 변화 없음(5-2) | A + t_fincf01 4곳 | D2 결정 |
| B | 다시 만든 행의 현금·주식 수에서 X를 뺌 | 이론상 | 복원 때 | 못 함 | `fq`·`eh`·`est`가 바뀌어 시뮬레이션이 달라짐(코드 분석) | 다수 | 기각 |
| C | 다시 만든 회사의 `isd`를 복원일로 | **아니오**(boundary.js [E12]: 여전히 433.45) | — | — | 변화 없음 | — | 기각 |
| D | 내보내기(`packS(1)`)에서 `eqq`를 0으로 써 넣음 | 새 코드만 | **못 함** | 못 함 | 변화 없음 | A와 비슷 | A보다 못함 |
| E | 내보내기에서 `fq`를 지우지 않음 | 새 코드만 | 못 함 | 못 함 | 내보내기 복원의 `eh`·`est`가 실제 값으로 바뀌어 복원 뒤 게임이 지금과 달라짐(코드 분석), 코드 +49~52%(실행) | 다수 | 기각(저장 형식 결정) |
| F | A + 첫 실제 분기 표시·각주 보강 | A와 같음 | A와 같음 | — | 변화 없음 | UI 테스트 추가 | D4 정책 |
| G | 수정 전 빌드가 쓴 일반 저장을 추정으로 고치는 이전(migration) | 일부 | — | 추정 | 변화 없음 | — | 기각 |
| H | 표시(`fqDerive`)에서만 보정 | 불가 | — | — | — | — | 기각 |

### 5-2. 각 안

**A — `qBack`에서 대기 증자 현금을 비움.** 위치는 `delete c.isq;c.isd=S.day-720;` 바로 뒤(sim.js:293). `priv&&fo` 조기 반환 뒤이므로 직접 세운 비상장사는 지금과 같다. `v11prep`이나 `v8prep`이 아니라 `qBack`에 두는 이유: 행을 실제로 다시 만드는 회사에만 적용되고(일반 저장 복원·직접 세운 비상장사는 제외), 03A의 같은 처리(`acq=null`)와 한곳에 모인다.

- 의미: 내보내기 복원은 복원 시점 상태로 과거를 다시 만든다. 그때까지 대기하던 거래는 그 기준선 안에 있다. 03A의 `acq=null`과 같은 규칙.
- 게임 상태: `eqq`·`isq`·`isd`는 기록 전용이다(sim.js:281 주석; 시뮬레이션이 읽지 않음). 대조 실험(counterfactual.py 방식; 이 커밋의 수치는 Claude 작업 공간 사본 실행이고, 저장소 스크립트 재실행 로그는 다음 커밋에서 부록 A-5로 추가): 6개 시나리오(플레이어 증자, 자사주, 자연 실행 3개 시점, 법정관리 감면 대기)에서 내보내기 복원 직후 대기 금액을 비운 세계와 그대로 둔 세계를 별도 프로세스로 360일 돌려, 기록 전용 필드(`eqq`·`isq`·`ncq`·`rlf`)를 뺀 게임 상태 전체 해시가 **매일 같았고**, 끝난 뒤 게임 자체 난수(`_R`)와 날짜별 난수(`wR(4)`)의 다음 값도 같았다(2,166줄 모두 동일, A·A1 둘 다).
- 난수: A는 대입 한 번이고 난수를 꺼내지 않는다. 게임은 날마다 난수를 다시 만들므로(2-2절) 복원 때 난수 사용이 바뀌더라도 다음 날에는 영향이 없지만, A는 그 사용도 바꾸지 않는다.
- 옛 저장: 5-3절.
- 비용: FIN-CF-02 설계 문구(테스트 머리 주석, MODEL.md)와 기존 테스트 기대값 3곳이 바뀐다(8-4절). 저장 전 거래 금액은 첫 실제 분기 어디에도 따로 보이지 않게 된다. 하지만 그 금액은 다시 만든 직전 행 현금 안에 있고, 같은 분기의 다른 거래(영업 현금 등)도 모두 그렇다.

**A1 — A에 FIN-CF-01 `ncq`를 더함.** 위치는 `delete c.rlf;c.cfd=S.day-720;` 바로 뒤. 근거와 재현은 6-2절. FIN-CF-01 테스트의 내보내기 분기 기대값이 바뀐다(8-4절).

**B — 기준선 쪽을 고침.** 다시 만든 행의 현금에서 X를, 주식 수에서 발행 주식 수를 빼서 거래를 첫 실제 분기 안으로 옮긴다. 저장 데이터에는 거래 당시 주가·발행 주식 수가 없어 주식 수를 정확히 되돌릴 수 없다. 합성 행마다 축소 계수가 다르고, 현금이 음수가 될 수 있다. 무엇보다 `fq`는 게임 상태다. `qBack`이 `fq`로 `eh`(주당순이익 기록)·`est`를 계산하고(sim.js:301) 시뮬레이션이 `eh`를 읽으므로(sim.js:215) 복원 뒤 게임이 달라진다. 기각.

**C — 장부 시작일을 복원일로.** 직전 행(L−90)이 `isd`(L)보다 앞서 `led`가 거짓이 되지만, 주식 수가 같아 `dsh`도 거짓이므로 규칙(`led‖!dsh` → 장부 금액)이 여전히 X를 쓴다. 실행 결과도 433.45 그대로다(boundary.js [E12]). 기각.

**D — 내보내기 때 비움.** 앞으로 만드는 코드는 고치지만, 이미 만들어 둔 코드·클라우드·파일 저장은 그대로 결함이 난다. 저장 직렬화(`packS`)에 회사 장부 규칙이 들어가는 것도 좋지 않다. A로 충분하다.

**E — `fq`를 지우지 않음.** 다시 만든 행이 없어지므로 원인 자체가 사라진다. 그러나 내보내기 코드가 49~52% 커지고(200일째 291,176 → 442,512자, 720일째 306,596 → 457,672자; 압축·base64 기준, probes.js [P3]) 클라우드 저장은 조각(180,000자) 수가 늘어난다. 복원 때 `qBack`이 돌지 않으므로 `eh`·`est`가 다시 만든 값이 아니라 실제 값이 되어 복원 뒤 게임이 지금과 달라진다. 이미 만든 코드는 고치지 못한다. 저장 형식 결정이라 이번 범위 밖. 기각.

**F — A + 표시 보강.** 첫 실제 분기에는 03A의 ◐와 각주가 이미 붙는다(1-4절). 각주 문안은 인수·흡수·LBO·숨은 부채만 말한다. "복원 전 같은 분기의 증자·자사주·출자 현금은 다시 만든 직전 분기 현금에 들어 있어 이 분기 증자·출자(자사주)에 넣지 않았어요" 같은 한 문장을 더할지는 정책 결정이다(D4). A 뒤 증자 칸에 남는 값은 복원 뒤 기록된 정확한 금액이므로 증자 칸에 ◐를 새로 붙일 근거는 약하다.

**G — 수정 전 빌드가 쓴 일반 저장을 고치는 이전.** 그런 저장의 `eqq`에는 복원 전 X와 복원 뒤 Z가 한 숫자로 합쳐져 있고, 저장 안에 둘을 가를 정보가 없다. "다시 만든 행 + 아직 결산 전"이라는 흔적(`isd === acd − 720`이고 마지막 행 날짜 < `acd`)으로 대상을 고를 수는 있지만, Z까지 지우게 된다. 기각. 대신 남는 위험으로 기록한다(R1).

**H — 표시에서만 보정.** 결산 때 X와 Z가 `isq[q.d]` 한 숫자로 합쳐진다. 그 뒤에는 나눌 수 없다. 나눌 수 있는 순간은 복원 처리 중(Z가 생기기 전)뿐이므로 고칠 곳은 `qBack`이다. 기각.

### 5-3. 옛 저장 호환 (A 기준)

| 저장 | 복원 경로 | `qBack` | 지금 | A 뒤 |
|------|----------|--------|------|------|
| 일반 저장(슬롯·자동 저장), 어느 버전이든 | 슬롯·시작 | 안 돎 | 맞음(직전 행이 실제 결산) | 같음 |
| FIN-CF-02 이후 빌드의 내보내기 코드·클라우드·파일, 대기 X 있음 | 붙여넣기·클라우드·파일 | 돎 | X 중복 | **복원 때 바로잡힘** |
| FIN-CF-02 이전 내보내기(필드 없음) | 같음 | 돎 | `v8prep`이 `eqq=0` → 결함 없음 | 같음 |
| 0일째 내보내기(대기 있음) | 같음 | 돎(`S.day=0`) | X 중복 | 바로잡힘(A는 날짜 조건 없음) |
| 수정 전 빌드에서 내보내기 복원 직후 쓰인 일반 저장(대기 X, 다시 만든 행) | 시작·슬롯 | 안 돎 | X 중복 | **그대로 (R1)** |
| 수정 후 빌드에서 내보내기 복원 직후 쓰인 일반 저장 | 시작·슬롯 | 안 돎 | — | 맞음(`eqq`에는 Z만) |
| 직접 세운 비상장사(`priv&&fo`)가 든 내보내기 | 붙여넣기 | 그 회사는 반환 | 첫 행에 현금흐름 칸 없음 | 같음 |
| 수정 후 빌드가 만든 내보내기를 수정 전 빌드로 엶 | — | 돎 | X 중복(옛 빌드 동작) | 해당 없음 (A는 내보낼 때가 아니라 복원할 때 작동) |

---

## 6. FIN-CF-01·03A 장부 부작용 (조사 6)

### 6-1. FIN-CF-03A — 영향 없음 (repro.js [E8])

`qBack`은 이미 `acr`를 지우고 `acq=null`, `acd=복원일`로 둔다(sim.js:297). 실행: 주식합병 대기(aD 1,117.80)가 있는 회사를 내보내기 복원 → `acq` null, `acd` 147(복원일) → 첫 실제 행 `part`, `ncA` 0. A는 `acq`·`acr`·`acd`를 건드리지 않는다. 첫 실제 행의 ◐ 표시도 그대로다(1-4절).

### 6-2. FIN-CF-01 — 같은 구조의 결함 (repro.js [E7])

`qBack`은 `delete c.rlf; c.cfd=S.day-720`을 하고 대기 감면 `ncq`는 남긴다. 다시 만든 행의 부채는 감면 뒤 부채 × `sc`이므로 감면 R은 이미 기준선 안에 있다. 그런데 첫 실제 결산이 R을 `rlf`로 확정하고 `fqDerive`가 `nc = R`을 차입 증감·재무활동에 더한다.

| 사례 | 대기 R | 줄 | 현재 | `ncq` 0 | 일반 저장(대조) |
|------|------:|----|-----:|-------:|-------------:|
| 대출 회수 경로 `callLoan(은행, PNPL, 1)` (테스트 F2b와 같은 방식) | 1,786.57 | 차입 증감 | 1,719.57 | −67.00 | −881.43 (직전 행 117일, R이 그 분기 안) |
| | | 기타·투자 매매 | −1,755.27 | 31.30 | 379.73 |
| | | 현금 증감 | −43.00 | −43.00 | −509.00 |

(실행값은 부록 A [E7] (b).) 현재 − `ncq` 0 = 차입 증감 +1,786.57, 기타 −1,786.57, 현금 증감 0. `ch11`을 직접 부른 합성 사례 [E7] (a)도 같다(R 945.75: 차입 증감 244.75 대 −701.00). 증자 결함과 같은 모양이고, 틀리는 칸이 증자가 아니라 차입 증감이라는 점만 다르다.

도달 경로: `ncq`가 결산 밖에서 쌓이는 곳은 `ch11`을 결산 밖에서 부르는 `callLoan`뿐이다(sim.js:158–160). `callLoan`을 부르는 곳은 플레이어 은행의 대출 회수(act2.js:173)와 경쟁자가 지배하는 은행이 플레이어 회사 대출을 회수하는 `rbank`(sim.js:163–165, 난이도 2 이상)다. 결산 안의 자본잠식 법정관리(sim.js:30)는 같은 `earn`에서 바로 확정되므로 대기로 남지 않는다. 자연 실행 3시드×720일에서 대기 `ncq`가 있던 날은 0일이다(natural.js). 즉 플레이어가 관련된 경우에만 생기지만, 생기면 금액이 크다.

같은 원인·같은 위치·같은 고침이므로 A1로 함께 고칠 수 있다. 다만 이번 작업 ID는 FIN-CF-02-SAVE-01이고 FIN-CF-01 테스트 기대값이 바뀌므로 범위 결정이 필요하다(D2). 따로 하려면 FIN-CF-01-SAVE-01로 등록하는 것을 제안한다.

### 6-3. 같은 식을 쓰는 부분

`fqDerive`의 `cff = dD + nc − ncA − dv + iss`에서 A는 `iss`만 바꾼다. 내보내기 복원 뒤 첫 실제 분기의 재무활동이 X만큼 줄고 기타·투자 매매가 X만큼 는다. 차입 증감(`dD + nc − ncA`)과 현금 증감은 그대로다(1-3절 E1: 차입 증감 141.00 양쪽 같음). `nc`(FIN-CF-01), `ncA`·`maN`·`inN`(03A)은 바뀌지 않는다. 다른 행(다시 만든 8행, 둘째 실제 분기부터)은 대기 금액과 무관하므로 바뀌지 않는다.

---

## 7. [설계 선택] 권장 설계(확정 아님)와 남는 위험

### 7-1. 권장 설계 (확정 아님)

1. **A**: `qBack`에서 대기 증자 현금을 비운다. 규칙 문장: "내보내기 복원으로 과거 분기를 다시 만들면, 그때까지 결산을 기다리던 증자·자사주·출자 현금은 다시 만든 직전 분기 현금 안에 있는 것으로 본다. 첫 실제 분기의 증자·출자(자사주)는 복원 뒤 기록된 현금만 보여 준다."
2. **A1은 D2 결정에 따름.** Claude 의견: 같은 원인·같은 위치이고, 03A까지 세 장부 중 FIN-CF-01만 남기면 `qBack`의 규칙이 장부마다 달라진다. 그래서 함께 고치는 쪽이 낫다고 본다. 범위를 좁히려면 A만 하고 FIN-CF-01-SAVE-01을 따로 연다.
3. 표시: 숫자 표시 방식은 바꾸지 않는다. 각주 한 문장 보강은 D4.

### 7-2. 바뀔 위치 (구현하지 않음, 승인 뒤 작업 목록)

| 파일 | 위치 | 변경 |
|------|------|------|
| src/sim.js | `qBack` (293) | `delete c.isq;c.isd=S.day-720;` 뒤 `c.eqq=0;` (A1이면 `delete c.rlf;c.cfd=S.day-720;` 뒤 `c.ncq=0;`), 03A 주석처럼 이유 주석 |
| src/sim.js | 281 주석 | `qBack`이 대기 금액을 비운다는 문장 |
| tests/t_fincf02_issue.js | 16줄 머리 주석, 174·183·187줄 | 8-4절 (승인 뒤, 측정 근거와 함께) |
| tests/t_fincf01_relief.js | 357·361·362·364줄 (A1일 때) | 8-4절 |
| 새 테스트 | tests/t_fincf02_save01.js (가칭) | 8-2절 |
| docs/MODEL.md, CHANGELOG.md, VERIFY.md | MODEL.md:114 FIN-CF-02 항목("내보내기는 `eqq`·`isd`를 보존하며"), CHANGELOG·VERIFY 기록 | 내보내기 복원 때 대기 금액을 비운다는 설명으로 교체, 작업 기록 |

`v8prep`·`earn`·`kill`·`qPush`·`fqDerive`·`packS`는 바꾸지 않는다.

### 7-3. 남는 위험

| # | 위험 | 영향 | 처리 |
|---|------|------|------|
| R1 | 수정 전 빌드에서 내보내기를 복원하면 곧바로 일반 저장(`raider7`)이 쓰인다(2-3절). 그 저장을 수정 후 빌드가 열면 `qBack`이 돌지 않아 A가 작동하지 않는다. 그 회사의 다음 결산 1회는 중복이 남는다 | 회사당 1분기, 1회 | 저장 안에서 복원 전 X와 복원 뒤 Z를 가를 수 없어 고치지 않음(5-2 G). 문서에 기록 |
| R2 | 저장 전 거래 금액이 첫 실제 분기 어디에도 따로 보이지 않음 | 정보 손실 | 다시 만든 직전 행 안에 있음. 각주 보강은 D4 |
| R3 | 첫 실제 분기는 다시 만든 직전 행과 비교하므로 모든 줄이 근사다(기간 91~180일, 축소 계수). A 뒤에도 기타에 오차가 남는다(R0: −78.00, E1: −98.00) | 기존 문제 | 03A가 ◐로 표시. 범위 밖(03A R2 설계서 9-1 R2와 같음) |
| R4 | FIN-CF-01 같은 결함(6-2절) | A만 하면 남음 | D2 |
| R5 | 하향 왕복(수정 후 → 수정 전 빌드 → 다시 수정 후): 수정 전 빌드에서 내보내기 복원하면 그 빌드 동작대로 중복 | 옛 빌드 동작 | 감지 불가. 03A 설계서 R3와 같은 종류 |
| R6 | (검증 방법) 한 프로세스 안에서 세계를 잇달아 만들면 `S` 밖의 전역 값이 앞 세계에서 이어진다. 이번 조사 첫 비교에서 두 번째 세계만 첫날 가격 알림 자동 일시정지(`S.sp0`·`S.apc`·`S.apr`·`S.ff`)가 걸려 상태 해시가 달랐다(장부와 무관한 하네스 현상; Claude 작업 공간의 일회성 비교 스크립트로 확인, 저장소에는 넣지 않음) | 검증 오판 | 비교할 두 세계는 별도 프로세스에서, 같은 순서로 돌린다(8-5절, counterfactual.py) |

### 7-4. 결정이 필요한 사항

| # | 사항 | Claude 제안 |
|---|------|-----------|
| D1 | A안 채택 | 채택 |
| D2 | FIN-CF-01 같은 결함(A1)을 이번에 함께 | 함께 (아니면 FIN-CF-01-SAVE-01 등록) |
| D3 | 기존 테스트 기대값 변경 승인 범위 | 8-4절의 t_fincf02 3곳(+ A1이면 t_fincf01 4곳), 바꾸기 전 독립 측정값 제시 |
| D4 | 첫 실제 분기 각주에 "복원 전 같은 분기 증자·자사주·출자 현금은 직전 분기에 들어 있음" 문장 추가 | 선택. 넣는다면 03A ◐ 각주 끝에 한 문장 |
| D5 | R1(수정 전 빌드가 쓴 일반 저장)을 기록만 할지 | 기록만 |

---

## 8. 테스트 계획 (조사 7)

### 8-1. 원칙

- 새 테스트를 먼저 쓰고 main `d82f847`에서 결함 사례가 **실패**, 대조 사례가 **통과**하는 것을 확인한 뒤 고친다(FIN-CF-01·02·03A와 같은 순서).
- 정답은 문서 계산식이나 `fqDerive`에서 가져오지 않는다. 거래 현금은 실제 게임 함수 호출 직전·직후의 현금·부채 측정값, 복원 뒤 기록은 복원 뒤 거래를 직접 잰 값의 합이다. 기타·재무활동 기대값은 행 숫자와 측정값으로 따로 계산한다(`cffW = dD + R − ncA − dv + Z`, `othW = (q.cs − p.cs) − cfo + capex − cffW − maN − inN`; t_fincf02 `rowCheck`와 같은 식).
- 기존 테스트 기대값은 승인 뒤, 바꾸는 이유를 독립 측정값으로 보이고 바꾼다.

### 8-2. 결함 재현 테스트 (새 파일)

| # | 사례 | 기대(수정 뒤) | main `d82f847` |
|---|------|-------------|---------------|
| S1 | 증자 10% 후 내보내기·복원(R0 경로, 460.60) | 복원 직후 `eqq` 0. 첫 실제 분기 증자 0, 재무활동 = cffW(Z=0), 기타 = othW, 차입 증감 = dD + R − ncA, 현금 증감 = q.cs − p.cs(행 숫자로 계산), `est` 거짓 | 실패 |
| S2 | 자사주 5% (음수) | S1과 같음 | 실패 |
| S3 | 복원 전 X + 복원 10일 뒤 Z | 증자 = Z(측정), 재무·기타 = 독립 계산 | 실패 |
| S4 | 복원 당일 날이 지나기 전 Z | 증자 = Z | 실패 |
| S5 | 경계 a·c·d (하루 전, 결산 뒤 같은 날, 두 번 내보내기) | 증자 = 0 | 실패 |
| S6 | 경계 b·e (대기 없음) | 증자 0, 바뀌는 것 없음 | 통과 |
| S7 | 일반 저장 대조: 대기 X 그대로, 다음 분기 증자 = X, 재무·기타 독립 계산 일치 | 지금과 같음 | 통과 |
| S8 | 자연 실행 내보내기: 시드 20261016 540일(BABX 197.30), 시드 12345 555일(은행 BOAX 5.44, SHFN 10.91) | 대기가 있던 모든 회사의 첫 실제 분기 증자 = 복원 뒤 기록 | 실패 |
| S9 | 직접 세운 비상장사(`priv&&fo`)의 대기 출자 | `qBack`이 건드리지 않음: `eqq` 남음, 첫 행에 현금흐름 칸 없음 | 통과 |
| S10 | 내보내기 복원 직후 일반 저장 → 그 일반 저장 복원(수정 후 빌드끼리) | 증자 0 | 실패 |
| S11 | 0일째 내보내기 | 증자 0 | 실패 |
| S12 | 화면: 첫 실제 분기 증자 칸 `–`(또는 Z), 재무·기타 칸 = 수정 뒤 값에 ◐, `≈` 없음, 페이지에 NaN 없음 | — | 실패 |
| S13 | 03A 대기 인수 + 대기 증자 동시 | `acq` null(기존), `eqq` 0, 03A 칸은 main과 같음 | 실패(증자만) |
| S14 (A1) | 대출 회수 감면 대기 후 내보내기 | `ncq` 0, 첫 실제 분기 `nc` 0, 차입 증감 = dD | 실패 |
| S15 (A1) | 감면 대기 일반 저장 대조 | `nc` = R, 지금과 같음 | 통과 |

R1(수정 전 빌드가 쓴 일반 저장)은 "기록된 한계"로 정보 줄을 남기고 실패로 세지 않는다(t_fincf02 LG-ST와 같은 방식). 이를 위해 main `d82f847`에서 만든 일반 저장 픽스처를 쓴다(8-7절).

### 8-3. 회귀

- 전체 17개 테스트 파일(+ 새 파일)이 수정 뒤 모두 통과.
- t_fincf02의 저장·보존·사망 사례(SD, SV 일반 저장, RET, KILL, ABS, LG, LG-SD, LG-ST, NAT)와 03A·01 저장 사례가 그대로 통과.

### 8-4. 기존 테스트 기대값 변경 후보 (실행으로 예측)

`verify/fin-cf-02-save01/hook_tests.py`: 소스를 바꾸지 않고, 테스트를 조립할 때 게임 코드와 테스트 사이에 `qBack`을 감싸는 훅만 넣어 A·A1을 흉내 낸 실행 결과다.

결과(Claude 작업 공간에서 같은 훅 문자열·같은 게임 코드로 실행; 저장소 hook_tests.py 재실행 로그는 다음 커밋에서 부록 A-6~A-8로 추가): 훅 없음 17/17 통과. **A: 16/17 — t_fincf02_issue.js만 3건 실패. A1: 15/17 — t_fincf02_issue.js 3건 + t_fincf01_relief.js 4건 실패.** 나머지 파일(t_fincf03_acq.js, t_golden.js 포함)은 A·A1에서도 통과했다. 실패한 검사는 모두 "내보내기 복원 뒤 대기 금액이 다음 분기에 나온다"는 지금 동작을 기대값으로 둔 곳이다.

| 파일:줄 | 지금 기대 | A(A1) 뒤 결과 | 바꿀 기대 (승인 뒤) |
|--------|----------|-------------|------------------|
| t_fincf02_issue.js:174 (내보내기 형식에서만 실패) | 복원 뒤 `eqq ≈ m.real` (433.45) | `eqq` 0.00 | 내보내기는 `eqq === 0`, 일반 저장은 그대로 |
| t_fincf02_issue.js:183 | 다음 결산 `iss ≈ m.real` | 0.00 | `iss` = 복원 뒤 기록(이 사례 0), 재무활동·기타를 독립 계산(`rowCheck` 식)과 비교하는 검사 추가 |
| t_fincf02_issue.js:187 | 첫 결산이 확정한 기록(`isq1`)이 다음 내보내기에서 행과 함께 사라짐 | 확정 기록이 아예 없어(`isq1` undefined) 전제가 깨져 실패 | 확정 기록이 생기도록 복원 뒤 거래(Z)를 넣고 같은 검사 유지 |
| t_fincf01_relief.js:357 (A1, 내보내기만) | 복원 뒤 `ncq = R` (1,406.50) | `ncq` 0 | 내보내기는 `ncq === 0` |
| t_fincf01_relief.js:361 (A1) | 결산이 `rlf{d,R}` 확정, 행 `nc = R` | `rlf` 없음, `nc` 0 | 내보내기는 `rlf` 없음, `nc` 0 |
| t_fincf01_relief.js:362 (A1) | 행이 R을 넣은 SPEC과 같음 (cff 689, 기타 −1,299) | cff −718, 기타 108 | SPEC을 R = 0으로 |
| t_fincf01_relief.js:364 (A1) | 화면이 R을 넣은 SPEC과 같음 | ◐-718 / ◐108, 감면 줄 없음 | 화면 기대값을 R = 0으로 |

### 8-5. 게임 상태·난수 일치

- main과 수정 브랜치를 같은 시드로 나란히 돌려 기록 전용 필드(`eqq`·`isq`·`isd`, A1이면 `ncq`·`rlf`·`cfd`)를 뺀 게임 상태 전체 해시를 **매일** 비교한다. 사례: 자연 실행 3시드×720일, 이번 문서의 내보내기 사례(플레이어 증자·자사주, 자연 실행 3개 시점, 대출 회수 감면), 03A 검증의 9개 사례.
- 각 사례 끝에서 게임 자체 난수 `_R`과 날짜별 난수 `wR(k)`의 다음 값을 비교한다. 참고: 게임은 새 게임과 진행 중에 `Math.random`을 쓰지 않는다(probes.js [P1]). 그래서 기존 FIN-CF-02·03A 검증 스크립트의 "끝난 뒤 `Math.random()` 3개 비교"로는 게임 난수 위치를 확인할 수 없다(브랜치가 `Math.random`을 새로 쓰는 경우만 잡는다). 그 검증의 결론은 매일 비교한 게임 상태 전체 해시로 뒷받침되므로 결론은 바뀌지 않는다. 이번 검증에서는 `_R`을 비교한다.
- 세계마다 별도 프로세스(7-3 R6).
- 이번 조사에서 같은 방식의 대조 실험을 이미 돌렸다(작업 공간 실행: A·A1 모두 2,166줄 동일; 부록 A-5는 다음 커밋).

### 8-6. 변이 검사 (각 변이는 새 테스트에서 실패해야 함)

| # | 변이 | 잡아야 할 테스트 |
|---|------|---------------|
| M1 | 추가한 `c.eqq=0` 제거 | S1–S5, S8, S10–S13 |
| M2 | `c.eqq=0`을 `priv&&fo` 반환 앞으로 옮김 | S9 |
| M3 | `qBack` 대신 `packS(1)`에서 비움(안 D) | S1(복원 경로 픽스처: main에서 만든 내보내기 코드) |
| M4 | 복원 뒤 거래까지 지우는 구현(예: 복원 뒤 첫 결산에서 `isq[q.d]` 확정을 건너뜀) | S3, S4 |
| M5 | `c.eqq=0`을 `v8prep`에 넣음(일반 저장 복원에도, 게임 중 30일마다도 적용) | S7 (그리고 기존 t_fincf02 대부분) |
| M6 (A1) | `c.ncq=0` 제거 / `v8prep`에 넣음 | S14 / S15 |

### 8-7. 옛 저장 픽스처

- main `d82f847`에서 만든 내보내기 코드(대기 증자 있음): 수정 후 빌드에서 복원 → 증자 0 (A가 이미 만든 코드를 고친다는 증거; M3를 잡음).
- main `d82f847`에서 내보내기 복원 직후 쓴 일반 저장(대기 X 포함): R1 기록용.
- 두 픽스처 모두 게임 상태뿐이고 개인정보·비밀정보가 없는지 확인한 뒤 tests/fixtures/에 넣는다(t12_sim.js의 save8.json과 같은 절차).

---

## 9. 재현 절차, 기준 SHA, 브랜치 상태

### 9-1. 재현 절차

스크립트(이 브랜치의 `verify/fin-cf-02-save01/`, 게임 소스는 main `d82f847`과 같음):

```
python3 verify/fin-cf-02-save01/run.py verify/fin-cf-02-save01/trace.js       # 실제 호출 순서(한 회사)
python3 verify/fin-cf-02-save01/run.py verify/fin-cf-02-save01/repro.js       # R0(460.60), E1–E9
python3 verify/fin-cf-02-save01/run.py verify/fin-cf-02-save01/boundary.js    # E10–E14
python3 verify/fin-cf-02-save01/run.py verify/fin-cf-02-save01/natural.js     # 자연 실행 대기 금액과 호출 위치
python3 verify/fin-cf-02-save01/run.py verify/fin-cf-02-save01/probes.js      # 난수 사용, 저장 크기
python3 verify/fin-cf-02-save01/counterfactual.py                             # A·A1 대조(별도 프로세스 3개)
python3 verify/fin-cf-02-save01/hook_tests.py none|A|A1                       # 기존 17개 테스트에 A·A1을 훅으로 흉내
```

`run.py`는 `build/build.py`와 같은 방식으로 src에서 게임을 메모리에 조립한다(src·dist에 쓰지 않음). 결과는 시드가 고정이라 같은 코드에서 같게 나온다.

게임 안에서(사람이 확인할 때): 회사를 지배 → 그 회사 결산 직후 같은 분기에 유상증자(또는 자사주 매입) → 저장 화면에서 코드 복사(또는 클라우드·파일 저장) → 붙여넣기(또는 클라우드·파일 불러오기)로 복원 → 그 회사 다음 결산까지 진행 → 회사 화면 현금흐름 탭 최신 분기: 증자·출자(자사주)에 저장 전 거래 금액이 표시 없이 나오고, 재무활동에 ◐와 함께 그만큼 더해지고, 기타·투자 매매가 그만큼 음수 쪽으로 간다.

### 9-2. 기준 SHA와 브랜치

| 항목 | 값 |
|------|----|
| 기준 main | `d82f84764fdf242de4956ed9d53521a479cc80a9` (원격 `origin/main`과 같음을 작업 시작·커밋 전 `git ls-remote`로 확인) |
| 게임 소스 | main `d82f847` = `d9600e9` (src 차이 0줄), 조립한 game.js sha256 앞자리 `6930de85162a9dbf` |
| 작업 브랜치 | `fin-cf-02-save01-design` (main `d82f847`에서 생성, 문서·조사 스크립트 전용 커밋: 이 문서와 스크립트 커밋, 이어서 재실행 로그를 더하는 커밋) |
| 바뀐 파일 | `docs/FIN-CF-02-SAVE-01-DESIGN.md`(새 파일), `verify/fin-cf-02-save01/`(새 폴더: 스크립트 9개와 실행 로그 — 이 커밋 5개, 다음 커밋에서 4개 추가) |
| 바꾸지 않은 것 | `src/`, `tests/`, `build/`, `index.html`, 기존 `docs/` 파일 |
| main 병합·배포 | 하지 않음. 이 브랜치의 병합 여부는 GPT-6 검토와 사용자 결정에 따름 |

---

## 부록 A. 실행 출력 원문

모두 Claude가 이 브랜치의 스크립트로 main `d82f847` 게임 코드(조립한 game.js sha256 앞자리 `6930de85162a9dbf`)에서 실행한 출력이다. 같은 내용이 `verify/fin-cf-02-save01/*_d82f847_2026-10-24.log`에 있다. GPT-6가 실행한 결과가 아니다.

### A-0. trace.js (실제 호출 순서, R0 사례의 PNPL)

`verify/fin-cf-02-save01/trace_d82f847_2026-10-24.log`

```
game sha256 6930de85162a9dbf | trace.js
[T] PNPL: last close 117; trade, export (packS(1)), restore (loadStr + v8fix as the paste path does), first real close, statement
   1 day 122: eqCash(PNPL, 460.60)  [eqq 0.00, isq undefined, isd -720, rows 8 (last 117)] -> [eqq 460.60, isq undefined, isd -720, rows 8 (last 117)]
   2 day 127: packS(1): PNPL [eqq 460.60, isq undefined, isd -720, rows 8 (last 117)] written to the export text (fq left out)
   3 day 127: loadStr -> migrate: PNPL [eqq 460.60, isq undefined, isd -720, rows none]
   4 day 127: v8fix() start
   5 day 127:   v8prep(PNPL)  [eqq 460.60, isq undefined, isd -720, rows none] -> [eqq 460.60, isq undefined, isd -720, rows none]  (sets eqq / isd only when missing)
   6 day 127:   v11prep() start: no S.IX -> full rebuild (coPrep, then bfill)
   7 day 127:     bfill() start
   8 day 127:       qBack(PNPL)  [eqq 460.60, isq undefined, isd -720, rows 0] -> [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)]
   9 day 127:     bfill() end
  10 day 127:   v11prep() end
  11 day 127: v8fix() end
  12 day 127: after the restore: PNPL [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)]
  13 day 150:   v8prep(PNPL)  [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)] -> [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)]  (sets eqq / isd only when missing)
  14 day 180:   v8prep(PNPL)  [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)] -> [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)]  (sets eqq / isd only when missing)
  15 day 207: earn(PNPL) close  [eqq 460.60, isq undefined, isd -593, rows 8 (last 37)] -> [eqq 0.00, isq {"207":460.5987288938939}, isd -593, rows 8 (last 207)]
  16 day 207: fqDerive(PNPL, row 207, previous 37): led true (prev.d 37 > isd -593), dsh false (3602 -> 3602), iss 460.60, est false, cff 534.60, oth -538.60, dc 64.00
```

### A-1. repro.js (R0, E1–E9)

`verify/fin-cf-02-save01/repro_d82f847_2026-10-24.log`

```
game sha256 6930de85162a9dbf | repro.js

[R0] the reported case: seed 20261016, issue 5 days after the close, export 10 days after the close, next close
  current, export code (packS(1) -> loadStr): PNPL last close 117, issue day 122 cash 460.60 | restore day 127: eqq 460.60, isd -593, cash 1001.58, shares 3601.95 | last rebuilt row 37: cash 965.00 (= 1001.58 x 0.9635, rounded), shares 3602.00 | after the close isq {"207":460.5987288938939}
  current, export code (packS(1) -> loadStr): row 207 vs previous 37 | 증자·출자 460.60 | 차입 증감 115.00 | 재무활동 534.60 | 기타·투자 매매 -538.60 | 현금 증감 64.00 | 영업 269.94 | est false | st part | nc 0.00
  current, JSON strip emulation (used by the earlier report): PNPL last close 117, issue day 122 cash 460.60 | restore day 127: eqq 460.60, isd -593, cash 1001.58, shares 3601.95 | last rebuilt row 37: cash 965.00 (= 1001.58 x 0.9635, rounded), shares 3602.00 | after the close isq {"207":460.5987288938939}
  current, JSON strip emulation (used by the earlier report): row 207 vs previous 37 | 증자·출자 460.60 | 차입 증감 115.00 | 재무활동 534.60 | 기타·투자 매매 -538.60 | 현금 증감 64.00 | 영업 269.94 | est false | st part | nc 0.00
  A: PNPL last close 117, issue day 122 cash 460.60 | restore day 127: eqq 460.60, isd -593, cash 1001.58, shares 3601.95 | last rebuilt row 37: cash 965.00 (= 1001.58 x 0.9635, rounded), shares 3602.00 | after the close isq undefined
  A: row 207 vs previous 37 | 증자·출자 0.00 | 차입 증감 115.00 | 재무활동 74.00 | 기타·투자 매매 -78.00 | 현금 증감 64.00 | 영업 269.94 | est false | st part | nc 0.00

[E1] share issue mid-quarter -> export -> restore the same day -> first real close (current vs A in the same world)
  PNPL: last close day 117; issue on day 147: cash +433.45 (measured), eqq 433.45, shares 3601.95; export and restore on day 147
  after restore: eqq 433.45, isq undefined, isd -573 (= 147 - 720); 8 rebuilt rows, the last one day 57: cash 931.00 = today's cash 974.44 x scale 0.9554 (rounded), shares 3602.00 = today's 3601.95 (already after the issue)
  current: row 207 vs previous 57 | 증자·출자 433.45 | 차입 증감 141.00 | 재무활동 534.45 | 기타·투자 매매 -531.45 | 현금 증감 71.00 | 영업 269.94 | est false | st part | nc 0.00
    share-issue cash recorded on PNPL after the restore (eqCash calls): 0.00
  A: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 141.00 | 재무활동 101.00 | 기타·투자 매매 -98.00 | 현금 증감 71.00 | 영업 269.94 | est false | st part | nc 0.00
    share-issue cash recorded on PNPL after the restore (eqCash calls): 0.00
  difference current - A: 증자 433.45 | 재무활동 433.45 | 기타 -433.45 | 현금 증감 0.00 | 차입 증감 0.00 | issue cash 433.45

[E2] control: the same issue with a full save (packS(), quarter rows kept, qBack does not run)
  after restore: eqq 433.45, isd -720, rows kept 8, last row day 117 (the real close 117, before the issue)
  full save: row 207 vs previous 117 | 증자·출자 433.45 | 차입 증감 0.00 | 재무활동 393.45 | 기타·투자 매매 -0.45 | 현금 증감 461.00 | 영업 269.94 | est false | st full | nc 0.00
  with the measured issue cash 433.45: 재무활동 should be 393.45, 기타 -0.45 -> statement MATCHES (the issue lies between two real closes)

[E3] buyback 5% mid-quarter -> export -> restore (the pending cash is negative)
  buyback cash -312.52 (measured), eqq after restore -312.52
  current: row 207 vs previous 57 | 증자·출자 -312.52 | 차입 증감 141.00 | 재무활동 -231.52 | 기타·투자 매매 478.52 | 현금 증감 381.00 | 영업 335.94 | est false | st part | nc 0.00
  A: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 141.00 | 재무활동 81.00 | 기타·투자 매매 166.00 | 현금 증감 381.00 | 영업 335.94 | est false | st part | nc 0.00
  difference current - A: 증자 -312.52 | 기타 312.52 | 현금 증감 0.00

[E4] issue X before the export AND issue Z 10 days after the restore, same quarter
  X 463.80, Z 453.66 (both measured)
  current: row 207 vs previous 47 | 증자·출자 917.45 | 차입 증감 27.00 | 재무활동 902.45 | 기타·투자 매매 -482.45 | 현금 증감 493.00 | 영업 274.94 | est false | st part | nc 0.00
  A: row 207 vs previous 47 | 증자·출자 453.66 | 차입 증감 27.00 | 재무활동 438.66 | 기타·투자 매매 -18.66 | 현금 증감 493.00 | 영업 274.94 | est false | st part | nc 0.00
  cash of the quarter that is NOT in the rebuilt starting cash = Z 453.66: current shows 917.45, A 453.66

[E5] boundaries (export -> restore -> first real close). "misplaced" = 증자 shown - cash recorded after the restore
  (a) issue, export one day before the close: pending at export 453.38 (export day 206) | first real row 207 vs rebuilt 116 (restore day 206) | current: 증자 453.38, 기타 -610.38, misplaced 453.38 | A: 증자 0.00, 기타 -157.00, misplaced 0.00
  (b) export on the close day right after the close, no trade: pending at export 0.00 (export day 207) | first real row 297 vs rebuilt 117 (restore day 207) | current: 증자 0.00, 기타 29.00, misplaced 0.00 | A: 증자 0.00, 기타 29.00, misplaced 0.00
  (c) close, then an issue the same day after the close, then export: pending at export 454.92 (export day 207) | first real row 297 vs rebuilt 117 (restore day 207) | current: 증자 454.92, 기타 -429.92, misplaced 454.92 | A: 증자 0.00, 기타 25.00, misplaced 0.00
  (d) issue, then export twice (restore, export again) before any close: pending at export 463.80 (export day 137) | first real row 207 vs rebuilt 47 (restore day 137) | current: 증자 463.80, 기타 -464.80, misplaced 463.80 | A: 증자 0.00, 기타 -1.00, misplaced 0.00
  (e) issue, the close confirms it, then export: pending at export 0.00 (export day 207) | first real row 297 vs rebuilt 117 (restore day 207) | current: 증자 0.00, 기타 24.00, misplaced 0.00 | A: 증자 0.00, 기타 24.00, misplaced 0.00

[E6] natural play (no player action), export on day 540 of seed 20261016 and day 555 of seed 12345: every company with a pending eqq, at its first real close
  seed 20261016 current: export on day 540, 1 company with a pending eqq
    BABX: pending at export 197.30 | row 571: 증자 197.30, 기타 -218.30 | recorded after the restore 0.00 | misplaced 197.30
  seed 20261016 A: export on day 540, 1 company with a pending eqq
    BABX: pending at export 197.30 | row 571: 증자 0.00, 기타 -21.00 | recorded after the restore 0.00 | misplaced 0.00
  seed 12345 current: export on day 555, 2 companies with a pending eqq
    BOAX (financial kd1): pending at export 5.44 | row 584: 증자 5.44, 기타 -92.44 | recorded after the restore 0.00 | misplaced 5.44
    SHFN (financial kd1): pending at export 10.91 | row 616: 증자 10.91, 기타 -47.01 | recorded after the restore 0.00 | misplaced 10.91
  seed 12345 A: export on day 555, 2 companies with a pending eqq
    BOAX (financial kd1): pending at export 5.44 | row 584: 증자 0.00, 기타 -87.00 | recorded after the restore 0.00 | misplaced 0.00
    SHFN (financial kd1): pending at export 10.91 | row 616: 증자 0.00, 기타 -36.10 | recorded after the restore 0.00 | misplaced 0.00

[E7] FIN-CF-01 relief waiting for its close (ncq) through an export. ch11 outside earn(): only callLoan does this in the game
  (a) ch11() called directly after an asset write-down (synthetic)
    PNPL: chapter 11 (bk 1), relief R waiting 945.75 -> after the export restore ncq 945.75
    current: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 244.75 | 재무활동 244.75 | 기타·투자 매매 -856.75 | 현금 증감 -642.00 | 영업 15.28 | est false | st part | nc 945.75
    ncq set to 0 after the restore: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 -701.00 | 재무활동 -701.00 | 기타·투자 매매 89.00 | 현금 증감 -642.00 | 영업 15.28 | est false | st part | nc 0.00
    full save: row 207 vs previous 117 | 증자·출자 0.00 | 차입 증감 -799.25 | 재무활동 -799.25 | 기타·투자 매매 379.25 | 현금 증감 -450.00 | 영업 15.28 | est false | st full | nc 945.75
    current - ncq 0: 차입 증감 945.75 | 기타 -945.75 | 현금 증감 0.00
  (b) the real loan-call path: callLoan(bank, company, 1) after a write-down (as test F2b)
    PNPL: chapter 11 (bk 1), relief R waiting 1786.57 -> after the export restore ncq 1786.57
    current: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 1719.57 | 재무활동 1719.57 | 기타·투자 매매 -1755.27 | 현금 증감 -43.00 | 영업 8.50 | est false | st part | nc 1786.57
    ncq set to 0 after the restore: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 -67.00 | 재무활동 -67.00 | 기타·투자 매매 31.30 | 현금 증감 -43.00 | 영업 8.50 | est false | st part | nc 0.00
    full save: row 207 vs previous 117 | 증자·출자 0.00 | 차입 증감 -881.43 | 재무활동 -881.43 | 기타·투자 매매 379.73 | 현금 증감 -509.00 | 영업 8.50 | est false | st full | nc 1786.57
    current - ncq 0: 차입 증감 1786.57 | 기타 -1786.57 | 현금 증감 0.00

[E8] FIN-CF-03A acquisition waiting for its close (acq) through an export (qBack already drops it)
  PNPL absorbed SNWF: pending aD at export 1117.80 -> after restore acq null, acd 147 (restore day 147), eqq 0.00
  03A: row 207 vs previous 57 | 증자·출자 0.00 | 차입 증감 61.00 | 재무활동 10.00 | 기타·투자 매매 -53.00 | 현금 증감 42.00 | 영업 348.52 | est false | st part | nc 0.00
  row state part, ncA 0.00

[E9] founded private company (c.priv && c.fo: qBack returns at once) with a pending cash contribution through an export
  founded MVGZ: priv 1, fo 1
  contribution 50.00, pending 50.00 -> after restore eqq 50.00, rows 0 (not rebuilt)
  first close after restore: 1 row(s); the first row has no previous row, so it has no cash-flow column (isq {"255":50})
  second close: row 345 vs previous 255 | 증자·출자 0.00 | 차입 증감 0.00 | 재무활동 0.00 | 기타·투자 매매 0.30 | 현금 증감 2.00 | 영업 10.84 | est false | st full | nc 0.00

done
```

### A-2. boundary.js (E10–E14)

`verify/fin-cf-02-save01/boundary_d82f847_2026-10-24.log`

```
game sha256 6930de85162a9dbf | boundary.js

[E10] issue X before the export, then issue Z on the restore day right after the restore (no day passes)
  X 433.45 before the export, Z 462.49 on restore day 147
  current: row 207 vs 57 | 증자·출자 895.95 | 재무활동 994.95 | 기타 -530.95 | 현금 증감 537.00 | est false | st part
  A: row 207 vs 57 | 증자·출자 462.49 | 재무활동 561.49 | 기타 -97.49 | 현금 증감 537.00 | est false | st part

[E11] autosave chain: export restore -> the game writes a FULL save at once (paste / cloud / file load call save()) -> that full save is restored
  current: eqq in the full save 433.45 (X 433.45); restored from the full save: the rebuilt rows are kept, qBack does not run
  current: row 207 vs 57 | 증자·출자 433.45 | 재무활동 534.45 | 기타 -531.45 | 현금 증감 71.00 | est false | st part
  A at the export restore: eqq in the full save 0.00 (X 433.45); restored from the full save: the rebuilt rows are kept, qBack does not run
  A at the export restore: row 207 vs 57 | 증자·출자 0.00 | 재무활동 101.00 | 기타 -98.00 | 현금 증감 71.00 | est false | st part
  -> a full save written by a build WITHOUT the fix after an export restore keeps X; a fixed build loading it cannot clear it (no qBack on a full restore)

[E12] option C: move the ledger start of a rebuilt company to the restore day (isd = load day instead of load day - 720)
  isd = load day: row 207 vs 57 | 증자·출자 433.45 | 재무활동 534.45 | 기타 -531.45 | 현금 증감 71.00 | est false | st part
  rebuilt rows shown as estimates: 0; previous row 57 < isd 147: led false, share count unchanged (dsh false) -> the rule still takes the ledger amount (X 433.45)

[E13] the tab cells of the first real row after the export restore (newest column)
  current: 증자·출자(자사주) "433" | 차입 증감 "◐141" | 재무활동 "◐534" | 기타 "◐-531" | 현금 증감 "71.0" | page clean true
    ◐ footnote: ※ ◐ 부분 기록 분기(27.3Q): 인수·자회사 흡수·LBO·숨은 부채 기록은 저장 데이터를 불러온 2027년 5월 28일부터예요. 그 전 같은 분기에 있었던 거래는 기록이 없어 차입 증감·기타·투자 매매에 섞여 있을 수 있어요. 기록된 거래는 반영했어요. | ≈ footnote: none
  A: 증자·출자(자사주) "–" | 차입 증감 "◐141" | 재무활동 "◐101" | 기타 "◐-98.0" | 현금 증감 "71.0" | page clean true
    ◐ footnote: ※ ◐ 부분 기록 분기(27.3Q): 인수·자회사 흡수·LBO·숨은 부채 기록은 저장 데이터를 불러온 2027년 5월 28일부터예요. 그 전 같은 분기에 있었던 거래는 기록이 없어 차입 증감·기타·투자 매매에 섞여 있을 수 있어요. 기록된 거래는 반영했어요. | ≈ footnote: none

[E14] day-0 export: a share issue on day 0 (before any day passes), export, restore on day 0 (qBack keeps acd on day 0)
  current: X 401.54, eqq after restore 401.54, isd -720, acd -721
  current: row 27 vs -90 | 증자·출자 401.54 | 재무활동 353.54 | 기타 -399.54 | 현금 증감 40.00 | est false | st full
  A: X 401.54, eqq after restore 401.54, isd -720, acd -721
  A: row 27 vs -90 | 증자·출자 0.00 | 재무활동 -48.00 | 기타 2.00 | 현금 증감 40.00 | est false | st full
```

### A-3. natural.js (자연 실행 3시드×720일)

`verify/fin-cf-02-save01/natural_d82f847_2026-10-24.log`

```
game sha256 6930de85162a9dbf | natural.js
seed 20261016: 720 days | days on which >=1 live company holds a pending eqq: 145 (company-days 145) | days with a pending ncq: 0 | eqCash calls 2
   eqCash from go src/ui2.js:674: 1 call(s), total -251.18 (e.g. NTRX day 208 -251.18)
   eqCash from go src/ui2.js:691: 1 call(s), total 197.30 (e.g. BABX day 515 197.30)
   ch11 calls: none
seed 777: 720 days | days on which >=1 live company holds a pending eqq: 0 (company-days 0) | days with a pending ncq: 0 | eqCash calls 0
   ch11 calls: none
seed 12345: 720 days | days on which >=1 live company holds a pending eqq: 211 (company-days 269) | days with a pending ncq: 0 | eqCash calls 6
   eqCash from bankQ src/ui2.js:593 (financial company): 5 call(s), total 40.03 (e.g. BOAX day 450 14.56; BOAX day 540 5.44; SHFN day 540 10.91)
   eqCash from go src/ui2.js:688 (financial company): 1 call(s), total -2.70 (e.g. AXAX day 661 -2.70)
   ch11 calls: earn src/sim.js:30 "자본잠식" x1
```

### A-4. probes.js (난수 사용, 저장 크기)

`verify/fin-cf-02-save01/probes_d82f847_2026-10-24.log`

```
game sha256 6930de85162a9dbf | probes.js
[P1] Math.random calls: during init 0, during 200 days of play 0
[P2] draws from the game stream during v8fix: export restore 474413 (bfill and qBack rebuild histories), full restore 0 | export code 291197 chars, full save 827141 chars (day 200)
[P3] day 200: export JSON 764767 chars, with fq kept 1077065 (+40.8%) | deflate+base64 291176 -> 442512 (+52.0%) | the real export code 291197 chars
[P3] day 720: export JSON 795706 chars, with fq kept 1119429 (+40.7%) | deflate+base64 306596 -> 457672 (+49.3%) | the real export code 306617 chars
```

### A-5. counterfactual.py (A·A1 대조, 별도 프로세스)

`verify/fin-cf-02-save01/counterfactual_d82f847_2026-10-24.log`

```
(저장소 스크립트로 재실행 중 — 다음 커밋에서 추가)
```

### A-6. hook_tests.py none (훅 없음)

`verify/fin-cf-02-save01/hook_tests_none_d82f847_2026-10-24.log`

```
(저장소 스크립트로 재실행 중 — 다음 커밋에서 추가)
```

### A-7. hook_tests.py A

`verify/fin-cf-02-save01/hook_tests_A_d82f847_2026-10-24.log`

```
(저장소 스크립트로 재실행 중 — 다음 커밋에서 추가)
```

### A-8. hook_tests.py A1

`verify/fin-cf-02-save01/hook_tests_A1_d82f847_2026-10-24.log`

```
(저장소 스크립트로 재실행 중 — 다음 커밋에서 추가)
```
