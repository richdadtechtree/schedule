# vibe. — 생산성 대시보드 프로젝트 설명서

> **버전**: v1.6.0 (2026-06-03 기준)  
> **마지막 업데이트**: 2026-06-18  
> **프로젝트 경로**: `/Users/leehyungjun/python work/schedule/`

---

## 📋 프로젝트 개요

**vibe.**는 한국어 기반의 프리미엄 올인원 생산성 대시보드 웹 애플리케이션입니다.  
단일 HTML 파일(`index.html`, 약 8,765줄)로 구성되어 있으며, Supabase를 백엔드로 사용하여 Google 로그인 및 클라우드 동기화를 지원합니다.

### 핵심 설계 철학
- **Single-File Architecture**: HTML + CSS + JS를 하나의 파일에 통합
- **Glassmorphism UI**: 투명 블러 효과, 그라디언트, 마이크로 애니메이션 적용
- **Cloud-First with Offline Fallback**: Supabase 동기화 + localStorage 캐싱
- **모바일 & 데스크톱 반응형**: PWA 지원, 모바일 하단 네비게이션 포함

---

## 🗂️ 파일 구조

```
schedule/
├── index.html                          # 메인 앱 (8,765줄, ~387KB) — 모든 기능 포함
├── local.html                          # 비 로그인(로컬 전용) 버전 — 구글 로그인/클라우드 동기화 없이 localStorage에만 저장
├── index3.html                         # 이전 버전 또는 테스트용 파일 (2,508줄)
├── sw.js                               # Service Worker (푸시 알림, 캐시 관리)
├── claude.md                           # 이 설명서
├── .claude/
│   └── settings.local.json             # Claude Code 권한 설정
├── .vscode/                            # VS Code 설정
├── supabase/
│   ├── functions/
│   │   └── send-push/
│   │       └── index.ts                # Edge Function: 푸시 알림 발송 (167줄)
│   └── migrations/
│       └── 20260504_push_subscriptions.sql  # DB 마이그레이션: 푸시 구독 테이블 + pg_cron
└── .git/                               # Git 버전 관리
```

---

## 🎨 디자인 시스템

### CSS 변수 (Design Tokens)

```css
/* 라이트 모드 */
--p: #6366f1;          /* Primary: Premium Indigo */
--p2: #d946ef;         /* Secondary: Premium Fuchsia */
--p3: #0ea5e9;         /* Accent: Sky Blue */
--acc: #10b981;        /* Success: Emerald */
--warn: #f59e0b;       /* Warning: Amber */
--danger: #ef4444;     /* Danger: Rose */
--info: #3b82f6;       /* Info: Blue */
--bg: #f8fafc;         /* Background: Very light slate */
--surface: rgba(255, 255, 255, 0.75);  /* Frosted glass 배경 */
--radius: 24px;        /* 카드 라운딩 */
--glass: blur(20px) saturate(190%);    /* 글래스모피즘 블러 */
```

### 폰트
- **Pretendard** (본문, 400~900): 한국어 최적화
- **Outfit** (로고, 제목, 700~900): 영문 디스플레이

### 다크 모드
- `[data-dark]` 속성으로 토글
- `localStorage('pne_dark')` 에 상태 저장
- 딥 슬레이트 배경(`#090d16`)에 밝은 텍스트 배색

---

## 🏗️ 아키텍처

### 프론트엔드 (index.html)

```
┌─────────────────────────────────────────────────┐
│  index.html                                     │
│  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   <style>    │  │       <body>             │ │
│  │  ~3,854줄    │  │  로그인 / 잠금 화면      │ │
│  │  CSS 전체    │  │  사이드바 + 메인 레이아웃 │ │
│  └──────────────┘  │  모달들 (Task/Memo/기타) │ │
│                    └──────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐│
│  │              <script>                        ││
│  │  ~4,900줄 JavaScript                        ││
│  │  ┌─────────────────────────────────────────┐ ││
│  │  │ System Logging & Diagnostics            │ ││
│  │  │ Supabase Config & Auth                  │ ││
│  │  │ Sync Logic (양방향 동기화)              │ ││
│  │  │ State Management (localStorage)         │ ││
│  │  │ View Renderers (8개 뷰)                 │ ││
│  │  │ Task/Memo CRUD                          │ ││
│  │  │ Pomodoro Timer                          │ ││
│  │  │ ASMR Audio Synthesizer                  │ ││
│  │  │ Weather API / Calendar                  │ ││
│  │  │ Voice Note (Web Speech API)             │ ││
│  │  │ Quick Capture (Command Palette)         │ ││
│  │  │ NLP Auto-Parse                          │ ││
│  │  │ Push Notifications                      │ ││
│  │  └─────────────────────────────────────────┘ ││
│  └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 백엔드 (Supabase)

| 구성 요소 | 설명 |
|-----------|------|
| **Supabase URL** | `https://phdyeiznernpuywsfcme.supabase.co` |
| **Auth** | Google OAuth 2.0 (Supabase Auth) |
| **Database** | PostgreSQL (Supabase) |
| **Edge Functions** | `send-push` — 푸시 알림 발송 |
| **pg_cron** | 1분/일별 스케줄로 Edge Function 호출 |
| **RLS** | Row Level Security (user_id 기반) |

