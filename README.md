# NextSet — 개인용 운동 기록 MVP

Next.js, TypeScript, Tailwind CSS, Recharts로 만든 **개인용** 웹앱입니다. **게스트**면 **localStorage**만 쓰고, **Google / Kakao**로 선택 로그인하면 **Supabase**에 동기화합니다(로그인 필수 아님).

## 구현 요약

1. **스캐폴드**: Next.js(App Router) + TypeScript + Tailwind, 차트용 **Recharts** 추가.
2. **도메인 타입**: 한곳에 모아 두고, 게스트는 **localStorage** 키, 로그인 시 **Supabase** 테이블에 같은 타입으로 저장(`src/lib/storage/`).
3. **점진적 과부하(progressive overload)**: `progressiveOverload.ts` 순수 함수(게스트·클라우드 동일).
4. **상태**: `AuthProvider` + `NextSetProvider`. 게스트는 `createLocalWorkoutStorage()`, 로그인 시 `createSupabaseWorkoutStorage()`. **최초 실행**(게스트·`nextset:routines` 없음) 시 샘플 루틴·주간·체중 시드. **기본 6개 루틴** 누락분 병합·삭제 시 `nextset:dismissedDefaultRoutineNames` 제외·빈 스케줄이면 월~토 채움. **전체 초기화**는 현재 모드(로컬 키 vs 해당 계정 Supabase)만 비움.
5. **OAuth**: Supabase `signInWithOAuth`(google, kakao), `/auth/callback`. 기기에 게스트 데이터가 있으면 로그인 후 **마이그레이션 모달**(병합 / 클라우드만 / 나중에).
6. **화면**: 홈, 루틴, 스케줄, 오늘 운동, 체중, 기록, 설정, **`/login`**, 상단 **계정 배너**.
7. **UI**: 모바일 우선, 하단 내비. 계정·동기화 안내도 한국어. 폰트 **Noto Sans KR**.

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

브라우저에 아직 NextSet 데이터가 없으면, **가슴+어깨+삼두 / 등+이두 / 하체 전면+둔근+코어 / 상체 보완 / 하체 후면+둔근+코어 / 전신 가볍게+약점 보완** 등 6개 예시 루틴과 **월~토 스케줄**, 오늘 날짜 **체중** 한 건이 자동으로 들어가 흐름을 바로 써볼 수 있습니다. 이미 루틴 데이터가 있어도 위 **6개 기본 루틴**이 목록에 없으면(이름 기준) **누락된 것만** 뒤에 붙습니다. 사용자가 해당 이름의 루틴을 **삭제**하면, 그 이름은 `nextset:dismissedDefaultRoutineNames`에 기록되어 **다시 자동으로 넣지 않습니다**. 주간 스케줄이 비어 있고 6개가 모두 있을 때만 월~토 예시 배치를 채웁니다. **설정 → 기본 루틴으로 다시 넣기**로 6개 루틴과 월~토 스케줄을 덮어쓰면 삭제 제외 목록도 함께 초기화됩니다.

## Vercel 배포

게스트만 쓸 때는 **환경 변수 없이** 배포할 수 있습니다. **클라우드·Kakao 로그인**을 쓰려면 Vercel Production에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣고, Kakao 리다이렉트 URI와 맞추려면 **`NEXT_PUBLIC_SITE_URL`**(배포 도메인, 예: `https://xxx.vercel.app`)도 넣는 것을 권장합니다. 자세한 내용은 루트 **`.env`**(주석 템플릿), **`.env.example`**, `next.config.ts`의 `loadEnvConfig` 설명을 참고하세요. 스키마는 **`supabase/migrations/0001_nextset_core.sql`** 입니다.

### GitHub 등에 올린 뒤 (권장)

