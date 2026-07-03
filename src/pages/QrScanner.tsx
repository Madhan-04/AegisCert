import React, { useState, useEffect, useRef } from 'react';
import { db, Certificate } from '../services/db';
import { Scan, Camera, ShieldAlert, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';

interface QrScannerProps {
  navigate: (route: string) => void;
}

export default function QrScanner({ navigate }: QrScannerProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState('');
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Get certificates for simulation target list
    setCertificates(db.getCertificates());
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setCameraActive(true);
      setScanStatus('Initializing optical focus...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScanning(true);
      setScanStatus('Scanning optical matrix for QR data...');
    } catch (err) {
      console.warn('Webcam blocked or unavailable. Running virtual camera.', err);
      setCameraActive(false);
      setIsScanning(true);
      setScanStatus('Scanning virtual video stream...');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsScanning(false);
  };

  const handleSimulateScan = (certId: string) => {
    setScanStatus('QR code detected! Reading payload...');
    setIsScanning(true);

    setTimeout(() => {
      stopCamera();
      // Redirect to verification details page
      navigate(`verification?id=${certId}`);
    }, 1200);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">QR Code Scanner</h1>
        <p className="text-sm text-slate-400">Scan diploma QR codes using your device camera to instantly load verifying blockchain receipts.</p>
      </div>

      <div className="glass-panel border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6">
        {isScanning && <div className="scan-line" />}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-xs text-rose-400">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Video feed viewport */}
        <div className="relative w-full max-w-sm aspect-square mx-auto rounded-2xl overflow-hidden border border-white/10 bg-slate-950 flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <div className="text-center p-6 space-y-4">
              <Camera className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
              <p className="text-2xs text-slate-500 max-w-[200px] mx-auto">Webcam stream simulated. Use the quick scanner shortcuts below to test.</p>
            </div>
          )}

          {/* Central target grid */}
          <div className="absolute inset-12 border-2 border-dashed border-accent-light/30 rounded-xl pointer-events-none flex items-center justify-center">
            {/* Pulsing red scan target dots */}
            <div className="w-4 h-4 border-t-2 border-l-2 border-red-500 absolute top-0 left-0" />
            <div className="w-4 h-4 border-t-2 border-r-2 border-red-500 absolute top-0 right-0" />
            <div className="w-4 h-4 border-b-2 border-l-2 border-red-500 absolute bottom-0 left-0" />
            <div className="w-4 h-4 border-b-2 border-r-2 border-red-500 absolute bottom-0 right-0" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-indigo-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            {scanStatus}
          </div>
          <p className="text-2xs text-slate-500">Hold the certificate's QR code in front of the lens box.</p>
        </div>

        {/* Simulator shortcuts for easy review */}
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3">
          <span className="block text-2xs uppercase text-slate-500 font-bold tracking-wider">Test Shortcuts (Simulate Camera Scan)</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold">
            {certificates.map((cert) => (
              <button
                key={cert.id}
                onClick={() => handleSimulateScan(cert.id)}
                className="p-2.5 bg-slate-900 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left text-slate-300 hover:text-white truncate"
              >
                Scan: {cert.studentName} ({cert.id})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
