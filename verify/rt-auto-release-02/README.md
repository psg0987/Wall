# RT-AUTO-RELEASE-02-CANDIDATE — 웹 v25 · APK 2.5 비배포 출시 후보 (2026-10-26)

기준 main `b4219808662a441aad596fd597c7f7a804c1ba55`(A4R 통합), 브랜치 `release-v25`. 모든 실행은 Claude 작업 공간에서 Claude가 했다. GPT-6 독립 출시 심사·사용자 최종 승인 전이며, Pages 갱신·APK 배포·main 변경은 하지 않았다.

| 파일 | 내용 |
| --- | --- |
| `full_suite_2026-10-26.log` | `python3 tests/run.py` 전체 20개, 20 PASS · 0 FAIL, exit code 0 (341초) |
| `verify_apk.py`, `verify_apk_2026-10-26.log` | apksigner 없이 APK 서명 블록을 직접 파싱: v2 RSA 서명 검증, 콘텐츠 다이제스트 재계산, 인증서 공개키 = 서명자 공개키, 인증서 SHA-256·패키지 비교(2.5 vs 2.4, 2.5 vs 2.3), APK 안 `assets/index.html` SHA-256 |
| `smoke_candidate.js`, `smoke_candidate_2026-10-26.log` | 후보 파일 자체(웹 `index.html`, APK `assets/index.html`)를 Chromium 412×915 모바일 화면에서 실행: 배포 중인 v24 페이지로 만든 실제 저장(자동 경영 켠 회사 포함)의 부팅 복원·가져오기 복원, 기존 고정 저장 2개 가져오기, 복원 후 300일 동안 모든 autop 호출을 기준식(RISK-06 A4R / A2)과 대조, 비금융 A4R·은행·보험 A2 유지·HOLD 0/0/0 강제 부실 확인, 자동 경영 OFF/ON. 37 ok · 0 FAIL |

다시 실행: `python3 build/build.py && python3 build/site.py && python3 android/mkassets.py`, `git show b4219808:index.html > v24.html`, `node verify/rt-auto-release-02/smoke_candidate.js v24.html index.html android/proj/assets/index.html`, `python3 verify/rt-auto-release-02/verify_apk.py dist/raider-tycoon-2.5.apk dist/raider-tycoon-2.4.apk`.

웹 페이지의 Google Fonts 요청은 작업 공간 네트워크 허용 목록에 막혀 실패한다(배포 중인 v24도 같음, 오프라인 폰트를 쓰는 APK 자산은 0건). 스모크는 이 실패를 따로 표시하고 페이지 오류로 세지 않는다.
