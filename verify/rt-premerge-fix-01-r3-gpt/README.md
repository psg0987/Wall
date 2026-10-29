# RT-PREMERGE-FIX-01-R3 — GPT-6 R3 패치 GitHub 통합 검증 (2026-10-29)

브랜치 `exp/rt-premerge-fix-01-r3-gpt-integration`, 출발 = R2 HEAD `d8f814f2ee618ac50d5a746a11c55196db71c037`. 입력 `RT_R3_EXACT_R2_PORT_2026-10-29.zip`(sha256 `3ca89ff1987a219db01209f980c7c16740c06626ac57a6d0093bedec92825b9d`): R2 기준 src blob 9/9 일치 확인, `R3_EXACT_R2_SOURCE_ONLY.patch`를 `git apply`로 수정 없이 적용(커밋 `8026c36`), 테스트 5개 그대로 복사·등록(28개). 기존 테스트·기대값 변경 없음. 모든 실행은 Claude가 이 작업 공간에서 했다. main·release-v25·Pages·APK 변경 없음.

| 로그 | 결과 |
| --- | --- |
| `full_suite_2026-10-29.log` | 28개 단독 실행: **27 PASS, 1 FAIL(`t_ctl_r3_property.js`)**, exit 1. Golden·K7·K7b·K0·R2 반례 PASS |
| `property_verbose_2026-10-29.log` | 그 FAIL의 원인: 테스트 요약이 `errs 0, fails 0`(쉼표) 형식이라 실행기(`errs N fails N`)가 인식하지 못함. 테스트 자체의 단언 실패 0 — 테스트 파일 한 줄 형식 수정 필요(이번에 고치지 않음) |
| `r3_tests_verbose_2026-10-29.log` | 나머지 R3 테스트 4개 상세 출력, FAIL 없음 |
| `audit_r3.js`, `audit_r3_2026-10-29.log` | 가짜 P 지배 순환 → 두 회사 AMBIG(`"?"`), `mine` false, `teOK` 차단, 자동경영 0회(120일), 복원(migrate+v8fix) 뒤 유지, 옛 가짜 P 라벨 저장 → 재검증으로 보류. **발견**: `ePay(보류 회사)` 직접 성공(권한 검사는 호출부 책임), `hqQ` 성장률 자율 조정이 보류 회사에도 작동, `optCp`·대출채권 매입·사건 인수자·행동주의 자사주 매입 필터가 `!mine`만 확인 |
| `rollback_r2_engine_2026-10-29.log` | R3 저장(`"?"` 포함)을 R2 엔진으로 열면 `"?"`가 30일 뒤에도 남고(옛 `root`가 `"?"`를 하나의 묶음으로 셈), `rootName("?")`이 엉뚱한 회사 이름을 표시 |
| `smoke_restore.js`, `smoke_restore_2026-10-29.log` | Chromium 412×915 에뮬레이션, 보류 회사가 든 저장: 자동 저장 부팅·슬롯·세이브 코드·파일 4경로 모두 보류 유지·`mine` false·자동경영 0회·페이지 오류 0. 클라우드 복원 NOT RUN |
| `smoke_v24_v25_saves_2026-10-29.log` | v24·v25 배포 페이지 저장 복원·탭 조작·A4R/A2/HOLD — 34 ok |
| `probe_r3_2026-10-29.log` | UX 프로브: 360일 상태 해시(P7) FIX와 동일(P7a·P7b는 main과도 동일) |

변경 범위: `src/core.js`(지배권 계산 재작성, `root`·`rootName`, v8fix 끝 silent 재계산), `src/sim.js`(보류 회사 제외 조건 6줄 — `autop`/A4R 동일), `src/ui2.js`(스왑 체결·조기 종료 권한 재확인, `privChk`).
