# RT-ORCH-04-C-R4 — 사용자 승인 권한·필수 검사 출처 감사

**상태: 실험/읽기 전용 진단. 운영 강제 게이트가 아니며 병합·배포 금지.**

## 2026-11-01 GitHub API 직접 확인

- 기준 `main`: `27abe48fd426a59148e528a3d11c87f64f29dd04`
- R3 Draft PR #19 HEAD: `b15bd5961318f0d9146f07b750c70cea42ce7c10`
- Ruleset `main-ci-protection` ID 26300434: active, 필수 체크 `full-suite` (GitHub Actions App 15368) 하나, 승인 리뷰 수 0.
- PR #19 체크 API: `full-suite` 상태 `in_progress`, 실험 `rt-orch-04c-live-gate` 실패. 양쪽 모두 App ID 15368로 표시됨. 동일 App ID만으로 신뢰한 워크플로와 공격자가 수정한 워크플로를 구별할 수 없음.
- PR #19의 새로운 `rt-orch-trusted-guard` 워크플로는 여전히 `main`에 없으며 Ruleset 필수 체크가 아님. **운영 검증을 했다고 주장하지 말 것.**

## R4 후보: 진단용 체크·Ruleset 출처 비교

`verify/rt_orch_r4_check_audit.py`는 GitHub REST를 통해 **따로 확보한 JSON 스냅샷**을 비교하는 offline 진단기:
- `ruleset`이 main에 active이고 `full-suite` 및 독립 게이트가 필수로 설정되었는지
- 실제 체크 결과가 해당 PR 최신 HEAD SHA와 정확히 일치하는지
- pending, skipped, neutral, cancelled, duplicated, wrong app, broken job link, fake workflow path/event/PR 번호
- GitHub Actions 실행 결과에서 `pull_request_target`이 기준 커밋에 귀속되었는데 이를 최신 PR HEAD 통과로 잘못 간주한 경우
- 외부 입력 JSON은 신뢰되지 않으므로 **일관성만 검사**. 출력이 `CONSISTENT_SNAPSHOT_ONLY`라도 병합 가능 판정은 아님.

## 아직 해결하지 못한 구조 문제

**P0: 사용자의 실제 승인 증명**
- GitHub Issue 작성자·PR 라벨·JSON의 `approved_by` 문자열은 충분한 승인이 아님.
- R3는 `main`에 pin된 승인 목록을 읽지만, **누가 승인 목록을 쓰는지** 검증하지 못함.
- 사용자 본인이 특정 Issue·위험도 C1·기준 SHA·허용 경로·PR HEAD를 명시적으로 승인하고, 이를 Claude/GPT가 작성한 PR과 별도 신뢰 채널에서 기록하는 프로세스가 필요.
- 승인 취소 또는 HEAD 변경 시 기존 승인 무효화. 승인 목록 갱신을 위한 별도 OWNER 유지보수 경로가 없으면 Ruleset 적용 후 교착 위험.
- 브랜치 권한/관리자 정책 확인 없이 GPT가 `main`에 승인 목록을 먼저 넣지 말 것.

**P0: 필수 검사의 실제 출처와 최신 SHA 귀속**
- GitHub 공식 문서상 필수 검사는 최신 HEAD 또는 test-merge SHA 기준으로 평가되며, `neutral`/`skipped`가 통과로 인정될 수 있음.
- `pull_request_target`은 일반적으로 workflow run SHA가 기준 브랜치 SHA. 독립 체크로 보고되고 Ruleset이 기대하는 SHA에 붙는지 **실제 검증 필요**.
- GitHub Actions App ID 15368은 같은 저장소의 모든 Actions 작업과 공유. **App ID만으로 가짜 동일 이름 체크를 차단했다고 결론 내리지 말 것.**
- 신뢰할 수 있는 체크 실행 출처가 확인되지 않으면 별도 신뢰 GitHub App/외부 승인·전용 보호 방식 검토. 새로운 유료 서비스는 기본 선택이 아님.
- 2026-11-01 기준 공식 GitHub Docs: 공개 저장소에 대한 `pull_request_target` 기본 이벤트 정책의 2026-12-02 적용 예고. 계정의 Actions 정책 화면에서 평가/강제 상태 확인이 필요. 임의로 예외 허용 설정 금지.

## 다음 단계 진입 조건

1. owner가 승인 기록의 작성·변경·철회 권한을 실제 통제하는지 확인
2. 신뢰 워크플로가 기준 브랜치에서 동작하고 PR HEAD 또는 test-merge SHA에 검사 결과가 올바르게 귀속되는지 증명
3. 동일 체크 이름 스푸핑이 기존 Ruleset을 우회하지 않는지 확인
4. 새로운 체크가 **실제로 GitHub Ruleset에서 필수**인 것을 확인
5. Golden/workflow/중복 PR/SHA 변경/기존 체크 취소·실패에서 Merge 버튼 비활성화 검증
6. 보호 경로 변경 시 유지보수 절차, 비용·AI 사용량 통제, rollback 확보
7. 모든 결과 동일 HEAD 정적 리뷰 후 사용자 별도 승인. **실제 merge/deploy는 다른 승인 작업**.

본 PR은 실험 브랜치만 사용한다. main, Ruleset, 기존 자동화, 배포, 금융 코드를 변경하지 않는다.

## 공식 근거
- https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks
- https://docs.github.com/en/pull-requests/reference/status-checks
- https://docs.github.com/en/rest/checks/runs
- https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target
