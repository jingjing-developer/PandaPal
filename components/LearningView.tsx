import React, { useState, useEffect, useMemo, useRef } from 'react';
import { VocabularyItem, ChallengeType, GameChallenge, AudioCache } from '../types';
import { generateSpeech, playAudioBuffer } from '../services/gemini';

interface GameSessionProps {
  items: VocabularyItem[];
  onComplete: (score: number) => void;
  onExit: () => void;
  color: string;
}

export const GameSession: React.FC<GameSessionProps> = ({ items, onComplete, onExit, color }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [audioCache, setAudioCache] = useState<AudioCache>({});
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);

  // --- Game Logic Engine ---
  
  // Create a game plan: For each word -> Learn It -> Play with it -> Review it
  const gameQueue = useMemo(() => {
    const queue: GameChallenge[] = [];
    
    // We break the items into chunks or do 1 by 1. For kids, 1 by 1 "Learn then Practice" is good.
    items.forEach((item) => {
        // 1. Learn phase
        queue.push({ type: ChallengeType.LEARN, target: item, options: [] });
        
        // 2. Practice Phase (Listen & Find)
        const distractors = items.filter(i => i.word !== item.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [item, ...distractors].sort(() => 0.5 - Math.random());
        queue.push({ type: ChallengeType.LISTEN_FIND, target: item, options });
    });
    
    // 3. Final Boss Review (Word Match) for all items mixed
    const reviewQueue: GameChallenge[] = [];
    items.forEach(item => {
        const distractors = items.filter(i => i.word !== item.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        const options = [item, ...distractors].sort(() => 0.5 - Math.random());
        reviewQueue.push({ type: ChallengeType.WORD_MATCH, target: item, options });
    });
    
    // Shuffle review
    return [...queue, ...reviewQueue.sort(() => 0.5 - Math.random())];
  }, [items]);

  const currentChallenge = gameQueue[currentStep];
  const progress = (currentStep / gameQueue.length) * 100;

  // --- Audio Handling ---

  const playWord = async (word: string) => {
    // If cached, play
    if (audioCache[word]) {
        playAudioBuffer(audioCache[word]);
        return;
    }

    // Generate
    setIsAudioLoading(true);
    const buffer = await generateSpeech(word);
    if (buffer) {
        setAudioCache(prev => ({ ...prev, [word]: buffer }));
        playAudioBuffer(buffer);
    }
    setIsAudioLoading(false);
  };

  // Auto-play audio when entering a new step if it's LEARN or LISTEN type
  // Use a ref to ensure it only fires once per step change
  useEffect(() => {
    if (!currentChallenge) return;
    
    // Reset state for new step
    setSelectedOption(null);
    setIsCorrect(null);

    const wordToPlay = currentChallenge.target.word;
    
    // Small delay for smooth transition and ensure view is ready
    const timer = setTimeout(() => {
        playWord(wordToPlay);
    }, 500);

    return () => clearTimeout(timer);
  }, [currentStep]); // Only re-run when step index changes


  // --- Interactions ---

  const handleNext = () => {
    if (currentStep < gameQueue.length - 1) {
        setCurrentStep(s => s + 1);
    } else {
        onComplete(score);
    }
  };

  const handleOptionClick = (option: VocabularyItem) => {
    if (isCorrect !== null) return; // Block double clicks

    setSelectedOption(option.word);
    const correct = option.word === currentChallenge.target.word;
    setIsCorrect(correct);

    if (correct) {
        // Success Logic
        setCombo(c => c + 1);
        setScore(s => s + 10 + combo * 2);
        
        // Removed playWord(option.word) here to prevent playing it "twice"
        // The user has already heard it at the start of the card.
        
        // Auto advance after short delay
        setTimeout(() => {
            handleNext();
        }, 1200);
    } else {
        setCombo(0);
        // Error sound effect placeholder (shake animation handles visual)
        setTimeout(() => {
           setSelectedOption(null);
           setIsCorrect(null);
        }, 1000);
    }
  };

  if (!currentChallenge) return <div>Loading Game...</div>;

  // --- Helpers ---
  const getFontSize = (text: string) => {
    if (text.length > 20) return 'text-2xl';
    if (text.length > 12) return 'text-4xl';
    return 'text-5xl';
  };

  // --- Renderers ---

  const renderLearnPhase = () => (
    <div className="flex flex-col items-center animate-pop w-full max-w-sm px-4">
        <div className="text-gray-500 font-bold mb-4 uppercase tracking-wider">Learn (学习)</div>
        
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full flex flex-col items-center border-b-8 border-gray-100 relative overflow-hidden">
            {/* Background shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-50 pointer-events-none"></div>

            <div className="text-9xl mb-6 drop-shadow-md transform transition hover:scale-110 duration-300">{currentChallenge.target.emoji}</div>
            
            <h1 className={`${getFontSize(currentChallenge.target.word)} font-black text-gray-800 mb-2 tracking-tight text-center leading-tight`}>
                {currentChallenge.target.word}
            </h1>
            <p className="text-2xl text-gray-400 font-bold mb-6">{currentChallenge.target.translation}</p>

            <button 
                onClick={() => playWord(currentChallenge.target.word)}
                className={`p-4 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200 transition-all transform hover:scale-110 active:scale-95 ${isAudioLoading ? 'animate-pulse' : ''}`}
                title="Play Pronunciation"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
            </button>
        </div>

        <button 
            onClick={handleNext}
            className="mt-8 w-full py-4 rounded-2xl font-black text-xl text-white shadow-lg btn-press flex items-center justify-center gap-2 touch-manipulation"
            style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.2)' }}
        >
            <span>I Know It! (懂了)</span>
            <span>➔</span>
        </button>
    </div>
  );

  const renderQuizPhase = () => {
    const isListenMode = currentChallenge.type === ChallengeType.LISTEN_FIND;
    const title = isListenMode ? "Listen & Find (听音找词)" : "What is this? (这是什么?)";

    return (
        <div className="flex flex-col items-center w-full max-w-sm px-4">
            
            {/* Question Area */}
            <div className="mb-6 text-center animate-pop w-full">
                <h2 className="text-gray-500 font-bold mb-4">{title}</h2>
                
                {isListenMode ? (
                    <button 
                        onClick={() => playWord(currentChallenge.target.word)}
                        className="bg-white p-6 rounded-full shadow-lg border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        <div className={`text-blue-500 ${isAudioLoading ? 'animate-spin' : 'animate-pulse'}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-16 h-16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                            </svg>
                        </div>
                    </button>
                ) : (
                    <div className="bg-white px-8 py-6 rounded-2xl shadow-md border-b-4 border-gray-200 w-full">
                        <span className={`${getFontSize(currentChallenge.target.word)} font-black text-gray-800 block leading-tight`}>
                            {currentChallenge.target.word}
                        </span>
                    </div>
                )}
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-4 w-full">
                {currentChallenge.options.map((opt) => {
                    let stateStyles = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
                    let icon = null;

                    if (selectedOption === opt.word) {
                        if (isCorrect) {
                            stateStyles = "bg-green-100 border-green-500 text-green-700 ring-4 ring-green-200";
                            icon = "✅";
                        } else if (isCorrect === false) {
                            stateStyles = "bg-red-100 border-red-500 text-red-700 animate-shake";
                            icon = "❌";
                        }
                    } else if (selectedOption && opt.word === currentChallenge.target.word && isCorrect === false) {
                         // Hint showing correct answer if wrong
                         stateStyles = "bg-green-50 border-green-300 opacity-70";
                    }

                    return (
                        <button
                            key={opt.word}
                            onClick={() => handleOptionClick(opt)}
                            disabled={isCorrect === true}
                            className={`
                                relative p-3 rounded-2xl font-bold text-xl shadow-sm border-b-4
                                flex flex-col items-center justify-center gap-1 aspect-square
                                transition-all duration-200 active:scale-95 touch-manipulation
                                ${stateStyles}
                            `}
                        >
                            <span className="text-4xl drop-shadow-sm mb-1">{opt.emoji}</span>
                            <span className="text-sm font-normal text-gray-500">{opt.translation}</span>
                            
                            {/* In Listen mode, show faded English to help reading mapping. */}
                            <span className="text-xs opacity-40 font-bold truncate max-w-full px-1">{opt.word}</span>
                            
                            {icon && <div className="absolute top-2 right-2 text-xl">{icon}</div>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col items-center pt-4 relative">
        {/* Top Bar */}
        <div className="w-full max-w-md px-4 flex justify-between items-center mb-4">
            <button onClick={onExit} className="text-gray-400 hover:text-gray-600 font-bold bg-white px-3 py-1 rounded-full shadow-sm text-sm border border-gray-100">
                ✕ Exit
            </button>
            <div className="flex gap-2">
                 {combo > 1 && (
                    <div className="animate-bounce bg-orange-400 text-white px-3 py-1 rounded-full font-bold shadow-sm border-b-2 border-orange-600 text-sm">
                        {combo}x Combo!
                    </div>
                 )}
                 <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold border border-yellow-300 text-sm">
                    {score} XP
                 </div>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md px-8 mb-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: color }}
                />
            </div>
        </div>

        {/* Main Content */}
        {currentChallenge.type === ChallengeType.LEARN ? renderLearnPhase() : renderQuizPhase()}
    </div>
  );
};