import { useState, useEffect } from "react";

export function useDarkModePref(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem("uvic-admin-dark");
    if (stored !== null) {
      return stored === "1";
    }
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });
  useEffect(
    () => localStorage.setItem("uvic-admin-dark", enabled ? "1" : "0"),
    [enabled]
  );
  return [enabled, setEnabled];
}
