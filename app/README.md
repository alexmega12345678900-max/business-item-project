# 놓침제로 앱 (기말 MVP)

- 주소: https://nochimzero.pages.dev
- 지표: https://nochimzero.pages.dev/stats.html (지표 키 필요, 팀 내부에서만 공유)
- 구성: Cloudflare Pages + Pages Functions + D1

## 하는 일

1. 결제 문자를 붙여 넣으면 기한 종류·기준일·기간을 찾아 마감일 계산 (규칙 기반)
2. 다가오는 기한 목록, D-day 표시 (이 브라우저에만 저장, 서버로 안 보냄)
3. 알림: 아이폰·맥 캘린더(.ics, 3일 전·하루 전 오전 9시) 또는 구글 캘린더에 넣기
4. 해지·반품·AS 방법 검색 바로가기
5. 홈 화면에 추가(PWA)

## 홍보 링크 만들기

채널마다 `?from=` 뒤에 이름을 붙여서 올립니다. 지표 페이지에서 채널별로 나뉘어 보입니다.

| 채널 | 링크 |
|---|---|
| 인스타 카드뉴스 A안 | https://nochimzero.pages.dev/?from=insta_a |
| 인스타 카드뉴스 B안 | https://nochimzero.pages.dev/?from=insta_b |
| 에브리타임 | https://nochimzero.pages.dev/?from=everytime |
| 학과 단톡 | https://nochimzero.pages.dev/?from=kakao |

## 팀원 테스트할 때

`https://nochimzero.pages.dev/?test=1`로 한 번 열면 그 브라우저는 지표에 안 잡힙니다. 되돌리려면 `?test=0`.

## 기록하는 것

방문, 기한 찾기, 등록, 알림 넣기, 방법 보기, 삭제, 홈 화면 추가, 공유. 익명 ID·채널·기한 종류만 남고 문자 내용·이름·IP는 남기지 않습니다.

## 배포

```bash
cd app
npx wrangler@latest pages deploy --project-name nochimzero --branch main
```

DB 구조는 `schema.sql`.

## 폰 앱 (안드로이드·아이폰)

웹 코드(`public/`)를 Capacitor 8로 감싼 앱입니다. 앱 안에서는 캘린더 대신 **폰 알림**이 마감 3일 전·하루 전 오전 9시에 울립니다. 지표에는 채널 `app_android`, `app_ios`로 잡히고, 알림 켜기는 "알림 넣기" 칸에 합쳐집니다.

- 안드로이드 설치 파일: https://nochimzero.pages.dev/nochimzero.apk (안드로이드 폰으로 사이트에 들어오면 "안드로이드 앱 받기" 버튼이 보임)
- 처음 설치할 때 "출처를 알 수 없는 앱 설치 허용"을 한 번 켜야 합니다.

### 다시 빌드하기 (맥)

```bash
cd app
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
npm run apk          # 안드로이드: public/nochimzero.apk까지 갱신
npx cap sync ios     # 아이폰: 그다음 npx cap open ios 로 Xcode에서 실행
```

웹을 고친 뒤에는 `npm run apk` → `wrangler pages deploy` 순서로 하면 사이트와 APK가 같이 갱신됩니다.

## 카드뉴스 A/B 올리는 법

같은 10장에 표지만 다릅니다 (디자인 캔버스 `놓침제로 카드뉴스`의 `01 표지`와 `01 표지 B안`).

| 안 | 표지 | 캡션 링크 |
|---|---|---|
| A안 | 초록 정보형 (D-day 목록) | https://nochimzero.pages.dev/?from=insta_a |
| B안 | 노란 공감형 ("헉… 또 결제됐네?") | https://nochimzero.pages.dev/?from=insta_b |

인스타 캡션에는 링크가 안 눌리므로 프로필 링크(또는 링크트리)에 두 주소를 따로 두거나, 스토리 링크 스티커로 각각 올립니다.
