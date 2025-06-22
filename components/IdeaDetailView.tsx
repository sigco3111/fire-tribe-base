import React, { useState, useEffect, useRef } from 'react';
import { Idea, IdeaCategory, ImpactLevel, EffortLevel, ProgressStatus, AICoachingPromptType, AICoachingSession, GroundingChunk } from '../types';
import { PROGRESS_STATUS_LABELS, AI_COACHING_PROMPT_TYPE_LABELS, CATEGORY_SPECIFIC_REFINEMENT_PROMPTS } from '../constants';
import { generateCoachingPrompt, getAICoachingResponse, generateImageForIdea } from '../services/geminiService'; 

interface IdeaDetailViewProps {
  idea: Idea | null;
  onSave: (idea: Idea) => void;
  onClose: () => void;
  isCreatingNew?: boolean;
  getApiKey: () => string | null; // Function to get current API key
  setDetailViewLoading: (isLoading: boolean) => void; // To control global loading state from App
  updateIdeaInList: (updatedIdea: Idea) => void; // To update the idea in App's state after AI operations
}

const getInitialRefinementPrompts = (category: IdeaCategory): string[] => {
  return CATEGORY_SPECIFIC_REFINEMENT_PROMPTS[category] || CATEGORY_SPECIFIC_REFINEMENT_PROMPTS[IdeaCategory.OTHER];
};

const initialNewIdeaTemplate: Omit<Idea, 'id' | 'createdAt' | 'refinementPrompts'> = {
  title: '',
  category: IdeaCategory.OTHER,
  description: '',
  potentialImpact: ImpactLevel.MEDIUM,
  effortLevel: EffortLevel.MEDIUM,
  initialSteps: [''],
  userRefinements: {},
  isCustom: true,
  isFavorite: false,
  status: ProgressStatus.NOT_STARTED,
  tags: [],
  aiCoachingSessions: [],
  imageUrl: undefined,
  imagePrompt: undefined,
};


// Component to format AI coaching responses
const FormattedAICoachingResponse: React.FC<{ session: AICoachingSession }> = ({ session }) => {
  if (!session || !session.response) return null;

  const { response, groundingMetadata } = session;
  const lines = response.split('\n');
  const elements: JSX.Element[] = [];
  let currentListType: 'ol' | 'ul' | null = null;
  let currentListItems: JSX.Element[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      if (currentListType === 'ol') {
        elements.push(<ol key={`list-${elements.length}`} className="list-decimal list-inside pl-4 my-2 leading-relaxed">{currentListItems}</ol>);
      } else if (currentListType === 'ul') {
        elements.push(<ul key={`list-${elements.length}`} className="list-disc list-inside pl-4 my-2 leading-relaxed">{currentListItems}</ul>);
      }
      currentListItems = [];
      currentListType = null;
    }
  };
  
  const processLine = (line: string) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      if (level === 1) elements.push(<h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-sky-300 mt-3 mb-1">{text}</h3>);
      else if (level === 2) elements.push(<h4 key={`h4-${elements.length}`} className="text-md font-semibold text-sky-400 mt-2 mb-1">{text}</h4>);
      else elements.push(<h5 key={`h5-${elements.length}`} className="text-sm font-semibold text-sky-500 mt-1 mb-1">{text}</h5>);
      return;
    }


    const olMatch = line.match(/^(\d+)\.\s+(.*)/); 
    const ulMatch = line.match(/^[-*]\s+(.*)/);    

    if (olMatch) {
      if (currentListType !== 'ol' && currentListType !== null) flushList();
      if (currentListType === null) currentListType = 'ol';
      currentListItems.push(<li key={`item-${elements.length}-${currentListItems.length}`} className="mb-1 text-slate-200">{olMatch[2]}</li>);
    } else if (ulMatch) {
      if (currentListType !== 'ul' && currentListType !== null) flushList();
      if (currentListType === null) currentListType = 'ul';
      currentListItems.push(<li key={`item-${elements.length}-${currentListItems.length}`} className="mb-1 text-slate-200">{ulMatch[1]}</li>);
    } else {
      flushList();
      if (line.trim() !== '') {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = line.split(urlRegex);
        elements.push(
          <p key={`p-${elements.length}`} className="my-2 leading-relaxed text-slate-200">
            {parts.map((part, index) => 
              urlRegex.test(part) ? (
                <a href={part} target="_blank" rel="noopener noreferrer" key={index} className="text-sky-400 hover:text-sky-300 underline break-all">{part}</a>
              ) : (
                part
              )
            )}
          </p>
        );
      } else if (elements.length > 0 && !line.trim() && (elements[elements.length-1].type === 'p' || elements[elements.length-1].type === 'ol' || elements[elements.length-1].type === 'ul')) {
        elements.push(<div key={`br-${elements.length}`} className="h-3"></div>);
      }
    }
  };

  lines.forEach(processLine);
  flushList();

  if (groundingMetadata && groundingMetadata.length > 0) {
    elements.push(
      <div key="grounding-metadata" className="mt-4 pt-3 border-t border-slate-600">
        <h6 className="text-sm font-semibold text-lime-400 mb-2">📚 참고 자료 (Google 검색 출처):</h6>
        <ul className="list-disc list-inside pl-4 space-y-1">
          {groundingMetadata.map((chunk, idx) => 
            chunk.web && (
              <li key={`grounding-${idx}`} className="text-xs">
                <a 
                  href={chunk.web.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 underline"
                  title={chunk.web.uri}
                >
                  {chunk.web.title || chunk.web.uri}
                </a>
              </li>
            )
          )}
        </ul>
      </div>
    );
  }

  return <div className="text-sm">{elements}</div>;
};


