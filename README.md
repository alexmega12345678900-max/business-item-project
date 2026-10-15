# 사업 아이템 기획 프로젝트

사업 아이템을 기획하고, 그 기획을 설명하는 웹 발표 자료를 만드는 팀 프로젝트입니다.

- **발표 사이트:** _(Cloudflare Pages 연결 후 추가)_
- **마감:** 2026-10-23 (금)
- **상태:** 주제 선정 중

## 폴더 구성

```
docs/plan.md      기획서 원본 — 모든 내용의 기준
docs/research/    조사 자료와 출처
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

조작: `→` / `Space` 다음, `←` 이전, `Home` / `End` 처음 / 끝, 화면 좌우 클릭 또는 스와이프.

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
`main`에 합쳐지면 발표 사이트가 자동으로 갱신됩니다. 브랜치마다 미리보기 주소도 생성됩니다.
