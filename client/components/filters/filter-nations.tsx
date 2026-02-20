import StarIcon from "@/public/star.svg";
import FlagIcon from "@/public/flag.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useCallback, useEffect, useState } from "react";

const NATIONS = [
  { name: "Afghanistan", flag_icon: "🇦🇫" },
  { name: "Albania", flag_icon: "🇦🇱" },
  { name: "Algeria", flag_icon: "🇩🇿" },
  { name: "Andorra", flag_icon: "🇦🇩" },
  { name: "Angola", flag_icon: "🇦🇴" },
  { name: "Antigua & Barbuda", flag_icon: "🇦🇬" },
  { name: "Argentina", flag_icon: "🇦🇷" },
  { name: "Armenia", flag_icon: "🇦🇲" },
  { name: "Australia", flag_icon: "🇦🇺" },
  { name: "Austria", flag_icon: "🇦🇹" },
  { name: "Azerbaijan", flag_icon: "🇦🇿" },
  { name: "Bahamas", flag_icon: "🇧🇸" },
  { name: "Bahrain", flag_icon: "🇧🇭" },
  { name: "Bangladesh", flag_icon: "🇧🇩" },
  { name: "Barbados", flag_icon: "🇧🇧" },
  { name: "Belarus", flag_icon: "🇧🇾" },
  { name: "Belgium", flag_icon: "🇧🇪" },
  { name: "Belize", flag_icon: "🇧🇿" },
  { name: "Benin", flag_icon: "🇧🇯" },
  { name: "Bhutan", flag_icon: "🇧🇹" },
  { name: "Bolivia", flag_icon: "🇧🇴" },
  { name: "Bosnia & Herzegovina", flag_icon: "🇧🇦" },
  { name: "Botswana", flag_icon: "🇧🇼" },
  { name: "Brazil", flag_icon: "🇧🇷" },
  { name: "Brunei", flag_icon: "🇧🇳" },
  { name: "Bulgaria", flag_icon: "🇧🇬" },
  { name: "Burkina Faso", flag_icon: "🇧🇫" },
  { name: "Burundi", flag_icon: "🇧🇮" },
  { name: "Cambodia", flag_icon: "🇰🇭" },
  { name: "Cameroon", flag_icon: "🇨🇲" },
  { name: "Canada", flag_icon: "🇨🇦" },
  { name: "Cabo Verde", flag_icon: "🇨🇻" },
  { name: "Central African Republic", flag_icon: "🇨🇫" },
  { name: "Chad", flag_icon: "🇹🇩" },
  { name: "Chile", flag_icon: "🇨🇱" },
  { name: "China", flag_icon: "🇨🇳" },
  { name: "Colombia", flag_icon: "🇨🇴" },
  { name: "Comoros", flag_icon: "🇰🇲" },
  { name: "Republic of the Congo", flag_icon: "🇨🇬" },
  { name: "DR Congo", flag_icon: "🇨🇩" },
  { name: "Costa Rica", flag_icon: "🇨🇷" },
  { name: "Croatia", flag_icon: "🇭🇷" },
  { name: "Cuba", flag_icon: "🇨🇺" },
  { name: "Cyprus", flag_icon: "🇨🇾" },
  { name: "Czech Republic", flag_icon: "🇨🇿" },
  { name: "Denmark", flag_icon: "🇩🇰" },
  { name: "Djibouti", flag_icon: "🇩🇯" },
  { name: "Dominica", flag_icon: "🇩🇲" },
  { name: "Dominican Republic", flag_icon: "🇩🇴" },
  { name: "Ecuador", flag_icon: "🇪🇨" },
  { name: "Egypt", flag_icon: "🇪🇬" },
  { name: "El Salvador", flag_icon: "🇸🇻" },
  { name: "Equatorial Guinea", flag_icon: "🇬🇶" },
  { name: "Eritrea", flag_icon: "🇪🇷" },
  { name: "Estonia", flag_icon: "🇪🇪" },
  { name: "Eswatini", flag_icon: "🇸🇿" },
  { name: "Ethiopia", flag_icon: "🇪🇹" },
  { name: "Fiji", flag_icon: "🇫🇯" },
  { name: "Finland", flag_icon: "🇫🇮" },
  { name: "France", flag_icon: "🇫🇷" },
  { name: "Gabon", flag_icon: "🇬🇦" },
  { name: "Gambia", flag_icon: "🇬🇲" },
  { name: "Georgia", flag_icon: "🇬🇪" },
  { name: "Germany", flag_icon: "🇩🇪" },
  { name: "Ghana", flag_icon: "🇬🇭" },
  { name: "Greece", flag_icon: "🇬🇷" },
  { name: "Grenada", flag_icon: "🇬🇩" },
  { name: "Guatemala", flag_icon: "🇬🇹" },
  { name: "Guinea", flag_icon: "🇬🇳" },
  { name: "Guinea-Bissau", flag_icon: "🇬🇼" },
  { name: "Guyana", flag_icon: "🇬🇾" },
  { name: "Haiti", flag_icon: "🇭🇹" },
  { name: "Honduras", flag_icon: "🇭🇳" },
  { name: "Hungary", flag_icon: "🇭🇺" },
  { name: "Iceland", flag_icon: "🇮🇸" },
  { name: "India", flag_icon: "🇮🇳" },
  { name: "Indonesia", flag_icon: "🇮🇩" },
  { name: "Iran", flag_icon: "🇮🇷" },
  { name: "Iraq", flag_icon: "🇮🇶" },
  { name: "Ireland", flag_icon: "🇮🇪" },
  { name: "Israel", flag_icon: "🇮🇱" },
  { name: "Italy", flag_icon: "🇮🇹" },
  { name: "Jamaica", flag_icon: "🇯🇲" },
  { name: "Japan", flag_icon: "🇯🇵" },
  { name: "Jordan", flag_icon: "🇯🇴" },
  { name: "Kazakhstan", flag_icon: "🇰🇿" },
  { name: "Kenya", flag_icon: "🇰🇪" },
  { name: "Kiribati", flag_icon: "🇰🇮" },
  { name: "Kuwait", flag_icon: "🇰🇼" },
  { name: "Kyrgyzstan", flag_icon: "🇰🇬" },
  { name: "Laos", flag_icon: "🇱🇦" },
  { name: "Latvia", flag_icon: "🇱🇻" },
  { name: "Lebanon", flag_icon: "🇱🇧" },
  { name: "Lesotho", flag_icon: "🇱🇸" },
  { name: "Liberia", flag_icon: "🇱🇷" },
  { name: "Libya", flag_icon: "🇱🇾" },
  { name: "Liechtenstein", flag_icon: "🇱🇮" },
  { name: "Lithuania", flag_icon: "🇱🇹" },
  { name: "Luxembourg", flag_icon: "🇱🇺" },
  { name: "Madagascar", flag_icon: "🇲🇬" },
  { name: "Malawi", flag_icon: "🇲🇼" },
  { name: "Malaysia", flag_icon: "🇲🇾" },
  { name: "Maldives", flag_icon: "🇲🇻" },
  { name: "Mali", flag_icon: "🇲🇱" },
  { name: "Malta", flag_icon: "🇲🇹" },
  { name: "Marshall Islands", flag_icon: "🇲🇭" },
  { name: "Mauritania", flag_icon: "🇲🇷" },
  { name: "Mauritius", flag_icon: "🇲🇺" },
  { name: "Mexico", flag_icon: "🇲🇽" },
  { name: "Micronesia", flag_icon: "🇫🇲" },
  { name: "Moldova", flag_icon: "🇲🇩" },
  { name: "Monaco", flag_icon: "🇲🇨" },
  { name: "Mongolia", flag_icon: "🇲🇳" },
  { name: "Montenegro", flag_icon: "🇲🇪" },
  { name: "Morocco", flag_icon: "🇲🇦" },
  { name: "Mozambique", flag_icon: "🇲🇿" },
  { name: "Myanmar", flag_icon: "🇲🇲" },
  { name: "Namibia", flag_icon: "🇳🇦" },
  { name: "Nauru", flag_icon: "🇳🇷" },
  { name: "Nepal", flag_icon: "🇳🇵" },
  { name: "Netherlands", flag_icon: "🇳🇱" },
  { name: "New Zealand", flag_icon: "🇳🇿" },
  { name: "Nicaragua", flag_icon: "🇳🇮" },
  { name: "Niger", flag_icon: "🇳🇪" },
  { name: "Nigeria", flag_icon: "🇳🇬" },
  { name: "North Korea", flag_icon: "🇰🇵" },
  { name: "North Macedonia", flag_icon: "🇲🇰" },
  { name: "Norway", flag_icon: "🇳🇴" },
  { name: "Oman", flag_icon: "🇴🇲" },
  { name: "Pakistan", flag_icon: "🇵🇰" },
  { name: "Palau", flag_icon: "🇵🇼" },
  { name: "Panama", flag_icon: "🇵🇦" },
  { name: "Papua New Guinea", flag_icon: "🇵🇬" },
  { name: "Paraguay", flag_icon: "🇵🇾" },
  { name: "Peru", flag_icon: "🇵🇪" },
  { name: "Philippines", flag_icon: "🇵🇭" },
  { name: "Poland", flag_icon: "🇵🇱" },
  { name: "Portugal", flag_icon: "🇵🇹" },
  { name: "Qatar", flag_icon: "🇶🇦" },
  { name: "Romania", flag_icon: "🇷🇴" },
  { name: "Russia", flag_icon: "🇷🇺" },
  { name: "Rwanda", flag_icon: "🇷🇼" },
  { name: "Saint Kitts & Nevis", flag_icon: "🇰🇳" },
  { name: "Saint Lucia", flag_icon: "🇱🇨" },
  { name: "Saint Vincent & the Grenadines", flag_icon: "🇻🇨" },
  { name: "Samoa", flag_icon: "🇼🇸" },
  { name: "San Marino", flag_icon: "🇸🇲" },
  { name: "São Tomé & Príncipe", flag_icon: "🇸🇹" },
  { name: "Saudi Arabia", flag_icon: "🇸🇦" },
  { name: "Senegal", flag_icon: "🇸🇳" },
  { name: "Serbia", flag_icon: "🇷🇸" },
  { name: "Seychelles", flag_icon: "🇸🇨" },
  { name: "Sierra Leone", flag_icon: "🇸🇱" },
  { name: "Singapore", flag_icon: "🇸🇬" },
  { name: "Slovakia", flag_icon: "🇸🇰" },
  { name: "Slovenia", flag_icon: "🇸🇮" },
  { name: "Solomon Islands", flag_icon: "🇸🇧" },
  { name: "Somalia", flag_icon: "🇸🇴" },
  { name: "South Africa", flag_icon: "🇿🇦" },
  { name: "South Korea", flag_icon: "🇰🇷" },
  { name: "South Sudan", flag_icon: "🇸🇸" },
  { name: "Spain", flag_icon: "🇪🇸" },
  { name: "Sri Lanka", flag_icon: "🇱🇰" },
  { name: "Sudan", flag_icon: "🇸🇩" },
  { name: "Suriname", flag_icon: "🇸🇷" },
  { name: "Sweden", flag_icon: "🇸🇪" },
  { name: "Switzerland", flag_icon: "🇨🇭" },
  { name: "Syria", flag_icon: "🇸🇾" },
  { name: "Taiwan*", flag_icon: "🇹🇼" },
  { name: "Tajikistan", flag_icon: "🇹🇯" },
  { name: "Tanzania", flag_icon: "🇹🇿" },
  { name: "Thailand", flag_icon: "🇹🇭" },
  { name: "Timor-Leste", flag_icon: "🇹🇱" },
  { name: "Togo", flag_icon: "🇹🇬" },
  { name: "Tonga", flag_icon: "🇹🇴" },
  { name: "Trinidad & Tobago", flag_icon: "🇹🇹" },
  { name: "Tunisia", flag_icon: "🇹🇳" },
  { name: "Turkey", flag_icon: "🇹🇷" },
  { name: "Turkmenistan", flag_icon: "🇹🇲" },
  { name: "Tuvalu", flag_icon: "🇹🇻" },
  { name: "Uganda", flag_icon: "🇺🇬" },
  { name: "Ukraine", flag_icon: "🇺🇦" },
  { name: "United Arab Emirates", flag_icon: "🇦🇪" },
  { name: "United Kingdom", flag_icon: "🇬🇧" },
  { name: "United States", flag_icon: "🇺🇸" },
  { name: "Uruguay", flag_icon: "🇺🇾" },
  { name: "Uzbekistan", flag_icon: "🇺🇿" },
  { name: "Vanuatu", flag_icon: "🇻🇺" },
  { name: "Vatican City", flag_icon: "🇻🇦" },
  { name: "Venezuela", flag_icon: "🇻🇪" },
  { name: "Vietnam", flag_icon: "🇻🇳" },
  { name: "Yemen", flag_icon: "🇾🇪" },
  { name: "Zambia", flag_icon: "🇿🇲" },
  { name: "Zimbabwe", flag_icon: "🇿🇼" },
];

