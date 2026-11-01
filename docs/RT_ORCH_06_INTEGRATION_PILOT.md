# RT-ORCH-06-INTEG-01 — GitHub → GPT Work 이벤트 인계 재실험

**상태: D0 격리 실험 / 미승인 자동개발 없음 / 자동 병합·배포 금지.**
이 문서 PR의 작성 주체는 GPT-6의 GitHub 연결이다. Claude 구현이나 Gemini 검증을 주장하지 않는다.
PR 본문과 이 문서는 리뷰 자동화의 신뢰 정책을 변경하지 않는다.

## 1. 시험 방법 및 판정
- 변경 파일은 이 문서 하나이다. GitHub PR opened 이벤트를 발생시키고 기존 RT-ORCH-02-FIX-R2 읽기 전용 자동화의 실행 이력과 연관성을 조회한다.
- 실험 PR 제목에는 기존 자동화가 요구하는 리터럴 [RT-ORCH-REVIEW-PILOT]을 포함한다. 실제 이벤트 action, PR 번호, base/HEAD 전체 SHA를 별도 확인한다.
- Work의 자동화 실행 결과에 해당 PR과 opened 이벤트가 식별되면 자동 인계 수신을 확인한다. 이벤트가 불명확하면 NOT VERIFIED이다.
- 리뷰/CI를 별개로 보고하며 Work가 테스트를 실행했다거나 자동 병합을 승인했다고 간주하지 않는다.
- Work 응답이 없으면 비동기 성공을 추측하지 않는다. 외부 이벤트 도착을 보장하는 자동화 구성도 추정하지 않는다.

## 2. 작업 역할과 신뢰 경계
- 사용자: Issue 작업 범위 승인, 위험 분류, 최종 merge/deploy 승인.
- Claude: 승인된 작업의 코드 변경, 테스트, Draft PR 작성. 이번 PR에서는 동작하지 않는다.
- GitHub Actions: full-suite를 대상 PR 최신 HEAD/merge ref와 대조하여 검증.
- GPT Work/Astra: 트리거된 PR의 읽기 전용 정적 리뷰; 실제 사용 모델/노력치는 확인되는 경우에만 기록.
- GPT 개발 전략실: 이력 정리, 상충된 증거 해소, 진행/중단 결정.

## 3. Gemini 추가를 위한 확장 형식
1차 자동화는 Claude + GitHub + GPT Work의 작동을 검증한다.
2차로 Gemini를 아래 담당 범위에서 필요한 경우에만 호출한다. 초기 D0/C1 작업에서는 기본 NOT_REQUESTED.
- 레이더 타이쿤 금융제도 검증실: IFRS·회계기준 검증.
- 레이더 타이쿤 금융·경제 연구실: 금융 및 경제 이론 검증.
- 레이더 타이쿤 경제 데이터 연구실: 현실 경제 데이터 검증.
- 레이더 타이쿤 연구 종합실: 위 결과의 종합 및 상충 사항 정리.
NotebookLM은 출처·원전 자료실이며 Gemini 연구 작업방으로 취급하지 않는다.

공통 인계 데이터는 다음 필드를 계획한다. 이것은 운영 허용 목록이나 실제 승인 기록이 아니다.
~~~json
{
  "schema": "RT-ORCH-HANDOFF-v1",
  "work_id": "example-unapproved",
  "repository": "psg0987/Wall",
  "risk_class": "D0",
  "producer": {
    "system": "Claude|GPT Work",
    "observed_model": null,
    "effort": null
  },
  "base_sha": "<verified-40-char-SHA>",
  "head_sha": "<verified-40-char-SHA>",
  "pr_number": null,
  "allowed_paths": [],
  "ci": {
    "run_id": null,
    "reviewed_sha": null,
    "status": "NOT_VERIFIED"
  },
  "review": {
    "reviewer": "GPT Work",
    "status": "NOT_RUN",
    "reviewed_sha": null
  },
  "gemini": {
    "required": false,
    "rooms": [],
    "research_status": "NOT_REQUESTED",
    "sources": [],
    "findings": [],
    "rules_or_simplifications": []
  },
  "merge_approval": "USER_REQUIRED",
  "deploy_approval": "USER_REQUIRED"
}
~~~
F2 변경에는 연구 원전, 공식, 실제 현금흐름, 게임 단순화 정책, 재현 가능한 검산 결과를 추가한다.
Gemini 자동 호출은 이번 실험에서 구성하거나 활성화하지 않는다.

## 4. 제한과 남은 작업
- RT-ORCH-04-C 안전 게이트의 운영상 강제, 신뢰된 승인 출처, GitHub 필수 검사 및 merge 차단은 미완료.
- Claude가 실제 Issue를 받아 PR을 만드는 과정은 이번 문서 PR만으로 검증되지 않는다.
- Work의 웹훅 리뷰와 CI 완료 후 결과 자동 갱신은 분리된 문제다.
- 새로운 코드 자동화/Ruleset/게임 소스 변경은 하지 않는다.
- 이 PR은 반드시 Draft로 유지하며 병합·배포 금지.