1. 저장소를 GitHub(또는 GitLab/Bitbucket)에 푸시합니다.
2. [Vercel](https://vercel.com)에 로그인 → **새 프로젝트 추가** → 해당 저장소를 **가져오기(Import)** 합니다.
3. **프레임워크**가 `Next.js`인지 확인합니다.  
   - **빌드 명령**: `npm run build` (기본값)  
   - **출력 디렉터리**: 비워 두기(Next 기본)  
   - **설치 명령**: `npm install` (기본값)
4. **배포(Deploy)** 를 누르면 빌드 후 `*.vercel.app` 주소로 접속할 수 있습니다.

### Vercel CLI로 배포

```bash
npm i -g vercel
cd /path/to/ai_health_trainer
vercel
```

프로덕션에 고정하려면 `vercel --prod` 를 사용합니다.

### 배포 후 알아두기

- **게스트**: **localhost와 배포 URL은 서로 다른 localStorage**입니다. 옮기려면 설정의 **JSON보내기/가져오기**를 쓰세요.
- **로그인**: 같은 계정이면 Supabase로 기기 간 동기화. 로그아웃해도 **클라우드 데이터는 삭제되지 않고**, 로컬 게스트 데이터도 **자동 삭제되지 않습니다**.

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
| `/login` | Google·Kakao OAuth(선택), 게스트로 계속하기 |

## localStorage 키

- `nextset:routines`
- `nextset:weeklySchedule`
- `nextset:workoutSessions`
- `nextset:weightLogs`
- `nextset:restSeconds` (세트 완료 후 쉬는 시간(초), 설정 화면에서 변경)
- `nextset:dismissedDefaultRoutineNames` (기본 6개 루틴 이름 중 사용자가 삭제해 자동 추가에서 제외한 목록, JSON 배열)
- `nextset:supabaseMigrated` (로컬→Supabase 마이그레이션 완료 시 설정)
- `nextset:migrationUiResolved:<userId>` (해당 계정에 대해 동기화 UI를 마친 경우)

점진적 과부하 판정 로직: `src/lib/progressiveOverload.ts`

## 수동 테스트 안내

1. **게스트**: 로그인 없이 루틴·스케줄·운동 완료·체중·새로고침 후 유지 확인.
2. **OAuth**: `.env.local`에 Supabase URL·anon 키 설정 → 대시보드에 리다이렉트 URL 등록 → `/login`에서 Google 또는 Kakao → 홈으로 돌아온 뒤 상단에 **클라우드 동기화 사용 중**이 보이는지 확인.
3. **마이그레이션**: 게스트로 데이터 만든 뒤 같은 브라우저에서 로그인 → 모달에서 **지금 동기화** 또는 **이 기기 데이터를 계정에 합치기** → 루틴·기록이 클라우드에 반영되는지 확인. 로컬 `nextset:*` 키는 그대로 두는 것이 목표입니다.
4. **충돌**: 클라우드에 이미 데이터가 있는 계정으로, 로컬에도 게스트 데이터가 있는 상태에서 로그인 → **이 기기 데이터를 계정에 합치기** / **클라우드 데이터만 사용** / **나중에** 각각 확인.

## 참고 코드 위치

- 타입 정의: `src/lib/types.ts`
- 스토리지·운동 완료 처리: `src/providers/nextset-provider.tsx`
- 스토리지 추상화: `src/lib/storage/` (`localPersistence`, `localStorageAdapter`, `supabaseAdapter`, `migrateLocalToSupabase.ts`)
- Supabase 브라우저 클라이언트: `src/lib/supabase/client.ts`
- OAuth 콜백: `src/app/auth/callback/route.ts`
- 인증 Context: `src/providers/auth-provider.tsx`
- 기본 루틴 자동 병합·삭제 시 제외: `src/lib/defaultRoutinesMerge.ts`
- 오늘 운동 UI: `src/app/workout/today/page.tsx` (루틴이 갱신되면 입력 폼이 맞게 다시 잡히도록 `WorkoutRoutineInputs`에 `key` 사용)
