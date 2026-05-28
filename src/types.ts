export type CharacterPresetId =
  | "classic"
  | "blocks"
  | "minimal"
  | "code"
  | "emoji";

export type PaletteId = "green" | "amber" | "grayscale" | "source" | "duotone";

export type CameraStatus =
  | "idle"
  | "requesting"
  | "live"
  | "denied"
  | "no-device"
  | "unsupported"
  | "insecure"
  | "error";

export interface AsciiSettings {
  density: number;
  fps: number;
  contrast: number;
  threshold: number;
  invert: boolean;
  mirror: boolean;
  characterPreset: CharacterPresetId;
  customRamp: string;
  palette: PaletteId;
}

export interface AsciiFrame {
  text: string;
  rows: number;
  columns: number;
  sourceWidth: number;
  sourceHeight: number;
  renderedAt: number;
}

export interface Palette {
  id: PaletteId;
  name: string;
  foreground: string;
  background: string;
  secondary?: string;
  usesSourceColor?: boolean;
}
