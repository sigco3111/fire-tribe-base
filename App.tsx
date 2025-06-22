
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import ApiKeyManager from './components/ApiKeyManager'; // Import ApiKeyManager
import BrainstormInputForm from './components/BrainstormInputForm';
import IdeaList from './components/IdeaList';
import Modal from './components/Modal';
import IdeaDetailView from './components/IdeaDetailView';
import LoadingSpinner from './components/LoadingSpinner';
import FilterSortControls from './components/FilterSortControls';
import { generateIdeasWithGemini, getAICoachingResponse, generateImageForIdea } from './services/geminiService'; // Import new functions
import { Idea, AIGeneratedIdeaSeed, IdeaCategory, ImpactLevel, EffortLevel, SortOption, ProgressStatus, AICoachingSession, ApiKeySource } from './types'; 
import { LOCAL_STORAGE_IDEAS_KEY, ALL_CATEGORIES, ALL_IMPACT_LEVELS, ALL_EFFORT_LEVELS, ALL_STATUSES, EMPTY_LIST_AI_PROMPT_EXAMPLES, USER_API_KEY_LOCAL_STORAGE_KEY } from './constants';


const App: React.FC = () => {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false); // General loading for AI idea list
  const [isDetailViewLoading, setIsDetailViewLoading] = useState<boolean>(false); // Specific loading for modal operations (AI coaching, image gen)
  const [error, setError] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isCreatingNewManually, setIsCreatingNewManually] = useState<boolean>(false);

  const [filterCategory, setFilterCategory] = useState<string>(ALL_CATEGORIES);
  const [filterImpact, setFilterImpact] = useState<string>(ALL_IMPACT_LEVELS);
  const [filterEffort, setFilterEffort] = useState<string>(ALL_EFFORT_LEVELS);
  const [filterStatus, setFilterStatus] = useState<string>(ALL_STATUSES);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.CREATED_AT_DESC);
  
  const [brainstormInput, setBrainstormInput] = useState<string>('');
  const brainstormFormRef = useRef<HTMLDivElement>(null);
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeySource, setApiKeySource] = useState<ApiKeySource>('checking');
  const [isEnvKeyPresent, setIsEnvKeyPresent] = useState<boolean>(false);


  useEffect(() => {
    // API Key Initialization
    const envKey = process.env.API_KEY;
    const localKey = localStorage.getItem(USER_API_KEY_LOCAL_STORAGE_KEY);
    const envKeyExists = !!(envKey && envKey.trim() !== '');
    setIsEnvKeyPresent(envKeyExists);

    if (envKeyExists) {
      setApiKey(envKey);
      setApiKeySource('env');
    } else if (localKey && localKey.trim() !== '') {
      setApiKey(localKey);
      setApiKeySource('local');
    } else {
      setApiKey(null);
      setApiKeySource('none');
    }

    // Load ideas from localStorage
    try {
      const storedIdeas = localStorage.getItem(LOCAL_STORAGE_IDEAS_KEY);
      if (storedIdeas) {
        setIdeas(JSON.parse(storedIdeas).map((idea: any) => ({
            ...idea,
            isFavorite: idea.isFavorite ?? false,
            status: idea.status ?? ProgressStatus.NOT_STARTED,
            tags: idea.tags ?? [],
            aiCoachingSessions: idea.aiCoachingSessions ?? [], 
            imageUrl: idea.imageUrl, 
            imagePrompt: idea.imagePrompt, 
        })));
      }
    } catch (e) {
      console.error("Failed to load ideas from localStorage:", e);
      setError("로컬 스토리지에서 아이디어를 불러오는데 실패했습니다.");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_IDEAS_KEY, JSON.stringify(ideas));
    } catch (e) {
      console.error("Failed to save ideas to localStorage:", e);
      setError("아이디어를 로컬 스토리지에 저장하는데 실패했습니다.");
    }
  }, [ideas]);

  const handleSaveUserApiKey = useCallback((key: string) => {
    if (isEnvKeyPresent) return; 
    localStorage.setItem(USER_API_KEY_LOCAL_STORAGE_KEY, key);
    setApiKey(key);
    setApiKeySource('local');
    setError(null); 
  }, [isEnvKeyPresent]);

  const handleClearUserApiKey = useCallback(() => {
    if (isEnvKeyPresent) return; 
    localStorage.removeItem(USER_API_KEY_LOCAL_STORAGE_KEY);
    setApiKey(null);
    setApiKeySource('none');
  }, [isEnvKeyPresent]);


  const handleGenerateIdeas = useCallback(async (promptOverride?: string) => {
    const currentPromptForGeneration = promptOverride || brainstormInput;
    
    if (!apiKey) {
      setError(isEnvKeyPresent 
        ? "API 키가 환경 변수에 설정되어 있지만 유효하지 않은 것 같습니다. 확인해주세요." 
        : "AI 아이디어 생성을 사용하려면 페이지 상단의 API 키 관리 섹션에서 API 키를 입력하고 저장해주세요.");
      setIsLoading(false);
      // Scroll to ApiKeyManager or Brainstorm form for visibility
      const apiKeyManagerElement = document.getElementById('api-key-manager-section');
      if (apiKeyManagerElement) {
        apiKeyManagerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        brainstormFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    if (!currentPromptForGeneration.trim()) {
      alert(promptOverride ? "AI 아이디어 생성을 위한 주제가 필요합니다." : '아이디어 생성을 위한 주제나 질문을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const aiGeneratedSeeds: AIGeneratedIdeaSeed[] = await generateIdeasWithGemini(apiKey, currentPromptForGeneration);
      const newIdeas: Idea[] = aiGeneratedSeeds.map(seed => ({
        ...seed,
        id: Date.now().toString() + Math.random().toString(36).substring(2,7),
        userRefinements: {},
        isCustom: false,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        status: ProgressStatus.NOT_STARTED,
        tags: [],
        aiCoachingSessions: [], 
        imageUrl: undefined, 
        imagePrompt: undefined, 
      }));

      if (newIdeas.length > 0) {
        setIdeas(prevIdeas => [...newIdeas, ...prevIdeas]);
        if (!promptOverride) { 
          setBrainstormInput(''); 
        }
      } else {
        setError("AI가 현재 입력에 대한 아이디어를 찾지 못했습니다. 다른 질문이나 키워드로 시도해보세요.");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('AI 아이디어 생성 중 알 수 없는 오류가 발생했습니다.');
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [brainstormInput, apiKey, isEnvKeyPresent, setBrainstormInput]); 

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsCreatingNewManually(false);
    setIsModalOpen(true);
  };

  const handleOpenNewIdeaModal = () => {
    setSelectedIdea(null); 
    setIsCreatingNewManually(true);
    setIsModalOpen(true);
  };
  
  const triggerAIQueryFocus = useCallback(() => {
    if (isLoading) return;
    if (!apiKey && apiKeySource === 'none') {
        setError("API 키가 설정되지 않아 AI 아이디어 요청을 처리할 수 없습니다. 페이지 상단의 API 키 관리 섹션에서 API 키를 설정해주세요.");
        const apiKeyManagerElement = document.getElementById('api-key-manager-section');
        if (apiKeyManagerElement) {
          apiKeyManagerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
           window.scrollTo({ top: 0, behavior: 'smooth' }); // Fallback to top
        }
        return;
    }

    if (EMPTY_LIST_AI_PROMPT_EXAMPLES.length > 0) {
      const randomExample = EMPTY_LIST_AI_PROMPT_EXAMPLES[Math.floor(Math.random() * EMPTY_LIST_AI_PROMPT_EXAMPLES.length)];
      setBrainstormInput(randomExample); 
    }
    brainstormFormRef.current?.querySelector('textarea')?.focus();
    brainstormFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  }, [isLoading, apiKey, apiKeySource, setBrainstormInput, setError]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIdea(null);
    setIsCreatingNewManually(false);
    setIsDetailViewLoading(false); 
  };

  const handleSaveIdea = (updatedIdea: Idea) => {
    setIdeas(prevIdeas => {
      const existingIndex = prevIdeas.findIndex(i => i.id === updatedIdea.id);
      if (existingIndex > -1) {
        const newIdeas = [...prevIdeas];
        newIdeas[existingIndex] = {
            ...updatedIdea,
            aiCoachingSessions: updatedIdea.aiCoachingSessions ?? [], 
            imageUrl: updatedIdea.imageUrl, 
            imagePrompt: updatedIdea.imagePrompt, 
        };
        return newIdeas;
      }
      return [{ 
        ...updatedIdea, 
        isFavorite: updatedIdea.isFavorite ?? false,
        status: updatedIdea.status ?? ProgressStatus.NOT_STARTED,
        tags: updatedIdea.tags ?? [],
        aiCoachingSessions: updatedIdea.aiCoachingSessions ?? [],
        imageUrl: updatedIdea.imageUrl, 
        imagePrompt: updatedIdea.imagePrompt, 
      }, ...prevIdeas];
    });
    handleCloseModal();
  };
  
  const handleDeleteIdea = (ideaId: string) => {
    if (window.confirm("정말로 이 아이디어를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
        setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
    }
  };

  const handleToggleFavorite = (ideaId: string) => {
    setIdeas(prevIdeas => 
        prevIdeas.map(idea => 
            idea.id === ideaId ? { ...idea, isFavorite: !idea.isFavorite } : idea
        )
    );
  };

  const getApiKeyForDetailView = useCallback((): string | null => {
    return apiKey;
  }, [apiKey]);
  
  const updateIdeaInList = useCallback((updatedIdea: Idea) => {
    setIdeas(prevIdeas => {
      const index = prevIdeas.findIndex(i => i.id === updatedIdea.id);
      if (index !== -1) {
        const newIdeasList = [...prevIdeas];
        newIdeasList[index] = updatedIdea;
        return newIdeasList;
      }
      return prevIdeas; 
    });
    if (selectedIdea && selectedIdea.id === updatedIdea.id) {
        setSelectedIdea(updatedIdea);
    }
  }, [selectedIdea]);


  const filteredAndSortedIdeas = useMemo(() => {
    let result = [...ideas];

    if (showFavoritesOnly) {
      result = result.filter(idea => idea.isFavorite);
    }
    if (filterCategory !== ALL_CATEGORIES) {
      result = result.filter(idea => idea.category === filterCategory);
    }
    if (filterImpact !== ALL_IMPACT_LEVELS) {
      result = result.filter(idea => idea.potentialImpact === filterImpact);
    }
    if (filterEffort !== ALL_EFFORT_LEVELS) {
      result = result.filter(idea => idea.effortLevel === filterEffort);
    }
    if (filterStatus !== ALL_STATUSES) {
      result = result.filter(idea => idea.status === filterStatus);
    }

    switch (sortOption) {
      case SortOption.CREATED_AT_ASC:
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case SortOption.CREATED_AT_DESC:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case SortOption.TITLE_ASC:
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case SortOption.TITLE_DESC:
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case SortOption.IMPACT_ASC:
        result.sort((a,b) => Object.values(ImpactLevel).indexOf(a.potentialImpact) - Object.values(ImpactLevel).indexOf(b.potentialImpact));
        break;
      case SortOption.IMPACT_DESC:
        result.sort((a,b) => Object.values(ImpactLevel).indexOf(b.potentialImpact) - Object.values(ImpactLevel).indexOf(a.potentialImpact));
        break;
      case SortOption.EFFORT_ASC:
         result.sort((a,b) => Object.values(EffortLevel).indexOf(a.effortLevel) - Object.values(EffortLevel).indexOf(b.effortLevel));
        break;
      case SortOption.EFFORT_DESC:
        result.sort((a,b) => Object.values(EffortLevel).indexOf(b.effortLevel) - Object.values(EffortLevel).indexOf(a.effortLevel));
        break;
      default:
        break;
    }
    return result;
  }, [ideas, filterCategory, filterImpact, filterEffort, filterStatus, showFavoritesOnly, sortOption]);
  
  const hasActiveFilters = showFavoritesOnly || 
                           filterCategory !== ALL_CATEGORIES || 
                           filterImpact !== ALL_IMPACT_LEVELS || 
                           filterEffort !== ALL_EFFORT_LEVELS ||
                           filterStatus !== ALL_STATUSES;
  
  const isAppGloballyBusy = isLoading || isDetailViewLoading; 
  const aiFeaturesGloballyDisabled = apiKeySource === 'none' && !isEnvKeyPresent;


  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onAddNewIdea={handleOpenNewIdeaModal} 
        onTriggerAIQuery={triggerAIQueryFocus} 
        isAppBusy={isAppGloballyBusy || aiFeaturesGloballyDisabled} // AI Query button in header also needs to know if API key is missing
      />
      <main className="container mx-auto p-4 flex-grow">
        <div id="api-key-manager-section" className="mb-6"> {/* Wrapper for ApiKeyManager */}
          <ApiKeyManager
            apiKey={apiKey}
            apiKeySource={apiKeySource}
            isEnvKeyPresent={isEnvKeyPresent}
            onSaveKey={handleSaveUserApiKey}
            onClearKey={handleClearUserApiKey}
          />
        </div>

        <div ref={brainstormFormRef}>
            <BrainstormInputForm 
              userInput={brainstormInput}
              setUserInput={setBrainstormInput}
              onGenerateIdeas={() => handleGenerateIdeas()} 
              isLoading={isLoading} 
            />
        </div>
        
        {error && (
          <div className="my-4 p-4 bg-red-800/50 border border-red-700 text-red-300 rounded-md text-sm">
            <p className="font-semibold mb-1">
              {error.startsWith("AI가 현재 입력에 대한 아이디어를 찾지 못했습니다") ? "정보:" : 
               error.includes("API 키") ? "API 키 오류:" : "오류 발생:"}
            </p>
            <p>{error}</p>
            {apiKeySource === 'none' && !isEnvKeyPresent && error.includes("API 키") &&
             <p className="mt-1">AI 기능을 사용하려면, 페이지 상단의 API 키 관리 섹션에서 Gemini API 키를 입력하고 저장해주세요.</p>}
            {apiKeySource === 'env' && error.includes("API 키") &&
             <p className="mt-1">환경 변수에 설정된 API 키가 유효하지 않거나 권한 문제가 있을 수 있습니다. Google AI Studio에서 키를 확인해주세요.</p>}
          </div>
        )}

        <FilterSortControls
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterImpact={filterImpact}
            setFilterImpact={setFilterImpact}
            filterEffort={filterEffort}
            setFilterEffort={setFilterEffort}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
            sortOption={sortOption}
            setSortOption={setSortOption}
            hasIdeas={ideas.length > 0}
        />

        {isLoading && !isModalOpen && <LoadingSpinner />} 
        
        <IdeaList 
            ideas={filteredAndSortedIdeas} 
            onSelectIdea={handleSelectIdea} 
            onDeleteIdea={handleDeleteIdea}
            onToggleFavorite={handleToggleFavorite}
            isIdeaListLoading={isLoading && ideas.length === 0 && !error} 
            isAppBusy={isAppGloballyBusy}
            activeFilters={hasActiveFilters}
            onAddNewManualIdea={handleOpenNewIdeaModal}
        />

      </main>
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={isCreatingNewManually ? "새 아이디어 추가" : (selectedIdea?.title || "아이디어 상세")}
      >
        <IdeaDetailView 
          idea={selectedIdea} 
          onSave={handleSaveIdea} 
          onClose={handleCloseModal}
          isCreatingNew={isCreatingNewManually}
          getApiKey={getApiKeyForDetailView}
          setDetailViewLoading={setIsDetailViewLoading}
          updateIdeaInList={updateIdeaInList} 
        />
      </Modal>
      <footer className="text-center p-4 text-xs text-slate-500 border-t border-slate-700/50 mt-8">
        © {new Date().getFullYear()} 파이어족 베이스. 경제적 자유를 향한 여정을 응원합니다.
      </footer>
    </div>
  );
};

export default App;