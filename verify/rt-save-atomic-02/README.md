# RT-SAVE-ATOMIC-02 (2026-11-01)

- 브랜치: `exp/rt-save-atomic-02`
- 출발점: `2b6200c2c6f455128ef4d938d41f79677344a05c`
- 실행은 모두 Claude가 이 작업 공간에서 했다.
- 바꾸지 않은 것: main·FIX·release-v25·Pages·APK, 금융 계산, A4R, F5, 지배권 알고리즘, 저장 형식. APK 네이티브 코드(Bridge)도 그대로다.
- 브라우저 확인은 Chromium(Playwright)에서 412×915 **화면 크기 에뮬레이션**으로 했다.
- Android는 JS stub(`window.Android.load/save`)만 썼다. 네이티브 `Bridge.save`의 동작은 smali 코드로 확인했다: 키 형식 `[a-z0-9]{1,24}`, 임시 파일에 쓰고 sync한 뒤 이름 변경, 예외가 나면 false. 실제 APK·WebView·Galaxy 실기기는 **NOT RUN**이다.

커밋 순서:
1. `93e3cc6`: 실패 테스트 먼저
2. `36e6818`: 수정
3. `b5ca558`: 기존 테스트 하네스 대기 보정
4. 이 검증 로그 커밋

## 수정 전 재현
- **A. 복원 중 입력**: 압축 완료를 2초 늦춰 `rsCommit`이 진행 중인 상태를 만들었다(`smoke_atomic02_on_base_2b6200c_2026-11-01.log`).
  - 이전 게임 화면(회사 T의 인수 탭)의 "+50%" 공개매수 버튼을 실제로 탭하면 **새 게임 B에서 공개매수가 실행됐다**: B의 현금 −1,586억, T를 100% 소유.
  - 이어서 성공 안내가 나왔지만 로컬 저장은 공개매수 전의 B였다. 게임과 저장이 서로 다른 상태다.
  - 커밋 중에 새 게임 화면이 그려졌다(render 1회).
  - 기기 저장이 실패하는 경우(I2)에도 "공개매수 성공" 안내가 먼저 나온 뒤 실패로 되돌아갔다.
- **A. 두 번째 복원** (노드 N5): B가 커밋되는 동안 슬롯 5를 불러오면 "세이브를 불러왔어요"가 표시되는데, 최종 게임과 로컬 저장은 슬롯의 C였다.
- **B. Android** (노드 N1~N3, 브라우저 I3): 조건은 `Android.load`가 A를 반환하고 `Android.save`는 false, localStorage는 정상이다.
  - 네 복원 경로 모두 성공 안내 → 재시작하면 A가 뜬다.
  - 슬롯 저장은 "저장했습니다"인데 다시 읽으면 이전 슬롯이다.
  - 자동 저장 `save()`는 true를 반환하지만 재시작하면 이전 상태다.
  - 원인: `stSet`은 네이티브 저장이 실패하면 localStorage에 쓰고 성공을 반환하는데, `stGet`은 네이티브를 먼저 읽는다.
- `G.mk`(N6): 세이브 가져오기의 불러오기 버튼 뒤의 `render()`는 게임 교체 전에 실행돼 이전 게임을 그린다. 수정 전에도 정상이었다.

## 수정 (`src/ui2.js`, `src/act2.js`)
- **입력 보류**: 커밋 중(`RSB`)에는 document capture 단계에서 click·dblclick·input·change·keydown·submit·touchstart·touchend·pointerdown을 멈춘다.
  - 탭하면 "불러오는 중이에요"만 표시된다.
  - Android 뒤로 가기(`andBack`)도 무시한다.
  - 티커(`tape`)는 다시 그리지 않는다. 게임 루프는 ATOMIC-01부터 이미 멈춰 있다.
  - 성공이든 실패든 커밋이 끝나면 입력이 돌아온다.
