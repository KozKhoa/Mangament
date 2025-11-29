// This context use to store information
"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import Story from "@/types/story";
import DEFAULT from "@/constants/default";
import KEY from "@/constants/key";

interface AppContextProps {
  story?: Story;
  font?: string;
  textSize?: number;
  readingFont: string;
  readingTextSize: number;
  readingLineSpacing: number;

  setStory: (story: Story) => void;
  updateFont: (font: string) => void;
  updateTextSize: (textSize: number) => void;
  updateReadingFont: (font: string) => void;
  updateReadingTextSize: (textSize: number) => void;
  updateReadingLineSpacing: (value: number) => void;
}

const AppContext = createContext<AppContextProps | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [story, setStory] = useState<Story>();
  const [textSize, setTextSize] = useState<number>(DEFAULT.textSize);
  const [font, setFont] = useState<string>(DEFAULT.font.id);
  const [readingFont, setReadingFont] = useState<string>(DEFAULT.font.id);
  const [readingTextSize, setReadingTextSize] = useState<number>(DEFAULT.textSize);
  const [readingLineSpacing, setReadingLineSpacing] = useState<number>(DEFAULT.lineSpacing);

  function loadFont() {
    const savedFont = localStorage.getItem(KEY.localStorage.FONT);
    const savedTextSize = localStorage.getItem(KEY.localStorage.TEXT_SIZE);
    const savedReadingFont = localStorage.getItem(KEY.localStorage.READING_FONT);
    const savedReadingTextSize = localStorage.getItem(KEY.localStorage.READING_TEXT_SIZE);
    const savedReadingLineSpacing = localStorage.getItem(KEY.localStorage.READING_LINE_SPACING);

    setFont(savedFont ?? DEFAULT.font.id);
    setTextSize(Number(savedTextSize ?? DEFAULT.textSize));
    setReadingFont(savedReadingFont ?? DEFAULT.font.id);
    setReadingTextSize(Number(savedReadingTextSize ?? DEFAULT.textSize));
    setReadingLineSpacing(Number(savedReadingLineSpacing ?? DEFAULT.lineSpacing));
  }

  function updateFont(newFont: string) {
    localStorage.setItem(KEY.localStorage.FONT, newFont);
    setFont(newFont);
  }

  function updateTextSize(newSize: number) {
    localStorage.setItem(KEY.localStorage.TEXT_SIZE, newSize.toString());
    setTextSize(newSize);
  }

  function updateReadingFont(newFont: string) {
    localStorage.setItem(KEY.localStorage.READING_FONT, newFont.toString());
    setReadingFont(newFont);
  }

  function updateReadingTextSize(newSize: number) {
    localStorage.setItem(KEY.localStorage.READING_TEXT_SIZE, newSize.toString());
    setReadingTextSize(newSize);
  }

  function updateReadingLineSpacing(newSpacing: number) {
    localStorage.setItem(KEY.localStorage.READING_LINE_SPACING, newSpacing.toString());
    setReadingLineSpacing(newSpacing);
  }

  useLayoutEffect(() => {
    loadFont();
  }, []);

  return (
    <AppContext.Provider
      value={{
        story,
        font,
        textSize,
        readingFont,
        readingTextSize,
        readingLineSpacing,
        setStory,
        updateFont,
        updateTextSize,
        updateReadingFont,
        updateReadingTextSize,
        updateReadingLineSpacing,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default function useApp() {
  const context = useContext(AppContext);
  return context;
}
