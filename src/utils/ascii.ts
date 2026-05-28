import { CHARACTER_PRESETS, PALETTES } from "../constants";
import type { AsciiFrame, AsciiSettings, Palette } from "../types";

const FONT_FAMILY = '"SFMono-Regular", "Cascadia Code", "Liberation Mono", Menlo, Consolas, monospace';

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getPalette(id: AsciiSettings["palette"]): Palette {
  return PALETTES.find((palette) => palette.id === id) ?? PALETTES[0];
}

export function getCharacterRamp(settings: AsciiSettings) {
  const custom = settings.customRamp.trim();
  return custom.length >= 2 ? custom : CHARACTER_PRESETS[settings.characterPreset].ramp;
}

export function renderAsciiFrame(
  video: HTMLVideoElement,
  workCanvas: HTMLCanvasElement,
  previewCanvas: HTMLCanvasElement,
  settings: AsciiSettings,
): AsciiFrame | null {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (!sourceWidth || !sourceHeight || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return null;
  }

  const columns = clamp(Math.round(settings.density), 32, 180);
  const rows = clamp(Math.round(columns * (sourceHeight / sourceWidth) * 0.48), 12, 110);
  const workContext = workCanvas.getContext("2d", { willReadFrequently: true });
  const previewContext = previewCanvas.getContext("2d");

  if (!workContext || !previewContext) {
    return null;
  }

  workCanvas.width = columns;
  workCanvas.height = rows;
  workContext.save();
  workContext.imageSmoothingEnabled = true;
  workContext.clearRect(0, 0, columns, rows);

  if (settings.mirror) {
    workContext.translate(columns, 0);
    workContext.scale(-1, 1);
  }

  workContext.drawImage(video, 0, 0, columns, rows);
  workContext.restore();

  const imageData = workContext.getImageData(0, 0, columns, rows);
  const data = imageData.data;
  const ramp = getCharacterRamp(settings);
  const palette = getPalette(settings.palette);
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = Math.max(320, Math.round(previewCanvas.clientWidth || 960));
  const cssHeight = Math.max(240, Math.round(previewCanvas.clientHeight || 620));
  const targetWidth = Math.round(cssWidth * ratio);
  const targetHeight = Math.round(cssHeight * ratio);

  if (previewCanvas.width !== targetWidth || previewCanvas.height !== targetHeight) {
    previewCanvas.width = targetWidth;
    previewCanvas.height = targetHeight;
  }

  previewContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  previewContext.fillStyle = palette.background;
  previewContext.fillRect(0, 0, cssWidth, cssHeight);

  const cellWidth = cssWidth / columns;
  const cellHeight = cssHeight / rows;
  const fontSize = Math.max(6, cellHeight * 0.92);
  const contrastFactor = 1 + settings.contrast / 100;
  const textRows: string[] = [];

  previewContext.font = `${fontSize}px ${FONT_FAMILY}`;
  previewContext.textAlign = "center";
  previewContext.textBaseline = "middle";

  for (let y = 0; y < rows; y += 1) {
    let line = "";

    for (let x = 0; x < columns; x += 1) {
      const index = (y * columns + x) * 4;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3] / 255;
      const luma = (0.2126 * red + 0.7152 * green + 0.0722 * blue) * alpha;
      let adjusted = (luma - 128) * contrastFactor + 128 + settings.threshold;

      adjusted = clamp(settings.invert ? 255 - adjusted : adjusted, 0, 255);

      const characterIndex = clamp(Math.round((adjusted / 255) * (ramp.length - 1)), 0, ramp.length - 1);
      const character = ramp[characterIndex];
      line += character;

      if (character === " ") {
        continue;
      }

      if (palette.usesSourceColor) {
        previewContext.fillStyle = `rgb(${red} ${green} ${blue})`;
      } else if (palette.secondary) {
        const mix = adjusted / 255;
        previewContext.fillStyle = mix > 0.52 ? palette.foreground : palette.secondary;
      } else {
        previewContext.fillStyle = palette.foreground;
      }

      previewContext.fillText(character, x * cellWidth + cellWidth / 2, y * cellHeight + cellHeight / 2);
    }

    textRows.push(line);
  }

  return {
    text: textRows.join("\n"),
    rows,
    columns,
    sourceWidth,
    sourceHeight,
    renderedAt: performance.now(),
  };
}
