# 레이더 타이쿤 (Raider Tycoon)

Wall Street Raider(W$R) 스타일의 모바일 주식·M&A 경영 시뮬레이션.
웹(한 장짜리 HTML: 이 저장소의 `index.html`을 GitHub Pages로, 그리고 Claude 아티팩트로 게시)과 안드로이드 APK(`com.wsr.tycoon`)로 돈다.

## 규칙
1. **이 저장소가 원본이다.** 웹 페이지와 APK는 여기서 빌드한 결과물이고, 게시본을 직접 고치지 않는다.
2. 코드를 바꾸면 같은 변경 안에서: `python3 tests/run.py` 전부 PASS, 공식이 바뀌면 `docs/MODEL.md`, 항상 `docs/CHANGELOG.md`.
3. 고정 시드 결과(`tests/golden.json`)가 바뀌면 이유를 CHANGELOG에 적고 나서 `UPDATE_GOLDEN=1`로 갱신한다. 이유 없이 바뀌면 버그다.
4. **서명 키와 그 비밀번호는 저장소·zip에 넣지 않는다**(`android/keys/`는 .gitignore). 다른 키로 서명한 APK는 이미 설치된 앱을 업데이트하지 못한다.
5. 이 저장소는 공개다. `verify/*/expected_SEALED.json`은 블라인드 검산의 정답지라서, 검산을 맡은 AI에게 이 저장소 링크나 파일을 주지 않는다.

## 폴더
| 경로 | 내용 |
| --- | --- |
| `src/` | 게임 소스. `head.html`(스타일·마크업) 다음에 `base_v5.js`, `data.js`, `core.js`, `sim.js`, `act1.js`, `act2.js`, `ui1.js`, `ui2.js` 순서로 이어 붙인다 |
| `build/build.py` | `dist/raider.html`(게시용)과 `dist/game.js`(테스트용)를 만든다 |
| `build/site.py` | 루트 `index.html`(웹사이트)을 `dist/raider.html`로 다시 쓴다 |
| `index.html` | 웹사이트에 걸리는 게임 페이지(빌드 결과, 직접 고치지 않음) |
| `tests/` | node 테스트와 러너. 러너가 `Math.random`을 고정 시드로 바꿔서 결과가 매번 같다 |
| `docs/` | `MODEL.md`(공식과 가정), `VERIFY.md`(검증 기록), `CHANGELOG.md` |
| `verify/` | 블라인드 검산 사례(입력 / 봉인된 정답 / 받은 결과)와 비교 스크립트 `compare.py` |
| `android/` | 오프라인 APK 빌드. `proj/`(매니페스트·리소스·smali·엔진), `java/`(앱 소스), `tools/`(출처는 `TOOLS.md`), `static/`(폰트·wllama) |
| `native/` | 온디바이스 AI 엔진(llama.cpp) 빌드 방법 |

## 명령
```sh
python3 build/build.py                          # dist/raider.html, dist/game.js
python3 build/site.py                           # index.html (웹사이트) 갱신
python3 tests/run.py                            # 전체 테스트 (인자로 이름 일부를 주면 그것만)
UPDATE_GOLDEN=1 python3 tests/run.py golden     # 의도한 변화일 때만

# APK: 서명 키를 android/keys/wsr-tycoon-signing.p12에(또는 RAIDER_KEYSTORE), 비밀번호를 android/keys/keypass.txt에(또는 RAIDER_KEYPASS)
python3 android/java2smali.py                   # android/java를 고쳤을 때만
python3 android/mkassets.py
python3 android/build_apk.py 24 2.4 dist/raider-tycoon-2.4.apk
```
확인한 환경: Python 3.13(+cryptography 50), Node 22, JDK 21.

## 백업에서 되살리기
소스 백업 zip에는 큰 바이너리가 빠져 있다. 나머지는 이렇게 채운다.
1. `python3 android/restore_from_apk.py raider-tycoon-2.3.apk` → AI 엔진(.so), 폰트, wllama (출시한 APK에서 그대로 꺼냄)
2. `python3 android/tools/provenance/fetch_tools.py` → APK 빌드 도구 (npm·PyPI에서 받고 해시 확인)
3. 서명 키와 비밀번호 파일(keypass.txt)을 `android/keys/`에 넣기 (둘 다 따로 보관)

2026-10-17에 이 순서로 처음부터 되살려 APK를 다시 빌드했더니 배포본과 바이트 단위로 같았다.

## 지금 버전
웹 v23 · APK 2.3 (2026-10-16). 내용은 `docs/CHANGELOG.md`.

`월스트리트 레이더 타이쿤 (2).html`은 예전에 올린 옛 버전 파일이라 손대지 않고 둔다.

## 협업
계획과 역할은 Claude Docs 문서 "레이더 타이쿤 1년 개발 계획 · AI 3인 협업"에 있다.
- Claude: 구현·통합·테스트. 저장소에 코드를 쓰는 건 Claude 하나.
- GPT: 블라인드 검산(정답을 모르는 상태로 같은 입력을 계산), 설계·테스트 기준 검토.
- Gemini: 실제 시장 통계와 원작 자료 조사(출처 포함).
