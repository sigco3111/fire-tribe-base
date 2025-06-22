
import React, { useState }  from 'react';

interface BrainstormInputFormProps {
  userInput: string;
  setUserInput: (value: string) => void;
  onGenerateIdeas: () => void;
  isLoading: boolean;
}

const masterExamplePrompts = [
  "월 100만원 추가 수입 아이디어",
  "IT 기술을 활용한 부업",
  "스트레스 없는 재테크 방법",
  "30대에 시작할 수 있는 파이프라인",
  "짠테크 노하우",
  "조기 은퇴를 위한 자산 관리",
  "월세 수입 부동산 투자",
  "N잡러 현실 조언",
  "디지털 상품 제작 및 판매",
  "퇴사 준비 체크리스트",
  "주식 투자 첫걸음",
  "1년에 1000만원 모으기",
  "사이드 프로젝트 수익화",
  "무자본 창업 아이디어",
  "시간 관리로 부수입 증대",
  "글로벌 마켓 수익 창출",
  "취미를 직업으로 전환",
  "MZ세대 스마트 소비",
  "프리랜서 성공 비법",
  "나만의 절약 루틴 만들기",
];
const EXAMPLES_TO_SHOW = 5;

const getRandomPrompts = (allPrompts: string[], count: number): string[] => {
  const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};


const BrainstormInputForm: React.FC<BrainstormInputFormProps> = ({ userInput, setUserInput, onGenerateIdeas, isLoading }) => {
  const [placeholder, setPlaceholder] = useState<string>("예: '월 100만원 추가 수입 얻는 방법', '초기 자본 적은 투자 아이디어', '생활비 절약 팁'");
  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>(() => getRandomPrompts(masterExamplePrompts, EXAMPLES_TO_SHOW));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) {
      alert('아이디어 생성을 위한 주제나 질문을 입력해주세요.');
      return;
    }
    onGenerateIdeas();
  };
  
  const handleExampleClick = (promptText: string) => {
    setUserInput(promptText);
  };

  const refreshDisplayedPrompts = () => {
    setDisplayedPrompts(getRandomPrompts(masterExamplePrompts, EXAMPLES_TO_SHOW));
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl shadow-xl mb-8">
      <h2 className="text-2xl font-semibold text-sky-400 mb-4">AI 아이디어 브레인스토밍</h2>
      <p className="text-slate-300 mb-5 text-sm">
        경제적 자유(FIRE) 달성을 위한 아이디어가 필요하신가요? AI에게 물어보세요!
        관심 분야, 목표, 또는 궁금한 점을 입력하면 AI가 맞춤형 아이디어를 제안해 드립니다.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userInput" className="sr-only">아이디어 주제 입력</label>
          <textarea
            id="userInput"
            rows={3}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500 text-slate-100 resize-none"
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-slate-400">다음 예시를 클릭하거나 직접 입력해보세요:</p>
            <button 
              type="button" 
              onClick={refreshDisplayedPrompts}
              className="text-xs text-sky-400 hover:text-sky-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
              aria-label="다른 예시 보기"
            >
              다른 예시 보기 🔄
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
              {displayedPrompts.map(prompt => (
                   <button
                      key={prompt}
                      type="button"
                      onClick={() => handleExampleClick(prompt)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-sky-300 text-xs rounded-full transition-colors disabled:opacity-50"
                      disabled={isLoading}
                   >
                      {prompt}
                   </button>
              ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              아이디어 생성 중...
            </>
          ) : (
            "AI 아이디어 받기 ✨"
          )}
        </button>
      </form>
    </div>
  );
};

export default BrainstormInputForm;
