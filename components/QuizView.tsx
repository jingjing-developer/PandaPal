import React, { useState } from 'react';
import { VocabularyItem } from '../types';
import { generateSpeech, playAudioBuffer } from '../services/gemini';

interface QuizViewProps {
  items: VocabularyItem[];
  onComplete: (score: number) => void;
  color: string;
}

export const QuizView: React.FC<QuizViewProps> = ({ items, onComplete, color }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState<boolean | null>(null); // true = correct, false = wrong
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentQuestion = items[currentIndex];

  // Create options: 1 correct, 3 distractors
  const options = React.useMemo(() => {
    const others = items.filter(i => i.word !== currentQuestion.word);
    // Shuffle distractors
    const shuffledOthers = [...others].sort(() => 0.5 - Math.random()).slice(0, 3);
    const allOptions = [currentQuestion, ...shuffledOthers];
    // Shuffle all options
    return allOptions.sort(() => 0.5 - Math.random());
  }, [currentQuestion, items]);

  const handleOptionClick = async (option: VocabularyItem) => {
    if (showResult !== null) return; // Prevent double clicking

    setSelectedOption(option.word);
    const isCorrect = option.word === currentQuestion.word;
    
    // Play audio immediately
    const buffer = await generateSpeech(option.word);
    if (buffer) playAudioBuffer(buffer);

    setShowResult(isCorrect);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setShowResult(null);
        setSelectedOption(null);
      } else {
        onComplete(isCorrect ? score + 1 : score);
      }
    }, 1500); // Wait 1.5s before next question
  };

  const getFontSize = (text: string) => {
    if (text.length > 20) return 'text-xl';
    if (text.length > 12) return 'text-2xl';
    return 'text-4xl';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-4 min-h-[500px]">
       <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-gray-500">测验 (Quiz) {currentIndex + 1}/{items.length}</span>
            <div className="flex gap-1">
                {[...Array(items.length)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full ${i < currentIndex ? (score > i ? 'bg-green-500' : 'bg-red-400') : 'bg-gray-200'}`}
                    />
                ))}
            </div>
       </div>

       <div className="bg-white p-8 rounded-3xl shadow-lg w-full text-center mb-8 border-b-8 border-gray-200">
            <p className="text-lg text-gray-400 font-bold mb-2">请找出这个单词:</p>
            <h2 className="text-4xl font-black text-gray-800 mb-2">{currentQuestion.translation}</h2>
            <p className="text-xl text-gray-500">{currentQuestion.pinyin}</p>
       </div>

       <div className="grid grid-cols-2 gap-4 w-full">
            {options.map((option) => {
                let statusClass = "bg-white border-b-4 border-gray-200 hover:border-gray-300";
                
                if (showResult !== null) {
                    if (option.word === currentQuestion.word) {
                        statusClass = "bg-green-100 border-b-4 border-green-500 text-green-700";
                    } else if (option.word === selectedOption) {
                        statusClass = "bg-red-100 border-b-4 border-red-500 text-red-700";
                    } else {
                        statusClass = "opacity-50 bg-gray-100 border-gray-200";
                    }
                }

                return (
                    <button
                        key={option.word}
                        onClick={() => handleOptionClick(option)}
                        className={`
                            p-4 rounded-2xl font-bold transition-all duration-200
                            min-h-[120px] flex flex-col items-center justify-center gap-2
                            shadow-sm
                            ${statusClass}
                        `}
                    >
                        <span className="text-3xl">{option.emoji}</span>
                        <span className={`${getFontSize(option.word)} text-center leading-tight`}>{option.word}</span>
                    </button>
                )
            })}
       </div>
    </div>
  );
};