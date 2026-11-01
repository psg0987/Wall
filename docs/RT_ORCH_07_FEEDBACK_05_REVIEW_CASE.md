# RT-ORCH-07-FEEDBACK-05 — 격리된 정적 리뷰 반례

**D0 / test-only / NOT A PRODUCTION GATE / DO NOT MERGE**

## 목표
- Claude↔GPT 자동화에서 의미 있는 정적 리뷰 지적사항이 처음 발생하는 사례를 만들고, 해당 findings를 Work 원본에 묶어 재검증할 수 있는지 시험한다.
- `verify/rt_orch_07_feedback_05_review_fixture.py`는 리뷰 품질 확인용 독립 모듈이다. 실제 GitHub 신뢰 게이트, 게임 로직, CI, 배포 또는 사용자 승인에 사용하지 않는다.
- 검토자는 변경된 Python 코드를 직접 읽어 입력 검증, 40글자 SHA 동일성 계약, 경계 사례와 재현 가능한 반례를 판단한다. 문서상의 시험 목적을 PASS 근거로 삼지 않는다.

## 리뷰/안전 기준
- 리뷰 결과는 기존 `[RT-ORCH-REVIEW-PILOT]`의 **비공개 실행 기록**으로만 생성돼야 한다. 본 PR은 GPT 작성 격리 시험이며 Claude가 코드를 수정했다고 주장하지 않는다.
- 입력된 테스트용 SHA와 사용자 승인 문구는 실제 사용자 승인이나 실행 권한이 아니다.
- 등록된 `RT-ORCH-07 Repair Consumer Issue`는 현재 **기존 PR #30 조회에 고정된 DRY RUN**이므로 이 PR을 수정할 수 없고 수정해서도 안 된다.
- 발견된 P1/P2가 있더라도 별도 Work Publisher의 원본 인증·현재 HEAD 재검증·중복 처리와 사용자 승인 출처 없이 Claude 수정 Issue를 자동 발행하지 않는다.
- 운영용 Publisher는 findings 0건이면 NO_REPAIR_REQUIRED/NO_DISPATCH를 유지한다.
- 이 시험은 프로덕션 자동 병합, Ruleset 검사, 금융 로직 수정에 어떤 변경도 허용하지 않는다.

## 검증 기록
- 기준 main SHA: `27abe48fd426a59148e528a3d11c87f64f29dd04`.
- 실제 PR HEAD는 PR 생성 후 GitHub에서 재확인하고, Work가 종료 시 재조회해야 한다.
- GPT Work 정적 리뷰, GitHub full-suite, 재현 테스트 실행은 각각 별도 상태로 기록한다.
- 완료 조건: 새 PR에 대한 Work opened 자동 수신과 특정 SHA의 의미 있는 findings 보고. 실제 Claude write repair는 별도 승인 및 새로운 소비자 설계 전까지 **NOT RUN**.
