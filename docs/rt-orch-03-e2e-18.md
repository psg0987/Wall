# RT-ORCH-03-E2E-18 — D0 문서 (DO NOT MERGE)

## 개요
- 작업 ID: `RT-ORCH-03-E2E-18`
- 관련 Issue: #46
- 기준 main SHA: `27abe48fd426a59148e528a3d11c87f64f29dd04`
- 작업 브랜치: `exp/rt-orch-03-e2e-18`
- 변경 범위: 이 문서 `docs/rt-orch-03-e2e-18.md` 1개 신규 생성만 허용. 게임·금융·테스트·Golden·CI·Ruleset·워크플로 변경 없음.

## RT-ORCH-WORK-27 목표
**GPT Work 자동 리뷰가 자신의 실행에서 GitHub에 진단 COMMENT를 직접 게시하는지** 확인한다.

## 명시 사항
- Claude는 문서 1개를 생성하고 Draft PR을 여는 것만 허용된다.
- GitHub CI와 GPT 자동 리뷰는 각각 별도의 후속 이벤트이며, 이 문서는 그 성공을 미리 주장하지 않는다.
- 이 문서는 리뷰 결과 전달, Claude 수정 권한, 게시자 원본 인증, 안전한 연쇄 개발 완성을 증명하지 않는다.
- `DO NOT MERGE` / `NO DEPLOY` / `NO CLAUDE REPAIR`.
- GPT Work 진단 COMMENT에 `CLAUDE_MAY_FIX=false`가 있으면 그 결과로 자동 코드 수정을 하지 않는다.
- `MAY_DISPATCH_NEXT=false`, `MAY_MERGE=false`, `MAY_DEPLOY=false`.
- WORK-28: 이 설명 한 줄은 GPT Work의 synchronize 이벤트 리뷰와 진단 COMMENT 직접 게시를 확인하는 시험이며, Claude 수정·병합·배포 권한이 아니다.
