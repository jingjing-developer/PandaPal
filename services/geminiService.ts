import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VocabularyItem } from "../types";

// Ensure process.env.API_KEY || 'FAKE_API_KEY_FOR_DEVELOPMENT' is treated as a string to avoid TS errors
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

// Audio Context Singleton
let audioContext: AudioContext | null = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// --- Content Generation ---

export const generateLessonContent = async (topic: string): Promise<VocabularyItem[]> => {
  const model = "gemini-2.5-flash";
  
  // Strict prompt for A1 level kids content with mixed types
  const prompt = `
    You are an English teacher for Chinese children (ages 5-8). 
    Generate 5 learning items about: "${topic}".
    
    Structure the 5 items strictly as follows:
    1. 3 basic English vocabulary Words (e.g., "Apple", "Cat").
    2. 1 simple English Phrase (e.g., "Red Apple", "Cute Cat").
    3. 1 short, simple English Sentence (e.g., "I like apples", "It is a cat").

    Rules:
    1. Content must be CEFR Pre-A1 or A1 level.
    2. 'word' field holds the English content.
    3. 'translation' MUST be in Simplified CHINESE.
    4. 'emoji' should be a single, clear emoji representing the meaning.
    5. 'pinyin' must be accurate for the Chinese translation.
    
    Return a JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The English word, phrase, or sentence" },
              translation: { type: Type.STRING, description: "Chinese meaning" },
              pinyin: { type: Type.STRING, description: "Pinyin" },
              emoji: { type: Type.STRING, description: "Visual emoji" }
            },
            required: ["word", "translation", "pinyin", "emoji"]
          }
        }
      }
    });

    let text = response.text;
    if (!text) return [];

    // Clean up Markdown if present (fixes parsing errors)
    if (text.startsWith("```json")) {
        text = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    }
    
    return JSON.parse(text) as VocabularyItem[];
  } catch (e) {
    console.error("Gemini Error:", e);
    throw e; // Throw so UI knows it failed
  }
};

// --- Text to Speech (TTS) ---

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / 1; // Mono
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}

export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Friendly voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const ctx = getAudioContext();
    const audioBytes = decodeBase64(base64Audio);
    return await decodeAudioData(audioBytes, ctx);

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const playAudioBuffer = (buffer: AudioBuffer) => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
};
