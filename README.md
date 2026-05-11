# NextSet — 개인용 운동 기록 MVP

Next.js, TypeScript, Tailwind CSS, Recharts로 만든 **개인용** 웹앱입니다. 데이터는 **localStorage**에만 저장되며, 백엔드와 계정(로그인)은 없습니다.

## 구현 요약

1. **스캐폴드**: Next.js(App Router) + TypeScript + Tailwind, 차트용 **Recharts** 추가.
2. **도메인 타입**: 한곳에 모아 두고, 지정한 키 이름으로 **localStorage** 읽기/쓰기.
3. **점진적 과부하(progressive overload)**: 규칙과 문구를 바꾸기 쉽도록 `progressiveOverload.ts`에 순수 함수로 분리.
4. **상태**: React Context로 스토리지와 동기화. **최초 실행** 시에만(아직 `nextset:routines` 키가 없을 때) 샘플 루틴·주간 스케줄·오늘 체중 시드. **전체 초기화** 시 시드 없이 비움.
5. **화면**: 홈, 루틴(목록·생성·편집), 스케줄, 오늘 운동, 체중, 기록(+상세), 백업/가져오기/초기화용 설정.
6. **UI**: 모바일 우선, 하단 고정 내비, 카드 레이아웃, 큰 입력 필드, 운동 완료 후 **요약 모달**(종목별 다음 타깃·이유). **앱 문구·날짜 표시는 한국어(ko-KR)**, 본문 폰트는 **Noto Sans KR**.

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

프로덕션 빌드:

```bash
npm run build
npm start
```

## 최초 실행 시

브라우저에 아직 NextSet 데이터가 없으면, **푸시 데이 / 풀 데이 / 레그 데이** 예시 루틴, 샘플 **주간 스케줄**, 오늘 날짜 **체중** 한 건이 자동으로 들어가 흐름을 바로 써볼 수 있습니다. 이후에는 홈 상단 **데이터** 메뉴에서 JSON보내기·가져오기·전체 초기화를 할 수 있습니다.

## Vercel 배포

이 프로젝트는 **백엔드 없음**, **환경 변수 불필요**라서 Vercel 기본 설정으로 배포하면 됩니다.

### GitHub 등에 올린 뒤 (권장)

1. 저장소를 GitHub(또는 GitLab/Bitbucket)에 푸시합니다.
2. [Vercel](https://vercel.com)에 로그인 → **Add New… → Project** → 해당 저장소를 **Import**합니다.
3. **Framework Preset**이 `Next.js`인지 확인합니다.  
   - **Build Command**: `npm run build` (기본값)  
   - **Output Directory**: 비워 두기(Next 기본)  
   - **Install Command**: `npm install` (기본값)
4. **Deploy**를 누르면 빌드 후 `*.vercel.app` 주소로 접속할 수 있습니다.

### Vercel CLI로 배포

```bash
npm i -g vercel
cd /path/to/ai_health_trainer
vercel
```

프로덕션에 고정하려면 `vercel --prod` 를 사용합니다.

### 배포 후 알아두기

- 데이터는 **브라우저 localStorage**에만 있어서, **localhost와 배포 URL은 서로 다른 저장소**입니다. 로컬에서 쓰던 데이터를 옮기려면 **데이터 → JSON보내기** 후, 배포 사이트에서 **가져오기**를 사용하세요.
- 팀/기기마다 데이터가 갈라지므로, “내 전용” 용도에는 적합하고 **서버 동기화는 없습니다**.

## 라우트(페이지) 안내

| 경로 | 설명 |
|------|------|
| `/` | 오늘 날짜·체중 입력·오늘 루틴, **운동 시작**, 빠른 링크, **데이터** 링크 |
| `/routines` | 루틴 목록, 새로 만들기·편집·복제·삭제 |
| `/routines/new`, `/routines/[id]` | 루틴 생성/편집(운동 추가·삭제·순서 위/아래) |
| `/schedule` | 월~일 루틴 지정(변경 시 **즉시 저장**) |
| `/workout/today` | 오늘 배정 루틴으로 세트 기록, **운동 완료**, 과부하 반영 후 요약 모달 |
| `/weight` | 날짜별 체중, 통계, 최근 30일(또는 가능한 구간) 추세 그래프, 최근 목록·삭제 |
| `/history`, `/history/[id]` | 완료한 운동 목록·볼륨, 상세 세트 |
| `/settings` | JSON보내기/가져오기, 전체 데이터 초기화 |

## localStorage 키

- `nextset:routines`
- `nextset:weeklySchedule`
- `nextset:workoutSessions`
- `nextset:weightLogs`
- `nextset:restSeconds` (세트 완료 후 쉬는 시간(초), 설정 화면에서 변경)

점진적 과부하 판정 로직: `src/lib/progressiveOverload.ts`

## 참고 코드 위치

- 타입 정의: `src/lib/types.ts`
- 스토리지·Context·운동 완료 처리: `src/providers/nextset-provider.tsx`
- 오늘 운동 UI: `src/app/workout/today/page.tsx` (루틴이 갱신되면 입력 폼이 맞게 다시 잡히도록 `WorkoutRoutineInputs`에 `key` 사용)
