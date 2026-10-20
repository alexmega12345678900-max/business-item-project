# 사업 아이템 기획 프로젝트

사업 아이템을 기획하고, 그 기획을 설명하는 웹 발표 자료를 만드는 팀 프로젝트입니다.

- **발표 사이트:** https://business-item-project.alexmega12345678900.workers.dev
- **마감:** 2026-10-23 (금)
- **주제:** 놓침제로(가칭) — 결제 문자 하나로 무료체험·구독·반품·보증기간의 기한을 대신 기억해 주는 웹앱
- **상태:** 발표 준비 1차 완료 — 기획서, 조사 자료 2건(시장·문제 근거, 사업성 계산), 발표 슬라이드 8장 + 부록 1장 (10분 발표)
- **발표 구조:** 기(문제) → 승(원인) → 전(해결: 기한 = 기준일 + 규칙) → 결(사업 가치)

## 폴더 구성

```
docs/plan.md      기획서 원본 — 모든 내용의 기준
docs/research/    조사 자료와 출처 (01 시장·문제 근거, 02 사업성 계산)
docs/발표-대본.md  10분 발표 대본 (슬라이드별 말할 내용과 시간)
docs/예상-질문.md  질의응답 대비 (사업성 숫자 포함)
docs/놓침제로-발표.pdf  인터넷이 안 될 때 쓰는 PDF 백업본
docs/survey.md    설문 초안 (보류)
site/             발표 사이트 (index.html 한 파일에 슬라이드가 있음)
```

기획서(`docs/plan.md`)를 먼저 고치고, 그 내용을 `site/index.html`의 슬라이드에 반영합니다.

## 슬라이드 수정하는 법

`site/index.html`에서 `<section class="slide">` 하나가 슬라이드 한 장입니다.
슬라이드를 추가하거나 순서를 바꾸려면 `<section>` 블록을 복사하거나 옮기면 됩니다.

로컬에서 미리 보기:

```bash
npx serve site
```

조작: `→` / `Space` 다음, `←` 이전, `Home` / `End` 처음 / 끝, 화면 좌우 클릭 또는 스와이프, `F` 전체 화면, `T` 밝게/어둡게.

PDF 백업본 다시 만들기 (슬라이드를 고친 뒤):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
  --print-to-pdf=docs/놓침제로-발표.pdf "file://$PWD/site/index.html"
```

## 팀원 작업 방법

```bash
git clone https://github.com/alexmega12345678900-max/business-item-project.git
cd business-item-project
git switch -c 내-작업-이름      # 새 브랜치에서 작업
# 수정 후
git add .
git commit -m "무엇을 바꿨는지"
git push -u origin 내-작업-이름
```

GitHub에서 Pull Request를 만들고, 확인 후 `main`에 합칩니다.
`main`에 합쳐지면 발표 사이트가 자동으로 갱신됩니다 (Cloudflare Workers, 1~2분 소요).
