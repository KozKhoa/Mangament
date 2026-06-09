// This context use to store information
"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import DEFAULT from "@/constants/default";
import KEY from "@/constants/key";
import genreService from "@/services/genre";
import { toast } from "sonner";
import authorService from "@/services/author";
import NATIONS from "@/constants/nations";
import Author from "@/types/author";
import Genre from "@/types/genre";
import Nation from "@/types/nation";

interface AppContextProps {
  genres: Genre[];
  trendingGenres: Genre[];
  authors: Author[];
  nations: Nation[];
  font?: string;
  textSize?: number;
  readingFont: string;
  readingTextSize: number;
  readingLineSpacing: number;

  updateFont: (font: string) => void;
  updateTextSize: (textSize: number) => void;
  updateReadingFont: (font: string) => void;
  updateReadingTextSize: (textSize: number) => void;
  updateReadingLineSpacing: (value: number) => void;

  loading: boolean;
}

const AppContext = createContext<AppContextProps | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [trendingGenres, setTrendingGenres] = useState<Genre[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);

  const [authors, setAuthors] = useState<Author[]>([]);
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

  useEffect(() => {
    async function fetchGenres() {
      const res = await genreService.getAllGenres();

      if (!res.success) return toast.warning(res.message);

      setGenres(res.data ?? []);
    }

    async function fetchTrendingGenres() {
      const res = await genreService.getTrendingGenres({ page: 1, limit: Infinity });

      if (!res.success) return toast.warning(res.message);

      setTrendingGenres(res.data ? res.data.map((data) => data.genre) : []);
    }

    async function fetchAuthors() {
      const res = await authorService.getAuthors();

      if (!res.success) return toast.warning(res.message);

      setAuthors(res.data ?? []);
    }

    async function fetchNations() {
      setNations(NATIONS);
    }

    async function fetchAll() {
      setLoading(true);

      await Promise.all([fetchGenres(), fetchAuthors(), fetchNations()]);

      setLoading(false);
    }

    fetchAll();
  }, []);

  useLayoutEffect(() => {
    loadFont();
  }, []);

  return (
    <AppContext.Provider
      value={{
        authors,
        genres,
        trendingGenres,
        nations,
        font,
        textSize,
        readingFont,
        readingTextSize,
        readingLineSpacing,
        updateFont,
        updateTextSize,
        updateReadingFont,
        updateReadingTextSize,
        updateReadingLineSpacing,
        loading,
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
