import React from 'react';
import { LevelConfig } from '../types';

interface MenuProps {
  levels: LevelConfig[];
  onSelectLevel: (level: LevelConfig) => void;
  totalXP: number;
}

export const Menu: React.FC<MenuProps> = ({ levels, onSelectLevel, totalXP }) => {
  return (
    <div className="flex flex-col items-center w-full h-full relative">
      {/* Header */}
      <div className="fixed top-0 z-20 w-full max-w-md p-4 bg-gradient-to-b from-yellow-50 to-transparent">
        <div className="bg-white/90 backdrop-blur-md rounded-full shadow-lg p-2 px-4 flex justify-between items-center border-2 border-yellow-200">
            <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🐼</span>
                <span className="font-bold text-gray-700">PandaPal</span>
            </div>
            <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full border border-yellow-300">
                <span>⭐</span>
                <span className="font-bold text-yellow-700">{totalXP}</span>
            </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="w-full max-w-md flex-1 overflow-y-auto pb-24 pt-24 px-6 hide-scrollbar">
        <div className="flex flex-col items-center gap-8 relative">
            
            {/* Connecting Path Line */}
            <div className="absolute top-4 bottom-4 w-4 bg-white/50 border-2 border-dashed border-gray-300 rounded-full -z-10" />

            {levels.map((level, index) => {
                const isLeft = index % 2 === 0;
                return (
                    <button
                        key={level.id}
                        onClick={() => onSelectLevel(level)}
                        className={`
                            relative group w-full flex items-center justify-center
                            transform transition-all duration-300 hover:scale-105
                        `}
                    >
                        {/* Level Node */}
                        <div 
                            className={`
                                w-24 h-24 rounded-full shadow-xl border-b-8
                                flex items-center justify-center text-4xl
                                relative z-10 btn-press
                                ${isLeft ? '-translate-x-4' : 'translate-x-4'}
                            `}
                            style={{ backgroundColor: level.color, borderColor: 'rgba(0,0,0,0.15)' }}
                        >
                            <span className="group-hover:animate-spin">{level.icon}</span>
                            
                            {/* Star Badge */}
                            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                                START
                            </div>
                        </div>

                        {/* Label */}
                        <div className={`
                            absolute top-20 bg-white px-4 py-2 rounded-xl shadow-md border-2 border-gray-100
                            whitespace-nowrap z-20 font-bold text-gray-700
                            ${isLeft ? '-translate-x-4' : 'translate-x-4'}
                        `}>
                            {level.title}
                            <div className="text-xs text-gray-400 font-normal">{level.chineseTitle}</div>
                        </div>
                    </button>
                );
            })}
            
            <div className="mt-8 text-center text-gray-400 font-bold">
                More levels coming soon! <br/> (更多关卡即将推出)
            </div>
        </div>
      </div>
    </div>
  );
};
