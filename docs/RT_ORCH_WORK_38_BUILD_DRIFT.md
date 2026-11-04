# RT-ORCH-WORK-38 — 웹 생성물과 게임 소스 불일치: 원인 확정 및 출시 차단 계약

**분석 완료 / 릴리스 NO-GO / 문서 전용 Draft / main·배포 불변**  
작성 기준: 2026-11-04 KST. 작업방: 레이더 타이쿤 개발 전략실 (GPT-6, High 선택 가능 시).  
관련: [Issue #56](https://github.com/psg0987/Wall/issues/56), [가격 알림 Draft PR #55](https://github.com/psg0987/Wall/pull/55).

## 1. 기준선과 결론

| 항목 | 정확한 식별자 |
|---|---|
| GitHub repo / 기준 main | `psg0987/Wall` / `27abe48fd426a59148e528a3d11c87f64f29dd04` |
| 현재 main의 루트 `index.html` blob | `037709b39e687f55d15f04973a1cad55d5141fbe` |
| 마지막 `index.html` 변경 커밋 | `21a0367e345bdf9ef4522b9de67dbdb169803e50` (2026-10-25 04:50:01 UTC) |
| `src/sim.js` pre-A4R blob / 현행 main blob | `1d710c4100d94e23d1d1f66de312d39eea70b334` / `e6125975baf3ee4730e621399cbe868294b1572b` |
| `src/ui1.js` pre-FIN-CF-03B blob / 현행 main blob | `c074d86cb6c611c0e31c901ef1c1b2fee6ef538a` / `062a5d61cba56129b6a258febe2e0c938facabfb` |
| PR #55 기준 / HEAD | `27abe48fd426a59148e528a3d11c87f64f29dd04` / `d2d8777861872df3c30bf45adf48c84764e3d7a0` (Draft·미병합) |

**ROOT_CAUSE=CONFIRMED:** `index.html`이 잘못 생성된 것이 아니다. 마지막 v24 생성 이후 `src/ui1.js`의 FIN-CF-03B와 `src/sim.js`의 A4R이 수정되었지만 `index.html`은 다시 빌드되지 않았다. 기타 게임 소스 모듈의 해당 스냅샷 차이는 없다.

**최종 상태:** `WORK38_ANALYSIS=COMPLETE`, `HISTORICAL_ARTIFACT_EXACT_MATCH=TRUE`, `GAME_SOURCE_TO_INDEX_DRIFT=TRUE`, `PR55_MERGE_READY=FALSE`, `WEB_RELEASE_READY=FALSE`.

## 2. 독립 재현 절차와 결과

GitHub API로 기준 main의 `index.html`·`src/head.html`·`src/base_v5.js`와 `src/data.js`, `core.js`, `sim.js`, `act1.js`, `act2.js`, `ui1.js`, `ui2.js` 원문을 직접 가져왔다. `build/build.py`와 `build/site.py`의 정확한 문자열 합성 순서, 줄바꿈, 웹 wrapper를 적용해 **메모리에서** `index.html`을 재구성하고 문자열 전체를 대조했다. 이 단계에서 로컬 Python 빌드 스크립트나 게임 테스트를 실행하지 않았다.

1. **현행 main 소스**로 재구성한 `index.html`: **554,547자**.
2. 저장소의 기존 `index.html`: **553,112자**, Git blob `037709b3…`.
3. 현행 `src/sim.js`만 A4R 도입 **직전** 커밋 `8b6ed6e6695e0d042836a54f301076c533b55d53`의 파일로, 현행 `src/ui1.js`만 FIN-CF-03B **직전** 커밋 `54389c27bcce586cc7835f3bcb9bb1b3215541c3`의 파일로 바꿔 다시 조합하면 **553,112자이며 현재 index와 전체 문자열이 정확히 일치**한다.
4. 역방향 검증: 기존 index 내부의 위 두 옛 소스 파일 텍스트만 현행 두 소스 텍스트로 바꾸면 현재 main의 전체 소스로 재구성한 index와 **정확히 일치**한다.
5. 두 파일의 문자 증가량도 `sim.js +852`, `ui1.js +583`, 합계 **+1,435자**로 전체 차이와 일치한다.
6. `index.html` Git blob은 2026-10-25 `v24` 후보 커밋과 현행 main에서 **같다**.

이는 원인을 두 파일의 변경으로 한정하는 강한 재현 증거다. **웹 브라우저 접속/배포본 실측, 실제 Python 빌드 실행, 해당 변경의 금융 독립 실험 재실행을 의미하지 않는다.**

## 3. 커밋 시점과 실제 기능 차이

| 시점 (UTC) | 커밋 | GitHub 직접 확인한 변경 |
|---|---|---|
| 2026-10-25 04:50 | [`21a0367e…`](https://github.com/psg0987/Wall/commit/21a0367e345bdf9ef4522b9de67dbdb169803e50) | v24/APK 2.4 릴리스 후보의 `index.html` 작성(메시지: no deployment) |
| 2026-10-25 09:12 | [`b93ace24…`](https://github.com/psg0987/Wall/commit/b93ace2413f7b1042e166c73665e10e8a63cbee6) | `src/ui1.js` FIN-CF-03B 회계 표시 변경 |
| 2026-10-25 09:30 | [`f86a2f47…`](https://github.com/psg0987/Wall/commit/f86a2f47fc5d7a1b3acdf1d3b3e7f13fe5c3c621) | 03B 검증 로그·문서 반영. 기록상 이후 main fast-forward 병합, **웹 게임은 v24 유지** |
| 2026-10-26 04:53 | [`b4219808…`](https://github.com/psg0987/Wall/commit/b4219808662a441aad596fd597c7f7a804c1ba55) | `src/sim.js` 비금융 기업 자동경영 A4R 도입, 게임 회귀 테스트 추가 |
| 2026-11-04 | `27abe48f…` | main 소스에는 두 변경이 존재하나 index blob은 v24 후보와 동일 |

**FIN-CF-03B 영향:** `fqDerive`가 금융기관의 결산 증가액 `q.gr` 중 자산·부채가 동시에 늘어 **현금이 오가지 않는** 부분을 `ncG`로 구분해 `cff = dD+nc-ncA-ncG-q.dv+iss`로 현금 차입·재무활동에서 제외한다. `full` 기록·실제 직전 결산·유한 `q.gr` 조건을 사용하며 화면에도 '예금·보험부채 증감' 메모를 표시한다. 게임 회계 표시 교정이지 새로운 현금 입출금이 아니다. v24 index는 기존 계산과 문구를 포함하므로 **표시된 현금흐름표 수치가 달라질 수 있다**.

**RT-AUTO-RISK-07 영향:** `autop`에 비금융·비지주 회사 한정 A4R 방어 규칙이 추가되었다. 신용등급, 순이익, 현금·성장격차에 따라 성장, 배당(0/15/30%), 자동 부채 상환, R&D를 조정한다. v24 index는 이전 A2 규칙만 포함하므로 **시뮬레이션 중 경영 결정·성과가 달라질 수 있다**. 은행/보험/지주회사는 이 A4R 분기의 대상이 아니다.

README는 `src/`를 게임 원본, `index.html`을 생성물로 정의한다. `docs/CHANGELOG.md`와 `docs/VERIFY.md`는 03B를 main에 반영하되 웹 v24는 유지했다고 기록한다. A4R 관련 변경 기록의 초기 '개발 브랜치·병합 전' 문구는 작성 시점 기록으로, **현행 main에 A4R 소스와 테스트가 들어간 사실을 뒤집지 않는다**.

## 4. WORK-37 가격 알림 PR과 회귀 검증의 적용 범위

[PR #55](https://github.com/psg0987/Wall/pull/55) HEAD `d2d8777861872df3c30bf45adf48c84764e3d7a0`은 `src/act1.js` 가격 알림 중복 등록 방지 및 등록된 `tests/t13_ui.js` 테스트를 추가했다. GitHub Actions [run #41770551697](https://github.com/psg0987/Wall/actions/runs/41770551697)은 해당 HEAD의 **full-suite 20/20 PASS, Golden 불변**이며 읽기 전용 GPT Work 정적 검토에서 보고 대상 결함 0건. **그러나 CI는 src에서 생성한 dist를 검사하므로 v24 index의 수정 반영을 보증하지 않는다.** 사용자 승인 없는 병합·배포 금지.

## 5. 출시 및 병합 권고 — 명시적 결정 게이트

**지금 채택할 안전한 운영 정책:** 현행 저장소 `index.html`의 v24 생성물 유지. 현행 `src/`를 원본으로 관리하되 두 기능의 게시 웹 반영을 **다음 별도 승인 릴리스의 기능 범위**로 분리. 가격 알림 PR #55도 소스 수정은 완료했지만 출시/병합 준비 완료로 승격하지 않는다.

| 선택지 | 판단 |
|---|---|
| A. 독립 출시 브랜치에서 현행 `src/` 전체로 공식 재빌드하고 FIN-CF-03B + A4R + WORK-37 가격 알림을 함께 출시 | **후보, 조건부 검토**. 웹의 금융 표시·자동경영 정책을 동시에 변경하므로 전체 diff·게임/저장/금융 검산·Golden·회귀·독립 리뷰 후 사용자 별도 병합·배포 승인 필수 |
| B. v24 index에 가격 알림 한 줄만 직접 패치해서 출시 | **NO-GO 기본값**. 생성물을 원본처럼 수정해 `src/`와 장기 불일치 고착; README 빌드 규칙 위반. 별도 명시적 예외 정책·재현 테스트 없는 자동 적용 금지 |
| C. 현행 `src/`에서 이미 반영된 A4R/03B 코드를 되돌려 index와 맞춤 | **NO-GO**. 개발 이력·승인된 금융 변경을 되돌리고 기존 20개 테스트의 기대값을 위협할 수 있음 |

**별도 승인 릴리스 게이트:**

1. 변경 범위 확정: 금융 UI와 A4R의 실제 게이밍 영향, WORK-37 알림 변경, 이전 버전 저장 호환성. A4R 독립 코드 리뷰 결과와 03B의 금융 오라클·검증 범위를 재확인.
2. 현재 main SHA와 대상 release SHA 고정. 새 릴리스 브랜치에서만 `python3 build/build.py` 및 `python3 build/site.py`를 실행해 `index.html`을 재생성하고, 소스/웹에서 해당 정책 동치성 비교.
3. 실제 `python3 tests/run.py` 전체 통과, `tests/golden.json` 불변, 변경 파일·HEAD·CI/독립 리뷰 별도 검증. 웹 생성물을 대상으로도 선택한 기능 회귀 테스트를 수행.
4. 공개 웹·APK 배포, main 병합, Draft 해제, CI/권한/Secrets·Ruleset 변경은 모두 별도 승인. 배포 없이 검증된 Draft까지만 자동 진행.

**이번 WORK-38에서 수행하지 않은 작업:** 게임 소스 수정, 웹 생성물 재생성, 새 금융 계산 실행, 기존 PR #55 수정·병합, main 수정, 실 웹 배포, 기존 Claude/GPT 자동화·CI/권한/Secrets 변경. 문서 전용 Draft와 Issue #56 기록만 허용.

**결론:** `ROOT_CAUSE=CONFIRMED`, `SOURCE_INDEX_POLICY=SOURCE_CANONICAL_AND_WEB_FROZEN`, `REL_CANDIDATE_REQUIRES_SEPARATE_APPROVAL`, `NO_MERGE_NO_DEPLOY`.
