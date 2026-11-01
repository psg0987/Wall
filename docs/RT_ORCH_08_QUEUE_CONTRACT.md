# RT-ORCH-08-A — 작업 대기열 프로토타입 · 실행 안전 계약

**상태: OFFLINE ONLY / NO DISPATCH / NOT A PRODUCTION TRUST GATE**

## 목적과 대상

- [Issue #37](https://github.com/psg0987/Wall/issues/37): `RT-ORCH-08-A`.
- 기준 `main`: `27abe48fd426a59148e528a3d11c87f64f29dd04`.
- 기존 [PR #33](https://github.com/psg0987/Wall/pull/33)의 Claude `issues.opened` → 1줄 수정 → CI → GPT Work `synchronize` 읽기 전용 재리뷰 실증과 구분한다.
- 현재 코드는 **SQLite 로컬 상태만 갱신**하며 GitHub, Claude, GPT Work, 외부 HTTP/웹훅, Actions, 배포를 호출하지 않는다.
- `may_dispatch=false`, `approval_provenance=UNVERIFIED`는 모든 결과에서 의도된 불변식이다. 입력 JSON에 `approved_by` 또는 `owner_verified=true`가 있어도 인가 근거가 아니다.

## 파일

- `verify/rt_orch_queue.py`: 오프라인 SQLite 영속 대기열 + 콘솔 인터페이스.
- `verify/test_rt_orch_queue.py`: 40개 Python 단위/반례 테스트, 실제 실행.
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
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite stage --input input.json
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite claim --worker offline-test
python3 verify/rt_orch_queue.py /tmp/rt-orch08.sqlite snapshot
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

직접 실행한 40개 테스트는 다음을 포함한다.

- SQLite 파일의 영속 상태 및 재열기.
- 같은 DB에 두 스레드가 동시에 `claim`하여 정확히 하나만 성공.
- FIFO 작업 처리·두 작업의 단일 점유.
- 재시작 후 `CLAIMED` 무단 재실행 방지 및 수동 격리.
- 실패·stale SHA 시 전체 대기열 정지.
- 중복 이벤트 키·작업 ID·PR HEAD, 허용 범위 밖 파일, 경로 순회·다른 저장소 차단.
- 최대 수정 시도 2회, 순서 건너뛰기 및 Boolean/잘못된 SHA 거절.
- CLI의 JSON 입력·중복 오류 비정상 종료코드.

실제 테스트 실행 명령, 실행 환경 및 결과는 별도로 Issue/PR에 기록한다. GitHub `full-suite` 20개 JavaScript 테스트는 신규 Python 40개를 실행하지 않으므로 그 CI의 PASS로 대체하지 않는다.

## 운영 사용 전 해결할 차단 항목

1. **사용자 승인 출처**: Issue 작성자 `OWNER`, 자유 입력 JSON, PR 댓글은 인증된 수정을 승인하는 증거가 아니다. Work/Claude 서비스가 검증할 수 있는 신뢰된 별도 승인 저장소와 범위·취소/만료 관리 필요.
2. **GPT 리뷰 원본 인증**: Automations 실행 ID/대상 HEAD와 CI의 종료 상태를 실제 플랫폼 결과·GitHub API로 교차 확인하는 Publisher. 결과 원본에서 발견사항 스키마를 안전하게 정규화해야 한다.
3. **진짜 이벤트와 작업 실행기**: 현재 SQLite 파일은 오프라인 컨테이너에만 있다. GitHub 이벤트/Work/Claude의 서로 독립적인 클라우드 환경 간 공유 영속 저장소·최소 권한 연결기·멱등 발행 및 동시 실행 락 서비스가 없다.
4. **안전 게이트**: `main` Ruleset은 `full-suite`만 필수. GPT Work 독립 리뷰, 사용자 승인 진위, SHA/PR provenance 검증이 실제 필수 보호 상태가 아니다. 해당 정책 변경은 사용자 별도 승인 필요.
5. **실제 2개 연속 작업**: 승인된 D0/C1 최소 두 작업을 폰 사용 없이 실행하고 각 최신 HEAD·CI·GPT 재리뷰·중복 재시작 내성까지 확인한 증거 필요. 새로운 C1 게임 코드 변경은 파일별 사용자 승인 전까지 금지.
6. **운영 품질**: 장애 복구/백업, DB 손상 검출, 파일 잠금/NFS 멀티호스트 한계, 로그·비용 한도·실제 프로세스 크래시 시 지속 중지, 서비스 재시작 수동 해제 설계 필요. SQLite 로컬 트랜잭션이 분산된 GitHub/Claude/Work 서비스 전체의 원자적 트랜잭션을 제공하지 않는다.

**기존 Claude Routines 및 GPT Work 리뷰 자동화는 변경하지 않는다.** `main` 병합, Draft 해제, Ruleset·권한 변경, 빌드·배포는 여전히 사용자 별도 승인 사항이다. Gemini 자동 실행은 현 단계에서 제외하며, 향후 F2 회계 검증에 선택적으로 추가한다.