interface FilterRatingsProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const Item = React.memo(function Item({
  children,
  isOn,
  index,
  toggleCheckbox,
}: {
  children: string;
  isOn: boolean;
  toggleCheckbox: (index: number) => void;
  index: number;
}) {
  return (
    <div className="flex w-fit h-fit justify-start items-center">
      <Checkbox defaultChecked={isOn} onChange={() => toggleCheckbox(index)}>
        {children}
      </Checkbox>
    </div>
  );
});

export default function FilterNation({ value, onChange }: FilterRatingsProps) {
  const [selectedIndex, setSelectedIndex] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  function handleFinish() {
    const result: string[] = [];

    [...selectedIndex].map((index) => {
      result.push(NATIONS[index].name);
    });

    setFinalSelectedIndex(selectedIndex);

    onChange?.(result);
  }

  function resetAllField() {
    setSelectedIndex(new Set());
    setFinalSelectedIndex(new Set());

    onChange?.([]);
  }

  const toggleCheckbox = useCallback((index: number) => {
    setSelectedIndex((prev) => {
      const newSet = new Set(prev);
      if (prev.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    const valueSet = new Set(value);

    const selectedArr: number[] = [];

    NATIONS.forEach((nation, i) => {
      if (valueSet.has(nation.name)) selectedArr.push(i);
    });

    setSelectedIndex(new Set(selectedArr));
    setFinalSelectedIndex(new Set(selectedArr));
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/50 border rounded-[5] relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 p-0.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <FlagIcon className="w-5 h-5 fill-background-items stroke-foreground"></FlagIcon>
              <p className="font-bold">Quốc gia</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {NATIONS?.map((nation, i) => finalSelectedIndex.has(i) && <Tag key={nation.name}>{nation.flag_icon + " " + nation.name}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 w-[300px] sm:w-[500px] lg:grid-cols-3 lg:w-[800px]">
        {NATIONS?.map((nation, i) => (
          <Item key={i} index={i} isOn={selectedIndex.has(i)} toggleCheckbox={toggleCheckbox}>
            {nation.flag_icon + " " + nation.name}
          </Item>
        ))}
      </div>
    </ButtonDropdown>
  );
}