### DB 테이블

| 테이블 | 주요 컬럼 |
|--------|-----------|
| `memos` | id, user_id, title, content, checklist, color, category, locked, checklist_items, updated_at |
| `tasks` | id, user_id, title, desc, category, priority, date, time, completed, repeat, weekdays, status, date_from, date_to, updated_at |
| `user_settings` | user_id, links, task_categories, memo_categories, pinned_memos, memo_lock_enabled, lock_pin, categories_updated_at |
| `push_subscriptions` | id, user_id, endpoint, p256dh, auth, created_at |

---

## ⚡ 주요 기능 상세

### 1. 대시보드 (Overview)
- **미니 캘린더**: 월별 보기, 일정 dot 표시, 대한민국 공휴일 표시 (2024~2027)
- **오늘의 일정**: 선택된 날짜 기반 필터링
- **진행률 바**: 카테고리별 일정 완료율 (5개 그리드)
- **핀 메모**: 최대 3개까지 대시보드에 고정 가능
- **인사이트 카드**: 오늘의 일정 분석 요약 자동 생성

### 2. 칸반 워크플로우 (Kanban)
- **3열 레이아웃**: 📋 할 일 → 🔧 진행 중 → ✅ 완료
- **Drag & Drop**: 드래그로 칸반 칼럼 간 이동
- **상태 자동 저장**: `task.status` 필드 (todo/doing/done)

### 3. 전략 매트릭스 (Eisenhower Matrix)
- **2×2 그리드**: 긴급+중요 / 중요 / 긴급 / 나중에
- **Drag & Drop**: 매트릭스 셀 간 이동으로 우선순위 재배치
- **자동 분류**: 우선순위와 D-day 기반 자동 배치

### 4. Smart Memo
- **다채로운 메모 카드**: 12가지 배경 색상 선택
- **카테고리 관리**: 기본 4개 + 사용자 커스텀 추가/편집/삭제
- **체크리스트 모드**: 메모 내 할일 체크리스트 지원 (진행률 바 포함)
- **메모 잠금**: 비밀번호(PIN) 보호, 기본값 `1234`
- **관련 메모 추천**: 일정 제목 키워드 기반 TF-IDF 유사 메모 팝업
- **Drag & Drop**: 카테고리 간 메모 이동
- **핀 기능**: 대시보드에 최대 3개 고정

### 5. 좋은글 모음 (Quotes)
- **명언/좋은글 수집**: 카테고리별 분류 (동기부여, 인생&지혜, 위로&힐링, 성공&습관)
- **랜덤 팝업**: 앱 시작 시 랜덤 좋은글 팝업 표시
- **Quick Capture**: 빠른 입력 모드 지원
- **DB 동기화**: `q_` 접두사 ID로 메모 테이블에 통합 저장

### 6. 리포트 (Analytics)
- **완료율 통계**: 전체/카테고리별 완료율
- **D-day 분석**: 임박한 일정 수
- **주간 패턴**: 요일별 일정 분포
- **메모 통계**: 카테고리별 메모 수

### 7. 강의 진도 (Lecture)
- **강의 카테고리 필터**: `📚 강의` 카테고리 일정 표시
- **강의 노트**: 강의 관련 메모 연결
- **전용 일정/메모 추가 버튼**

