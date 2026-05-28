import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { AsciiFrame, AsciiSettings, CameraStatus } from "../types";
import { renderAsciiFrame } from "../utils/ascii";

export function useAsciiRenderer(
  videoRef: RefObject<HTMLVideoElement>,
  settings: AsciiSettings,
  cameraStatus: CameraStatus,
) {
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestFrameRef = useRef<AsciiFrame | null>(null);
  const lastUiUpdateRef = useRef(0);
  const [frameMeta, setFrameMeta] = useState<AsciiFrame | null>(null);

  useEffect(() => {
    workCanvasRef.current = document.createElement("canvas");
  }, []);

  useEffect(() => {
    if (cameraStatus !== "live") {
      return;
    }

    let animationFrame = 0;
    let lastRender = 0;
    const frameInterval = 1000 / settings.fps;

    const draw = (now: number) => {
      const video = videoRef.current;
      const workCanvas = workCanvasRef.current;
      const previewCanvas = previewCanvasRef.current;

      if (video && workCanvas && previewCanvas && now - lastRender >= frameInterval) {
        const frame = renderAsciiFrame(video, workCanvas, previewCanvas, settings);
        lastRender = now;

        if (frame) {
          latestFrameRef.current = frame;

          if (now - lastUiUpdateRef.current > 500) {
            lastUiUpdateRef.current = now;
            setFrameMeta(frame);
          }
        }
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    animationFrame = window.requestAnimationFrame(draw);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [cameraStatus, settings, videoRef]);

  const getLatestFrame = useCallback(() => latestFrameRef.current, []);

  return {
    previewCanvasRef,
    frameMeta,
    getLatestFrame,
  };
}