const IdeaDetailView: React.FC<IdeaDetailViewProps> = ({ 
    idea, 
    onSave, 
    onClose, 
    isCreatingNew = false,
    getApiKey,
    setDetailViewLoading,
    updateIdeaInList
 }) => {
  const getInitialIdeaState = () => {
    if (isCreatingNew || !idea) {
      const category = initialNewIdeaTemplate.category;
      return { 
        ...initialNewIdeaTemplate,
        refinementPrompts: getInitialRefinementPrompts(category) 
      };
    }
    return { 
      ...idea, 
      status: idea.status ?? ProgressStatus.NOT_STARTED, 
      tags: idea.tags ?? [],
      aiCoachingSessions: idea.aiCoachingSessions?.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) ?? [], // Ensure sorted on load
      imageUrl: idea.imageUrl,
      imagePrompt: idea.imagePrompt,
    };
  };
  
  const [editableIdea, setEditableIdea] = useState<Omit<Idea, 'id' | 'createdAt'>>(getInitialIdeaState);
  const [currentTagInput, setCurrentTagInput] = useState<string>('');
  const [editingTag, setEditingTag] = useState<{ index: number; text: string } | null>(null);
  const editingTagInputRef = useRef<HTMLInputElement>(null);

  const [aiOpError, setAiOpError] = useState<string | null>(null);
  const [userSpecificQuery, setUserSpecificQuery] = useState<string>('');
  
  const apiKey = getApiKey(); // Get API key once
  const aiFeaturesDisabled = !apiKey;

  useEffect(() => {
    const initialState = getInitialIdeaState();
    setEditableIdea(initialState);
    setUserSpecificQuery(''); 
    setAiOpError(null);
    setEditingTag(null);
    setDetailViewLoading(false); // Reset loading when idea changes or view opens
  }, [idea, isCreatingNew]);

  useEffect(() => {
    if (editingTag && editingTagInputRef.current) {
      editingTagInputRef.current.focus();
    }
  }, [editingTag]);
  
  const handleChange = (
    field: keyof Omit<Idea, 'id' | 'createdAt' | 'initialSteps' | 'refinementPrompts' | 'userRefinements' | 'tags' | 'aiCoachingSessions' | 'imageUrl' | 'imagePrompt'>, 
    value: string | boolean | IdeaCategory | ImpactLevel | EffortLevel | ProgressStatus
  ) => {
    setEditableIdea(prev => {
      const newState = { ...prev, [field]: value };
      if (field === 'category' && (isCreatingNew || prev.isCustom)) {
         newState.refinementPrompts = getInitialRefinementPrompts(value as IdeaCategory);
         newState.userRefinements = {};
      }
      return newState;
    });
  };

  const handleListChange = (listType: 'initialSteps' | 'refinementPrompts', index: number, value: string) => {
    setEditableIdea(prev => {
      const newList = [...prev[listType]];
      newList[index] = value;
      return { ...prev, [listType]: newList };
    });
  };
  
  const addListItem = (listType: 'initialSteps' | 'refinementPrompts') => {
    setEditableIdea(prev => ({ ...prev, [listType]: [...prev[listType], ''] }));
  };

  const removeListItem = (listType: 'initialSteps' | 'refinementPrompts', index: number) => {
    setEditableIdea(prev => ({ ...prev, [listType]: prev[listType].filter((_, i) => i !== index) }));
  };

  const handleRefinementChange = (prompt: string, value: string) => {
    setEditableIdea(prev => ({
      ...prev,
      userRefinements: {
        ...prev.userRefinements,
        [prompt]: value,
      },
    }));
  };

  const handleAddTag = () => {
    const newTag = currentTagInput.trim().replace(/\s+/g, '-'); 
    if (newTag && !editableIdea.tags.includes(newTag)) {
      setEditableIdea(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
    }
    setCurrentTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditableIdea(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };
  
  const handleEditTag = (index: number) => {
    setEditingTag({ index, text: editableIdea.tags[index] });
  };

  const handleSaveEditedTag = () => {
    if (editingTag) {
      const updatedTag = editingTag.text.trim().replace(/\s+/g, '-');
      if (updatedTag) {
        const tagExists = editableIdea.tags.some((tag, i) => i !== editingTag.index && tag === updatedTag);
        if (!tagExists) {
          setEditableIdea(prev => {
            const newTags = [...prev.tags];
            newTags[editingTag.index] = updatedTag;
            return { ...prev, tags: newTags };
          });
        }
      } else {
        setEditableIdea(prev => {
            const newTags = prev.tags.filter((_, i) => i !== editingTag.index);
            return { ...prev, tags: newTags };
          });
      }
      setEditingTag(null);
    }
  };


  const handleAIImageGeneration = async () => {
    if (aiFeaturesDisabled) {
        setAiOpError("AI 이미지 생성을 위해 API 키를 설정해주세요.");
        return;
    }
    if (!editableIdea.title || !editableIdea.category) {
        setAiOpError("이미지 생성을 위해 아이디어 제목과 카테고리가 필요합니다.");
        return;
    }
    setDetailViewLoading(true);
    setAiOpError(null);
    try {
        const { base64Image, Gprompt } = await generateImageForIdea(apiKey!, editableIdea.title, editableIdea.category);
        const updatedIdeaPartial = {
            ...editableIdea,
            imageUrl: base64Image,
            imagePrompt: Gprompt,
        };
        setEditableIdea(updatedIdeaPartial);
        // Also update the idea in the main App state for persistence if user navigates away before saving
        if(idea?.id){
            updateIdeaInList({
                id: idea.id, 
                createdAt: idea.createdAt, 
                ...updatedIdeaPartial
            });
        }

    } catch (err) {
        if (err instanceof Error) {
            setAiOpError(err.message);
        } else {
            setAiOpError("AI 이미지 생성 중 알 수 없는 오류가 발생했습니다.");
        }
    } finally {
        setDetailViewLoading(false);
    }
  };

  const handleAICoachingRequest = async (coachingType: AICoachingPromptType, customQuestion?: string) => {
    if (aiFeaturesDisabled) {
        setAiOpError("AI 코칭 기능을 사용하려면 API 키를 설정해주세요.");
        return;
    }
    if (!editableIdea) return;
    if (coachingType === AICoachingPromptType.USER_SPECIFIC_QUERY && (!customQuestion || customQuestion.trim() === '')) {
      setAiOpError("AI에게 질문할 내용을 입력해주세요.");
      return;
    }

    setDetailViewLoading(true);
    setAiOpError(null);

    try {
      const ideaContext = {
        title: editableIdea.title,
        description: editableIdea.description,
        category: editableIdea.category,
        initialSteps: editableIdea.initialSteps,
        userRefinements: editableIdea.userRefinements,
        tags: editableIdea.tags,
        status: editableIdea.status,
        potentialImpact: editableIdea.potentialImpact,
        effortLevel: editableIdea.effortLevel,
      };
      const promptSent = generateCoachingPrompt(ideaContext, coachingType, editableIdea.aiCoachingSessions || [], customQuestion);
      const { textResponse, groundingMetadata } = await getAICoachingResponse(apiKey!, promptSent, coachingType);

      const newSession: AICoachingSession = {
        promptType: coachingType,
        promptSent,
        response: textResponse,
        timestamp: new Date().toISOString(),
        groundingMetadata: groundingMetadata,
      };
      
      const updatedAICoachingSessions = [newSession, ...(editableIdea.aiCoachingSessions || [])];
      const updatedIdeaPartial = {
        ...editableIdea,
        aiCoachingSessions: updatedAICoachingSessions,
      };
      setEditableIdea(updatedIdeaPartial);

      if (coachingType === AICoachingPromptType.USER_SPECIFIC_QUERY) {
        setUserSpecificQuery(''); 
      }
       // Also update the idea in the main App state
       if(idea?.id){
            updateIdeaInList({
                id: idea.id, 
                createdAt: idea.createdAt, 
                ...updatedIdeaPartial
            });
        }

    } catch (err) {
      if (err instanceof Error) {
        setAiOpError(err.message);
      } else {
        setAiOpError("AI 코칭 중 알 수 없는 오류가 발생했습니다.");
      }
    } finally {
      setDetailViewLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editableIdea.title.trim()) {
      alert("아이디어 제목을 입력해주세요.");
      return;
    }
    const finalIdea: Idea = {
      id: idea?.id || Date.now().toString() + Math.random().toString(36).substring(2,7),
      createdAt: idea?.createdAt || new Date().toISOString(),
      ...editableIdea, 
      isCustom: idea?.isCustom ?? isCreatingNew, 
    };
    onSave(finalIdea);
  };
  
  if (!editableIdea && !isCreatingNew) return <p className="text-center p-8">아이디어를 불러오는 중...</p>;

  const currentIdea = editableIdea;
  const isCurrentlyLoadingAI = getApiKey() === null; // Simple check if AI features are generally disabled

  const coachingButtonClasses = "px-3 py-2 text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-center";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm">
      {currentIdea.imageUrl && (
        <div className="mb-4 p-3 bg-slate-700/50 rounded-md">
          <img 
            src={currentIdea.imageUrl} 
            alt={currentIdea.imagePrompt || 'AI generated image for idea'} 
            className="rounded-md max-w-full h-auto max-h-64 object-contain mx-auto shadow-lg" 
          />
          {currentIdea.imagePrompt && <p className="text-xs text-slate-400 mt-2 text-center">프롬프트: "{currentIdea.imagePrompt}"</p>}
        </div>
      )}

      <div className="pt-2">
        <button
            type="button"
            onClick={handleAIImageGeneration}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={aiFeaturesDisabled || !currentIdea.title || !currentIdea.category}
            aria-label={aiFeaturesDisabled ? "AI 이미지 생성을 위해 API 키 설정 필요" : "AI 이미지 생성"}
            title={aiFeaturesDisabled ? "AI 기능을 사용하려면 헤더에서 API 키를 설정해주세요." : "AI 아이디어 시각화"}
        >
            🎨 아이디어 시각화 (AI 이미지 생성)
            {isCurrentlyLoadingAI && editableIdea.title && editableIdea.category && ( // Show spinner only if it *would* be running
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
        </button>
        {isCurrentlyLoadingAI && editableIdea.title && editableIdea.category && <p className="text-purple-300 text-xs mt-2 text-center">AI가 아이디어를 그리고 있습니다...</p>}
      </div>

       <div>
        <label htmlFor="title" className="block text-sm font-medium text-sky-300 mb-1">아이디어 제목</label>
        <input
          type="text"
          id="title"
          value={currentIdea.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-sky-300 mb-1">카테고리</label>
          <select
            id="category"
            value={currentIdea.category}
            onChange={(e) => handleChange('category', e.target.value as IdeaCategory)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.values(IdeaCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
            <label htmlFor="status" className="block text-sm font-medium text-sky-300 mb-1">진행 상태</label>
            <select
                id="status"
                value={currentIdea.status}
                onChange={(e) => handleChange('status', e.target.value as ProgressStatus)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            >
                {Object.entries(PROGRESS_STATUS_LABELS).map(([statusKey, statusLabel]) => (
                    <option key={statusKey} value={statusKey as ProgressStatus}>{statusLabel}</option>
                ))}
            </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-sky-300 mb-1">상세 설명</label>
        <textarea
          id="description"
          rows={3}
          value={currentIdea.description}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="potentialImpact" className="block text-sm font-medium text-sky-300 mb-1">잠재적 효과</label>
          <select
            id="potentialImpact"
            value={currentIdea.potentialImpact}
            onChange={(e) => handleChange('potentialImpact', e.target.value as ImpactLevel)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.values(ImpactLevel).map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="effortLevel" className="block text-sm font-medium text-sky-300 mb-1">필요 노력</label>
          <select
            id="effortLevel"
            value={currentIdea.effortLevel}
            onChange={(e) => handleChange('effortLevel', e.target.value as EffortLevel)}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
          >
            {Object.values(EffortLevel).map(level => <option key={level} value={level}>{level}</option>)}
          </select>
        </div>
      </div>
       
      <div className="flex items-center mt-4">
          <input
              type="checkbox"
              id="isFavorite"
              checked={!!currentIdea.isFavorite} 
              onChange={(e) => handleChange('isFavorite', e.target.checked)}
              className="h-4 w-4 text-sky-600 border-slate-500 rounded focus:ring-sky-500"
          />
          <label htmlFor="isFavorite" className="ml-2 text-sm font-medium text-slate-300">이 아이디어를 즐겨찾기에 추가</label>
      </div>
      
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-sky-300 mb-1">태그</label>
        <div className="flex items-center mb-2">
            <input
                type="text"
                id="tags"
                value={currentTagInput}
                onChange={(e) => setCurrentTagInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                    }
                }}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 mr-2"
                placeholder="태그 입력 후 Enter 또는 , (쉼표)"
            />
            <button type="button" onClick={handleAddTag} className="px-3 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white rounded-md">추가</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(currentIdea.tags || []).map((tag, index) => (
            editingTag?.index === index ? (
              <input
                key={`editing-tag-${index}`}
                ref={editingTagInputRef}
                type="text"
                value={editingTag.text}
                onChange={(e) => setEditingTag({ ...editingTag, text: e.target.value })}
                onBlur={handleSaveEditedTag}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEditedTag(); } }}
                className="bg-teal-700 text-teal-100 text-xs px-2 py-1 rounded-full focus:ring-1 focus:ring-sky-400 outline-none"
              />
            ) : (
              <span 
                key={tag + index} 
                onClick={() => handleEditTag(index)}
                className="flex items-center bg-teal-600 hover:bg-teal-500 cursor-pointer text-teal-100 text-xs px-2 py-1 rounded-full transition-colors"
              >
                {tag}
                <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }} 
                    className="ml-1.5 text-teal-300 hover:text-white text-xs"
                    aria-label={`Remove tag ${tag}`}
                >
                    &times;
                </button>
              </span>
            )
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-md font-medium text-sky-300 mb-2 mt-4">초기 실행 단계</h4>
        {currentIdea.initialSteps.map((step, index) => (
          <div key={index} className="flex items-center mb-2">
            <input
              type="text"
              value={step}
              onChange={(e) => handleListChange('initialSteps', index, e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 mr-2"
              placeholder={`단계 ${index + 1}`}
            />
            {currentIdea.initialSteps.length > 1 && (
                 <button type="button" onClick={() => removeListItem('initialSteps', index)} className="text-red-400 hover:text-red-300 p-1 rounded-full text-xs">삭제</button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => addListItem('initialSteps')} className="text-sky-400 hover:text-sky-300 text-xs mt-1">+ 단계 추가</button>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-sky-300 mb-2">아이디어 구체화 (Refinement)</h4>
        {currentIdea.refinementPrompts.map((prompt, index) => (
          <div key={index} className="mb-3">
            <label className="block text-xs font-medium text-slate-400 mb-1">{prompt}</label>
            <textarea
              rows={2}
              value={currentIdea.userRefinements[prompt] || ''}
              onChange={(e) => handleRefinementChange(prompt, e.target.value)}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
              placeholder="답변을 입력하세요..."
            />
          </div>
        ))}
         {(isCreatingNew || currentIdea.isCustom) && ( 
            <>
            <h5 className="text-sm font-medium text-sky-400 mt-3 mb-1">구체화 질문 수정 (선택 사항)</h5>
            {currentIdea.refinementPrompts.map((prompt, index) => (
              <div key={`custom-prompt-${index}`} className="flex items-center mb-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => handleListChange('refinementPrompts', index, e.target.value)}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 mr-2 text-xs"
                  placeholder={`질문 ${index + 1}`}
                />
                 {currentIdea.refinementPrompts.length > 1 && (
                    <button type="button" onClick={() => removeListItem('refinementPrompts', index)} className="text-red-400 hover:text-red-300 p-1 rounded-full text-xs">삭제</button>
                 )}
              </div>
            ))}
            <button type="button" onClick={() => addListItem('refinementPrompts')} className="text-sky-400 hover:text-sky-300 text-xs mt-1">+ 질문 추가</button>
            </>
        )}
      </div>

      <div className="pt-4 border-t border-slate-700">
        <h4 className="text-lg font-semibold text-indigo-400 mb-3">✨ AI 아이디어 코칭</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {[
            AICoachingPromptType.ACTION_PLAN_DETAIL,
            AICoachingPromptType.RISK_ANALYSIS,
            AICoachingPromptType.ALTERNATIVE_PERSPECTIVES,
            AICoachingPromptType.EXPLORE_RESOURCES,
            AICoachingPromptType.IDEA_ELABORATION,
          ].map((type) => (
            <button 
              key={type}
              type="button" 
              onClick={() => handleAICoachingRequest(type)}
              className={`${coachingButtonClasses} ${type === AICoachingPromptType.IDEA_ELABORATION && (window.innerWidth < 640 || window.innerWidth >=1024) ? '' : 'sm:col-span-2 lg:col-span-1'}`}
              disabled={aiFeaturesDisabled}
              title={aiFeaturesDisabled ? "AI 기능을 사용하려면 헤더에서 API 키를 설정해주세요." : AI_COACHING_PROMPT_TYPE_LABELS[type]}
              aria-label={AI_COACHING_PROMPT_TYPE_LABELS[type]}
            >
              {
                {
                  [AICoachingPromptType.ACTION_PLAN_DETAIL]: '📋 ',
                  [AICoachingPromptType.RISK_ANALYSIS]: '🤔 ',
                  [AICoachingPromptType.ALTERNATIVE_PERSPECTIVES]: '💡 ',
                  [AICoachingPromptType.EXPLORE_RESOURCES]: '📚 ',
                  [AICoachingPromptType.IDEA_ELABORATION]: '🔎 ',
                }[type]
              }
              {AI_COACHING_PROMPT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-600/50">
          <h5 className="text-md font-semibold text-teal-400 mb-2">💬 AI에게 직접 질문하기</h5>
          <textarea
            rows={3}
            value={userSpecificQuery}
            onChange={(e) => setUserSpecificQuery(e.target.value)}
            placeholder="이 아이디어에 대해 AI에게 더 자세히 물어보고 싶은 내용을 입력하세요. (예: '이 아이템을 온라인으로 판매하기 위한 첫 3단계는 무엇인가요?', '이 전략의 잠재적인 단점은 무엇일까요?')"
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm placeholder-slate-500"
            disabled={aiFeaturesDisabled}
          />
          <button
            type="button"
            onClick={() => handleAICoachingRequest(AICoachingPromptType.USER_SPECIFIC_QUERY, userSpecificQuery)}
            className="mt-2 px-4 py-2 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            disabled={aiFeaturesDisabled || !userSpecificQuery.trim()}
            title={aiFeaturesDisabled ? "AI 기능을 사용하려면 헤더에서 API 키를 설정해주세요." : "AI 답변 요청"}
            aria-label="AI 답변 요청"
          >
            AI 답변 요청
          </button>
        </div>
        
        {aiOpError && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-xs my-3">{aiOpError}</p>}

        {(currentIdea.aiCoachingSessions && currentIdea.aiCoachingSessions.length > 0) && (
          <div className="mt-6 space-y-4">
            <h5 className="text-md font-medium text-indigo-300">코칭 기록 (최신순):</h5>
            {currentIdea.aiCoachingSessions.map((session, index) => (
              <div key={index} className="p-3 bg-slate-700/80 rounded-lg shadow-md">
                <p className="text-xs text-slate-400 mb-2 border-b border-slate-600 pb-1">
                  <span className={`font-semibold ${
                    session.promptType === AICoachingPromptType.USER_SPECIFIC_QUERY ? 'text-teal-400' 
                    : session.promptType === AICoachingPromptType.EXPLORE_RESOURCES ? 'text-lime-400' 
                    : session.promptType === AICoachingPromptType.IDEA_ELABORATION ? 'text-yellow-400'
                    : 'text-indigo-400'
                  }`}>
                    {AI_COACHING_PROMPT_TYPE_LABELS[session.promptType] || session.promptType}
                  </span>
                  {' - '}
                  {new Date(session.timestamp).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'})}
                </p>
                <FormattedAICoachingResponse session={session} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-md transition-colors"
           disabled={isCurrentlyLoadingAI} // Check general loading state
        >
          {isCreatingNew ? '아이디어 추가' : '변경사항 저장'}
        </button>
      </div>
    </form>
  );
};

export default IdeaDetailView;