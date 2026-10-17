# 온디바이스 AI 엔진 (libllamasrv.so / libllamasrv8.so)

APK 안의 `android/proj/lib/arm64-v8a/libllamasrv*.so`는 사실 라이브러리가 아니라 llama.cpp의 `llama-server` 실행 파일이야.
안드로이드는 `lib/` 안의 `.so`만 실행 가능한 위치(nativeLibraryDir)에 풀어 주기 때문에(`extractNativeLibs=true`) 이름만 그렇게 붙였다.
앱(Lm.java)이 자식 프로세스로 띄우고 `127.0.0.1`로 HTTP 요청을 보낸다.

| 파일 | CPU 대상 | 언제 쓰나 | sha256 (strip 후) |
| --- | --- | --- | --- |
| libllamasrv.so | ARMv8.2 + dotprod (`-mcpu=cortex_a76`) | 기본 | 5dfc9952c3017eec4cb58d707d710297a31152356f003e2fb87b0b8cc626f960 |
| libllamasrv8.so | + i8mm (`-mcpu=cortex_a76+i8mm`) | `/proc/cpuinfo`에 i8mm가 있을 때 (읽기 속도가 크게 빠름) | 9b464dd13f3eaffa10a0f456383b07c8a2c980647512b1f7c7414c0e7ee98f51 |

## 소스
- llama.cpp 커밋 `fcac19079f3f2985fe74ed845f0880e7e9a8030a` (2026-10-14)
- 패치 하나: `server-parent-watch.patch` — 환경 변수 `LLAMA_PARENT_WATCH`가 있으면 부모(앱)가 사라졌을 때 서버도 스스로 종료.

## 도구
- zig 0.17.0 (PyPI `ziglang==0.17.0`, `python3 -m ziglang`)로 aarch64-linux-musl 정적 빌드. 래퍼는 `native/zig/`.
  CPU 대상은 환경 변수 `ZMCPU`로 바꾼다(기본 `cortex_a76`).
- cmake 3.28, ninja 1.11, GNU strip 2.42(`aarch64-linux-gnu-strip`)

## 빌드
```sh
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp
git checkout fcac19079f3f2985fe74ed845f0880e7e9a8030a
git apply ../native/server-parent-watch.patch
Z=$PWD/../native/zig
for V in base i8mm; do
  [ $V = i8mm ] && export ZMCPU=cortex_a76+i8mm || export ZMCPU=cortex_a76
  cmake -S . -B build-$V -G Ninja -DCMAKE_BUILD_TYPE=Release \
    -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR=aarch64 \
    -DCMAKE_C_COMPILER=$Z/zcc-aarch64 -DCMAKE_CXX_COMPILER=$Z/zcxx-aarch64 -DCMAKE_ASM_COMPILER=$Z/zcc-aarch64 \
    -DCMAKE_AR=$Z/zar -DCMAKE_RANLIB=$Z/zranlib -DCMAKE_EXE_LINKER_FLAGS=-static \
    -DBUILD_SHARED_LIBS=OFF -DGGML_NATIVE=OFF -DGGML_OPENMP=OFF \
    -DLLAMA_CURL=OFF -DLLAMA_OPENSSL=OFF -DLLAMA_BUILD_TESTS=OFF -DLLAMA_BUILD_EXAMPLES=OFF \
    -DLLAMA_BUILD_SERVER=ON -DLLAMA_BUILD_UI=OFF
  cmake --build build-$V --target llama-server
done
aarch64-linux-gnu-strip -o libllamasrv.so  build-base/bin/llama-server
aarch64-linux-gnu-strip -o libllamasrv8.so build-i8mm/bin/llama-server
```
주의: `ZMCPU`는 ninja가 모르는 값이라, 같은 빌드 폴더에서 값만 바꾸면 다시 컴파일되지 않는다. 그래서 변형마다 폴더를 따로 쓴다.
2026-10-16에 이 방법 그대로 두 변형을 새 폴더에서 다시 빌드해서, strip한 결과가 위 표의 sha256과 바이트 단위로 같은 것을 확인했다.

## 앱이 띄우는 방식 (Lm.java)
`-m <모델> --host 127.0.0.1 --port <임의> -t <쓰기 스레드> -tb <읽기 스레드> -c <문맥, 보통 3072> -b 256 -ub 256 -np 1 --jinja -rea off --no-ui --no-slots -cram 0 -C <코어 마스크> -Cb <코어 마스크>`
환경 변수: `LLAMA_API_KEY`(앱이 매번 만드는 임의 키), `LLAMA_PARENT_WATCH=1`.
요청: `/v1/chat/completions` 스트리밍, `return_progress`(읽기 진행률), `chat_template_kwargs.enable_thinking=false`.

## 폰 측정 (S24 Ultra, Snapdragon 8 Gen 3, 쓰기 tok/s)
| 모델 | 4코어 | 6코어 | 8코어 |
| --- | --- | --- | --- |
| 1.2B | 35.1 | 31.1 | 11.8 |
| 2.4B | 19.6 | 18.6 | 4 |

8코어가 느린 건 효율 코어가 큰 코어를 기다리게 만들어서야. 그래서 튜너가 cpufreq로 큰 코어만 골라 마스크를 만든다.
