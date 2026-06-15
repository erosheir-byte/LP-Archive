// 피드 프리셋 정의. 콘텐츠 스크립트와 팝업이 함께 사용한다.
const FTC_PRESETS = [
  {
    id: "study",
    name: "수험생 · 공부 자극",
    description: "공부 동기부여, 스터디윗미, 공부법 영상 위주",
    keywords: [
      "공부 자극 영상",
      "공부 동기부여",
      "study with me",
      "스터디윗미 실시간",
      "수능 공부법",
      "의대생 공부 브이로그",
      "서울대생 공부 루틴",
      "10시간 공부 타이머"
    ]
  },
  {
    id: "english",
    name: "영어 공부",
    description: "영어 회화, 리스닝, 단어 암기 영상 위주",
    keywords: [
      "영어 회화 연습",
      "영어 리스닝 훈련",
      "영어 쉐도잉",
      "english listening practice",
      "영어 단어 암기법",
      "기초 영문법 강의"
    ]
  },
  {
    id: "dev",
    name: "개발 · 커리어",
    description: "프로그래밍 강의, 개발자 커리어 영상 위주",
    keywords: [
      "코딩 강의",
      "프로그래밍 입문",
      "개발자 브이로그",
      "알고리즘 문제 풀이",
      "CS 지식 면접",
      "개발자 커리어 조언"
    ]
  },
  {
    id: "fitness",
    name: "운동 · 건강",
    description: "홈트레이닝, 운동 루틴, 건강 관리 영상 위주",
    keywords: [
      "홈트레이닝 루틴",
      "맨몸 운동",
      "헬스 초보 루틴",
      "스트레칭 10분",
      "달리기 동기부여",
      "건강한 식단"
    ]
  },
  {
    id: "reading",
    name: "독서 · 교양",
    description: "책 리뷰, 인문학, 다큐멘터리 영상 위주",
    keywords: [
      "책 추천 리뷰",
      "인문학 강의",
      "역사 다큐멘터리",
      "과학 교양",
      "경제 공부 기초",
      "철학 입문 강의"
    ]
  }
];

if (typeof window !== "undefined") {
  window.FTC_PRESETS = FTC_PRESETS;
}