- **두 번째 복원 거부**: `rsCommit`이 진행 중이면 두 번째 요청은 "다른 불러오기가 진행 중이에요"로 실패한다. 상태는 건드리지 않고, 첫 번째 복원은 그대로 끝난다.
- **Android 읽기·쓰기 일치**: 네이티브 저장이 실패했는데 네이티브 사본이 있으면 실패를 반환한다. 이 경우 localStorage에 써도 다시 읽히지 않기 때문이다.
  - 네이티브 사본이 없거나(load가 null) 네이티브가 받지 않는 키이면 예전처럼 localStorage에 쓰고, `stGet`도 그쪽으로 읽는다.
  - 읽기 우선순위와 저장 형식은 그대로다.

## 수정 후
| 로그 | 결과 |
| --- | --- |
| `after_fix_t_save_atomic02_2026-11-01.log` | 9 ok, fails 0. 수정 전 7 FAIL(N1 ×4, N2, N3, N5). 최종 테스트를 2b6200c에서 다시 돌려도 7 FAIL |
| `smoke_atomic02_2026-11-01.log` (8 ok) | I1: 커밋 중 공개매수·3× 탭은 아무 효과가 없다("불러오는 중이에요"). 최종 B는 저장된 B와 같고 로컬 저장도 같은 B다. 커밋 중 render 0회. 끝난 뒤 탭은 정상 동작한다. I2: 실패 + A 유지, 탭 정상. I3: 실패 안내, 게임 A, 재시작 A |
| `full_suite_2026-11-01.log` | 38개를 하나씩 실행해 **38 PASS**. 기존 37개(Golden·K0·K7·K7b·캐시 ON/OFF 포함)와 신규 1개다 |
| `smoke_atomic01_regression_2026-11-01.log` | ATOMIC-01 원자성 스모크 10 ok. ATOMIC-01 README의 '11 ok'는 잘못 센 것이고 실제로도 10 ok였다 |
| `smoke_fix02_regression…` / `smoke_cloud_regression…` | 45 ok / 모의 클라우드 11 ok |
| `smoke_restore…` / `smoke_v24_v25_saves…` | 복원 4경로 ok(클라우드 NOT RUN) / v24·v25 저장 34 ok |
| `natural_hash_2026-11-01.log` | 101 `1e216748d6ec2b94`, 202 `0d4491041fef0226`, 303 `051019f8206254ef`, 캐시 OFF·ON 모두 같다 |

기존 테스트 변경(기대값은 그대로):
- `t_ctl_prefinal_fix02.js`의 파일 가져오기 하네스는 0ms 타이머 20번만 기다렸다. ATOMIC-01부터 복원이 기기 저장을 기다리므로, 이전 경우의 커밋이 끝나기 전에 다음 경우가 시작되고 있었다.
- ATOMIC-01에서는 겹친 복원이 그냥 통과했고, 이번 거부 규칙에서 드러났다.
- `RSB`가 0이 될 때까지 기다리도록 바꿨다. 2b6200c와 이번 수정 둘 다 통과한다.

## 남은 위험 / 실행 범위
- 입력 보류는 이벤트 capture 방식이다. 페이지 밖에서 들어오는 Android 호출은 막지 않는다: `andPause`는 저장 대기열만 쓰므로 안전하고, `andResume`은 속도만 되돌린다. 커밋 중 `andResume`이 오면 새 게임 속도가 바뀔 수 있다. 코드상 가능성이고 측정은 안 했다.
- 스크롤은 막지 않는다(화면만 움직인다).
- Android 저장 정책: 네이티브 사본이 있는데 네이티브 저장이 계속 실패하는 기기에서는 자동 저장이 진행되지 않는다. 예전에도 localStorage에만 쓰여 재시작 때 읽히지 않았으니 결과는 같고, 이제는 복원·슬롯 저장이 실패로 안내된다.
- 네이티브가 실패하는 실제 조건(디스크 가득, 권한)과 WebView의 localStorage 동작은 실기기에서 확인하지 않았다.
- NOT RUN: 실제 APK·Android WebView·Galaxy, 실제 클라우드 계정.
