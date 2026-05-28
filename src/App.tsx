import { useCallback, useMemo, useState } from "react";
import {
  Camera,
  CameraOff,
  Clipboard,
  Download,
  FileText,
  FlipHorizontal,
  ImageDown,
  Play,
  Square,
} from "lucide-react";
import { CHARACTER_PRESETS, DEFAULT_SETTINGS, PALETTES } from "./constants";
import { useAsciiRenderer } from "./hooks/useAsciiRenderer";
import { useCamera } from "./hooks/useCamera";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePersistedSettings } from "./hooks/usePersistedSettings";
import type { AsciiSettings, CameraStatus, CharacterPresetId, PaletteId } from "./types";
import { clamp } from "./utils/ascii";

const presetIds = Object.keys(CHARACTER_PRESETS) as CharacterPresetId[];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getStatusCopy(status: CameraStatus, errorMessage: string) {
  switch (status) {
    case "requesting":
      return {
        title: "Waiting for camera permission",
        body: "Your browser is asking for access. Frames are processed locally in this tab.",
      };
    case "live":
      return {
        title: "Camera live",
        body: "Frames are being converted locally. Nothing is uploaded.",
      };
    case "denied":
      return {
        title: "Camera permission was blocked",
        body: "Allow camera access in the browser controls, then try again.",
      };
    case "no-device":
      return {
        title: "No camera found",
        body: "Connect or enable a camera, then start CharCam again.",
      };
    case "unsupported":
      return {
        title: "Camera API unavailable",
        body: "This browser does not expose the MediaDevices camera API.",
      };
    case "insecure":
      return {
        title: "Secure origin required",
        body: "Camera access needs HTTPS or localhost.",
      };
    case "error":
      return {
        title: "Camera could not start",
        body: errorMessage || "The camera may be busy in another app.",
      };
    case "idle":
    default:
      return {
        title: "Ready for camera",
        body: "Start the camera to generate a live ASCII frame.",
      };
  }
}

