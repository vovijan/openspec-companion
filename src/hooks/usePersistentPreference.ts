import { useState } from "react";

export function usePersistentPreference<T extends string>(
  storageKey: string,
  getInitialValue: () => T,
): [T, (nextValue: T) => void] {
  const [value, setValue] = useState<T>(getInitialValue);

  function updateValue(nextValue: T) {
    setValue(nextValue);
    localStorage.setItem(storageKey, nextValue);
  }

  return [value, updateValue];
}
