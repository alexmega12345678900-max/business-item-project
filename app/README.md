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