### 8. 시스템 설정 (Settings)
- **카테고리 관리**: 일정/메모 카테고리 추가, 편집, 삭제, 색상 지정
- **Quick Access 링크**: 사이드바 하단 빠른 접속 링크 관리 (기본: Naver, YouTube, Claude, Gemini, Threads)
- **다크 모드 토글**
- **시스템 잠금 PIN 변경**
- **메모 잠금 on/off**
- **데이터 백업/복원**: JSON 내보내기/가져오기
- **CSV 내보내기**: 일정 데이터 CSV 다운로드
- **시스템 진단**: 연결 상태, 로그 콘솔, 디버그 정보
- **데이터 초기화**: 비밀번호 확인 후 전체 데이터 삭제

---

## 🔄 데이터 동기화 흐름

### 로그인/동기화 프로세스

```
사용자 ─→ Google OAuth ─→ Supabase Auth
                            │
                            ▼
                    onAuthStateChange()
                            │
                    ┌───────┴───────┐
                    │  SIGNED_IN    │
                    └───────┬───────┘
                            │
                    syncFromSupabase()
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
          서버 메모     서버 일정    서버 설정
          가져오기     가져오기    가져오기
                │           │           │
                ▼           ▼           ▼
          dirty 체크    dirty 체크    타임스탬프
          병합 로직    병합 로직    비교 병합
                │           │           │
                └───────────┼───────────┘
                            ▼
                    save() → localStorage
                    render() → UI 갱신
```

### 동기화 규칙
- **Server-First**: 서버 데이터를 기본 신뢰 소스(Single Source of Truth)로 사용
- **Dirty Flag**: 로컬에서 수정 후 서버 동기화 전 `dirty: true` 표시
- **타임스탬프 기반 카테고리 병합**: `categories_updated_at` 비교
- **양방향 Upsert**: 저장 시 `supabase.from().upsert()` 사용

---

## 🔔 푸시 알림 시스템

### 구성 요소

| 컴포넌트 | 역할 |
|----------|------|
| `sw.js` | 클라이언트 Push 수신, 알림 표시, 알림 클릭 처리 |
| `send-push/index.ts` | Supabase Edge Function, 서버 측 Web Push 발송 |
| `push_subscriptions` 테이블 | 사용자별 구독 정보 저장 |
| `pg_cron` | 1분 간격: 15분 전 / 정시 알림, 매일 06:00 KST: 일정 요약 |

### 알림 유형
1. **15분 전 알림** (`vibe-15min`): 시간이 설정된 일정 15분 전 발송
2. **정시 알림** (`vibe-now`): 일정 시간에 맞춰 즉시 발송
3. **일일 요약** (`vibe-daily`): 매일 아침 06:00 오늘의 시간 없는 일정 요약
4. **클라이언트 알림** (`Notification API`): 브라우저 내 직접 알림

### Service Worker 동작
```javascript
// 푸시 수신 → 알림 표시
self.addEventListener('push', event => { ... });

// 알림 클릭 → 앱 포커스 또는 새 창 열기
self.addEventListener('notificationclick', event => { ... });
```

---

## 🎯 일정(Task) 데이터 구조

```javascript
{
  id: 'task_1718700000000_abc123',  // 타임스탬프 + 랜덤 해시
  title: '회의 참석',
  desc: '주간 팀 미팅',
  category: '💼 업무',
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  date: '2026-06-18',              // 단일 날짜
  time: '14:00',                   // 선택사항
  completed: false,
  repeat: 'none' | 'daily' | 'weekly' | 'monthly',
  weekDays: ['0', '2', '4'],       // 주간 반복 시 요일 (0=월 ~ 6=일)
  status: '' | 'todo' | 'doing' | 'done',  // 칸반 상태
  dateFrom: '2026-06-18',          // 기간 설정 시 시작일
  dateTo: '2026-06-25',            // 기간 설정 시 종료일
  dirty: false,                    // 서버 동기화 대기 여부
  updated_at: '2026-06-18T05:00:00.000Z'
}
```

### 날짜 유형
- **단일 날짜**: 특정 하루에 배치
- **기간 설정**: 시작일~종료일 범위에 걸쳐 표시 (모든 날짜에 노출)

### 반복 옵션
- `none`: 반복 없음
- `daily`: 매일 반복
- `weekly`: 매주 특정 요일 반복 (요일 선택)
- `monthly`: 매월 같은 날짜 반복

