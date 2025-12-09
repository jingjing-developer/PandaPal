export interface VocabularyItem {
  word: string;           // English Word (Primary)
  translation: string;    // Chinese Translation (Secondary)
  pinyin: string;         // Pinyin
  emoji: string;          // Visual
}

export interface LevelConfig {
  id: number;
  title: string;          // English Title
  chineseTitle: string;   // Chinese Title
  color: string;          // Theme Color
  icon: string;           // Level Icon
  topicPrompt: string;    // Specific prompt for Gemini
}

export enum AppState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  GAME = 'GAME',
  VICTORY = 'VICTORY'
}

export type AudioCache = Record<string, AudioBuffer>;

export enum ChallengeType {
  LEARN = 'LEARN',             // Presentation: Look, Listen, Learn
  LISTEN_FIND = 'LISTEN_FIND', // Audio plays -> Pick correct image/word
  WORD_MATCH = 'WORD_MATCH'    // English Word shows -> Pick correct image
}

export interface GameChallenge {
  type: ChallengeType;
  target: VocabularyItem;
  options: VocabularyItem[]; // For multiple choice
}
