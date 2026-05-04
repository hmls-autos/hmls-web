"use client";

import { useCallback, useRef, useState } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(
    async (mode?: "environment" | "user") => {
      const facing = mode ?? facingMode;
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
        });
        setStream(mediaStream);
        setFacingMode(facing);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Failed to access camera:", err);
        throw err;
      }
    },
    [facingMode],
  );

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    if (!srcW || !srcH) return null;
    // Cap to 1600px on the long edge before encoding. Modern phone cameras
    // produce 12+MP frames; toDataURL on a 4032×3024 canvas yields a 5–8 MB
    // base64 string that JSON-encodes to ~7–11 MB. That stalls the upload
    // and can blow past the gateway body limit silently. 1600px is plenty
    // for diagnostic photos (warning lights, fluid leaks, brake wear) and
    // brings the JPEG-q0.8 base64 down to ~250–700 KB.
    const MAX_DIM = 1600;
    const scale = Math.min(1, MAX_DIM / Math.max(srcW, srcH));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(srcW * scale);
    canvas.height = Math.round(srcH * scale);
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => {
      t.stop();
    });
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const switchCamera = useCallback(async () => {
    stopCamera();
    const newMode = facingMode === "environment" ? "user" : "environment";
    await startCamera(newMode);
  }, [facingMode, stopCamera, startCamera]);

  return {
    videoRef,
    stream,
    isActive: !!stream,
    startCamera,
    capturePhoto,
    stopCamera,
    switchCamera,
  };
}
