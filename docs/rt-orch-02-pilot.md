# RT-ORCH-02 자동 리뷰 연결 시험

- 목적: Claude Code가 만든 Pull Request에 대해 ChatGPT Work의 RT-ORCH-02 자동 독립 리뷰가 실행되는지, GitHub 이벤트 전달을 검증한다.
- 게임 소스와 테스트는 변경하지 않았다. 이 문서 파일 하나만 추가한다.
- 사용자 승인 없는 병합·배포를 금지한다. 이 PR은 시험용이며 병합하지 않는다.
- synchronize 재시험: 2026-11-01, PR #6에 문서 한 줄을 추가하는 커밋으로 pull_request synchronize 이벤트를 발생시킨다.
RT-ORCH-02-FIX: GitHub 웹훅 조건 수정 후 이벤트 전달 재시험.
- 재연결 후 웹훅 재시험: RT-ORCH-02-RECONNECT-VERIFY-01.
- RT-ORCH-02-FIX-R2-VERIFY-01: R2 수정 후 GPT Work의 자동 독립 리뷰 수행 여부를 검증한다.
