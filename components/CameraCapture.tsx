import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CameraIcon } from './icons';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    stopCamera(); // Ensure previous stream is stopped
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing rear camera:", err);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (fallbackErr) {
        console.error("Error accessing front camera:", fallbackErr);
        setError("Could not access camera. Please check your browser permissions.");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
          }
        }, 'image/jpeg');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm flex items-center justify-center z-50 animate-glitchIn">
      <div className="relative bg-deep-space/80 border border-cyber-cyan/30 rounded-lg shadow-cyber-glow-cyan p-4 w-full max-w-2xl">
        <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-cyan rounded-tl-lg"></div>
        <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-cyber-cyan rounded-tr-lg"></div>
        <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-cyber-cyan rounded-bl-lg"></div>
        <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-cyber-cyan rounded-br-lg"></div>
        
        <h3 className="text-lg font-display font-semibold text-center mb-4 text-cyber-cyan animate-flicker">CAMERA FEED</h3>
        <div className="relative">
          {error && <div className="absolute inset-0 flex items-center justify-center bg-space-cadet rounded-md"><p className="text-red-400 text-center p-4">{error}</p></div>}
          <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-md bg-space-cadet border border-cyber-cyan/20" />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-space-cadet/50 text-light-text rounded-lg hover:bg-space-cadet transition border border-cyber-cyan/30"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={!stream || !!error}
            className="p-4 bg-cyber-cyan rounded-full text-deep-space hover:bg-cyber-magenta transition disabled:opacity-50 disabled:cursor-not-allowed shadow-nevel-up active:shadow-nevel-down active:translate-y-px"
            aria-label="Take Photo"
          >
            <CameraIcon className="w-8 h-8" />
          </button>
           <button
            onClick={startCamera}
            className="px-6 py-2 bg-space-cadet/50 text-light-text rounded-lg hover:bg-space-cadet transition border border-cyber-cyan/30"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};