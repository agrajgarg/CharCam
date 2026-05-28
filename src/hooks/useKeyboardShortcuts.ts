import { useEffect } from "react";

interface ShortcutHandlers {
  onCapture: () => void;
  onToggleMirror: () => void;
  onToggleInvert: () => void;
  onDensityStep: (step: number) => void;
  onPreset: (index: number) => void;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handlers.onCapture();
        return;
      }

      if (event.key === "m" || event.key === "M") {
        handlers.onToggleMirror();
        return;
      }

      if (event.key === "i" || event.key === "I") {
        handlers.onToggleInvert();
        return;
      }

      if (event.key === "[") {
        handlers.onDensityStep(-8);
        return;
      }

      if (event.key === "]") {
        handlers.onDensityStep(8);
        return;
      }

      const preset = Number(event.key);

      if (preset >= 1 && preset <= 5) {
        handlers.onPreset(preset - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlers]);
}
