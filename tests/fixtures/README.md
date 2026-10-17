# 테스트 고정 파일

| 파일 | 내용 | 쓰는 테스트 |
| --- | --- | --- |
| `old_save_1ecdc53_seed12345_day440.wsr` | RT-BANK-001 수정 **전** 게임(커밋 `1ecdc53`, main)이 쓴 실제 저장 파일. 플레이어가 '세이브 내보내기'로 복사하는 형식(`packS(1)`: `WSR1:` + gzip + base64, 가격 기록·분기 재무 기록은 빠지고 불러올 때 다시 만듦). 시드 12345를 플레이어 조작 없이 440일 진행. 대기 대손 필드 `woq`가 없다. 431일에 은행 BOAX가 JYNR 법정관리로 286.97을 대손했고, BOAX의 다음 결산은 494일이다 | `t_bank_writeoff_cases.js` (TC-BANK-04) |

다시 만들기: `python3 verify/rt-bank-001/make_old_save.py` (git 기록 필요). 2026-10-17에 두 번 만들어 바이트 단위로 같았다.
sha256 `77c1708ba43fb94812daea4e3fa8b9c539d0b351ee4f1603189b6f57143fab4b`, 297,749바이트.
