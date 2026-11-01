# RT-ORCH-07-FEEDBACK-02 — GPT Work → Claude 수정 전달 대기열 (오프라인 시범)

**상태: Draft-only prototype. 실제 퍼블리셔·Claude 수정 수신자는 아직 연결되지 않았으며 병합·배포·Ruleset 변경 금지.**

## 직접 확인한 운영 기준
- main SHA: `27abe48fd426a59148e528a3d11c87f64f29dd04`.
- RT-ORCH-07-FEEDBACK-01 PR #26 HEAD: `8a4e9b832fe584f7963c1a0085d7d08c1259f00d`.
- 기존 GPT Work 자동화 `[RT-ORCH-REVIEW-PILOT]`은 **GitHub 쓰기 전면 금지**, 결과를 Work 비공개 실행 결과에만 전달하도록 설정되어 있음.
- 기존 Claude Code Document PR Builder는 GitHub `Issue opened`로 제한된 D0 문서 Draft PR을 새로 만드는 작업에 성공했으나 **기존 PR을 수정하는 소비자 동작은 없음**.
- PR #25 (Claude 자동 생성)는 GPT Work가 opened 이벤트를 수신해 검토했고, `full-suite` 최종 success 별도 확인.
- 현재 Ruleset #26300434의 required check는 `full-suite` 한 개. trusted GPT review check 미강제.

## 이번 신규 코드
- `verify/rt_orch_feedback_outbox.py`: 기존 R7-01 `inspect()`를 재사용해 수정 후보를 정규화. 결정적 SHA-256 전달 키를 생성, 원본 Issue, 최신 PR HEAD, Work run ID, P1/P2 정형 코드, 정확한 허용 경로를 묶어 **읽기 전용 계획**을 반환.
- `verify/test_rt_orch_feedback_outbox.py`: 20개 모의 반례. 누락된 기원 Issue, 허위 리뷰 출처, CI pending, 저장소·PR·SHA 불일치, 중복 전달/중단 상태, 스팸·명령문 삭제, 재시도 2회 상한, protected financial path 차단.
- 결과가 `STAGING_PROPOSAL_ONLY`여도 `may_publish=false`, `may_dispatch=false`. 사용자 승인이나 Work 검증 원본을 제공하는 기능이 없다.
- 실제 GitHub Blob SHA와 로컬 Python 검증 파일을 동일하게 대조한 뒤, 기존 31개+신규 20개 = **51/51 테스트 직접 실행 PASS**. GitHub Actions full-suite는 본 신규 Python 모듈을 자동 실행하지 않으므로 별도로 확인한다.

## 다음 운영 연결에 필요한 실제 조건
1. **신뢰할 수 있는 GPT Work 결과 전달자**: Work 플랫폼이 노출하는 인증된 run ID·PR 번호·리뷰 HEAD·서식화된 finding을 별도 쓰기 주체가 검증할 수 있어야 한다. Work 비공개 텍스트를 누구나 수정 가능한 GitHub Issue/PR 본문으로 그대로 복사하는 방식은 승인 근거가 아니다.
2. **사용자 승인된 수정 범위**: 대상 Issue와 PR, 허용 파일, 위험도, 재시도 제한을 Work/GitHub 텍스트만으로 자가 승인하지 말 것. 승인 출처 확인 불가 시 자동 수정 중단.
3. **Claude 수정 소비자**: 새 Issue 작성과 다르게, 동일 PR HEAD에서 제한된 변경을 한 뒤 `synchronize` 이벤트를 생성할 수 있는 별도 루틴 필요. source HEAD이 변했으면 무단 덮어쓰기 금지.
4. **중복 처리 영속화**: 현재 코드는 외부에서 읽어온 outbox 목록과 비교할 뿐 영속 기록·동시성 제어가 없음. atomic claim/CAS와 전달 기록 및 재시도 횟수를 외부 신뢰 저장소에서 보장해야 한다.
5. **실제 원인-수정-재검증 실험**: Work가 명시적 P1/P2 문제를 검증한 PR 1개에 한해 Claude 수정→CI→GPT Work 재리뷰까지 실험. 현재 실제 PR #25의 Work 리뷰에는 문제 0개였으므로 가짜 리뷰를 Work 결과라고 보고하지 않는다.
6. **GitHub Ruleset 강제**: 자동 병합 없이 Draft PR을 유지하며, trusted required check 미해결시 수동 승인을 계속 요구한다.

## 현재 자동화 범위와 미래 확장
- 1차는 Claude와 GPT만 사용한다. Gemini/Codex는 자동 실행에 포함하지 않는다.
- 미래 금융 관련 F2 작업에서만 `레이더 타이쿤 금융제도 검증실`, `레이더 타이쿤 금융·경제 연구실`, `레이더 타이쿤 경제 데이터 연구실`, `레이더 타이쿤 연구 종합실`을 작업별로 추가하도록 인계 스키마를 유지한다.
- 모든 main merge/deploy는 사용자 최종 승인, Work의 기존 read-only 정책 변경 없음.

## 독립성
- Python은 GPT가 작성하고 이 세션 컨테이너에서 실제로 실행했다. 기존 31개+신규 20개 모두 PASS. Claude 테스트 결과로 표현하지 않는다.
- 문서·Python 변경은 시험 Draft PR에만 존재한다. 신뢰된 GPT→Claude 자동 전달, 실 CI 신규 Python 테스트, 운영 게이트는 NOT VERIFIED/NOT IMPLEMENTED.
