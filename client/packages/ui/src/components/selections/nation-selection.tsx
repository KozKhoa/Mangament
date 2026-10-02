"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import ArrowDownIcon from "@/public/arrows/down-v.svg";
import ReloadIcon from "@/public/reload.svg";
import Nation from "@/types/nation";

export interface NationMultiSelectionProps {
  className?: string;

  defaultValue?: string | null;

  onChange?: (nation: Nation | null) => void;

  onReset?: (nation: Nation | null) => void;
}

const NATIONS = [
  "🇦🇫 Afghanistan",
  "🇦🇱 Albania",
  "🇩🇿 Algeria",
  "🇦🇩 Andorra",
  "🇦🇴 Angola",
  "🇦🇬 Antigua & Barbuda",
  "🇦🇷 Argentina",
  "🇦🇲 Armenia",
  "🇦🇺 Australia",
  "🇦🇹 Austria",
  "🇦🇿 Azerbaijan",
  "🇧🇸 Bahamas",
  "🇧🇭 Bahrain",
  "🇧🇩 Bangladesh",
  "🇧🇧 Barbados",
  "🇧🇾 Belarus",
  "🇧🇪 Belgium",
  "🇧🇿 Belize",
  "🇧🇯 Benin",
  "🇧🇹 Bhutan",
  "🇧🇴 Bolivia",
  "🇧🇦 Bosnia & Herzegovina",
  "🇧🇼 Botswana",
  "🇧🇷 Brazil",
  "🇧🇳 Brunei",
  "🇧🇬 Bulgaria",
  "🇧🇫 Burkina Faso",
  "🇧🇮 Burundi",
  "🇰🇭 Cambodia",
  "🇨🇲 Cameroon",
  "🇨🇦 Canada",
  "🇨🇻 Cabo Verde",
  "🇨🇫 Central African Republic",
  "🇹🇩 Chad",
  "🇨🇱 Chile",
  "🇨🇳 China",
  "🇨🇴 Colombia",
  "🇰🇲 Comoros",
  "🇨🇬 Republic of the Congo",
  "🇨🇩 DR Congo",
  "🇨🇷 Costa Rica",
  "🇭🇷 Croatia",
  "🇨🇺 Cuba",
  "🇨🇾 Cyprus",
  "🇨🇿 Czech Republic",
  "🇩🇰 Denmark",
  "🇩🇯 Djibouti",
  "🇩🇲 Dominica",
  "🇩🇴 Dominican Republic",
  "🇪🇨 Ecuador",
  "🇪🇬 Egypt",
  "🇸🇻 El Salvador",
  "🇬🇶 Equatorial Guinea",
  "🇪🇷 Eritrea",
  "🇪🇪 Estonia",
  "🇸🇿 Eswatini",
  "🇪🇹 Ethiopia",
  "🇫🇯 Fiji",
  "🇫🇮 Finland",
  "🇫🇷 France",
  "🇬🇦 Gabon",
  "🇬🇲 Gambia",
  "🇬🇪 Georgia",
  "🇩🇪 Germany",
  "🇬🇭 Ghana",
  "🇬🇷 Greece",
  "🇬🇩 Grenada",
  "🇬🇹 Guatemala",
  "🇬🇳 Guinea",
  "🇬🇼 Guinea-Bissau",
  "🇬🇾 Guyana",
  "🇭🇹 Haiti",
  "🇭🇳 Honduras",
  "🇭🇺 Hungary",
  "🇮🇸 Iceland",
  "🇮🇳 India",
  "🇮🇩 Indonesia",
  "🇮🇷 Iran",
  "🇮🇶 Iraq",
  "🇮🇪 Ireland",
  "🇮🇱 Israel",
  "🇮🇹 Italy",
  "🇯🇲 Jamaica",
  "🇯🇵 Japan",
  "🇯🇴 Jordan",
  "🇰🇿 Kazakhstan",
  "🇰🇪 Kenya",
  "🇰🇮 Kiribati",
  "🇰🇼 Kuwait",
  "🇰🇬 Kyrgyzstan",
  "🇱🇦 Laos",
  "🇱🇻 Latvia",
  "🇱🇧 Lebanon",
  "🇱🇸 Lesotho",
  "🇱🇷 Liberia",
  "🇱🇾 Libya",
  "🇱🇮 Liechtenstein",
  "🇱🇹 Lithuania",
  "🇱🇺 Luxembourg",
  "🇲🇬 Madagascar",
  "🇲🇼 Malawi",
  "🇲🇾 Malaysia",
  "🇲🇻 Maldives",
  "🇲🇱 Mali",
  "🇲🇹 Malta",
  "🇲🇭 Marshall Islands",
  "🇲🇷 Mauritania",
  "🇲🇺 Mauritius",
  "🇲🇽 Mexico",
  "🇫🇲 Micronesia",
  "🇲🇩 Moldova",
  "🇲🇨 Monaco",
  "🇲🇳 Mongolia",
  "🇲🇪 Montenegro",
  "🇲🇦 Morocco",
  "🇲🇿 Mozambique",
  "🇲🇲 Myanmar",
  "🇳🇦 Namibia",
  "🇳🇷 Nauru",
  "🇳🇵 Nepal",
  "🇳🇱 Netherlands",
  "🇳🇿 New Zealand",
  "🇳🇮 Nicaragua",
  "🇳🇪 Niger",
  "🇳🇬 Nigeria",
  "🇰🇵 North Korea",
  "🇲🇰 North Macedonia",
  "🇳🇴 Norway",
  "🇴🇲 Oman",
  "🇵🇰 Pakistan",
  "🇵🇼 Palau",
  "🇵🇦 Panama",
  "🇵🇬 Papua New Guinea",
  "🇵🇾 Paraguay",
  "🇵🇪 Peru",
  "🇵🇭 Philippines",
  "🇵🇱 Poland",
  "🇵🇹 Portugal",
  "🇶🇦 Qatar",
  "🇷🇴 Romania",
  "🇷🇺 Russia",
  "🇷🇼 Rwanda",
  "🇰🇳 Saint Kitts & Nevis",
  "🇱🇨 Saint Lucia",
  "🇻🇨 Saint Vincent & the Grenadines",
  "🇼🇸 Samoa",
  "🇸🇲 San Marino",
  "🇸🇹 São Tomé & Príncipe",
  "🇸🇦 Saudi Arabia",
  "🇸🇳 Senegal",
  "🇷🇸 Serbia",
  "🇸🇨 Seychelles",
  "🇸🇱 Sierra Leone",
  "🇸🇬 Singapore",
  "🇸🇰 Slovakia",
  "🇸🇮 Slovenia",
  "🇸🇧 Solomon Islands",
  "🇸🇴 Somalia",
  "🇿🇦 South Africa",
  "🇰🇷 South Korea",
  "🇸🇸 South Sudan",
  "🇪🇸 Spain",
  "🇱🇰 Sri Lanka",
  "🇸🇩 Sudan",
  "🇸🇷 Suriname",
  "🇸🇪 Sweden",
  "🇨🇭 Switzerland",
  "🇸🇾 Syria",
  "🇹🇼 Taiwan*",
  "🇹🇯 Tajikistan",
  "🇹🇿 Tanzania",
  "🇹🇭 Thailand",
  "🇹🇱 Timor-Leste",
  "🇹🇬 Togo",
  "🇹🇴 Tonga",
  "🇹🇹 Trinidad & Tobago",
  "🇹🇳 Tunisia",
  "🇹🇷 Turkey",
  "🇹🇲 Turkmenistan",
  "🇹🇻 Tuvalu",
  "🇺🇬 Uganda",
  "🇺🇦 Ukraine",
  "🇦🇪 United Arab Emirates",
  "🇬🇧 United Kingdom",
  "🇺🇸 United States",
  "🇺🇾 Uruguay",
  "🇺🇿 Uzbekistan",
  "🇻🇺 Vanuatu",
  "🇻🇦 Vatican City",
  "🇻🇪 Venezuela",
  "🇻🇳 Vietnam",
  "🇾🇪 Yemen",
  "🇿🇲 Zambia",
  "🇿🇼 Zimbabwe",
];