### 우선순위 색상
- 🔴 `HIGH`: `#ef4444` (Rose)
- 🟡 `MEDIUM`: `#f59e0b` (Amber)
- 🟢 `LOW`: `#10b981` (Emerald)

---

## 📝 메모(Memo) 데이터 구조

```javascript
{
  id: 'm_1718700000000_xyz789',     // 타임스탬프 + 랜덤 해시
  title: '회의록',
  content: '주요 논의 사항...',
  checklist: '항목1\n항목2\n항목3',  // 체크리스트 원본 텍스트
  color: '#e3f2fd',                  // 메모 배경색
  category: '📁 일반',
  locked: false,                     // 잠금 여부
  dirty: false
}

// 체크리스트 아이템 (별도 저장)
checklistItems = {
  'm_xxx': [
    { text: '항목1', done: true },
    { text: '항목2', done: false }
  ]
}
```

### 메모 색상 팔레트 (12가지)
| 색상명 | HEX |
|--------|-----|
| Yellow | `#fffde7` |
| Green  | `#e8f5e9` |
| Blue   | `#e3f2fd` |
| Pink   | `#fce4ec` |
| Purple | `#f3e5f5` |
| Cyan   | `#e0f7fa` |
| Orange | `#fff3e0` |
| Lime   | `#f1f8e9` |
| Coral  | `#fbe9e7` |
| Indigo | `#e8eaf6` |
| Lemon  | `#f9fbe7` |
| White  | `#ffffff` |

---

## 🎵 ASMR 포커스 사운드

Web Audio API 기반 **실시간 합성** 방식 (외부 오디오 파일 없음):

| 트랙 | 합성 방법 |
|------|----------|
| 🌙 Deep Lo-fi | 화이트 노이즈 + 저역 필터 + 느린 사인파 |
| 🌧️ Calm Rain | 핑크 노이즈 + 밴드패스 필터 |
| ☕ Cozy Cafe | 화이트 노이즈 베이스 + 랜덤 주파수 클릭/딸깍 |
| 🌲 Forest Walk | 브라운 노이즈 + 랜덤 새 지저귐(사인파) |
| 🌊 Ocean Waves | 화이트 노이즈 + 저역 진동 + LFO 볼륨 변조 |

---

## 🎙️ 음성 메모 (Voice Note)

- **Web Speech API** (`webkitSpeechRecognition`) 사용
- **언어**: 한국어 (`ko-KR`)
- **자동 종료**: 3초 무음 감지 시 자동 정지
- **변환 텍스트**: 인식 결과를 새 메모로 자동 저장
- **미리보기**: 실시간 인식 결과 사이드바에 표시

---

## ⏱️ 포모도로 타이머

- **기본 시간**: 25분 (사용자 변경 가능: 5~120분)
- **표시 위치**: 헤더 우측 칩 형태
- **기능**: 시작/일시정지/리셋
- **알림**: 타이머 종료 시 브라우저 알림 + 토스트
- **다음 일정 추천**: 타이머 종료 후 우선순위 높은 미완료 일정 자동 추천

---

## ⌨️ Quick Capture (Command Palette)

- **단축키**: `Ctrl+K` 또는 `Cmd+K`
- **NLP 자동 파싱**: 제목에서 날짜/시간/카테고리/우선순위 자동 추출
  - 예: `"내일 3시 회의"` → 날짜: 내일, 시간: 15:00
  - 예: `"모레 중요 보고서 제출"` → 날짜: 모레, 우선순위: HIGH
- **기간 설정**: 빠른 기간 칩 (3일, 7일, 14일, 30일)
- **카테고리/우선순위**: 드롭다운 선택

---

## 🔐 보안 기능

### 시스템 잠금
- **PIN 잠금 화면**: 4자리 숫자 PIN 입력
- **기본 PIN**: `1234` (설정에서 변경 가능)
- **숫자 패드**: 모바일 친화적 UI

### 메모 잠금
- **개별 메모 잠금/해제**: 메모 뷰어에서 토글
- **비밀번호 입력 모달**: 잠긴 메모 열 때 PIN 요구
- **글로벌 on/off**: 설정에서 메모 잠금 기능 전체 토글

---

## 🌤️ 날씨 & 대기질

- **OpenWeatherMap API** 사용 (Geolocation 기반)
- **표시 정보**: 위치명, 현재 온도(°C), 대기질 등급(좋음/보통/나쁨)
- **위치**: 헤더 좌측 칩 형태
- **캐싱**: `localStorage('pne_weather_loc')`에 위치명 저장

