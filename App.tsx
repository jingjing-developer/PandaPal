import React, { useState } from 'react';
import { LevelConfig, AppState, VocabularyItem } from './types';
import { generateLessonContent, getAudioContext } from './services/gemini';
import { Menu } from './components/Menu';
import { GameSession } from './components/LearningView'; // LearningView file now exports GameSession

// Simplified, Kid-Friendly Topics (A1)
const LEVELS: LevelConfig[] = [
  { id: 1, title: 'Animals', chineseTitle: '动物朋友', color: '#F87171', icon: '🐶', topicPrompt: 'Cute domestic animals (Cat, Dog, Bird, Fish, Rabbit)' },
  { id: 2, title: 'Fruits', chineseTitle: '美味水果', color: '#FB923C', icon: '🍎', topicPrompt: 'Common fruits (Apple, Banana, Orange, Pear, Grape)' },
  { id: 3, title: 'Colors', chineseTitle: '五颜六色', color: '#4ADE80', icon: '🎨', topicPrompt: 'Basic colors (Red, Blue, Green, Yellow, Pink)' },
  { id: 4, title: 'Family', chineseTitle: '我的家庭', color: '#60A5FA', icon: '🏠', topicPrompt: 'Immediate family (Mom, Dad, Brother, Sister, Baby)' },
  { id: 5, title: 'Body', chineseTitle: '我的身体', color: '#A78BFA', icon: '👀', topicPrompt: 'Body parts (Eye, Nose, Mouth, Hand, Ear)' },
];

function App() {
  const [state, setState] = useState<AppState>(AppState.MENU);
  const [currentLevel, setCurrentLevel] = useState<LevelConfig | null>(null);
  const [vocabList, setVocabList] = useState<VocabularyItem[]>([]);
  const [totalXP, setTotalXP] = useState(0);
  const [lastScore, setLastScore] = useState(0);

  const handleSelectLevel = async (level: LevelConfig) => {
    // Initialize Audio Context on user gesture
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    setCurrentLevel(level);
    setState(AppState.LOADING);
    
    // Generate content
    const items = await generateLessonContent(level.topicPrompt);
    
    if (items.length > 0) {
        setVocabList(items);
        setState(AppState.GAME);
    } else {
        setState(AppState.MENU);
        alert("Ops! Could not load the game. Please try again.");
    }
  };

  const handleGameComplete = (score: number) => {
    setLastScore(score);
    setTotalXP(prev => prev + score);
    setState(AppState.VICTORY);
  };

  const returnToMenu = () => {
    setState(AppState.MENU);
    setCurrentLevel(null);
    setVocabList([]);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-yellow-50 relative font-sans selection:bg-yellow-200">
        
        {/* Background Decor */}
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
             <div className="absolute top-10 left-10 text-6xl opacity-10 animate-float">☁️</div>
             <div className="absolute top-40 right-20 text-4xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>☁️</div>
             <div className="absolute bottom-20 left-1/4 text-8xl opacity-5 animate-spin" style={{ animationDuration: '20s' }}>☀️</div>
        </div>

        <div className="relative z-10 h-full">
            {state === AppState.MENU && (
                <Menu levels={LEVELS} onSelectLevel={handleSelectLevel} totalXP={totalXP} />
            )}

            {state === AppState.LOADING && (
                <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-8xl mb-8 animate-bounce">🐼</div>
                    <h2 className="text-3xl font-black text-gray-700 mb-2">Loading...</h2>
                    <p className="text-gray-500 font-bold">Getting your adventure ready!</p>
                    <p className="text-gray-400 text-sm mt-1">(正在准备你的冒险)</p>
                    
                    <div className="mt-8 flex gap-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            )}

            {state === AppState.GAME && currentLevel && (
                <GameSession 
                    items={vocabList} 
                    onComplete={handleGameComplete} 
                    onExit={returnToMenu}
                    color={currentLevel.color} 
                />
            )}

            {state === AppState.VICTORY && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-pop">
                    <div className="text-9xl mb-4 animate-bounce">🏆</div>
                    <div className="relative">
                        <div className="absolute -inset-4 bg-yellow-300 rounded-full opacity-50 blur-xl animate-pulse"></div>
                        <h1 className="relative text-5xl font-black text-gray-800 mb-2 text-shadow-sm">Amazing!</h1>
                    </div>
                    <h2 className="text-2xl text-gray-500 font-bold mb-10">Level Complete!</h2>
                    
                    <div className="bg-white p-8 rounded-3xl shadow-xl border-b-8 border-gray-100 w-full max-w-xs mb-8 transform -rotate-2">
                        <p className="text-gray-400 font-bold uppercase text-xs mb-2 tracking-widest">Rewards</p>
                        <div className="text-6xl font-black text-yellow-500 mb-2 flex items-center justify-center gap-2">
                            <span>+{lastScore}</span>
                            <span className="text-4xl">⭐</span>
                        </div>
                    </div>

                    <button 
                        onClick={returnToMenu}
                        className="w-full max-w-xs py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-2xl shadow-lg text-xl btn-press border-green-700"
                    >
                        Play More (继续玩)
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}

export default App;
