# RT-ORCH-08-A — 작업 대기열 프로토타입 · 실행 안전 계약

**상태: OFFLINE ONLY / NO DISPATCH / NOT A PRODUCTION TRUST GATE**

## 목적과 대상

- [Issue #37](https://github.com/psg0987/Wall/issues/37): `RT-ORCH-08-A`.
- 기준 `main`: `27abe48fd426a59148e528a3d11c87f64f29dd04`.
- 기존 [PR #33](https://github.com/psg0987/Wall/pull/33)의 Claude `issues.opened` → 1줄 수정 → CI → GPT Work `synchronize` 읽기 전용 재리뷰 실증과 구분한다.
- 현재 코드는 **SQLite 로컬 상태만 갱신**하며 GitHub, Claude, GPT Work, 외부 HTTP/웹훅, Actions, 배포를 호출하지 않는다.
- `may_dispatch=false`, `approval_provenance=UNVERIFIED`는 모든 결과에서 의도된 불변식이다. 입력 JSON에 `approved_by` 또는 `owner_verified=true`가 있어도 인가 근거가 아니다.

## 파일

- `verify/rt_orch_queue.py`: 오프라인 SQLite 영속 대기열 + 콘솔 인터페이스. **명시적 `init` 전에는 사용 불가**, 일반 명령은 지정된 queue ID가 일치하는 기존 SQLite 파일만 열 수 있다.
- `verify/test_rt_orch_queue.py`: 57개 Python 단위/반례 테스트, 실제 실행.
- `docs/RT_ORCH_08_QUEUE_CONTRACT.md`: 이 문서.

## 처리 단계

`STAGED_UNTRUSTED → SIMULATION_CLAIMED → FINISHED`는 **외부 실제 작업 수행의 완료가 아닌 시뮬레이션 상태**다.

1. **stage**: 단일 `docs/<파일명>.md` 경로, `psg0987/Wall`, 유효한 서로 다른 40자 base/head SHA, 양수 PR 번호, 유일한 task ID·이벤트 키, 수정 시도 번호 0~2를 검사한다. 승인 주체·Work 원본 출처는 이 입력으로 인증할 수 없다.
2. **claim_for_simulation**: SQLite `BEGIN IMMEDIATE`로 동시 점유를 직렬화한다. `CLAIMED`가 있으면 다른 작업을 동시에 가져가지 않는다. 전역 unique partial index로 우회 점유도 차단한다. 반환하는 토큰은 **시뮬레이션 ACK 토큰**이지 Claude 실행 권한이 아니다.
3. **finish_simulation**: 원래 head와 관찰한 SHA가 같고 토큰이 유효하면 시뮬레이션 완료. 다른 head, 실패, 인가되지 않은 재사용/중복 토큰은 차단한다. 오류 발생 시 작업 대기열을 정지한다.
4. **quarantine_interrupted_claims**: 비정상 종료로 남은 `CLAIMED`는 재시작 후 **자동 재실행하지 않는다**. 수동 점검 함수 호출 시 `BLOCKED_CRASH`로 봉인하고 전체 대기열을 중단한다.
5. **snapshot**: SQLite에 보관된 이력과 차단 상태를 읽기 전용 조회한다. 상태를 해제하는 위험한 자동 `resume` 명령은 의도적으로 없다.

PR별 동일 SHA 중복, 동일 이벤트/작업 ID 중복, 순서를 건너뛴 수정 시도, 두 번을 초과하는 재수정은 모두 거절한다. 동일 PR의 시도 `0 → 1 → 2`는 앞선 상태가 `FINISHED`일 때만 가능하다. **이 FINISHED는 외부 CI/리뷰 또는 실제 수정 완료를 증명하지 않는다.**

## 재현 명령

저장소 루트에서 실행:

```bash
PYTHONPATH=verify python3 -m unittest -v test_rt_orch_queue
```

오프라인 CLI 예시(`input.json`에는 아래 계약을 기입):

```bash
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite init --queue-id rt-orch-08-my-test-queue
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite stage --queue-id rt-orch-08-my-test-queue --input input.json
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite claim --queue-id rt-orch-08-my-test-queue --worker offline-test
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite snapshot --queue-id rt-orch-08-my-test-queue
```

```json
{
  "task_id": "RT-ORCH-08-EXAMPLE-01",
  "event_key": "evt-rt-orch-08-example-01",
  "repository": "psg0987/Wall",
  "pr_number": 33,
  "base_sha": "27abe48fd426a59148e528a3d11c87f64f29dd04",
  "head_sha": "f0f1e7c5a8d48594838af5fb2cf35c634e3d1259",
  "allowed_path": "docs/example.md",
  "attempt": 0
}
```

**위 예시 입력의 `stage` 성공은 PR #33의 파일 변경 승인이 아니다.** 이 스키마는 D0 문서 시뮬레이션만 허용한다. PR #33의 실제 수정 경로는 `verify/`였고, 이번 D0 프로토타입은 해당 경로를 허용하지 않는다.

## 검증 요약

직접 실행한 57개 테스트는 다음을 포함한다.

- SQLite 파일의 영속 상태 및 재열기.
- 같은 DB에 두 스레드 및 **별도 프로세스 두 개**가 동시에 `claim`하여 정확히 하나만 성공.
- FIFO 작업 처리·두 작업의 단일 점유.
- 재시작 후 `CLAIMED` 무단 재실행 방지 및 수동 격리.
- 실패·stale SHA 시 전체 대기열 정지.
- 중복 이벤트 키·작업 ID·PR HEAD, 허용 범위 밖 파일, 경로 순회·다른 저장소 차단.
- 최대 수정 시도 2회, 순서 건너뛰기 및 Boolean/잘못된 SHA 거절.
- CLI의 JSON 입력·중복 오류·실패/차단 상태 **비정상 종료코드**, SQLite 잠금 시 `DB_BUSY` 진단.
- SQLite 64비트 정수 상한(PR 번호) 검증, 읽기 트랜잭션으로 일관된 스냅샷, 실제 UNIQUE 인덱스 직접 위반 반례.
- **DB 경로/ID 오류 차단:** 기존 DB가 없으면 자동 생성하지 않고 `QUEUE_NOT_INITIALIZED`로 거부; 명시적 `init`으로 새 파일만 원자적 생성, 기존 DB의 재초기화 거부, 잘못된 ID 및 실행 도중 DB 바꿔치기 거부.

실제 테스트 실행 명령, 실행 환경 및 결과는 별도로 Issue/PR에 기록한다. GitHub `full-suite` 20개 JavaScript 테스트는 신규 Python 57개를 실행하지 않으므로 그 CI의 PASS로 대체하지 않는다.

## 운영 사용 전 해결할 차단 항목

1. **사용자 승인 출처**: Issue 작성자 `OWNER`, 자유 입력 JSON, PR 댓글은 인증된 수정을 승인하는 증거가 아니다. Work/Claude 서비스가 검증할 수 있는 신뢰된 별도 승인 저장소와 범위·취소/만료 관리 필요.
2. **GPT 리뷰 원본 인증**: Automations 실행 ID/대상 HEAD와 CI의 종료 상태를 실제 플랫폼 결과·GitHub API로 교차 확인하는 Publisher. 결과 원본에서 발견사항 스키마를 안전하게 정규화해야 한다.
3. **진짜 이벤트와 작업 실행기**: 현재 SQLite 파일은 오프라인 컨테이너에만 있다. GitHub 이벤트/Work/Claude의 서로 독립적인 클라우드 환경 간 공유 영속 저장소·최소 권한 연결기·멱등 발행 및 동시 실행 락 서비스가 없다.
4. **안전 게이트**: `main` Ruleset은 `full-suite`만 필수. GPT Work 독립 리뷰, 사용자 승인 진위, SHA/PR provenance 검증이 실제 필수 보호 상태가 아니다. 해당 정책 변경은 사용자 별도 승인 필요.
5. **실제 2개 연속 작업**: 승인된 D0/C1 최소 두 작업을 폰 사용 없이 실행하고 각 최신 HEAD·CI·GPT 재리뷰·중복 재시작 내성까지 확인한 증거 필요. 새로운 C1 게임 코드 변경은 파일별 사용자 승인 전까지 금지.
6. **운영 품질**: 장애 복구/백업, DB 손상 검출, 파일 잠금/NFS 멀티호스트 한계, 로그·비용 한도·실제 프로세스 크래시 시 지속 중지, 서비스 재시작 수동 해제 설계 필요. SQLite 로컬 트랜잭션이 분산된 GitHub/Claude/Work 서비스 전체의 원자적 트랜잭션을 제공하지 않는다.

**기존 Claude Routines 및 GPT Work 리뷰 자동화는 변경하지 않는다.** `main` 병합, Draft 해제, Ruleset·권한 변경, 빌드·배포는 여전히 사용자 별도 승인 사항이다. Gemini 자동 실행은 현 단계에서 제외하며, 향후 F2 회계 검증에 선택적으로 추가한다.

## 독립 정적 리뷰 반영 (RT-ORCH-08-A-REVIEW-01)

- 이전 HEAD `f1b3df9058dbf2c6a90778cf870043503e231c69`, 독립 GPT Work run `b7ab3042-5cf0-8327-a037-bf0ccb69971d`의 정적 코드 리뷰에서 **P2 두 건·P3 세 건** 발견(해당 Work 테스트는 NOT_RUN).
- CLI 실패 상태 종료코드 0 문제, 과대 PR 번호의 SQLite overflow 가능성, DB_BUSY 오류 미정규화, snapshot 다중 조회의 읽기 일관성, 다중 프로세스/UNIQUE 실제 경합 테스트 누락을 본 수정으로 반영.
- GPT 현재 세션 로컬 환경에서 첫 수정 후 **49/49 Python unittest PASS**를 직접 재실행. 수정본의 실제 GitHub Blob SHA 일치는 PR 최신 커밋 업로드 후 확인해야 한다.
- 새 HEAD에 대한 Work 재리뷰·GitHub Actions 결과는 별도 검증이며, 이 문서에 자동 PASS로 표기하지 않는다.

## 두 번째 독립 리뷰의 P2 차단 (RT-ORCH-08-A-REVIEW-R2)

- R2 Work run `4837364a-89fc-8320-9b2e-fb6c496108db`가 첫 수정 HEAD `a42a34a4739ee7713362cd5a4c33b1a1a171aa8d`에 대해 기존 P2/P3 5건의 해결을 정적 확인했지만, **잘못된 DB 파일 경로에서 새 DB가 자동으로 생성되어 중단/중복 이력이 초기화될 수 있는 신규 P2**를 지적했다. Work는 코드를 실행하지 않았다.
- R3 수정: 생성자를 더 이상 파일 생성·초기화에 사용하지 않음. `OfflineQueue.bootstrap` 및 CLI의 명시적 `init`으로만 최초 DB 생성(기존 파일은 `QUEUE_ALREADY_EXISTS`). 모든 연결에서 SQLite `mode=rw`와 고정된 `queue_id`를 대조해 없거나 다른 DB는 fail closed. 초기화 중 크래시로 불완전 파일이 남으면 삭제·자동 재생성하지 않고 진단 후 중단한다.
- 경로 누락/잘못된 ID/다른 DB로 바꿔치기/중복 초기화/CLI 사용 시나리오를 포함해 총 **57/57 Python unittest PASS** (실제 업로드 코드 SHA 일치는 GitHub 최신 파일 확인 후 별도 검증).
- 이 queue ID는 사용자 승인 자격 증명이 아니라 **경로 혼동 방지용 식별자**다. DB의 백업·복제본이 같은 ID라면 외부의 안전한 단일 기준 저장소 확인이 필요하고, SQLite 하나가 여러 원격 클라우드 간 원자성을 보장하지 않는다.