---

## 📅 캘린더 시스템

### 미니 캘린더 (대시보드)
- 월별 그리드 뷰
- 일정 있는 날 dot 표시 (카테고리 색상)
- 오늘 날짜 강조, 선택 날짜 하이라이트

### 7일 스트립 (헤더 하단)
- 오늘 기준 7일 가로 스크롤 칩
- 날짜 선택 시 전체 뷰 필터링

### 월간 팝업 캘린더
- 풀 페이지 월간 뷰
- 일정 목록 직접 표시
- 카테고리별 범례
- 공휴일 표시 (빨간색)

### 대한민국 공휴일 데이터
- 2024~2027년 고정/음력 공휴일 하드코딩
- 설날, 추석, 어린이날, 석가탄신일 등 대체공휴일 포함

---

## 📱 반응형 디자인

### 데스크톱 (769px+)
- **사이드바**: 호버 시 슬라이드 아웃 (기본 숨김, 20px 보임)
- **메인 영역**: 좌측 48px 마진
- **그리드**: 3열 태스크/메모 카드

### 모바일 (768px 이하)
- **사이드바**: 햄버거 메뉴로 토글
- **하단 네비게이션**: 고정 바 (대시보드, 칸반, 메모, 리포트, 설정)
- **모달**: 하단에서 슬라이드업 (bottom sheet 스타일)
- **터치 타겟**: 최소 44px
- **칸반**: 수평 스크롤 (snap)
- **매트릭스**: 1열 스택
- **Safe Area**: `env(safe-area-inset-*)` 적용

---

## 🔧 주요 함수 목록

### 초기화 & 렌더링
| 함수 | 역할 |
|------|------|
| `init()` | 앱 초기화 (세션 체크, 동기화, 렌더링, 알림 권한) |
| `render()` | 현재 뷰에 맞는 렌더 함수 호출 |
| `renderOverview()` | 대시보드 뷰 렌더링 |
| `renderKanban()` | 칸반 워크플로우 렌더링 |
| `renderMatrix()` | 아이젠하워 매트릭스 렌더링 |
| `renderMemosView()` | 메모 뷰 렌더링 |
| `renderQuotesView()` | 좋은글 모음 뷰 렌더링 |
| `renderAnalytics()` | 리포트 뷰 렌더링 |
| `renderLecture()` | 강의 진도 뷰 렌더링 |
| `renderSettings()` | 설정 뷰 렌더링 |

### 데이터 CRUD
| 함수 | 역할 |
|------|------|
| `saveTask()` | 새 일정 저장 / 수정 |
| `deleteTask()` | 일정 삭제 (기간/반복 일정 개별/전체 삭제 분기) |
| `toggleTask()` | 일정 완료 토글 |
| `saveMemo()` | 메모 저장 / 수정 |
| `deleteMemo()` | 메모 삭제 |
| `duplicateTask()` | 일정 복제 |
| `duplicateMemo()` | 메모 복제 |
| `save()` | 모든 데이터 localStorage에 저장 |

### Supabase 동기화
| 함수 | 역할 |
|------|------|
| `syncFromSupabase()` | 서버 → 로컬 전체 동기화 |
| `syncMemoToSupabase()` | 개별 메모 서버 업로드 |
| `syncTaskToSupabase()` | 개별 일정 서버 업로드 |
| `syncSettingsToSupabase()` | 설정(카테고리, 링크 등) 서버 업로드 |
| `deleteMemoFromSupabase()` | 서버에서 메모 삭제 |
| `deleteTaskFromSupabase()` | 서버에서 일정 삭제 |
| `handleSignIn()` | Google OAuth 로그인 |
| `handleSignOut()` | 로그아웃 (미동기화 데이터 경고) |

### UI 인터랙션
| 함수 | 역할 |
|------|------|
| `switchView()` | 뷰 전환 (overview, kanban, matrix, memos, quotes, analytics, lecture, settings) |
| `toggleDark()` | 다크 모드 토글 |
| `toggleLock()` | 시스템 잠금 |
| `openQuickCapture()` | Quick Capture 열기 (Ctrl+K) |
| `openMemoView()` | 메모 상세 보기 모달 |
| `openMonthPopup()` | 월간 캘린더 팝업 |
| `showToast()` | 토스트 알림 표시 |
| `autoParse()` | NLP 자동 날짜/시간 파싱 |