const PARSED_NATIONS: Nation[] = NATIONS.map((item) => {
  const spaceIdx = item.indexOf(" ");
  if (spaceIdx !== -1) {
    return {
      flag_icon: item.slice(0, spaceIdx).trim(),
      name: item.slice(spaceIdx + 1).trim(),
    };
  }
  return { flag_icon: "", name: item };
});

export default function NationSelection({ className, defaultValue = null, onChange, onReset }: NationMultiSelectionProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const [selectedNation, setSelectedNation] = useState<Nation | null>(() => {
    if (!defaultValue) return null;
    return PARSED_NATIONS.find((n) => n.name.toLowerCase() === defaultValue.toLowerCase() || n.name.includes(defaultValue)) ?? null;
  });

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

  useEffect(() => {
    if (defaultValue === null || defaultValue === undefined) {
      setSelectedNation(null);
    } else {
      const found = PARSED_NATIONS.find((n) => n.name.toLowerCase() === defaultValue.toLowerCase() || n.name.includes(defaultValue));
      if (found) setSelectedNation(found);
    }
  }, [defaultValue]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [open]);

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

  const filteredNations = useMemo(() => {
    if (!searchQuery.trim()) return PARSED_NATIONS;
    const query = searchQuery.toLowerCase().trim();
    return PARSED_NATIONS.filter((n) => n.name.toLowerCase().includes(query) || (n.flag_icon && n.flag_icon.includes(query)));
  }, [searchQuery]);

  function handleSelect(nation: Nation | null) {
    setSelectedNation(nation);
    onChange?.(nation);
    setOpen(false);
  }

  function handleReset() {
    setSelectedNation(null);
    if (onReset) {
      onReset(null);
    } else {
      onChange?.(null);
    }
  }

  return (
    <div ref={dropdownContainerRef} className={`flex flex-col gap-1 text-foreground relative ${className ?? ""}`}>
      <div className="flex flex-row flex-wrap items-center justify-between gap-1 px-1">
        <span className="font-bold text-sm">Quốc gia</span>
        {onReset && <ReloadIcon onClick={handleReset} className="w-4 h-4 fill-foreground cursor-pointer hover:animate-spin" />}
      </div>

      <div
        ref={setReference}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between px-3 py-2 border border-foreground/30 bg-background-items rounded-sm min-h-[42px] cursor-pointer transition-all duration-150 `}
      >
        {selectedNation ? (
          <div className="flex items-center gap-2">
            <span className="text-xl leading-none">{selectedNation.flag_icon}</span>
            <span className="text-sm font-medium">{selectedNation.name}</span>
          </div>
        ) : (
          <span className="text-sm text-foreground/50">Chọn quốc gia...</span>
        )}

        <ArrowDownIcon className={`w-4 h-4 fill-foreground transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`} />
      </div>

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
            className="flex absolute bg-background-items flex-col justify-center items-start w-[320px] sm:w-[420px] xl:w-[700px] max-w-[90vw] z-50 border border-foreground/30 p-3 gap-3 rounded-sm shadow-[4px_4px_1px_var(--foreground)]/40"
          >
            {/* Search bar */}
            <div className="relative flex items-center w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm quốc gia..."
                className="w-full px-3 py-1.5 text-sm bg-background border border-foreground/20 rounded focus:outline-none focus:border-primary pr-8 text-foreground"
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

            {/* Grid of nations */}
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-7 gap-2 max-h-[280px] xl:max-h-[500px] w-full overflow-y-auto custom-scrollbar p-1">
              {filteredNations.length > 0 ? (
                filteredNations.map((nation) => {
                  const isSelected = selectedNation?.name === nation.name;
                  return (
                    <button
                      key={nation.name}
                      type="button"
                      onClick={() => handleSelect(nation)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-sm border transition-all ${
                        isSelected
                          ? "border-foreground bg-primary/10 font-bold shadow-[2px_4px_1px_var(--foreground)]/80 "
                          : "border-foreground/10 hover:border-foreground/30 hover:bg-foreground/5 cursor-pointer"
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl leading-none mb-1.5 select-none">{nation.flag_icon}</span>
                      <span className="text-xs text-center line-clamp-2 leading-tight select-none text-foreground">{nation.name}</span>
                    </button>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-6 text-sm text-foreground/50">Không tìm thấy quốc gia</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
