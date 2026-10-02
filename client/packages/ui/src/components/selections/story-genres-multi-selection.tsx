"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import ArrowDownIcon from "@/public/arrows/down-v.svg";
import ReloadIcon from "@/public/reload.svg";
import CloseButtonIcon from "@/public/x-icon.svg";

import genreService from "@/services/genre";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Genre from "@/types/genre";
import Checkbox from "@/components/inputs/checkbox";
import Tag from "@/components/tags/tag";

interface StoryGenreMultiSelectionProps {
  className?: string;

  defaultValue?: string[];

  onChange?: (genres: string[]) => void;

  onReset?: (genres: string[]) => void;
}

export default function StoryGenreMultiSelection({ className, defaultValue, onChange, onReset }: StoryGenreMultiSelectionProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(() => new Set(defaultValue ?? []));
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    refs: { setReference, setFloating },
    floatingStyles,
    placement,
  } = useFloating({
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    transform: false,
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: ["bottom-end", "top-start", "top-end"],
        padding: 8,
      }),
      shift({ padding: 8 }),
    ],
  });

  const isTop = placement.startsWith("top");

  // Fetch genres list
  useEffect(() => {
    async function fetchGenres() {
      const res = await genreService.getAllGenres();
      if (res.success && res.data) {
        setAllGenres(res.data);
      }
    }
    fetchGenres();
  }, []);

  // Sync selectedGenres when defaultValue changes
  const defaultValueKey = defaultValue ? defaultValue.join(",") : "";
  useEffect(() => {
    if (defaultValue) {
      setSelectedGenres(new Set(defaultValue));
    } else {
      setSelectedGenres(new Set());
    }
  }, [defaultValueKey]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  // Outside click listener
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownContainerRef.current && !dropdownContainerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Filtered genres based on search query
  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) return allGenres;
    const query = searchQuery.toLowerCase().trim();
    return allGenres.filter((g) => {
      const gName = typeof g === "string" ? g : g.name;
      return gName.toLowerCase().includes(query) || snakeCaseToCapitalizeWord(gName).toLowerCase().includes(query);
    });
  }, [allGenres, searchQuery]);

  function toggleGenre(genreName: string) {
    const next = new Set(selectedGenres);
    if (next.has(genreName)) {
      next.delete(genreName);
    } else {
      next.add(genreName);
    }
    const arr = Array.from(next);
    setSelectedGenres(next);
    onChange?.(arr);
  }

  function handleClearAll() {
    setSelectedGenres(new Set());
    onChange?.([]);
  }

  function handleResetToDefault() {
    const defaultSet = new Set(defaultValue ?? []);
    setSelectedGenres(defaultSet);
    const arr = Array.from(defaultSet);
    if (onReset) {
      onReset(arr);
    } else {
      onChange?.(arr);
    }
  }

  function removeGenre(genreName: string, e: React.MouseEvent) {
    e.stopPropagation();
    toggleGenre(genreName);
  }

  return (
    <div ref={dropdownContainerRef} className={`flex flex-col gap-1 text-foreground relative ${className ?? ""}`}>
      {/* Header */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-1 px-1">
        <span className="font-bold text-sm">Thể loại</span>
        {onReset && <ReloadIcon onClick={handleResetToDefault} className="w-4 h-4 fill-foreground cursor-pointer hover:animate-spin" />}
      </div>

      {/* Trigger Button */}
      <div
        ref={setReference}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between px-3 py-2 border border-foreground/30 bg-background-items rounded-md min-h-[42px] cursor-pointer transition-colors`}
      >
        <div className="flex flex-row flex-wrap gap-1 items-center max-w-[90%]">
          {selectedGenres.size > 0 ? (
            Array.from(selectedGenres).map((genreName) => (
              <Tag key={genreName} className="flex flex-cols gap-1 items-center justify-center">
                <span>{snakeCaseToCapitalizeWord(genreName)}</span>
                <span onClick={(e) => removeGenre(genreName, e)} className=" font-bold ml-0.5 cursor-pointer text-[11px]">
                  <CloseButtonIcon className="w-4 h-4 text-foreground hover:text-red-500" />
                </span>
              </Tag>
            ))
          ) : (
            <span className="text-sm text-foreground/50">Chọn thể loại...</span>
          )}
        </div>

        <ArrowDownIcon className={`w-4 h-4 fill-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} />
      </div>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={setFloating}
            style={{
              ...floatingStyles,
              transformOrigin: isTop ? (placement.endsWith("end") ? "bottom right" : "bottom left") : placement.endsWith("end") ? "top right" : "top left",
            }}
            initial={{ opacity: 0, scaleY: 0.96 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.96 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className="flex absolute bg-background-items flex-col justify-center items-start w-[340px] sm:w-[460px] lg:w-[600px] xl:w-[700px] max-w-[92vw] z-50 border border-foreground/30 p-3 gap-2.5 rounded-md shadow-[4px_4px_1px_var(--foreground)]/40"
          >
            {/* Search Input & Action Controls */}
            <div className="flex flex-col gap-2 w-full">
              <div className="relative flex items-center w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thể loại..."
                  className="w-full px-3 py-1.5 text-sm bg-background border border-foreground/20 rounded-md focus:outline-none focus:border-primary pr-8 text-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 text-foreground/50 hover:text-foreground text-sm font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between text-xs text-foreground/70 px-0.5">
                <span>
                  Đã chọn: <strong className="text-foreground">{selectedGenres.size}</strong>
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleClearAll} className="hover:text-red-500 hover:underline transition-colors cursor-pointer">
                    Xóa tất cả
                  </button>
                  <span>•</span>
                  <button type="button" onClick={handleResetToDefault} className="hover:text-primary hover:underline transition-colors cursor-pointer">
                    Reset ban đầu
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Genre Options */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[280px] lg:max-h-[400px] xl:max-h-[500px] duration-200
                w-full overflow-y-auto custom-scrollbar p-1 border-t border-foreground/10 pt-2"
            >
              {filteredGenres.length > 0 ? (
                filteredGenres.map((genre) => {
                  const genreName = typeof genre === "string" ? genre : genre.name;
                  const isChecked = selectedGenres.has(genreName);
                  return (
                    <div
                      key={typeof genre === "string" ? genre : genre.id || genre.name}
                      onClick={() => toggleGenre(genreName)}
                      className={`flex items-center px-2.5 py-2 rounded-sm border transition-colors text-left select-none cursor-pointer ${
                        isChecked
                          ? "border-primary bg-primary/10 shadow-[2px_4px_1px_var(--foreground)]/80 font-bold"
                          : "border-foreground/10 hover:border-foreground/40 hover:bg-foreground/5 text-foreground"
                      }`}
                    >
                      <Checkbox value={isChecked} onChange={() => {}} className="pointer-events-none w-full ">
                        <span className="truncate text-foreground font-light">{snakeCaseToCapitalizeWord(genreName)}</span>
                      </Checkbox>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-6 text-sm text-foreground/50">Không tìm thấy thể loại</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