---

## 🗃️ localStorage 키 목록

| 키 | 저장 내용 |
|----|----------|
| `pne_tasks` | 일정 배열 (JSON) |
| `pne_memos` | 메모 배열 (JSON) |
| `pne_checks` | 체크리스트 아이템 (JSON 객체) |
| `pne_cats` | 일정 카테고리 색상 맵 (JSON) |
| `pne_memo_cats` | 메모 카테고리 색상 맵 (JSON) |
| `pne_quote_cats` | 좋은글 카테고리 색상 맵 (JSON) |
| `pne_quotes` | 좋은글 배열 (JSON) |
| `pne_pinned_memos` | 핀 고정된 메모 ID 배열 (JSON) |
| `pne_dark` | 다크 모드 상태 ('1' 또는 null) |
| `pne_pin` | 시스템 잠금 PIN (문자열) |
| `pne_memo_lock` | 메모 잠금 활성화 여부 ('true'/'false') |
| `pne_weather_loc` | 날씨 위치명 (문자열) |
| `pne_cat_updated_at` | 카테고리 마지막 수정 시간 (ISO) |

---

## 🚀 실행 방법

### 로컬 개발
```bash
# VS Code Live Server 사용 (권장)
# 1. VS Code에서 index.html 열기
# 2. Live Server 확장 실행 → http://localhost:5500

# 또는 Python HTTP 서버 사용
cd "/Users/leehyungjun/python work/schedule"
python3 -m http.server 5500
# → http://localhost:5500 접속
```

> ⚠️ **주의**: Google OAuth 로그인은 `file://` 프로토콜에서 작동하지 않습니다.  
> 반드시 `http://` 또는 `https://`로 접속해야 합니다.

### 배포
- **정적 호스팅**: Vercel, Netlify, GitHub Pages 등에 `index.html` + `sw.js` 배포
- **Supabase**: 별도 설정 필요 없음 (이미 클라우드 호스팅)

---

## 📌 기술 스택 요약

| 분류 | 기술 |
|------|------|
| **프론트엔드** | Vanilla HTML/CSS/JS (Single File) |
| **UI 프레임워크** | 없음 (순수 구현) |
| **CSS 스타일** | Glassmorphism, CSS Variables, Media Queries |
| **백엔드** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **인증** | Google OAuth 2.0 (Supabase Auth) |
| **알림** | Web Push API + Service Worker |
| **오디오** | Web Audio API (실시간 합성) |
| **음성 인식** | Web Speech API (한국어) |
| **스케줄링** | pg_cron (PostgreSQL) |
| **날씨** | OpenWeatherMap API |
| **폰트** | Google Fonts (Pretendard, Outfit) |

---

## 📝 개발 이력 (Git 커밋 요약)

| 날짜 | 주요 변경 |
|------|----------|
| 2025-05-12 | 초기 구축: 메모, 녹음 메모, 로그인 문제 해결 |
| 2025-05-12 | 메모 카테고리 null constraint 동기화 버그 수정 |
| 2025-05-12 | 빌드 버전 태그 진단 기능 추가 |
| 2026-06-02 | 다수 기능 업데이트 (5개 커밋) |
| 2026-06-03 | v1.6.0 릴리즈 (2개 커밋) |
| 2026-06-04 | 화면 개선 및 최종 조정 (3개 커밋) |

---

## ⚠️ 알려진 제한사항 & 주의사항

1. **단일 파일 구조**: 8,765줄로 대규모 — 향후 모듈 분리 권장
2. **Supabase 키 노출**: `anon` 키가 클라이언트에 포함 (RLS로 보호되지만 민감 데이터 아닌지 확인 필요)
3. **pg_cron 설정**: `SERVICE_ROLE_KEY`를 수동으로 SQL에 삽입 필요 (`YOUR_SERVICE_ROLE_KEY` placeholder)
4. **공휴일 데이터**: 2024~2027년만 하드코딩 — 이후 연도 추가 필요
5. **VAPID 키**: 푸시 알림 사용 시 Supabase Environment Variables에 VAPID 키 설정 필요
6. **CSS 일부 오타**: `index.html` 961~963줄에 CSS 문법 오류 존재 (`.btn-primary` 스타일 일부 누락)
