# 변경 기록 (최신이 위)

## 저장소 이전 (2026-10-17)
- 소스 전체를 GitHub 저장소 psg0987/Wall로 옮김. 웹사이트 `index.html`을 v23으로 교체(전에는 메뉴 스크롤 수정 전 버전).
- `build/site.py`(웹사이트 페이지 생성), `.nojekyll`(GitHub Pages가 파일을 그대로 내보내게).
- 키스토어 비밀번호를 코드에서 빼서 `android/keys/keypass.txt` 또는 `RAIDER_KEYPASS`로 읽게 함(공개 저장소라서).

## 검증만 (게임 변경 없음, 2026-10-17)
- GPT 블라인드 검산 1번 통과(verify/compare.py, verify/earn-case-1/gpt_result.json).
- 테스트 t_close_spec: 결산 7,381번을 문서 공식으로 다시 계산해 게임과 비교.
- 블라인드 검산 2번 봉인(verify/earn-case-2: 이월결손금·지분법 이익·현금 정리 갈래).
- GPT 블라인드 검산 2번 통과(17개 항목, 최대 오차 3.8e-09). compare.py가 게임 내부 중간값(game_intermediates.json)도 비교.

## v23 · APK 2.3 (2026-10-16)
- 부실 기업 자산 손상차손을 그 분기 순이익·EPS·재무제표에 반영(전에는 자산에서 바로 빠짐).
- 법정관리 부채 감면을 자본 거래로 기록(`er.cap`).
- 재무 탭 손익계산서에 '자산 손상차손' 줄(해당 분기가 있을 때만).
- 재무 탭 EPS 줄이 1만 원 이상이면 '억' 금액처럼 '1.56조'로 보이던 표시 버그 수정(원 단위로 표시).
- 테스트: 결산 돈 보존(t_clean_surplus), 손상차손 화면 표시·EPS 단위(t_impair_ui), 고정 시드 기준 결과(t_golden), 모든 테스트 시드 고정.
- MODEL.md: 결산 규칙 5개 보충(은행 이자·성장 자금, 회사채 만기·발행, 현금 정리 조건, 분식 분기), 등급 D 금리 모순 기록.
- 저장소 정리: README, native/README(엔진 재빌드 시 해시 일치 확인), android/TOOLS.md, android/java2smali.py(Java→smali 재현 확인).
- 소스를 패치 단계 없이 모듈 파일로 평탄화(빌드 결과가 v22와 바이트 단위로 같음을 확인한 뒤 수정 시작).

## v22 · APK 2.2 (2026-10-16)
- 종목 화면 매수·매도 버튼 높이 맞춤(참모 말풍선 스타일 이름 충돌).