export function App() {
  const [settings, setSettings] = usePersistedSettings();
  const { videoRef, status, errorMessage, startCamera, stopCamera } = useCamera();
  const { previewCanvasRef, frameMeta, getLatestFrame } = useAsciiRenderer(videoRef, settings, status);
  const [toast, setToast] = useState("");
  const isLive = status === "live";
  const statusCopy = getStatusCopy(status, errorMessage);

  const patchSettings = useCallback(
    (patch: Partial<AsciiSettings>) => {
      setSettings((current) => ({ ...current, ...patch }));
    },
    [setSettings],
  );

  const exportPng = useCallback(() => {
    const canvas = previewCanvasRef.current;

    if (!canvas || !getLatestFrame()) {
      setToast("No ASCII frame to export yet.");
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setToast("PNG export failed.");
        return;
      }

      downloadBlob(blob, `charcam-${Date.now()}.png`);
      setToast("PNG downloaded.");
    }, "image/png");
  }, [getLatestFrame, previewCanvasRef]);

  const exportText = useCallback(() => {
    const frame = getLatestFrame();

    if (!frame) {
      setToast("No ASCII text to export yet.");
      return;
    }

    downloadBlob(new Blob([frame.text], { type: "text/plain;charset=utf-8" }), `charcam-${Date.now()}.txt`);
    setToast("Text file downloaded.");
  }, [getLatestFrame]);

  const copyText = useCallback(async () => {
    const frame = getLatestFrame();

    if (!frame) {
      setToast("No ASCII text to copy yet.");
      return;
    }

    try {
      await navigator.clipboard.writeText(frame.text);
      setToast("ASCII copied.");
    } catch {
      setToast("Clipboard access was blocked.");
    }
  }, [getLatestFrame]);

  const resetSettings = useCallback(() => setSettings(DEFAULT_SETTINGS), [setSettings]);

  const shortcutHandlers = useMemo(
    () => ({
      onCapture: exportPng,
      onToggleMirror: () => patchSettings({ mirror: !settings.mirror }),
      onToggleInvert: () => patchSettings({ invert: !settings.invert }),
      onDensityStep: (step: number) =>
        patchSettings({ density: clamp(settings.density + step, 32, 180) }),
      onPreset: (index: number) => {
        const palette = PALETTES[index];
        if (palette) {
          patchSettings({ palette: palette.id });
        }
      },
    }),
    [exportPng, patchSettings, settings.density, settings.invert, settings.mirror],
  );

  useKeyboardShortcuts(shortcutHandlers);

  return (
    <main className="app-shell">
      <video ref={videoRef} className="camera-source" muted playsInline aria-hidden="true" />

      <header className="app-header">
        <div>
          <p className="eyebrow">Local ASCII Camera</p>
          <h1>CharCam</h1>
        </div>
        <div className={`status-pill status-pill--${status}`}>
          <span aria-hidden="true" />
          {statusCopy.title}
        </div>
      </header>

      <section className="workspace" aria-label="ASCII camera workspace">
        <div className="preview-panel">
          <div className="preview-toolbar">
            <div>
              <p className="panel-label">Live ASCII</p>
              <p className="preview-meta">
                {frameMeta
                  ? `${frameMeta.columns} x ${frameMeta.rows} chars · ${settings.fps} fps target`
                  : "Waiting for first frame"}
              </p>
            </div>
            <div className="toolbar-actions">
              {isLive ? (
                <button className="icon-button icon-button--danger" type="button" onClick={stopCamera} title="Stop camera">
                  <Square size={18} aria-hidden="true" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  className="icon-button icon-button--primary"
                  type="button"
                  onClick={startCamera}
                  disabled={status === "requesting" || status === "unsupported" || status === "insecure"}
                  title="Start camera"
                >
                  <Play size={18} aria-hidden="true" />
                  <span>Start</span>
                </button>
              )}
            </div>
          </div>

          <div className="canvas-wrap">
            <canvas ref={previewCanvasRef} className="ascii-canvas" aria-label="Live ASCII camera preview" />
            {!isLive ? (
              <div className="empty-state">
                {status === "requesting" ? <Camera size={36} aria-hidden="true" /> : <CameraOff size={36} aria-hidden="true" />}
                <div>
                  <h2>{statusCopy.title}</h2>
                  <p>{statusCopy.body}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="control-panel" aria-label="Camera and ASCII controls">
          <section className="control-section">
            <div className="section-head">
              <h2>Output</h2>
              <button className="text-button" type="button" onClick={resetSettings}>
                Reset
              </button>
            </div>

            <label className="field">
              <span>Density <output>{settings.density}</output></span>
              <input
                type="range"
                min="32"
                max="180"
                step="4"
                value={settings.density}
                onChange={(event) => patchSettings({ density: Number(event.target.value) })}
              />
            </label>

            <label className="field">
              <span>FPS <output>{settings.fps}</output></span>
              <input
                type="range"
                min="8"
                max="30"
                step="1"
                value={settings.fps}
                onChange={(event) => patchSettings({ fps: Number(event.target.value) })}
              />
            </label>

            <label className="field">
              <span>Contrast <output>{settings.contrast}</output></span>
              <input
                type="range"
                min="-80"
                max="120"
                step="2"
                value={settings.contrast}
                onChange={(event) => patchSettings({ contrast: Number(event.target.value) })}
              />
            </label>

            <label className="field">
              <span>Threshold <output>{settings.threshold}</output></span>
              <input
                type="range"
                min="-90"
                max="90"
                step="2"
                value={settings.threshold}
                onChange={(event) => patchSettings({ threshold: Number(event.target.value) })}
              />
            </label>

            <div className="toggle-row">
              <label>
                <input
                  type="checkbox"
                  checked={settings.invert}
                  onChange={(event) => patchSettings({ invert: event.target.checked })}
                />
                Invert
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={settings.mirror}
                  onChange={(event) => patchSettings({ mirror: event.target.checked })}
                />
                Mirror
              </label>
            </div>
          </section>

          <section className="control-section">
            <h2>Characters</h2>
            <label className="field">
              <span>Preset</span>
              <select
                value={settings.characterPreset}
                onChange={(event) => patchSettings({ characterPreset: event.target.value as CharacterPresetId })}
              >
                {presetIds.map((id) => (
                  <option key={id} value={id}>
                    {CHARACTER_PRESETS[id].name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Custom ramp</span>
              <input
                type="text"
                maxLength={40}
                value={settings.customRamp}
                onChange={(event) => patchSettings({ customRamp: event.target.value })}
                placeholder=" .:-=+*#%@"
              />
            </label>
          </section>

          <section className="control-section">
            <h2>Palette</h2>
            <div className="swatch-grid">
              {PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  className={`swatch ${settings.palette === palette.id ? "is-active" : ""}`}
                  type="button"
                  onClick={() => patchSettings({ palette: palette.id as PaletteId })}
                  title={palette.name}
                  aria-label={palette.name}
                >
                  <span style={{ background: palette.background }} />
                  <span style={{ background: palette.foreground }} />
                </button>
              ))}
            </div>
          </section>

          <section className="control-section">
            <h2>Capture</h2>
            <div className="capture-grid">
              <button className="icon-button" type="button" onClick={exportPng}>
                <ImageDown size={18} aria-hidden="true" />
                <span>PNG</span>
              </button>
              <button className="icon-button" type="button" onClick={exportText}>
                <FileText size={18} aria-hidden="true" />
                <span>TXT</span>
              </button>
              <button className="icon-button" type="button" onClick={copyText}>
                <Clipboard size={18} aria-hidden="true" />
                <span>Copy</span>
              </button>
              <button className="icon-button" type="button" onClick={() => patchSettings({ mirror: !settings.mirror })}>
                <FlipHorizontal size={18} aria-hidden="true" />
                <span>Mirror</span>
              </button>
            </div>
          </section>

          <section className="privacy-strip" aria-live="polite">
            <Download size={16} aria-hidden="true" />
            <span>{toast || statusCopy.body}</span>
          </section>
        </aside>
      </section>
    </main>
  );
}
