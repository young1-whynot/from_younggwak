# 폰 UI 프로토타입

브라우저에서 바로 돌아가는 아이폰 스타일 인터랙티브 프로토타입이에요.

- `index.html` — 홈 화면 (전화, 문자, 톡, 모먼트, 음악 등)
- `gallery.html` — 갤러리
- `assets/` — 사진, 아이콘, 배경화면, 음성 파일
- `lib/` — 화면을 그리는 스크립트 (Preact + 템플릿 런타임)

## GitHub Pages로 열기

1. 이 폴더 안의 파일을 전부 저장소에 올려요 (`index.html`이 저장소 맨 위에 있어야 해요).
2. 저장소 **Settings → Pages**에서 Source를 **Deploy from a branch**, 브랜치를 `main` / `(root)`로 두고 Save.
3. 1~2분 뒤 `https://아이디.github.io/저장소이름/` 으로 열려요.

## 내 컴퓨터에서 열기

파일을 더블클릭해도 대부분 열리지만, 안 되면 폴더에서 `python3 -m http.server` 실행 후 `http://localhost:8000` 으로 여세요.
