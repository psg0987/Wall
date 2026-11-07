# RT-ORCH-WORK-37 — 가격 알림 중복 등록 방지 (Draft-only)

## 범위

- 기준 Wall main: `27abe48fd426a59148e528a3d11c87f64f29dd04`
- 작업방: 레이더 타이쿤 개발 전략실
- 변경 주체: GPT-6 + GitHub 연결 도구(Claude 구현/별도 독립 Claude 검토가 아님)
- 작업 브랜치: `exp/rt-orch-work37-price-alert`, 본 브랜치는 main으로 병합하지 않는다.
- 허용 변경: `src/act1.js`의 `G.alert` 등록 중복 제한, `tests/t13_ui.js` 기존 CI 등록 테스트 강화, `docs/CHANGELOG.md` 변경 기록, 본 경계 보고서.
- 범위 외: `src/sim.js`, 금융 수식, 주가 이동, 저장 스키마, 다른 UI 기능, Golden, workflows, `index.html`, APK, 배포/병합.

## 원인과 처리

기존 `G.alert`가 같은 종목·방향·숫자 임계치를 매 클릭할 때마다 `S.al.push`해 등록 슬롯을 소모했다. 이후 `src/sim.js`의 `S.al.filter`는 중복 개수만큼 별도 알림을 발생시킬 수 있다.

신규 코드에서는 계산된 `i, d, px`가 정확히 같은 예약이 이미 있으면 알림을 추가하지 않고 `이미 같은 가격 알림이 설정돼 있어요`를 출력한다. 서로 다른 방향·가격 임계치·회사 항목은 여전히 허용한다. 최대 30개 검사 순서, 기존 구조 `[{i,d,px}]`, 기존 저장 호환성, 기존 알림 발동 로직은 변경하지 않았다. 기존 저장 데이터에 남아 있는 중복은 마이그레이션하거나 임의로 삭제하지 않는다.

## 빌드 생성물의 **사전 불일치**

GitHub `main`의 현재 `src/head.html`+`src/base_v5.js`+7개 JS를 저장소 `build/build.py` 및 `build/site.py`의 결합 규칙으로 **읽기 전용 재구성하여 현재 `index.html`과 비교**한 결과, 변경 전부터 동일하지 않았다.

- 현재 `index.html`: JS 문자 길이 553112.
- 기존 소스 전체를 재조합한 `index.html`: JS 문자 길이 554547.
- 첫 불일치 지점: 문자 인덱스 89823. 기존 `src/sim.js`의 `RT-AUTO-RISK-07` 주석/구현 부근에서 차이가 시작됨.

따라서 새 가격 알림만 고치려고 `index.html`을 전량 재생성하면 A4R 등 **이번 작업의 범위를 벗어난 기존 소스 변경**이 공개 웹에 반영될 위험이 있다. `index.html`은 이번 Draft에서 건드리지 않았으며, 이 PR은 **빌드 동기화 문제가 해결되기 전에는 병합 불가**다. `tests/run.py`는 `src/`를 빌드해 `dist/game.js`를 검증하므로, CI 성공만으로 실제 웹 배포물 동치성을 주장해서는 안 된다.

## 검증

- 이전 WORK-35 원본 게임 코드에서 중복 등록·발동을 VM으로 직접 재현: 선행 8/8 PASS (현재 작업에서 재실행 근거로 카운트하지 않음).
- WORK-37 로컬 VM 독립 동작 테스트: Node 22 **9/9 PASS**. 정상 중복 차단, 기존 동작, 다른 종목/방향/가격, 한도 30, 저장 JSON 스키마 유지, 저장된 과거 중복의 안전한 발동.
- 기존 `tests/t13_ui.js`에 반복 등록·방향·다른 기준 가격·저장 복원 회귀 시나리오 추가. **GitHub Actions `full-suite` 완료 상태는 PR이 생성된 후 별도 확인**.
- 본 보고서와 로컬 테스트는 GitHub Actions/Claude 독립 리뷰의 대체 근거가 아니다.

## 차단과 완료조건

`CODE_CHANGED_IN_DRAFT=true`; `LIVE_MAIN_UNCHANGED=true`; `WEB_BUILD_EQUIVALENCE=BLOCKED_PREEXISTING_DRIFT`; `INDEPENDENT_CLAUDE_REVIEW=NOT_RUN`; `MERGE/DEPLOY=FORBIDDEN`.

완료하려면 (1) `index.html`과 소스의 기존 A4R 불일치 원인 및 출시 정책 결정, (2) 해당 기준 위에서 `build/build.py`·`build/site.py` 공식 재생성, (3) CI 최종 HEAD 통과, (4) Claude 등 별도 독립 리뷰, (5) 사용자 별도 병합·배포 승인 필요.
