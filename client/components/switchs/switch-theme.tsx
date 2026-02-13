import { useTheme } from "next-themes";
import Switch from "./switch";
import { useEffect, useState } from "react";

function SwitchTheme() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), [theme]);
  if (!mounted) return null;

  return (
    <Switch
      defaultValue={theme === "light"}
      roundImageBgOnUrl="/theme/sun.svg"
      roundImageBgOffUrl="/theme/moon.svg"
      onToggle={(isLight) => setTheme(isLight ? "light" : "dark")}
    />
  );
}

export default SwitchTheme;
