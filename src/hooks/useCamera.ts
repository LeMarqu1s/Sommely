import { useState, useRef, useCallback } from 'react';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  hasPermission: boolean | null;
  error: string | null;
  startCamera: () => Promise<boolean>;
  stopCamera: () => void;
  resetCameraState: () => void;
  captureImage: () => string | null;
  waitForVideoReady: () => Promise<boolean>;
  captureFromFile: (file: File) => Promise<string>;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setError('La caméra nécessite HTTPS. Utilisez https:// au lieu de http:// dans l\'URL.');
        setHasPermission(false);
        return false;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Votre navigateur ne supporte pas l\'accès à la caméra.');
        setHasPermission(false);
        return false;
      }
      // Contraintes flexibles pour mobile : essayer d'abord avec résolution idéale, sinon fallback
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' },
            });
          } catch {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          }
        }
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
      setHasPermission(true);
      return true;
    } catch (err: unknown) {
      setHasPermission(false);
      const e = err as { name?: string };
      if (e.name === 'NotAllowedError') {
        setError('Caméra refusée. Autorisez l\'accès dans les paramètres.');
      } else if (e.name === 'NotFoundError') {
        setError('Aucune caméra trouvée sur cet appareil.');
      } else {
        setError('Impossible d\'accéder à la caméra.');
      }
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const resetCameraState = useCallback(() => {
    setError(null);
    setHasPermission(null);
  }, []);

  const waitForVideoReady = useCallback((maxMs = 5000): Promise<boolean> => {
    return new Promise(resolve => {
      if (!videoRef.current) {
        resolve(false);
        return;
      }
      const video = videoRef.current;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        resolve(true);
        return;
      }
      const start = Date.now();
      const check = () => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          resolve(true);
          return;
        }
        if (Date.now() - start >= maxMs) {
          resolve(false);
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.readyState < 2) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    return dataUrl.split(',')[1] ?? null;
  }, []);

  const captureFromFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result.split(',')[1] ?? '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  return { videoRef, canvasRef, isActive, hasPermission, error, startCamera, stopCamera, resetCameraState, captureImage, captureFromFile, waitForVideoReady };
}
