# APK 빌드 도구 출처 (android/tools)

이 컨테이너는 npm·PyPI만 열려 있어서, 도구를 전부 그 두 곳의 패키지에서 꺼내 왔다. 같은 파일인지 sha256 앞 16자리로 확인한다.

| 파일 | sha256 (앞 16자리) | 출처 |
| --- | --- | --- |
| aapt2 | 1cf3df7b8a2e8d3d | PyPI `aapt2==0.2.1` 휠 안의 `aapt2/bin/Linux/aapt2` |
| apktool.jar | ceca3e49bfc697c9 | npm `apktool@2.0.3`의 `bin/apktool.jar` (smali·baksmali 포함) |
| android-framework.jar | da9774dcff5a57ee | 위 apktool.jar 안의 `brut/androlib/android-framework.jar` (aapt2 링크용 프레임워크 리소스) |
| d8jvm52f.jar | 213f21bccee1f9a1 | 아래 변환 과정으로 만든 D8 |
| SmaliB.java / .class | — | apktool의 SmaliBuilder를 부르는 한 줄짜리 래퍼 (smali → classes.dex) |

## 다시 받기
`python3 android/tools/provenance/fetch_tools.py` 하나로 위 파일을 전부 npm·PyPI에서 다시 받고(D8은 다시 변환), 해시를 확인한다.
2026-10-17 확인: 네 파일 모두 해시 일치(D8은 아래 make_d8.py로 따로 확인). SmaliB.class는 그 자리에서 컴파일하므로 해시 비교 안 함.

## d8jvm52f.jar 만든 방법
npm에는 JVM용 D8이 없고, Termux(안드로이드)용 `d8-termux@1.0.0`만 있다. 그 안의 `d8.jar`는 dex 형식이라 그대로는 JVM에서 못 돈다.
1. `d8.jar`를 apk 이름으로 감싼 뒤 PyPI `enjarify-adapter==1.0.2`(enjarify)로 JVM 클래스로 되돌린다 → `d8jvm.jar`
2. 클래스 파일 버전을 52(Java 8)로 맞춘다 → `d8jvm52.jar`
3. `provenance/fixcp.py`로 인터페이스 메서드 참조를 고친다(`provenance/extif.txt`는 JDK 쪽 인터페이스 목록) → `d8jvm52f.jar`

`provenance/make_d8.py`가 1~3을 그대로 한다. npm에서 받은 d8.jar로 1~3단계를 처음부터 다시 돌려 해시가 같은 것을 확인했다(2026-10-17, 약 70초).

스택맵이 없는 클래스라서 실행할 때 검증을 끈다: `java -XX:+UnlockDiagnosticVMOptions -XX:-BytecodeVerificationRemote -cp d8jvm52f.jar com.android.tools.r8.D8 ...`
(android/java2smali.py가 이렇게 부른다.)

## 앱 코드 빌드 흐름
```
android/java/*.java --javac --release 8--> .class --D8 --release --min-api 21--> classes.dex --baksmali--> proj/smali
proj/smali --SmaliB--> classes.dex ┐
proj/res, AndroidManifest --aapt2--> resources ├─ zip + 정렬 + v2 서명 (build_apk.py) → APK
proj/lib/arm64-v8a/*.so (native/README.md) ┘
proj/assets (mkassets.py: dist/raider.html + static/)
```
`python3 android/java2smali.py --check`로 Java 소스와 proj/smali가 같은지 확인할 수 있다(2026-10-16 확인: 같음).
MainActivity.smali와 Bridge.smali는 손으로 쓴 smali라서 이 스크립트가 덮어쓰지 않는다.
