# RT-ORCH-07-FEEDBACK-01 — Claude↔GPT 자동 수정 피드백 계약 (실험)

**상태: OFFLINE CONTRACT ONLY / 연결·자동 실행 미구현 / 절대 병합·배포·Ruleset 변경 금지.**

## 이번 단계와 검증된 사실
- 2026-11-01 GitHub Issue #24 → Claude Code 자동 Draft PR #25 생성 → GPT Work opened 이벤트 자동 리뷰: 실연동 확인.
- GitHub Actions PR #25 full-suite run 41294036356는 이번 단계 조회에서 completed/success. 현재 main SHA 27abe48fd426a59148e528a3d11c87f64f29dd04.
- 기존 GPT Work 자동화는 **읽기 전용**, 리뷰 결과는 비공개 Work 실행 기록에 저장됨. GitHub/Claude로 자동 수정 요청을 게시하지 않음.
- 기존 Claude Routines는 새 Issue opened 기반 D0 문서 PR 생성용. 기존 PR에 대한 리뷰 수정 요청을 받아 같은 브랜치를 수정하도록 구현되지 않음.
- PR #25를 비롯한 실제 게임 소스 자동 수정 반복/무인 대기열은 아직 NOT VERIFIED.

## R7 계약 파일
- `verify/rt_orch_feedback_contract.py`: 네트워크/쓰기/외부 호출 없는 순수 입력 검사. GitHub에서 받은 것처럼 주어진 JSON 5개를 서로 대조할 뿐 진위 검증은 하지 않음.
- `verify/test_rt_orch_feedback_contract.py`: 리뷰 SHA 불일치, 잘못된 저장소, 비-Draft, 보호 파일, 잘못된 경로, 다른 PR, CI 불일치, 중복 HEAD, 재시도 초과, 위조된 승인 문자열 등을 다루는 모의 반례 테스트.
- 출력의 `CANDIDATE_ONLY`는 **수정 승인·작업 실행 지시 아님**. `may_dispatch=false`가 항상 유지되어야 함.
- 현재 허용 시험은 docs/*.md **정확히 1개 경로**만. C1 게임 코드·F2 회계·Golden·workflow·배포 경로는 이 계약에서 절대 자동 수정 요청을 만들 수 없음.

## 필수 다음 연결 설계
1. **사용자 사전 승인된 작업 대기열:** 허용 파일, 위험도, 수정 횟수, 원본 Issue, base/main SHA를 신뢰된 곳에 기록한다. Issue 본문 문자열이나 `approved_by`, `signed` 등의 필드를 단독 승인으로 쓰지 않는다.
2. **GPT Work 리뷰 발행:** 지금은 비공개 출력만 가능. 비밀키/토큰을 PR이나 문서에 놓지 않고 권한이 제한된 리뷰 전달 경로를 마련한다. 서명되지 않은 GitHub 댓글·PR 설명·외부 리뷰자 명의로 자동 수정 권한을 부여하면 안 된다.
3. **Claude 수정 수신자:** 원본 브랜치·HEAD SHA를 확인한 뒤 리뷰 코드(정형화된 P1/P2 항목)만 검토한다. 자유서술 텍스트를 shell 명령이나 권한 상승 지시로 실행하지 않는다. 인가된 1개 PR/변경 범위 밖은 차단.
4. **최신 HEAD 기준 자동 루프:** HEAD 이동/중복/경합을 차단, 2번 수정 후 종료·사용자 보고. 같은 파일을 다른 작업이 수정했으면 자동 덮어쓰기 금지.
5. **CI 완료 후 재확인:** GPT가 PR opened 시 CI=PENDING이라고 보고한 경우 자동으로 PASS로 바꾸지 말고 최신 HEAD의 종료된 full-suite를 확인한 뒤 별도 사용자용 상태 기록.
6. **실제 통합 시험:** 일부러 실패하는 D0/안전한 C1 시험에서 Work 지적 → Claude 실제 수정 → CI → Work synchronize 이벤트 재리뷰까지 동작을 직접 확인해야 한다.

## 보안 미완료
- GitHub 필수 검사는 여전히 `full-suite` 하나. 별도의 신뢰된 승인·review status 강제는 없음 (RT-ORCH-04-C 운영 NO-GO).
- 기존 Work 설정/Claude 루틴을 이번 실험에서 변경하지 않음. 따라서 자동 수정 루프는 절대 PASS 처리하지 않는다.
- 모든 병합·배포는 사용자 최종 승인. 사용자가 휴대폰을 사용하지 않는 동안에도 사전 승인된 Draft 작업만 진행하도록 제한.

## 향후 Gemini 확장
- 현재 자동 실행은 Claude + GPT만. Gemini 자동 호출 없음.
- 나중에 F2 변경에 대해서만 레이더 타이쿤 금융제도 검증실(회계), 레이더 타이쿤 금융·경제 연구실(이론), 레이더 타이쿤 경제 데이터 연구실(데이터), 레이더 타이쿤 연구 종합실(종합)을 선택적으로 연결.
- NotebookLM은 별도 원전 자료실.

## 작업 독립성
- 이 PR의 코드는 GPT가 GitHub 커넥터로 작성했음. GitHub Actions의 full-suite는 게임 회귀 테스트이며 이 신규 Python 검증기 테스트를 자동 실행한다고 주장하지 않음.
- 독립 정적 리뷰·검증기 단위 테스트·실제 Work→Claude 연결은 각각 완료 증거가 확보될 때만 완료로 표시한다.
