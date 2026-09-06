# Calm workspace 디자인 변경

2026-09-07. `index.html`과 `guest.html`에 동일한 디자인 레이어를 추가했습니다.

## 즉시 비교 / 원복

사이드바 위의 **기존 디자인** 버튼을 누르면 기존 CSS로 즉시 돌아갑니다.
모바일에서는 오른쪽 위 메뉴를 열면 버튼이 보입니다.
**새 디자인**을 누르면 다시 새 화면을 사용할 수 있습니다.
선택은 이 브라우저에 저장되며 일정·메모·클라우드 데이터와 별개입니다.

## 코드 전체 원복

변경 전 기준: `backup/before-calm-design-20260907`, `d922529`.
디자인 브랜치: `design/calm-workspace`.
작업 폴더에 추가 수정사항이 없다면 다음 명령으로 원본을 열 수 있습니다.

```powershell
git switch backup/before-calm-design-20260907
```

새 디자인을 다시 열려면:

```powershell
git switch design/calm-workspace
```

추가 작업이 있는 경우 먼저 커밋하거나 보관하세요. `reset --hard`나 `clean`은 필요하지 않습니다.

## 변경 내용

- 따뜻한 뉴트럴 배경과 초록색 포인트, 불투명한 표면
- 더 큰 제목·본문과 여유 있는 일정 목록, 오른쪽 보조 달력
- 선택 날짜와 남은 일정 수가 표시되는 대시보드 제목
- 모바일 배치, 다크모드 대비, 포커스 테두리, 브라우저 확대 허용
- 기존 CSS와 업무 데이터 처리 로직 보존

## 확인

- 두 HTML의 모든 인라인 JavaScript 구문 검사 및 `git diff --check` 통과
- 계정 연결을 제거한 별도 로컬 테스트 사본에서 일정 추가, 하루 미루기, 다음 날 조회, 완료 처리, 메모 추가 확인
- 데스크톱 / 390px 모바일 / 다크모드 화면 확인
- 기존 디자인 전환과 새로고침 후 유지 확인
- Google OAuth와 실제 Supabase 동기화는 검증하지 않았으며 수정하지 않음
- 사용자 승인 후 master에 반영. 운영 배포 여부는 호스팅 서비스에서 별도 확인 필요.

## 디자인 참고

차분한 색과 타이포그래피 중심의 방향을 참고했으며, 특정 스타일을 인기 1위라고 전제하지 않았습니다.

- https://www.creativebloq.com/design/canvas-2026-trend-predictions-have-filled-me-with-hope
- https://www.moburst.com/blog/top-mobile-web-design-trends/

운영 브랜치에서 디자인 변경을 취소하려면 디자인 커밋에 대해 git revert 77d4f08을 실행하고 master를 푸시합니다. 후속 변경이 있으면 충돌을 먼저 검토하세요.
