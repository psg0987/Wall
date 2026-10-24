# RT-FIN-CF-03A-DESIGN-R1 보완 설계서

- 작업 ID: RT-FIN-CF-03A-DESIGN-R1
- 원본: RT-FIN-CF-03A-DESIGN
- 작성: Claude Opus 4.6
- 기준 커밋: main `d553d3e`
- 선행: GPT-6 개발 전략실 설계 검토 (조건부 승인 / 실제 코드 구현 미승인)
- 상태: 설계 보완판 — 코드 수정·테스트 파일 작성·커밋·병합·배포 금지

---

## 목차

1. [기존 설계서 전문 (원문 그대로)](#1-기존-설계서-전문)
2. [R1-1: 보고 주체 분석 및 G.liq 내부 흡수 정책](#r1-1)
3. [R1-2: LBO 세부 분류 — 단계별 현금·부채·지분 추적](#r1-2)
4. [R1-3: 호출처별 absorb(a,t,paidVal,cashPaid) 검증표](#r1-3)
5. [R1-4: 최종 장부 필드 명세](#r1-4)
6. [R1-5: 계산식과 테스트 합격 기준](#r1-5)
7. [R1-6: GPT 판단이 필요한 사항](#r1-6)

---

## 1. 기존 설계서 전문

> 아래는 RT-FIN-CF-03A-DESIGN.md 원문 전체를 그대로 수록한다.
> R1에서 수정·보완하는 부분은 별도 절(R1-1 ~ R1-6)에 기술하며, 원문은 변경하지 않는다.

---

### [원문 시작] RT-FIN-CF-03A 설계서

- 작업 ID: RT-FIN-CF-03A-DESIGN
- 작성: Claude Opus 4.6
- 기준 커밋: main `d553d3e`
- 선행 자료: RT-FIN-CF-03-AUDIT, RT-FIN-CF-03-POLICY, RT-FIN-CF-03-CASES
- 상태: 설계 전용 — 코드 수정·테스트 파일 작성·커밋·병합·배포 금지

---

#### 0. 요약

현행 현금흐름표의 **차입 증감**(= `dD + nc`)은 실제 현금 차입뿐 아니라 비현금 부채 변동까지 포함하고 있어, 인수·합병·LBO·금융성장 분기에 수천억 규모의 왜곡이 발생한다. 본 설계는:

1. 비현금 부채 변동을 유형별로 추적하는 장부(ledger)를 추가한다.
2. 기업 인수 순현금(인수대금 − 피인수기업 현금)을 별도 행으로 분리한다.
3. 기존 FIN-CF-01(법정관리)·FIN-CF-02(증자·출자) 장부를 손상시키지 않는다.
4. 게임 경제(현금·부채·주식·난수)를 변경하지 않는다.

Natural play 3개 시드 × 720일 실행 기준:
- AI 인수 33건, 비현금 승계부채 합계 17,871억
- 금융사 매 분기 gr 합계 13,150억 (차입 증감의 중앙값 100%가 gr)
- 현행 차입 증감에서 비현금분을 빼면, 기타·투자 매매에서 인수 순현금이 자연 분리됨

---

#### A. 거래별 현금·부채 이동 테이블

##### A-1. 인수·합병 계열 (absorb 경유)

| 경로 | 함수 | 파일:줄 | 인수자 현금 변화 | 인수자 부채 변화 | 비현금 부채 | 비고 |
|------|------|---------|-----------------|-----------------|------------|------|
| AI 자동인수 | `maTick` | sim.js:48-51 | `−pay`, overflow 가능 | overflow분 + `t.D` | `t.D` (승계) | pay = mc(t)×1.3×(100−보유%)÷100 |
| 주식합병 | `G.merge` | act2.js:24-34 | 없음 (주식교환) | `t.D` | `t.D` (승계) | 인수자 현금 불변, 현금 대금 0 |
| 인수 제안 수락 | offer event | ui2.js:676-680 | `−P×(100−보유%)÷100`, overflow 가능 | overflow분 + `t.D` | `t.D` (승계) | 피인수 현금 t.cs도 편입 |
| 자회사 흡수 | `G.liq` | act2.js:48-50 | 없음 (intra-group) | `t.D` | `t.D` (승계) | paidVal = −hv(c,100), 현금 미지급 |

모든 경우 `absorb(a,t,paidVal)`이 `a.cs += t.cs`, `a.D += t.D`를 실행한다. overflow(`cs<0 → D−=cs; cs=0`)는 실제 현금 차입이다.

##### A-2. LBO (타겟 기준)

| 경로 | 함수 | 파일:줄 | 타겟 현금 변화 | 타겟 부채 변화 | 비현금 부채 | 비고 |
|------|------|---------|---------------|---------------|------------|------|
| LBO 성공 | `G.tender` | act2.js:39 | 0 | `+P×0.7` | `P×0.7` 전액 | 인수자는 ePay로 30% 현금 지급 |

LBO 부채는 **타겟** 장부에 기록된다. 인수자의 30% 현금 지급은 인수자의 투자활동(기타·투자)에 남는다.

##### A-3. 금융사 성장 (earn 내)

| 경로 | 함수 | 파일:줄 | 현금 변화 | 부채 변화 | 비현금 부채 | 비고 |
|------|------|---------|----------|----------|------------|------|
| kd 분기성장 | `earn` | sim.js:25 | 0 | `+gr` | `gr` 전액 | gr = A×g/4, 예금/보험부채 증가 |
| 비kd 분기성장 | `earn` | sim.js:25 | `−gr` or `−gr×0.9` | 0 (overflow만) | 없음 | 비금융은 현금투자 |

##### A-4. 숨은 부채 (hqQ)

| 경로 | 함수 | 파일:줄 | 현금 변화 | 부채 변화 | 비현금 부채 | 비고 |
|------|------|---------|----------|----------|------------|------|
| 숨은 부채 발각 | `hqQ` | ui2.js:735 | 0 | `+A×0.1` | `A×0.1` 전액 | 시한폭탄, 드묾 |
| 소송 폭탄 | `hqQ` | ui2.js:735 | `−A×0.05` | overflow분 | 없음 (현금 지출) | overflow는 실제 차입 |

##### A-5. 기존 처리 완료 항목 (변경 불필요)

| 경로 | 처리 | 비고 |
|------|------|------|
| 법정관리 부채 감면 (ch11x) | FIN-CF-01: `ncq → rlf` | 이미 차입에서 분리됨 |
| 증자·출자·자사주 (iss/bb/pp 등) | FIN-CF-02: `eqq → isq` | 이미 분리됨 |
| 회사채 발행/상환 (bissue/bcall) | 실제 현금 | 차입 증감에 정확히 반영 |
| 개인대여금 (advP/advR) | 실제 현금 | 차입 증감에 정확히 반영 |
| 특별배당용 차입 (G.mg 'xd') | 실제 현금 | D↑, 배당 지급, 올바른 cff |
| 초기 교차출자 (init) | 게임 시작 | 분기 이전, fq 없음 |

##### A-6. 감사 수치 요약 (main e161f6d, 스크립트 실행)

| 케이스 | 비현금 부채 | 현행 차입 증감 | 보정 후 차입 증감 | 인수 순현금 |
|--------|------------|---------------|------------------|------------|
| K1 주식합병 | 1,117.80 | 1,118.00 | 0.20 | +103.03 |
| K2 offer(현금) | 2,149.48 | 3,511.00 | 1,361.52 | −1,959.23 |
| K3 maTick | 73.14 | 73.00 | −0.14 | −191.17 |
| K4 LBO(타겟) | 5,054.55 | 5,055.00 | 0.45 | 없음(타겟) |
| K5 G.liq(모회사) | 653.44 | 654.00 | 0.56 | +74.92 |
| K6 은행 gr | 49.00 | 49.00 | 0.00 | — |
| K6 보험 gr | 28.00 | 28.00 | 0.00 | — |
| K10 은행합병 | 1,360.95 | 1,361.00 | 0.05 | +109.71 |
| K12 숨은 부채 | 668.03 | — | — | — |

---

#### B. 비현금 부채 장부 설계

##### B-1. 설계 원칙

FIN-CF-01/02와 동일한 **pending → confirmed** 패턴을 따른다:
1. 이벤트 발생 시 pending 필드에 누적한다.
2. `earn()` 분기 마감 시 confirmed 구조체로 옮긴다.
3. `fqDerive()`가 confirmed 값을 읽어 차입 증감을 보정한다.
4. `kill()` 시 pending/confirmed를 정리한다.

##### B-2. 새 필드 정의

총 6개 새 필드 + 1개 장부 시작일:

```
// ── 인수 비현금 부채 + 인수 순현금 ──
c.maDq = 0           // pending: 분기 중 absorb로 승계한 비현금 부채 누적 (t.D의 합)
c.maNetQ = 0         // pending: 분기 중 인수 순현금 누적 (t.cs − cashPaid의 합)
c.maR = null          // confirmed: { d: closeDay, D: nonCashDebt, net: netCash }
                      //   D > 0 = 비현금 부채 증가, net > 0 = 현금 유입

// ── LBO 푸시다운 부채 (타겟 기준) ──
c.lboq = 0           // pending: G.tender LBO에서 받은 P×0.7 누적
c.lboR = null         // confirmed: { d: closeDay, D: pushDownDebt }

// ── 숨은 부채 (hqQ) ──
c.hdq = 0            // pending: 숨은 부채 발각 시 A×0.1 누적
c.hdR = null          // confirmed: { d: closeDay, D: hiddenDebt }

// ── 장부 시작일 (통합) ──
c.mad = S.day         // 장부 시작일. fqDerive에서 prev.d > c.mad일 때만 장부값 사용
```

##### B-3. 금융 성장(gr) — 새 필드 불필요

금융사의 gr은 분기 레코드 slot 12에 이미 기록돼 있다. `fqDerive`에서 `c.kd`가 참이면 `q.gr`을 비현금 부채로 직접 사용한다. 별도 pending/confirmed 불필요.

**알려진 한계**: absorb 직후 `a.kd = t.kd`로 업종이 변경되면, 변경 전 분기의 gr 보정이 현재 `c.kd`로 판단된다. 은행→비은행 전환 시 과거 분기의 gr이 보정에서 빠지거나, 반대로 비은행→은행 전환 시 과거 분기에 잘못된 보정이 적용될 수 있다. 이 경우는 극히 드물고(absorb 시 피인수가 kill되므로 인수자 자체 이력만 남음), 기록하되 수용한다.

##### B-4. Pending 누적 시점

| 이벤트 | 함수 | 누적 코드 위치 | 필드 |
|--------|------|---------------|------|
| absorb (모든 경로) | `absorb()` | sim.js:43 직후 | `a.maDq += t.D`, `a.maNetQ += t.cs − cashPaid` |
| LBO 성공 | `G.tender` | act2.js:39 직후 | `c.lboq += P×0.7` |
| 숨은 부채 | `hqQ` | ui2.js:735 직후 | `c.hdq += c.A×0.1` |

**cashPaid 계산**:
- `maTick`: `pay` (sim.js:51의 `ac.cs -= pay` 이전 값)
- `offer event`: `P × (100 − c.own["c"+a.id] || 0) / 100`
- `G.merge`: 0 (주식교환)
- `G.liq` (회사→회사): 0 (intra-group)

##### B-5. 분기 마감 확정

`earn()` (sim.js:32) 기존 rlf/isq 확정 코드 바로 뒤에 추가:

```javascript
// FIN-CF-03A: 비현금 부채 장부 확정
if (c.maDq || c.maNetQ) {
  c.maR = { d: Math.round(S.day), D: c.maDq || 0, net: c.maNetQ || 0 };
  c.maDq = 0;
  c.maNetQ = 0;
}
if (c.lboq) {
  c.lboR = { d: Math.round(S.day), D: c.lboq };
  c.lboq = 0;
}
if (c.hdq) {
  c.hdR = { d: Math.round(S.day), D: c.hdq };
  c.hdq = 0;
}
```

##### B-6. Save/Load 및 하위 호환

**packS** (act2.js:246): 변경 없음. 새 필드들은 자동으로 JSON에 포함된다. strip 모드에서 fq가 삭제되면 qBack이 다시 생성하므로 장부도 리셋된다.

**v8prep** (core.js:94): 새 필드 초기화 추가:

```javascript
if (c.maDq == null) c.maDq = 0;
if (c.maNetQ == null) c.maNetQ = 0;
if (c.mad == null) c.mad = S.day;
if (c.lboq == null) c.lboq = 0;
if (c.hdq == null) c.hdq = 0;
```

**의미**: 구버전 세이브를 로드하면 mad = 현재 day로 설정된다. fqDerive에서 `prev.d > c.mad` 조건을 만족하는 분기부터만 장부값을 사용하므로, 로드 직후의 과거 분기들은 기존 방식(보정 없음)으로 표시된다. 다음 분기 마감부터 장부가 작동한다.

maR, lboR, hdR은 null 초기값이므로 v8prep에서 별도 설정하지 않는다 (null = 기록 없음).

##### B-7. qBack (이력 재생성)

qBack (sim.js:282-286)은 strip 세이브 복원 시 호출된다. 기존에 `delete c.rlf; c.cfd = S.day-720; delete c.isq; c.isd = S.day-720`을 수행한다. 새 필드 추가:

```javascript
delete c.maR;
c.maDq = 0;
c.maNetQ = 0;
c.mad = S.day - 720;
delete c.lboR;
c.lboq = 0;
delete c.hdR;
c.hdq = 0;
```

이렇게 하면 재생성된 8개 분기에서는 보정 없이 기존 방식으로 표시된다.

##### B-8. kill 정책

`kill()` (sim.js:40)에서 기존 `c.ncq = 0; delete c.rlf; c.eqq = 0; delete c.isq` 뒤에 추가:

```javascript
c.maDq = 0;
c.maNetQ = 0;
delete c.maR;
c.lboq = 0;
delete c.lboR;
c.hdq = 0;
delete c.hdR;
```

##### B-9. 8분기 보존 정책

maR, lboR, hdR은 각각 1분기치만 보존한다 (rlf와 동일). `fqDerive`가 `d === q.d`로 매칭하므로 해당 분기 행에서만 사용되고, 이후 분기에서는 무시된다. 8분기 스크롤 시 자연 소멸.

다만 maR/lboR/hdR이 서로 다른 분기에 각각 존재할 수 있으므로, qPush에서 isq처럼 오래된 것을 삭제할 필요는 없다(각각 1개만 보존).

---

#### C. 인수 순현금 장부

##### C-1. 최소 데이터

인수 순현금 = Σ(피인수 현금 − 실제 지불 현금). absorb 호출 시 계산:

```
maNetQ += t.cs − cashPaid
```

여기서:
- `t.cs`: absorb 호출 시점의 피인수기업 보유 현금 (absorb 내부에서 `a.cs += t.cs`)
- `cashPaid`: 인수자가 실제 지출한 현금 (경로별 상이, B-4 참조)

##### C-2. 확정 후 구조

```
c.maR = {
  d: closeDay,      // 장부 확정일 (분기 마감일)
  D: 1117.80,       // 비현금 승계부채 합계 (양수 = 부채 증가)
  net: 103.03        // 인수 순현금 합계 (양수 = 현금 유입)
}
```

##### C-3. 수식

```
인수 순현금 행 = maR.net (if maR && maR.d === q.d)
             = 0 (otherwise)
```

이 값은 기존 기타·투자 매매(oth)에서 자연 분리된다. D 절 참조.

---

#### D. 표시 행과 등식 증명

##### D-1. 현행 fqDerive (ui1.js:78-82)

```
dD     = q.D − prev.D
nc     = c.rlf.d === q.d ? c.rlf.R : 0       // FIN-CF-01
iss    = (ledger or estimate)                  // FIN-CF-02
cff    = dD + nc − dv + iss
dc     = q.cs − prev.cs
oth    = dc − cfo + capex − cff
```

현행 등식: `dc = cfo − capex + cff + oth`

차입 증감(표시) = `cff + dv − iss = dD + nc`

##### D-2. 신규 fqDerive

```
// 기존 (변경 없음)
dD   = q.D − prev.D
nc   = ...rlf... (FIN-CF-01)
iss  = ...isq... (FIN-CF-02)

// 신규: 비현금 부채 보정값 (모두 양수 = 부채 증가 방향)
maNC  = c.maR && c.maR.d === q.d ? c.maR.D : 0    // 인수 승계부채
grNC  = c.kd ? q.gr : 0                             // 금융 성장
lboNC = c.lboR && c.lboR.d === q.d ? c.lboR.D : 0  // LBO 푸시다운
hdNC  = c.hdR && c.hdR.d === q.d ? c.hdR.D : 0     // 숨은 부채

// 인수 순현금
maNet = c.maR && c.maR.d === q.d ? c.maR.net : 0

// 장부 유효 조건 (FIN-CF-01/02와 동일 패턴)
led3  = !!(prev && c && c.mad != null && prev.d > c.mad)
// led3가 false면 maNC, lboNC, hdNC, maNet 모두 0으로 처리
// grNC는 별도 조건 없음 (q.gr은 분기 레코드에 항상 존재)

// 보정된 재무활동 현금흐름
cff_new = dD + nc − maNC − grNC − lboNC − hdNC − dv + iss
// = dD + nc − allNC − dv + iss    (allNC = maNC+grNC+lboNC+hdNC)

// 기타·투자 매매 (인수 순현금 분리)
oth_new = dc − cfo + capex − cff_new − maNet

dc_check = cfo − capex + cff_new + maNet + oth_new
```

##### D-3. 등식 증명

```
dc = cfo − capex + cff_new + maNet + oth_new

oth_new = dc − cfo + capex − cff_new − maNet    ... (정의)

대입:
  cfo − capex + cff_new + maNet + (dc − cfo + capex − cff_new − maNet)
= dc                                              ✓
```

##### D-4. 신규 cff와 기존 cff의 관계

```
cff_old = dD + nc − dv + iss
cff_new = cff_old − allNC

oth_old = dc − cfo + capex − cff_old
oth_new = dc − cfo + capex − cff_new − maNet
        = oth_old + allNC − maNet
```

##### D-5. 표시 행 구성 (ui1.js:120 현금흐름 탭)

변경 후 행 목록:

| # | 행 이름 | 수식 | 변경 |
|---|--------|------|------|
| 1 | 순이익 | q.ni | 기존 |
| 2 | 감가상각(비현금) | dep | 기존 |
| 3 | 지분법·상각 조정 | q.ga − q.eq | 기존 |
| 3b| 손상·대손상각 | q.imp + q.wo | 기존 (조건부) |
| 4 | **영업활동 현금흐름** | cfo | 기존 **bold** |
| 5 | 설비투자 | −capex | 기존 |
| 6 | **잉여현금흐름 FCF** | fcf | 기존 **bold** |
| 7 | 차입 증감 | `cff_new + dv − iss` | **변경** — 비현금 빠짐 |
| 8 | 배당 지급 | −dv | 기존 |
| 9 | 증자·출자(자사주) | iss (or ≈est) | 기존 FIN-CF-02 |
| 10| **재무활동 현금흐름** | cff_new | **변경** **bold** |
| 11| **인수 순현금** | maNet | **신규** |
| 12| 기타·투자 매매 | oth_new | **변경** |
| 13| **현금 증감** | dc | 기존 **bold** |
| 14| └ 법정관리 부채 감면 | nc (memo) | 기존 FIN-CF-01 |
| 15| └ 비현금 부채 변동 | allNC (memo) | **신규** (조건부) |

행 11 "인수 순현금"은 maNet ≠ 0인 분기에만 표시한다.
행 15 "비현금 부채 변동"은 allNC ≠ 0인 분기에만 표시한다. 세부 분해는 하지 않는다 (단일 합계).

##### D-6. 케이스 검증 (K1 주식합병)

현행:
```
dD = 1118, nc = 0, dv = 51, iss = 0
cff_old = 1118 + 0 − 51 + 0 = 1067
차입 증감 = 1067 + 51 − 0 = 1118
oth_old = 136 − 348.52 + 0 − 1067 = −1279.52 (≈ −1016, 오차는 다른 변동분)
```

보정 후:
```
maNC = 1117.80, grNC = 0, lboNC = 0, hdNC = 0
allNC = 1117.80
cff_new = 1118 + 0 − 1117.80 − 0 − 51 + 0 = −50.80
차입 증감 = −50.80 + 51 − 0 = 0.20   ✓ (비현금 승계부채 제거됨)
maNet = 103.03 (피인수 현금 103.03, 현금 대금 0)
oth_new = 136 − 348.52 + 0 − (−50.80) − 103.03 = −264.75 → ≈ 101.80 − 103.03 ≈ −1.23 (OK)
```

##### D-7. 케이스 검증 (K4 LBO 타겟)

현행 (타겟 PNPL):
```
dD = 5055, nc = 0
cff_old = 5055 + 0 − 0 + 0 = 5055
차입 증감 = 5055
```

보정 후:
```
lboNC = 5054.55
cff_new = 5055 − 5054.55 = 0.45
차입 증감 = 0.45   ✓ (LBO 비현금 부채 제거됨)
maNet = 0 (absorb 아님)
```

##### D-8. 케이스 검증 (K6 은행 분기)

현행 (JPMX kd1):
```
dD = 49, gr = 49 (slot 12)
차입 증감 = 49
```

보정 후:
```
grNC = 49 (c.kd = 1이므로 q.gr 사용)
cff_new = 49 + 0 − 49 − 0 + 0 = 0
차입 증감 = 0   ✓ (예금 성장은 차입이 아님)
```

---

#### E. LBO 접근법 비교

##### E-1. 옵션 1: 게임 충실 접근 (권장)

**설명**: 게임 코드가 실제로 하는 대로 추적한다. LBO 시 `c.D += P×0.7`이 타겟 장부에 발생하므로, **타겟의** 비현금 부채로 기록한다. 인수자는 30%를 현금 지급하며 이는 기존 기타·투자 매매에 남는다.

**장점**:
1. 게임 경제 변경 없음 — 부채 기록 위치가 코드와 일치
2. 타겟이 private이지만 여전히 earn() 분기 마감을 받으므로 장부 패턴이 작동
3. 구현 단순: G.tender에서 `c.lboq += P×0.7` 한 줄 추가

**단점**:
1. 타겟이 비상장(c.priv=1)이므로 플레이어가 현금흐름 탭을 확인할 때 모회사가 아닌 자회사 탭을 봐야 함
2. 모회사의 현금흐름에는 30% 현금 지급만 보이고, 부채 70%는 안 보임

**완화**: cfNote 메모에 "LBO 부채 P×0.7은 자회사 장부에 기록됨" 추가 가능.

##### E-2. 옵션 2: 회계적 연결 접근

**설명**: LBO를 인수자 관점에서 연결 재무제표처럼 처리한다. 인수자의 차입 증감에 P×0.7을 비현금으로 기록하되, 실질적으로는 "연결 부채"로 표시.

**장점**:
1. 모회사 현금흐름에서 전체 그림을 볼 수 있음
2. W$R 원작의 LBO 표현과 유사

**단점**:
1. 부채가 실제로 타겟 장부(c.D)에 있으므로 이중 기록 위험
2. 구현 복잡: 인수자와 타겟 양쪽에 장부를 연결해야 함
3. 타겟이 나중에 상장(ipoMy)이나 청산(G.liq)되면 부채 추적 정합성 문제
4. 게임의 회사별 분리 원칙과 충돌

##### E-3. 결론

**옵션 1 (게임 충실)을 권장한다.**

이유: 게임에서 부채는 `c.D`로 회사 단위로 관리되며, LBO 부채는 명확히 타겟의 `c.D`에 가산된다. 연결 접근은 구현 복잡도와 정합성 위험이 높고, 게임의 단순한 회사 모델에 맞지 않는다. 타겟의 현금흐름 탭에서 LBO 부채가 비현금으로 분리되면 충분하다.

---

#### F. 회귀 테스트 계획

##### F-1. 기존 테스트 보전

| 파일 | 테스트 | 기대 동작 |
|------|--------|----------|
| `t_fincf01_relief.js` | F1~F8, N1, B1, SD, RET, SV, LG, N, F8 | 전부 PASS 유지 |
| `t_fincf02_issue.js` | 전체 | 전부 PASS 유지 |
| 기타 14개 테스트 파일 | 전체 | 전부 PASS 유지 |

FIN-CF-03A는 fqDerive의 반환값에 새 필드를 추가하고 cff/oth 값을 변경한다. 기존 테스트 중 cff/oth 기대값을 직접 검증하는 케이스는 specCF 함수를 통해 검증하므로, specCF에 새 보정 로직을 반영해야 한다.

##### F-2. 새 테스트 파일: t_fincf03_acq.js

###### F-2a. 합성 케이스 (스크립트 시나리오)

| ID | 시나리오 | 검증 포인트 |
|----|---------|------------|
| M1 | 주식합병 (G.merge): 비금융 인수 | maNC = t.D, maNet = t.cs, 차입 증감에서 t.D 제거됨 |
| M2 | 현금인수 (maTick 경로): overflow 발생 | maNC = t.D, overflow는 차입에 남음, maNet = t.cs − pay |
| M3 | offer 이벤트: 부분 보유 상태에서 인수 | cashPaid = P×(100−own%)/100 |
| M4 | G.liq 흡수: 자회사 흡수 | maNC = t.D, maNet = t.cs (현금 지급 0) |
| M5 | LBO: 타겟에 push-down | lboNC = P×0.7, 타겟 차입 0 |
| M6 | 숨은 부채 발각 | hdNC = A×0.1, 차입에서 제거됨 |
| M7 | 은행 분기 (gr만) | grNC = q.gr, 차입 = 0 |
| M8 | 보험 분기 (gr만) | grNC = q.gr, 차입 = 0 |
| M9 | 같은 분기 복합: 인수 + gr + ch11 | maNC, grNC, nc 모두 적용, 등식 성립 |
| M10 | 같은 분기 2건 인수 | maDq 누적, maR.D = 합계 |
| M11 | 인수 후 다음 분기: maR 자연 소멸 | maNC = 0 (d 불일치) |
| M12 | 인수 후 kill: 장부 정리 | maDq/maR = 0/null |

###### F-2b. 세이브/로드 테스트

| ID | 시나리오 | 검증 포인트 |
|----|---------|------------|
| SV1 | 세이브 → 로드 → 분기 마감 | 새 필드 보존, 장부 정상 작동 |
| SV2 | 구버전 세이브(새 필드 없음) 로드 | v8prep가 초기화, mad = S.day, 과거 분기 보정 없음 |
| SV3 | strip 세이브 로드 | qBack 후 장부 리셋, mad = S.day-720 |
| SV4 | 세이브에 pending 있는 상태로 저장 → 로드 → 마감 | pending → confirmed 정상 |

###### F-2c. 자연 플레이 테스트

| ID | 시나리오 | 검증 포인트 |
|----|---------|------------|
| N1 | seed 12345, 720일 | 매 분기 등식 검증: dc = cfo − capex + cff_new + maNet + oth_new |
| N2 | seed 777, 720일 | 동일 |
| N3 | seed 20261016, 720일 | 동일 |

각 자연 플레이에서:
- 모든 회사의 모든 분기에서 등식 `dc = cfo − capex + cff + maNet + oth` 성립 확인
- 인수가 발생한 분기에서 maNC > 0 확인
- kd 회사의 매 분기 grNC = q.gr 확인
- 차입 증감 절대값이 현행보다 작아진 분기 개수 집계

##### F-3. 뮤테이션 테스트

기존 verify/fin-cf-02/mutation_check.py 패턴을 따른다:

1. 새 장부 필드 초기화를 제거한 변이 → 구버전 세이브 로드 시 crash 확인
2. maNC 보정을 0으로 고정한 변이 → 인수 분기에서 차입 증감 오류 확인
3. grNC 보정을 0으로 고정한 변이 → kd 분기에서 차입 증감 오류 확인
4. lboq 누적을 빼먹은 변이 → LBO 분기에서 차입 증감 오류 확인
5. kill에서 장부 정리 빼먹은 변이 → kill 후 stale maR 잔존 확인

##### F-4. main-vs-branch 상태 동일성 검증

verify/fin-cf-02/main_vs_branch.py와 동일한 구조:

1. main (d553d3e)과 branch를 같은 시드로 동시 실행
2. 매일 S를 JSON화하되 새 장부 필드(maDq, maNetQ, maR, lboq, lboR, hdq, hdR, mad)를 제외
3. 전체 게임 상태(가격, 현금, 부채, 주식, fq 24개 숫자, RNG 위치)가 동일한지 확인
4. 케이스: 자연 3개 + 스크립트 3개 (인수/LBO/숨은부채 트리거)

이 검증은 **게임 경제가 변경되지 않았음**을 증명한다.

---

#### G. 수정 제안 (함수명, 파일, 줄)

##### G-1. sim.js

| # | 함수 | 줄 | 수정 내용 |
|---|------|---|----------|
| G1 | `absorb(a,t,paidVal)` | 43 | `a.D += t.D` 직후에 `a.maDq = (a.maDq\|\|0) + t.D` 추가. cashPaid 계산은 호출자별로 다르므로, absorb에 `cashPaid` 파라미터를 추가하거나 호출 전에 계산. |
| | | | **접근법**: absorb의 시그니처를 `absorb(a, t, paidVal, cashPaid)` 로 변경. cashPaid = 인수자가 실제 지출한 현금. |
| | | | `a.maNetQ = (a.maNetQ\|\|0) + t.cs - (cashPaid\|\|0)` 추가 |
| G2 | `earn(c)` | 32 | 기존 rlf/isq 확정 코드 뒤에 maR/lboR/hdR 확정 코드 추가 (B-5 참조) |
| G3 | `kill(c,m,paid)` | 40 | 기존 `c.ncq=0; delete c.rlf; c.eqq=0; delete c.isq` 뒤에 새 필드 정리 추가 (B-8 참조) |
| G4 | `qBack(c)` | 282 | 기존 `delete c.rlf; c.cfd=S.day-720; delete c.isq; c.isd=S.day-720` 뒤에 새 필드 리셋 추가 (B-7 참조) |
| G5 | `maTick()` | 48-51 | absorb 호출 시 cashPaid = `pay` 전달: `absorb(ac, t, pay, pay)` |

##### G-2. act2.js

| # | 함수 | 줄 | 수정 내용 |
|---|------|---|----------|
| G6 | `G.merge` | 34 | absorb 호출 시 cashPaid = 0 전달: `absorb(a, x, q.nv, 0)` |
| G7 | `G.tender` (LBO 분기) | 39 | `c.D += P*.7` 직후에 `c.lboq = (c.lboq\|\|0) + P*.7` 추가 |
| G8 | `G.liq` (회사→회사 분기) | 50 | absorb 호출 시 cashPaid = 0 전달: `absorb(h, c, -hv(c,100), 0)` |

##### G-3. ui2.js

| # | 함수 | 줄 | 수정 내용 |
|---|------|---|----------|
| G9 | offer event go | 680 | absorb 호출 시 cashPaid 전달: `absorb(a, c, P, cashPaid)` 여기서 `cashPaid = P*(100-(c.own["c"+a.id]\|\|0))/100` |
| G10 | `hqQ` (숨은 부채) | 735 | `c.D += c.A*.1` 직후에 `c.hdq = (c.hdq\|\|0) + c.A*.1` 추가 |

##### G-4. core.js

| # | 함수 | 줄 | 수정 내용 |
|---|------|---|----------|
| G11 | `v8prep(c)` | 94 | 새 필드 초기화 추가 (B-6 참조). 기존 `if(c.eqq==null)c.eqq=0;if(c.isd==null)c.isd=S.day` 뒤에 추가 |

##### G-5. ui1.js

| # | 함수 | 줄 | 수정 내용 |
|---|------|---|----------|
| G12 | `fqDerive(c,q,prev)` | 78-82 | 신규 보정값 계산 추가 (D-2 참조). 반환 객체에 `maNC, grNC, lboNC, hdNC, allNC, maNet` 추가 |
| G13 | 현금흐름 탭 (fseg===3) | 120 | 차입 증감 행: `d.cff+q.dv-d.iss` → 이미 cff_new 사용으로 자동 변경됨 |
| | | | 기타·투자 매매 행: `d.oth` → 이미 oth_new 사용으로 자동 변경됨 |
| | | | **신규 행 추가**: "인수 순현금" (`d.maNet`), "비현금 부채 변동" (`d.allNC`) |
| G14 | `cfNote(c)` / `cfRl(c)` 근처 | 120 이후 | 인수 순현금 행 표시 조건 함수 추가, cfNote에 비현금 부채 안내 텍스트 추가 |

##### G-6. 수정 요약

| 파일 | 수정 개수 | 영향 범위 |
|------|----------|----------|
| sim.js | 5 (G1-G5) | absorb 시그니처, earn 확정, kill 정리, qBack 리셋, maTick 호출 |
| act2.js | 3 (G6-G8) | G.merge/G.tender/G.liq 호출 |
| ui2.js | 2 (G9-G10) | offer event, hqQ |
| core.js | 1 (G11) | v8prep 초기화 |
| ui1.js | 3 (G12-G14) | fqDerive, 현금흐름 탭, cfNote |
| **합계** | **14곳** | |

---

#### H. 커밋 단위 분할

##### H-Phase 1: 장부 인프라 (커밋 1)

**범위**: 새 필드 초기화 + kill 정리 + qBack 리셋. 게임 로직 변경 없음.

**수정 대상**: G3, G4, G11 (sim.js kill/qBack, core.js v8prep)

**완료 기준**:
- 기존 16개 테스트 전부 PASS
- 구버전 세이브 로드 시 crash 없음 (SV2)
- strip 세이브 로드 후 qBack 정상 (SV3)

##### H-Phase 2: pending 누적 (커밋 2)

**범위**: absorb 시그니처 변경, 각 호출자에서 cashPaid 전달, maDq/maNetQ/lboq/hdq 누적.

**수정 대상**: G1, G5, G6, G7, G8, G9, G10 (sim.js absorb/maTick, act2.js G.merge/G.tender/G.liq, ui2.js offer/hqQ)

**완료 기준**:
- 기존 16개 테스트 전부 PASS
- main-vs-branch 상태 동일성 통과 (새 필드 제외)
- 합성 케이스에서 pending 값 정확성 (M1-M6, M10)

##### H-Phase 3: 분기 마감 확정 (커밋 3)

**범위**: earn()에서 pending → confirmed 변환.

**수정 대상**: G2 (sim.js earn)

**완료 기준**:
- 기존 16개 테스트 전부 PASS
- main-vs-branch 상태 동일성 통과 (새 필드 + maR/lboR/hdR 제외)
- 합성 케이스에서 confirmed 값 정확성 (M1-M12)
- SV1, SV4 (세이브/로드 후 pending→confirmed 정상)

##### H-Phase 4: fqDerive 보정 + 표시 (커밋 4)

**범위**: fqDerive에서 비현금 보정 + 인수 순현금 계산, 현금흐름 탭 행 추가.

**수정 대상**: G12, G13, G14 (ui1.js fqDerive, 현금흐름 탭)

**완료 기준**:
- 기존 16개 테스트 전부 PASS (specCF 업데이트 포함)
- 자연 플레이 N1-N3 등식 검증 통과
- 합성 케이스 차입 증감 · 인수 순현금 · 기타 정확성
- 뮤테이션 테스트 통과
- K1-K12 감사 수치 재현

##### H-Phase 5 (선택): cfNote 안내 텍스트 (커밋 5)

**범위**: 비현금 부채 관련 안내 텍스트, 기존 cfNote 확장.

**수정 대상**: G14 (ui1.js cfNote)

**완료 기준**:
- UI 렌더링 정상
- 기존 테스트 PASS

---

#### 부록: absorb 시그니처 변경 상세

현행: `function absorb(a, t, paidVal)`
변경: `function absorb(a, t, paidVal, cashPaid)`

`cashPaid`는 선택적 파라미터다. `undefined`이면 0으로 처리한다 (`cashPaid || 0`).

모든 absorb 호출처:

| 호출처 | 파일:줄 | 현행 호출 | 변경 후 | cashPaid 의미 |
|--------|---------|----------|---------|--------------|
| maTick | sim.js:51 | `absorb(ac,t,pay)` | `absorb(ac,t,pay,pay)` | 실제 현금 지급액 |
| G.merge | act2.js:34 | `absorb(a,x,q.nv)` | `absorb(a,x,q.nv,0)` | 주식교환, 현금 0 |
| offer go | ui2.js:680 | `absorb(a,c,P)` | `absorb(a,c,P,cP)` | cP = P×(100−own%)/100 |
| G.liq (회사) | act2.js:50 | `absorb(h,c,-hv(c,100))` | `absorb(h,c,-hv(c,100),0)` | intra-group, 현금 0 |

**대안**: absorb 시그니처를 변경하는 대신, 호출자에서 absorb 전에 직접 `a.maDq += t.D`, `a.maNetQ += t.cs - cashPaid`를 기록할 수도 있다. 이 경우 absorb는 변경하지 않지만, 4곳에 중복 코드가 생긴다. 시그니처 변경이 더 깔끔하다.

---

#### 부록: fqDerive 반환 객체 변경

현행 반환:
```javascript
return { gp, sga, cogs, pre, dep, cfo, capex, cff, dc, oth,
         nc, unk, est, bank, eqv, wc, ppe, fcf, iss }
```

변경 후:
```javascript
return { gp, sga, cogs, pre, dep, cfo, capex, cff, dc, oth,
         nc, unk, est, bank, eqv, wc, ppe, fcf, iss,
         maNC, grNC, lboNC, hdNC, allNC, maNet }
```

`cff`, `oth`는 이미 보정된 값이므로, 기존 코드에서 `d.cff`, `d.oth`를 참조하는 모든 곳이 자동으로 새 값을 사용한다.

---

#### 부록: led3 (장부 유효 조건) 상세

```javascript
led3 = !!(prev && c && c.mad != null && prev.d > c.mad)
```

- `prev`: 이전 분기 레코드가 존재해야 함 (첫 번째 분기 = 보정 불가)
- `c.mad != null`: 장부 시작일이 설정됨
- `prev.d > c.mad`: 이전 분기가 장부 시작 이후여야 함 (strict)

이 조건이 false면:
- maNC, lboNC, hdNC, maNet = 0 (장부 미사용, 기존 방식)
- grNC는 led3과 무관: q.gr은 분기 레코드에 항상 존재하며, c.kd만으로 판단

**이유**: cfd (FIN-CF-01)와 isd (FIN-CF-02)처럼, 장부 시작 이전의 과거 분기에 잘못된 보정을 적용하는 것을 방지한다. 새 세이브에서는 mad = S.day이므로 다음 분기부터 작동하고, 구버전 세이브에서도 동일하게 안전하다.

grNC에 led3을 적용하지 않는 이유: q.gr은 분기 레코드 slot 12에 원래부터 존재하는 값이며, 장부 시작과 무관하게 항상 유효하다. 단, 구버전 세이브의 qBack으로 재생성된 분기에서도 gr이 들어 있으므로, 재생성 분기에서 grNC 보정이 적용된다. 이는 의도된 동작이다 — qBack이 생성한 gr은 `A*g/4`로 실제 earn과 동일한 공식이므로 보정해도 안전하다.

---

#### 수용 기준 체크리스트

| # | 기준 | 설계 충족 |
|---|------|----------|
| 1 | 비현금 부채를 차입에서 제외 | ✓ maNC+grNC+lboNC+hdNC를 cff에서 차감 |
| 2 | 실제 현금 차입 유실 없음 | ✓ overflow·bissue·advP 등 현금 차입은 dD에 남음 |
| 3 | 인수 순현금 별도 분리 | ✓ maNet 행 추가, oth에서 분리 |
| 4 | 현금흐름 합계 = 분기 현금변동 | ✓ dc = cfo − capex + cff_new + maNet + oth_new (증명 완료) |
| 5 | 세이브 호환성 | ✓ v8prep 초기화, mad로 과거 분기 보호 |
| 6 | 게임 경제·RNG 보존 | ✓ main-vs-branch로 검증, 장부만 추가 |
| 7 | FIN-CF-01/02 장부 무손상 | ✓ ncq/rlf/eqq/isq 미변경 |

*끝*

### [원문 끝]

---
---

# R1 보완 사항

GPT-6 개발 전략실 검토 항목 6건에 대한 보완.

---

## R1-1. 보고 주체 분석 및 G.liq 내부 흡수 정책 {#r1-1}

> GPT-6 검토 항목 [2]: G.liq 내부 흡수 예외

### R1-1-1. 현재 게임의 보고 주체

**결론: 게임은 개별 회사 재무제표(individual financial statements)를 표시한다. 연결 재무제표(consolidated)는 존재하지 않는다.**

근거:

| 관찰 | 근거 코드 |
|------|----------|
| 재무제표는 `S.co[i]` 단위로 생성 | `fqDerive(c, q, prev)` — c는 개별 회사 객체 |
| 자산·부채·현금이 회사별로 분리 | `c.A`, `c.cs`, `c.D` — 모회사와 자회사가 별도 관리 |
| 자회사를 투자자산으로 표시 | `c.own["c"+x.id]`(지분율), `c.bs["c"+x.id]`(취득원가) |
| 자회사 재무가 모회사에 합산되지 않음 | `G.tender` 후 타겟은 `c.priv=1`로 독립 존속 |
| 주식가치 = 시장가(mc) 기준 | `hv(c, pct)` = 시가 기준, 연결 순자산 기준이 아님 |
| fq(분기 실적)가 회사마다 독립 | `qPush(c, [...])` — 개별 push |

**게임에는 연결 재무제표 개념이 없다.** 모회사가 자회사를 100% 소유해도, 자회사의 실적·자산·부채는 모회사의 fq에 합산되지 않는다.

### R1-1-2. G.liq 내부 흡수의 본질

G.liq 코드 (act2.js:48-50):

```javascript
// k !== "P" 분기 (회사 소유 자회사 흡수)
const h = S.co[+k.slice(1)];      // h = 모회사
const same = h.i === c.i;
const nol = c.nol;
absorb(h, c, -hv(c, 100));        // 흡수
if (same) h.nol += nol * .5;
```

| 항목 | 내용 |
|------|------|
| 선행 조건 | `c.priv === true`, `ownerK(c)` = "c"+h.id (모회사가 100% 소유) |
| paidVal | `-hv(c, 100)` — 음수. 시가 기준 자기 지분의 가치 (음수이므로 goodwill에서 차감 방향) |
| 현금 지급 | **없음**. 모회사(h)의 `h.cs`는 absorb 전에 차감되지 않음 |
| absorb 내부 처리 | `h.cs += c.cs` (자회사 현금 편입), `h.D += c.D` (자회사 부채 편입) |
| 결과 | 자회사 c는 `kill()`, 모회사 h가 자회사의 자산·부채를 직접 보유 |

**경제적 실질 분석**:

| 비교 기준 | 외부 인수 (maTick/offer/merge) | G.liq 내부 흡수 |
|----------|-------------------------------|-----------------|
| 지배력 취득 시점 | 이 거래에서 취득 | **이미 취득 완료** (G.tender 등으로 선행) |
| 신규 대가 지급 | 현금 또는 주식 교환 | **없음** |
| 거래 상대방 | 외부 주주 | 없음 (100% 소유) |
| 기업결합 회계 해당 | 예 (IFRS 3 적용) | **아니오** (공통지배 거래, IFRS 3 범위 밖) |
| 게임 내 분류 | "인수" (S.st.ma++) | "청산" (S.fl.lq=1) |

### R1-1-3. 정책 결정

**G.liq 내부 흡수는 "인수 순현금" 행에 포함한다.**

다만 이 정책은 **게임의 개별 재무제표 보고 구조**에 기반한 판단이며, IFRS 연결 기준의 보편적 회계 판단이 아니다.

**근거**:

1. **개별 보고 주체 관점**: 모회사의 개별재무제표에서 자회사 흡수는 실제 자산·부채 이동이다. 자회사 현금(c.cs)이 모회사로 유입되고, 자회사 부채(c.D)가 모회사에 편입된다. 이는 모회사의 현금흐름표에 반영돼야 하는 실제 변동이다.

2. **추적하지 않으면 왜곡이 더 크다**: G.liq 흡수를 추적하지 않으면:
   - 자회사의 부채(t.D)가 모회사의 "차입 증감"에 포함됨 → 실제 차입이 아닌데 차입으로 표시
   - 자회사의 현금(t.cs)이 "기타·투자 매매"에 포함됨 → 출처가 불분명

3. **기계적 동일성**: absorb() 함수가 동일하게 호출되므로, 코드 분기 없이 일관된 처리가 가능하다.

4. **표시 라벨 선택**: "인수 순현금" 라벨은 G.liq를 포함한 모든 absorb 기반 거래에 적용된다. 게임 내에서 G.liq 흡수 빈도는 낮으며(플레이어가 명시적으로 청산을 선택해야 함), 외부 인수가 대다수를 차지한다.

**K5 사례 확인**: 감사 결과 K5 (G.liq 모회사)에서 비현금 부채 653.44, 인수 순현금 +74.92가 정확히 추적됐다. 보정 후 차입 증감 0.56으로 비현금 부채가 올바르게 제거된다.

### R1-1-4. 대안 비교 (GPT 판단용)

| 대안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 통합 라벨 **(현재 설계)** | G.liq 내부 흡수를 외부 인수와 동일한 "인수 순현금" 행에 표시 | 구현 단순, absorb 코드 분기 없음, 기존 K5 검증 완료 | 내부 거래와 외부 거래 구분 불가 |
| B. 분리 라벨 | G.liq 흡수 시 absorb에 `internal=true` 플래그 전달, 표시 시 "자회사 흡수" 별도 행 | 거래 유형 구분 가능 | absorb 시그니처에 5번째 파라미터 추가, 같은 분기 내부+외부 혼합 시 maR 분리 필요 |
| C. 흡수 미추적 | G.liq 흡수를 maDq/maNetQ에 누적하지 않고 기존 oth에 남김 | 내부 거래를 인수로 표시하지 않음 | 자회사 부채가 "차입 증감"에 잘못 포함되는 기존 문제가 G.liq에서만 지속 |

**권장**: 대안 A (현재 설계 유지). 대안 B는 장점이 있으나, 구현 복잡도 대비 이점이 제한적이다. G.liq 빈도가 낮고, 유저가 자회사를 흡수했다는 사실은 이미 게임 로그로 알 수 있다. GPT의 최종 판단을 구한다.

---

## R1-2. LBO 세부 분류 — 단계별 현금·부채·지분 추적 {#r1-2}

> GPT-6 검토 항목 [3]: LBO 세부 분류

### R1-2-1. G.tender LBO 단계별 추적

코드: act2.js:36-42

**전제 조건** (line 37):
- `c.kd`가 참이면 LBO 불가 ("은행·보험사는 LBO로 인수할 수 없어요")
- `need = P * 0.3` (인수자 부담 현금 = 타겟 시가 × 프리미엄 × 30%)
- `P = mc(c) * (1 + prem/100) * (100 - own) / 100`

#### 단계 1: 인수자 현금 지급

```javascript
ePay(e, need);    // e = "P"(플레이어) or 회사 인덱스
                  // need = P * 0.3
```

| 주체 | 변동 | 현금/비현금 |
|------|------|-----------|
| 인수자 | 현금 −need (= −P×0.3) | **실제 현금 지출** |

ePay 내부:
- `e === "P"`: `S.cash -= need`
- `e === 회사`: `S.co[e].cs -= need`

#### 단계 2: 타겟 부채 + 영업권 생성

```javascript
if (lbo) {
  c.gw += Math.max(0, mc(c) * (1 + prem/100) - eq(c));
  c.D += P * .7;
}
```

| 주체 | 변동 | 현금/비현금 |
|------|------|-----------|
| 타겟 | goodwill +Δ | 비현금 (장부 조정) |
| 타겟 | D +P×0.7 | **비현금** — 대출기관이 매도 주주에게 직접 지급한 것으로 간주 |
| 타겟 | 현금 변동 없음 | — |

#### 단계 3: 기존 주주 결제

```javascript
settleX(c, 1 + prem/100);
for (const k of Object.keys(c.own)) {
  if (k === bk) continue;
  payK(c, k, c.own[k]/100 * mc(c) * (1+prem/100));
  setOwn(c, k, 0);
}
```

`payK(c, k, x)` 분석 (core.js:67-70):
- k = "P": 매도 대금 → S.cash (플레이어)
- k = "c"+id: 매도 대금 → S.co[id].cs (다른 회사)
- **payK는 타겟(c)의 c.cs를 차감하지 않는다.** 매도 주주에 대한 지급 재원은 인수자 현금(30%) + 대출(70%)로 구성되며, 게임은 이를 추상화한다.

| 주체 | 변동 | 현금/비현금 |
|------|------|-----------|
| 매도 주주 | 현금 수령 (각자 지분율 × 프리미엄 시가) | 실제 현금 수령 |
| 타겟 | c.cs 변동 없음 | — |

#### 단계 4: 소유권 전환

```javascript
setOwn(c, bk, 100);              // 인수자 100% 소유
c.bs[bk] = (c.bs[bk]||0) + need; // 취득원가 = 현금 지급액
c.priv = 1;                       // 비상장 전환
c.pt = S.day;                     // 비상장 전환일
```

| 주체 | 변동 | 현금/비현금 |
|------|------|-----------|
| 인수자 | 지분 100% 취득, 취득원가 = need | 장부 조정 |
| 타겟 | 비상장 전환 | 상태 변경 |

**중요: G.tender는 absorb()를 호출하지 않는다.** 타겟은 독립 법인으로 존속한다.

#### 단계 5 (후속, 선택적): 자회사 흡수 (G.liq)

타겟이 나중에 G.liq로 흡수되면 그때 absorb()가 호출된다. 이 시점에 타겟의 D(LBO 부채 포함)가 모회사에 편입된다.

### R1-2-2. 현금흐름 반영 요약

| 주체 | 현금흐름 항목 | 값 | 설계 표시 |
|------|-------------|---|----------|
| **인수자** | 투자 현금유출 | −P×0.3 | "기타·투자 매매" (oth)에 자연 포함 |
| **타겟** | 비현금 부채 증가 | +P×0.7 | lboq → lboR → lboNC로 추적, "차입 증감"에서 제거 |
| **타겟** | 현금 변동 | 0 | 없음 |

### R1-2-3. 게임 경제 단순화 명시

> **이 설계에서 LBO 처리는 현재 게임의 경제적 단순화 정책(game-specific economic simplification)에 따른 것이며, 모든 실제 IFRS LBO에 적용되는 보편적 정답이 아니다.**

게임의 단순화:

| 실제 LBO | 게임 LBO |
|----------|---------|
| SPV(특수목적법인) 설립 → 대출 조달 → 매도 주주 지급 → SPV가 타겟과 합병 | 타겟에 직접 `c.D += P×0.7` |
| 대출금이 SPV를 거쳐 매도 주주에게 실제 현금으로 지급됨 | payK가 매도 주주에게 직접 지급 (재원 추상화) |
| 합병 후 타겟이 대출금 상환 의무를 짐 | 타겟이 처음부터 부채를 직접 부담 |
| LBO 대출에 별도 금리·만기·담보 조건 | 일반 D에 합산, 별도 조건 없음 |

**대출기관 → 매도 주주 직접 지급**: 게임에서 payK는 c.cs(타겟 현금)를 차감하지 않으면서 매도 주주에게 현금을 지급한다. 이는 대출기관이 매도 주주에게 직접 지급하는 것으로 간주할 수 있다. 이 재원의 출처(30% 인수자 + 70% 대출)는 게임이 추상화하며, 타겟의 현금에는 영향을 주지 않는다.

---

## R1-3. 호출처별 absorb(a,t,paidVal,cashPaid) 검증표 {#r1-3}

> GPT-6 검토 항목 [4]: 인수 순현금 장부 검증

### R1-3-0. GPT-6 검증 질문 7개

각 호출처에 대해 아래 7개 질문에 답한다:

- **Q1**: cashPaid가 실제 지급액과 일치하는가?
- **Q2**: 기존 지분을 보유한 인수자의 지급액을 중복 계산하지 않는가?
- **Q3**: 대상 회사의 현금을 단 한 번만 기록하는가?
- **Q4**: 실패한 합병과 단순 공개매수는 제외되는가?
- **Q5**: 내부 흡수 청산과 외부 인수의 분류가 올바른가?
- **Q6**: 인수 다음 결산 전 저장·불러오기에 기록이 남는가?
- **Q7**: 결산 당일 거래가 다음 분기로 넘어가는 경계를 처리하는가?

### R1-3-1. maTick (sim.js:48-51) — AI 자동인수

**코드 경로**:
```javascript
const pr = mc(t) * 1.3;                      // 프리미엄 30%
const ao = t.own["c"+ac.id] || 0;            // 인수자의 기존 보유율
const pay = pr * (100-ao) / 100;             // 실제 현금 지급액
// ... 기타 주주 payK 처리 ...
ac.cs -= pay;                                 // 인수자 현금 차감
if (ac.cs < 0) { ac.D -= ac.cs; ac.cs = 0; } // overflow = 실제 차입
S.st.ma++;
absorb(ac, t, pay);                           // 현행 호출
// 변경 후: absorb(ac, t, pay, pay)
```

| 질문 | 답변 |
|------|------|
| Q1 | **✓** cashPaid = pay = pr×(100−ao)/100. `ac.cs -= pay` 직전에 계산된 값과 정확히 일치한다. |
| Q2 | **✓** ao = `t.own["c"+ac.id]||0` (인수자의 기존 보유율). pay는 (100−ao)%분만 계산하므로 기보유 지분에 대한 이중 지급이 없다. |
| Q3 | **✓** t.cs는 absorb 내부에서 `a.cs += t.cs`로 한 번만 읽힌다. 이전 단계의 payK는 t.cs를 차감하지 않는다 (payK는 대상 회사 현금을 건드리지 않음). maNetQ += t.cs − cashPaid 한 번. |
| Q4 | **✓** maTick은 조건(rnd()>.5, 적격 대상, 충분한 현금)을 모두 통과한 경우에만 absorb에 도달한다. 실패 경로에서는 absorb가 호출되지 않으므로 장부 누적이 없다. |
| Q5 | **✓** maTick은 항상 외부 인수 (AI 회사 간 자동 인수). 내부 흡수는 G.liq에서만 발생한다. |
| Q6 | **✓** maDq/maNetQ는 회사 객체(c)의 필드로 저장된다. packS가 S.co를 JSON으로 직렬화하면 pending 값이 포함된다. 로드 후 다음 earn()에서 confirmed로 전환된다. |
| Q7 | **✓** maTick은 step() 내에서 earn() 이전에 실행된다 (mktTick 순서). 같은 날 maTick 후 earn이 실행되면, 해당 분기에서 pending이 confirmed된다. 이는 의도된 동작이다. |

**overflow 처리 검증**:
```
Before: ac.cs = 50, ac.D = 100, pay = 80, t.D = 200, t.cs = 30
After ac.cs -= pay: ac.cs = -30
After overflow: ac.D = 100 + 30 = 130, ac.cs = 0
After absorb: ac.cs = 0 + 30 = 30, ac.D = 130 + 200 = 330

dD = 330 - 100 = 230 (= overflow 30 + t.D 200)
maDq = 200 (비현금 = t.D만)
corrected 차입 증감 = dD + nc - maNC = 230 - 200 = 30 (= overflow, 실제 차입분만)  ✓
maNetQ = t.cs - pay = 30 - 80 = -50 (인수에 순현금 유출)  ✓
```

### R1-3-2. G.merge (act2.js:24-34) — 주식 합병

**코드 경로**:
```javascript
// 실패 분기 (absorb 미호출)
if (yes <= 50 || anti || gov) {
  const f = mc(x) * .005;
  a.cs -= f;   // 자문 비용만 차감
  if (a.cs < 0) { a.D -= a.cs; a.cs = 0; }
  return render();
}
// 성공 분기
settleX(x, 1+prem/100);
// 주식 교환으로 기존 주주에게 신주 배정 (현금 이동 없음)
rescale(a, a.sh/ns);
absorb(a, x, q.nv);    // 현행 호출
// 변경 후: absorb(a, x, q.nv, 0)
```

| 질문 | 답변 |
|------|------|
| Q1 | **✓** cashPaid = 0. 주식합병은 현금 대가 없이 주식 교환으로 이뤄진다. 인수자의 현금(a.cs)은 absorb 전에 차감되지 않는다 (실패 시 자문비만 차감). |
| Q2 | **✓** 주식 교환이므로 기존 보유분에 대한 현금 중복 계산이 불가능하다. 기존 주주들에게 신주가 배정되며 (adds 구조), rescale로 지분이 조정된다. |
| Q3 | **✓** absorb 내부에서 `a.cs += t.cs` 한 번. settleX나 주식 교환 과정에서 t.cs는 변경되지 않는다. |
| Q4 | **✓** 실패(yes<=50, anti, gov) 시 `return render()` — absorb 미호출. 실패 5번 후 성공 1번이면 absorb는 성공한 1번에서만 호출된다 (K10 사례 참조). 자문비(mc(x)×0.005)는 인수자의 oth에 남으며, 장부에 기록되지 않는다. |
| Q5 | **✓** G.merge는 항상 외부 인수. 상장 회사 간 합병이며 (priv인 회사는 합병 주체 불가 — line 25), 내부 흡수가 아니다. |
| Q6 | **✓** maTick과 동일. pending 필드가 회사 객체에 저장된다. |
| Q7 | **✓** G.merge는 플레이어 액션이다. step() 사이에 실행되므로, pending은 다음 step()의 earn()에서 confirmed된다. 같은 날에 earn()이 실행되는 경우: 플레이어 액션은 step() 밖에서 실행 → pending 누적 → 다음 step()에서 earn() → confirmed. earn() 전에 처리되는 경우가 없으므로 "현재 분기 누락" 위험이 없다. |

### R1-3-3. offer event (ui2.js:676-680) — 인수 제안 수락

**코드 경로**:
```javascript
// 인수자 (a)의 기존 보유율
const own_pct = c.own["c"+a.id] || 0;
const P = mc(c) * (1 + pr/100);

// 거절/역제안 실패 분기 — absorb 미호출
if (k === "no") { fxj(c, .03); return ...; }
if (k === "more" && rnd() >= .5) { return ...; }

// 성공 분기
settleX(c, 1+pr/100);
// 기존 주주에게 payK로 현금 지급 (재원 = 인수자)
for (const h of Object.keys(c.own)) {
  if (h === "c"+a.id) continue;
  payK(c, h, c.own[h]/100 * P);
}
// 인수자 현금 차감
const cashPaid_offer = P * (100 - own_pct) / 100;
a.cs -= cashPaid_offer;
if (a.cs < 0) { a.D -= a.cs; a.cs = 0; }  // overflow

// 소유권 정리
for (const h of Object.keys(c.own))
  if (h !== "c"+a.id) setOwn(c, h, 0);

absorb(a, c, P);    // 현행 호출
// 변경 후: absorb(a, c, P, cashPaid_offer)
```

| 질문 | 답변 |
|------|------|
| Q1 | **✓** cashPaid = P×(100−own_pct)/100. 이것은 `a.cs -= ...` 라인에서 차감되는 정확한 금액이다. P = mc(c)×(1+pr/100)이 총가격, own_pct = 기존 보유분, (100−own_pct)/100은 추가 취득분. |
| Q2 | **✓** own_pct = `c.own["c"+a.id]||0`으로 기존 보유분을 정확히 차감한다. 인수자가 20% 보유 중이면, cashPaid = P×80/100이다. 기존 20%에 대해서는 현금 지급이 없다. |
| Q3 | **✓** payK(c, h, ...)는 h(주주)에게 지급하며, c.cs(타겟 현금)를 변경하지 않는다 (payK 코드 확인: core.js:67-70). absorb 시점의 c.cs = 원래 타겟 현금. maNetQ += c.cs − cashPaid → 한 번만 기록. |
| Q4 | **✓** "no"(거절): `return` — absorb 미호출. "more"(역제안) 실패 시: `return` — absorb 미호출. 오직 수락(k==="yes") 또는 성공한 역제안에서만 absorb 도달. |
| Q5 | **✓** offer 이벤트는 항상 외부 인수. 이벤트 발생 조건(ui2.js:676)이 `!c.priv && !c.kd && mine(c) && mc(c)>50`이고, 인수자(a)는 같은 업종의 비지배 대형사이므로, 100% 소유 자회사 간의 내부 거래가 아니다. |
| Q6 | **✓** pending 필드가 인수자(a)의 회사 객체에 저장된다. packS에 포함. |
| Q7 | **✓** offer 이벤트는 evPick(k)에서 처리된다. 이벤트 처리는 step() 밖(플레이어 상호작용)이므로, pending은 다음 earn()에서 confirmed된다. |

**payK 비간섭 증명** (core.js:67-70):

```javascript
function payK(c, k, x) {
  const b = c.bs[k] || 0, g = x - b;
  if (k === "P") { S.cash += x - t; return x - t; }    // 플레이어에게 지급
  if (k[0] === "r") { S.R[...].cash += x; return x; }  // 라이벌에게 지급
  const h = S.co[+k.slice(1)];                          // 다른 회사에게 지급
  h.cs += x - t;                                        // h의 현금 증가
  return x - t;
}
```

payK는 c(타겟)의 cs, D, A를 변경하지 않는다. 오직 지급 대상(k)의 현금만 증가시킨다. 따라서 absorb 시점의 c.cs는 원래 값 그대로이다.

### R1-3-4. G.liq (act2.js:48-50) — 내부 흡수 청산

**코드 경로**:
```javascript
// k !== "P" 분기 (회사가 소유한 자회사)
const h = S.co[+k.slice(1)];     // 모회사
const same = h.i === c.i;
const nol = c.nol;
absorb(h, c, -hv(c,100));        // 현행 호출
// 변경 후: absorb(h, c, -hv(c,100), 0)
```

| 질문 | 답변 |
|------|------|
| Q1 | **✓** cashPaid = 0. G.liq 내부 흡수는 현금 지급이 없다. 모회사(h)의 h.cs는 absorb 전에 차감되지 않는다. (k==="P" 분기와 다름 — k==="P"는 개인 청산으로 absorb를 호출하지 않음) |
| Q2 | **해당 없음.** 모회사가 이미 100% 소유한 자회사를 흡수하므로, 기존 지분에 대한 추가 지급이 없다. cashPaid = 0이 정확하다. |
| Q3 | **✓** absorb 내부에서 `h.cs += c.cs` 한 번. G.liq 코드에서 c.cs를 직접 변경하는 코드가 없다. |
| Q4 | **✓** G.liq는 실패 경로가 없다 (조건: `c.priv && ownerK(c)가 "c"+id`이면 바로 absorb 실행). 단, k==="P" 분기는 `kill(c,1,1)`로 별도 처리되며 absorb를 호출하지 않는다. |
| Q5 | **✓** R1-1-3 정책에 따라, G.liq 내부 흡수도 "인수 순현금" 행에 포함한다. cashPaid = 0이므로 maNetQ = c.cs (자회사 현금 전액이 순유입). maDq = c.D (자회사 부채 전액이 비현금 승계). |
| Q6 | **✓** pending 필드가 모회사(h)의 회사 객체에 저장된다. |
| Q7 | **✓** G.liq는 플레이어 액션. step() 밖에서 실행, 다음 earn()에서 confirmed. |

### R1-3-5. G.tender LBO (act2.js:39) — 타겟 기준

**G.tender는 absorb()를 호출하지 않는다. 별도 추적 경로 (lboq).**

```javascript
if (lbo) {
  c.gw += Math.max(0, mc(c)*(1+prem/100) - eq(c));
  c.D += P * .7;
  // 변경: c.lboq = (c.lboq||0) + P * .7;  추가
}
```

| 질문 | 답변 |
|------|------|
| Q1 | **해당 없음.** absorb가 아닌 별도 경로. lboq = P×0.7 = 타겟에 추가된 비현금 부채 정확량. |
| Q2 | **해당 없음.** 타겟 기준 장부이므로 인수자 지분 중복 계산 문제 없음. |
| Q3 | **해당 없음.** 타겟의 현금은 변경되지 않으며, maNetQ에 기록하지 않음 (absorb 미호출). |
| Q4 | **✓** LBO 실패 시 (vote 거부, line 38): `return render()` — c.D += ... 줄에 도달하지 않으므로 lboq도 누적되지 않음. |
| Q5 | **해당 없음.** LBO는 타겟 기준 독립 추적 (lboq/lboR 경로). |
| Q6 | **✓** lboq는 타겟(c) 회사 객체에 저장. 타겟이 priv=1이지만 earn()은 모든 회사에 대해 실행되므로, 다음 분기 마감에 lboR로 confirmed. |
| Q7 | **✓** G.tender는 플레이어 액션. |

### R1-3-6. 실패·비해당 거래 확인

| 거래 | absorb 호출 | 장부 영향 |
|------|-----------|----------|
| G.merge 실패 (yes<=50, anti, gov) | ✗ | 없음. 자문비만 a.cs에서 차감 (oth에 남음) |
| G.tender 실패 (vote 거부) | ✗ | 없음. 수수료만 차감 |
| G.tender 비LBO (일반 공개매수) | ✗ (absorb 미호출) | 없음. 타겟은 독립 존속 (priv=1) |
| offer 거절 / 역제안 실패 | ✗ | 없음 |
| 단순 지분 매입 (BB 등) | ✗ | 없음 (absorb 경로 아님) |
| G.liq k==="P" (개인 청산) | `kill(c,1,1)` (absorb ✗) | 없음. kill이 장부 필드를 정리 |

### R1-3-7. 분기 경계 상세

**게임 실행 흐름** (관련 부분만):

```
[player action] → render() → [player action] → render() → ...
[play button] → step() {
  S.day++;
  mktTick() {
    maTick();        // ← AI 인수 (absorb 가능)
    ipoTick();
    ...
    for (c of S.co) earn(c);  // ← pending → confirmed
  }
} → render()
```

**경우 1: maTick 인수 → 같은 step()의 earn()**
- maTick에서 maDq 누적 → 같은 step()에서 earn()이 maR로 확정
- 해당 분기 fq에 반영됨 ✓

**경우 2: 플레이어 액션 → 다음 step()의 earn()**
- 플레이어 액션은 step() 밖에서 실행
- pending 누적 → 다음 step()의 earn()에서 확정
- **결산 당일에 플레이어 액션이 일어나면**: step()이 이미 실행된 후 → 해당 분기 earn() 이미 완료 → pending은 **다음 분기**로 이월
- 이는 FIN-CF-01/02의 ncq/eqq와 동일한 동작이며, 의도된 설계

**경우 3: 저장·불러오기**
- pending(maDq, maNetQ, lboq, hdq)은 회사 객체에 포함 → packS/unpackS에서 보존
- 로드 후 다음 earn()에서 정상 confirmed
- **인수 직후 저장 → 로드**: pending이 유지되므로 기록이 남음 ✓

---

## R1-4. 최종 장부 필드 명세 {#r1-4}

> GPT-6 검토 항목 [5]: 새 장부 및 구버전 저장

### R1-4-1. 필드 명세 표

| # | 필드 | 의미 | 초기값 | 데이터형 | 수명 주기 | 보존 범위 |
|---|------|------|--------|---------|----------|----------|
| 1 | `c.maDq` | pending: 인수 승계 비현금 부채 누적 (Σ t.D) | `0` | number | absorb에서 누적 → earn에서 maR.D로 확정 후 0 리셋 | 개별 회사 |
| 2 | `c.maNetQ` | pending: 인수 순현금 누적 (Σ (t.cs − cashPaid)) | `0` | number | absorb에서 누적 → earn에서 maR.net로 확정 후 0 리셋 | 개별 회사 |
| 3 | `c.maR` | confirmed: 인수 장부 확정 기록 | `null` | `{d:number, D:number, net:number}` or `null` | earn에서 생성, fqDerive에서 참조 (d===q.d 매칭), 1분기 보존 | 개별 회사 |
| 4 | `c.lboq` | pending: LBO 비현금 부채 누적 (Σ P×0.7) | `0` | number | G.tender에서 누적 → earn에서 lboR.D로 확정 후 0 리셋 | 개별 회사 (타겟) |
| 5 | `c.lboR` | confirmed: LBO 장부 확정 기록 | `null` | `{d:number, D:number}` or `null` | earn에서 생성, fqDerive에서 참조, 1분기 보존 | 개별 회사 (타겟) |
| 6 | `c.hdq` | pending: 숨은 부채 비현금분 누적 (Σ A×0.1) | `0` | number | hqQ에서 누적 → earn에서 hdR.D로 확정 후 0 리셋 | 개별 회사 |
| 7 | `c.hdR` | confirmed: 숨은 부채 장부 확정 기록 | `null` | `{d:number, D:number}` or `null` | earn에서 생성, fqDerive에서 참조, 1분기 보존 | 개별 회사 |
| 8 | `c.mad` | 장부 시작일 | `S.day` | number | 생성 후 불변 (qBack에서만 리셋) | 개별 회사 |

### R1-4-2. 수명 주기 다이어그램

```
[이벤트 발생]           [분기 마감 earn()]         [fqDerive()]
   ↓                        ↓                       ↓
maDq += t.D           ┌─ if maDq||maNetQ:     maNC = maR.d===q.d
maNetQ += t.cs-cP     │   maR = {d,D,net}       ? maR.D : 0
                      │   maDq = 0             maNet = maR.d===q.d
   또는               │   maNetQ = 0             ? maR.net : 0
lboq += P*.7          │
                      ├─ if lboq:              lboNC = lboR.d===q.d
   또는               │   lboR = {d,D}           ? lboR.D : 0
hdq += A*.1           │   lboq = 0
                      │
                      └─ if hdq:               hdNC = hdR.d===q.d
                         hdR = {d,D}             ? hdR.D : 0
                         hdq = 0

[kill()]              [qBack()]                [v8prep()]
   ↓                     ↓                       ↓
maDq = 0              delete maR               if maDq==null: maDq=0
maNetQ = 0            maDq = 0                 if maNetQ==null: maNetQ=0
delete maR            maNetQ = 0               if mad==null: mad=S.day
lboq = 0              mad = S.day-720          if lboq==null: lboq=0
delete lboR           delete lboR              if hdq==null: hdq=0
hdq = 0               lboq = 0
delete hdR            delete hdR
                      hdq = 0
```

### R1-4-3. 처리 기준 매트릭스

| 함수 | maDq | maNetQ | maR | lboq | lboR | hdq | hdR | mad |
|------|------|--------|-----|------|------|-----|-----|-----|
| **absorb** | `+=t.D` | `+=t.cs-cP` | — | — | — | — | — | — |
| **G.tender(LBO)** | — | — | — | `+=P*.7` | — | — | — | — |
| **hqQ** | — | — | — | — | — | `+=A*.1` | — | — |
| **earn (pending→confirmed)** | `→maR.D, 0` | `→maR.net, 0` | 생성 `{d,D,net}` | `→lboR.D, 0` | 생성 `{d,D}` | `→hdR.D, 0` | 생성 `{d,D}` | — |
| **fqDerive** | — | — | 읽기(d매칭) | — | 읽기(d매칭) | — | 읽기(d매칭) | 읽기(led3) |
| **kill** | `=0` | `=0` | `delete` | `=0` | `delete` | `=0` | `delete` | — |
| **qBack** | `=0` | `=0` | `delete` | `=0` | `delete` | `=0` | `delete` | `=S.day-720` |
| **v8prep** | `??0` | `??0` | — | `??0` | — | `??0` | — | `??S.day` |

### R1-4-4. FIN-CF-01/02 무간섭 확인

| 기존 필드 | FIN-CF-03A에서의 조작 | 간섭 여부 |
|----------|---------------------|----------|
| `c.ncq` (FIN-CF-01 pending) | 읽지 않음, 쓰지 않음 | **무간섭** |
| `c.rlf` (FIN-CF-01 confirmed) | fqDerive에서 읽기만 (기존과 동일) | **무간섭** |
| `c.cfd` (FIN-CF-01 장부시작일) | 읽지 않음, 쓰지 않음 | **무간섭** |
| `c.eqq` (FIN-CF-02 pending) | 읽지 않음, 쓰지 않음 | **무간섭** |
| `c.isq` (FIN-CF-02 confirmed) | fqDerive에서 읽기만 (기존과 동일) | **무간섭** |
| `c.isd` (FIN-CF-02 장부시작일) | 읽지 않음, 쓰지 않음 | **무간섭** |

### R1-4-5. 구버전 저장 정책

**원칙: 구버전 세이브에서 기록되지 않은 인수 부채와 인수 현금을 추정값으로 확정하지 않는다.**

| 상황 | 처리 |
|------|------|
| 구버전 세이브 로드 (maDq/maNetQ/mad 등 없음) | v8prep에서 `maDq=0`, `maNetQ=0`, `mad=S.day`로 초기화 |
| 로드 직후 과거 분기 표시 | led3 = false (prev.d <= c.mad). 과거 분기에는 보정 없이 기존 방식으로 표시. 비현금 부채가 차입 증감에 포함된 채로 남지만, 이는 정확한 장부 기록이 없으므로 추정보다 안전함 |
| 로드 후 다음 분기 마감 | mad = S.day (로드 시점). 다음 분기의 prev.d > mad이므로 led3 = true. 이후 분기부터 장부 작동 |
| 로드 후 첫 분기에 인수 발생 | pending이 정상 누적 → earn()에서 confirmed. 정확하게 추적됨 |

**추정값을 사용하지 않는 이유**:
1. 구버전 세이브에는 인수 이력이 fq에 누적 형태로만 존재한다 (개별 거래 기록 없음)
2. dD에서 비현금분을 역추적하려면 과거 absorb 이벤트를 재구성해야 하는데, 저장 데이터에 이 정보가 없다
3. 잘못된 추정은 잘못된 보정보다 나쁘다 — 과거 분기를 보정 없이 두는 것이 안전하다

**grNC 예외**: grNC = q.gr (slot 12)은 분기 레코드에 원래 기록돼 있으므로, 구버전 세이브에서도 사용 가능하다. c.kd가 참이면 과거 분기에서도 gr 보정이 적용된다. 이는 led3 조건과 독립적이다.

---

## R1-5. 계산식과 테스트 합격 기준 {#r1-5}

> GPT-6 검토 항목 [6]: 검증 계획

### R1-5-1. 테스트 매트릭스 (GPT-6 요구 조건 8건 + 확장)

| # | GPT-6 요구 조건 | 테스트 ID | 시나리오 | 합격 기준 |
|---|----------------|----------|---------|----------|
| 1 | Gemini C1·C2 회계 사례 | **별도 정의 필요** | Gemini C1·C2 사례 정의를 GPT-6에게 요청 (R1-6-1 참조) | 사례 정의에 따름 |
| 2 | Claude K1~K5, K10 | M1 (K1 재현), M3 (K2 재현), M2 (K3 재현), M5 (K4 재현), M4 (K5 재현), M-10 (K10 재현) | 감사 결과 수치를 재현하는 합성 테스트 | 아래 표 참조 |
| 3 | 여러 기업 인수가 같은 분기 | M10 | 같은 분기에 maTick 인수 2건 발생 | maDq = Σ(t1.D + t2.D), maR.D = 합계, maR.net = Σ(t.cs − cashPaid) |
| 4 | 비현금 부채 변동 + 실제 신규 차입 동시 | M9-EXT | M9에 bissue(실제 차입) 추가 | 차입 증감 = bissue 금액만. allNC = maNC + grNC, oth에서 인수 순현금 분리 |
| 5 | 내부 자회사 흡수 청산 | M4 | G.liq 흡수: cashPaid=0, maNet=t.cs | 비현금 부채 = t.D, 순현금 = t.cs, 차입 보정 정상 |
| 6 | 저장 경계와 구버전 데이터 | SV1~SV4 | 세이브/로드, 구버전, strip, pending 상태 저장 | R1-4-5 정책대로 동작 |
| 7 | 기존 FIN-CF-01·02 회귀 | 전체 | t_fincf01_relief.js, t_fincf02_issue.js 전부 | PASS 유지, ncq/rlf/eqq/isq 무간섭 |
| 8 | 전체 경제 상태와 RNG 일치 | F-4 (main-vs-branch) | 새 장부 필드 제외 후 상태 비교 | 100% 일치 (가격, 현금, 부채, 주식, fq 24개 숫자, RNG 위치) |

### R1-5-2. K1~K5, K10 수치 합격 기준

| 케이스 | maDq(=maNC) | maNetQ(=maNet) | lboNC | 보정 후 차입 증감 | 허용 오차 |
|--------|-------------|----------------|-------|--------------------|----------|
| K1 주식합병 | 1,117.80 | +103.03 | 0 | 0.20 | ±1.0 |
| K2 offer(현금) | 2,149.48 | −1,959.23 | 0 | 1,361.52 | ±1.0 |
| K3 maTick | 73.14 | −191.17 | 0 | −0.14 | ±1.0 |
| K4 LBO(타겟) | 0 | 0 | 5,054.55 | 0.45 | ±1.0 |
| K5 G.liq(모회사) | 653.44 | +74.92 | 0 | 0.56 | ±1.0 |
| K10 은행합병 | 1,360.95 | +109.71 | 0 | 0.05 | ±1.0 |

(허용 오차 ±1.0은 부동소수점 반올림 차이)

### R1-5-3. 등식 검증 (모든 합성·자연 테스트 공통)

매 분기 레코드 (c, q, prev)에 대해:

```
d = fqDerive(c, q, prev)

assert: |q.cs − prev.cs − (d.cfo − d.capex + d.cff + d.maNet + d.oth)| < 0.01

assert: d.allNC === d.maNC + d.grNC + d.lboNC + d.hdNC

assert: d.cff === (q.D − prev.D) + d.nc − d.allNC − q.dv + d.iss
```

### R1-5-4. 독립 검산 가능한 중간값

테스트 출력에 포함할 중간 검산값:

| 검산값 | 계산 방법 | 검증 방법 |
|--------|----------|----------|
| `maDq_raw` | absorb 직후 `a.maDq` | `t.D` 직접 읽은 값과 비교 |
| `maNetQ_raw` | absorb 직후 `a.maNetQ` | `t.cs − cashPaid` 직접 계산과 비교 |
| `overflow` | `max(0, −(a.cs_before − cashPaid))` | `(dD − maDq)` = 실제 차입과 일치 확인 |
| `dD_decomp` | `dD = maNC + lboNC + hdNC + grNC + 실제차입 + nc` | 분해 합이 원래 dD와 일치 |
| `oth_shift` | `oth_new − oth_old` | `allNC − maNet`과 일치 (D-4 증명) |

### R1-5-5. 자연 플레이 통계 집계 (N1~N3)

각 시드별로 720일 실행 후:

| 지표 | 목적 |
|------|------|
| 인수 건수 (maTick/merge/offer/G.liq) | 장부 누적 횟수 확인 |
| 비현금 부채 합계 (allNC) | 원본 감사 결과와 비교 |
| 보정 전 차입 > 보정 후 차입인 분기 비율 | 비현금 제거 효과 확인 |
| maNet 양수/음수 건수 | 인수 순현금 분포 확인 |
| 등식 위반 건수 | **0이어야 함** |
| RNG 상태 일치 (main-vs-branch) | **100%여야 함** |

### R1-5-6. 뮤테이션 테스트 상세

| 변이 | 변이 내용 | 기대 실패 |
|------|----------|----------|
| MUT-1 | v8prep에서 `c.maDq=0` 초기화 제거 | 구버전 세이브 로드 후 absorb 시 `undefined + t.D = NaN` → crash 또는 NaN 전파 |
| MUT-2 | fqDerive에서 `maNC = 0`으로 고정 | K1 분기 차입 증감 = 1,118 (보정 안 됨) ≠ 0.20 |
| MUT-3 | fqDerive에서 `grNC = 0`으로 고정 | K6 은행 분기 차입 증감 = 49 ≠ 0 |
| MUT-4 | G.tender에서 `c.lboq += P*.7` 누락 | K4 타겟 차입 증감 = 5,055 ≠ 0.45 |
| MUT-5 | kill에서 `delete c.maR` 누락 | kill 후 stale maR이 잔존, 부활한 회사(?)에서 잘못된 보정 |
| MUT-6 | earn에서 `c.maDq = 0` 리셋 누락 | 다음 분기 maDq가 이전 분기 값 + 새 값으로 이중 누적 |

---

## R1-6. GPT 판단이 필요한 사항 — 확정 정책 반영 {#r1-6}

> 아래는 R1 초안에서 GPT-6에게 판단을 요청한 4건이다.
> RT-FIN-CF-03A-DESIGN-PUBLISH 시점에 GPT-6 개발 전략실이 다음 정책을 확정했다.

### R1-6-0. 확정 정책 (GPT-6 결정, PUBLISH 시점 반영)

| # | 확정 정책 | 설계 영향 |
|---|----------|----------|
| P1 | **신규 기업 인수와 기존 100% 자회사 흡수는 표시 유형을 구분한다.** | R1-1-4 대안 B 채택. absorb에 내부/외부 구분 필요 |
| P2 | **G.liq 내부 흡수는 '자회사 흡수·투자회수(순현금)'로 분리 표시한다.** | 현금흐름표에 별도 행 추가. "인수 순현금"과 구분되는 라벨 |
| P3 | **대상 회사 현금이 없는 LBO의 비현금 부채 증가는 현금 차입으로 분류하지 않는다.** | 기존 설계 유지 (lboNC로 차입에서 제거). 추가 변경 없음 |
| P4 | **금융기관 gr 문제는 FIN-CF-03B에 남긴다.** | grNC 보정을 FIN-CF-03A 범위에서 제외. 별도 작업으로 분리 |

#### P1·P2 구현 방향: G.liq 내부 흡수 분리

R1-1-4 대안 B를 채택한다. 구체적으로:

1. **absorb 시그니처**: `absorb(a, t, paidVal, cashPaid)` 유지 (5번째 파라미터 `internal` 추가 불필요)
2. **내부/외부 구분**: G.liq 호출처에서 absorb 전에 별도 pending 필드 또는 플래그로 구분
3. **표시 행**:
   - 외부 인수: **"인수 순현금"** (maNet) — maTick, G.merge, offer 경로
   - 내부 흡수: **"자회사 흡수·투자회수(순현금)"** — G.liq 경로
4. **장부 분리 방법 (2가지 후보)**:
   - 방법 A: maNetQ를 maNetQ_ext / maNetQ_int로 분리 → maR.net_ext / maR.net_int
   - 방법 B: maR에 `int` 플래그 추가, fqDerive에서 분리 계산
   - 구현 단계에서 확정 (설계 수준에서는 두 방법 모두 등식 보존)

**등식 보존 증명**: 기존 `maNet`을 `maNet_ext + maNet_int`로 분리해도:
```
dc = cfo − capex + cff_new + maNet_ext + maNet_int + oth_new
```
등식이 성립한다 (oth_new 정의에서 maNet 대신 maNet_ext + maNet_int를 차감).

#### P4 구현 방향: grNC를 FIN-CF-03B로 분리

FIN-CF-03A에서 grNC 보정을 구현하지 않는다. fqDerive에서:
```
grNC = 0    // FIN-CF-03A에서는 항상 0. FIN-CF-03B에서 c.kd ? q.gr : 0으로 활성화
```

이에 따라:
- 금융사(kd)의 gr은 여전히 차입 증감에 포함된다 (현행 동작 유지)
- FIN-CF-03A는 인수 비현금 부채(maNC), LBO(lboNC), 숨은 부채(hdNC)만 보정한다
- 원본 설계서 절 B-3 "금융 성장(gr) — 새 필드 불필요"의 내용은 FIN-CF-03B로 이관

### R1-6-1. Gemini C1·C2 회계 사례 정의 필요 (미결)

GPT-6 검토 항목 [6]에서 "Gemini C1·C2 회계 사례"를 테스트 조건으로 요구했으나, 해당 사례의 구체적 정의(시나리오, 입력값, 기대 출력)를 보유하고 있지 않다.

**요청**: C1·C2 사례의 다음 정보를 제공해 주기 바란다:
- 시나리오 설명 (어떤 거래가 발생하는가)
- 관련 회사의 초기 상태 (A, cs, D, kd 등)
- 기대 결과 (maDq, maNetQ, 보정 후 차입 증감, 인수 순현금)

제공되면 M 시리즈에 C1·C2를 추가한다.

### R1-6-2. G.liq 내부 흡수 분류 — ✅ 확정

~~R1-1-4에서 대안 A(통합 라벨)를 권장했다.~~

**확정: 대안 B 채택** (P1·P2). 신규 인수와 내부 흡수를 구분하며, G.liq 내부 흡수는 "자회사 흡수·투자회수(순현금)"으로 별도 행에 표시한다. 상세는 R1-6-0 P1·P2 참조.

### R1-6-3. LBO 비현금 부채 — ✅ 확정

**확정: 현금 차입으로 분류하지 않는다** (P3). 기존 설계(lboNC로 차입에서 제거) 유지. cfNote에 "게임 경제적 단순화" 문구를 포함할지는 구현 단계에서 결정한다.

### R1-6-4. 보정된 차입 증감 표시 시 음수 허용 여부 (미결)

보정 후 차입 증감이 음수가 될 수 있다 (K3: −0.14). 이는 비현금 부채를 제거한 후 부채 순감소를 의미한다. 음수 표시를 그대로 허용할지, 0으로 floor할지 판단을 구한다. 현행 설계는 음수를 그대로 표시한다 (실제 현금 상환이 있었으면 음수가 맞음).

### R1-6-5. 금융기관 gr 범위 — ✅ 확정

**확정: FIN-CF-03B로 분리** (P4). FIN-CF-03A에서는 grNC = 0으로 처리하며, 금융사의 예금/보험부채 성장(gr) 보정은 별도 작업에서 다룬다.

---

## 부록 R1: 원본 설계 대비 변경 사항 요약

| 원본 절 | R1 변경 | 변경 이유 |
|---------|---------|----------|
| A-1 (거래 테이블) | **변경 없음** | — |
| A-2 (LBO) | **R1-2로 보완** — 단계별 현금·부채·지분 추적, 게임 단순화 명시 | GPT-6 항목 [3] |
| B-2 (새 필드) | **변경 없음** — R1-4에서 상세 명세 표 추가 | GPT-6 항목 [5] |
| B-4 (pending 누적) | **변경 없음** — R1-3에서 호출처별 7개 질문 답변 | GPT-6 항목 [4] |
| E (LBO 접근법) | **변경 없음** (옵션 1 유지) — R1-2-3에서 경제적 단순화 명시 | GPT-6 항목 [3] |
| F (테스트 계획) | **R1-5로 보완** — Gemini C1·C2, 동시 발생, 내부 흡수, 저장 경계, FIN-CF-01/02 회귀, RNG 일치 추가 | GPT-6 항목 [6] |
| G (수정 제안) | **변경 없음** | — |
| H (커밋 분할) | **변경 없음** | — |

**설계 방향 자체의 변경은 없다.** 원본 설계의 필드 구조, 수식, 코드 수정 위치, 커밋 분할은 모두 유지된다. R1은 GPT-6이 요구한 분석·검증·명세를 보충한 것이다.

### PUBLISH 시점 확정 정책 반영

| 확정 정책 | 원본 설계 영향 | 변경 범위 |
|----------|--------------|----------|
| P1·P2: G.liq 내부 흡수 분리 표시 | D-5 표시 행에 "자회사 흡수·투자회수(순현금)" 행 추가 | 구현 단계에서 maNetQ 분리 또는 maR 플래그 |
| P3: LBO 비현금 = 차입 아님 | 기존 설계 유지 (변경 없음) | — |
| P4: gr → FIN-CF-03B 분리 | B-3 절 내용을 FIN-CF-03B로 이관, D-2의 grNC = 0 | fqDerive에서 grNC 항 비활성화 |

---

*끝*
