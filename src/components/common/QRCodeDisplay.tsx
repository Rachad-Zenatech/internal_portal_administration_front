import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  className = "",
  errorCorrectionLevel = "M",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    setRenderError(null);

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: "#0f172a", // Slate 900
          light: "#ffffff", // Pure white
        },
        errorCorrectionLevel: errorCorrectionLevel,
      },
      (error) => {
        if (error) {
          console.error("[QRCodeDisplay] Failed to generate standard QR Code:", error);
          setRenderError("Failed to render QR Code.");
        }
      }
    );
  }, [value, size, errorCorrectionLevel]);

  if (renderError) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs text-center">
        {renderError}
      </div>
    );
  }

  return (
    <div className={`p-3 bg-white rounded-2xl shadow-sm border border-slate-200/90 inline-flex flex-col items-center justify-center ${className}`}>
      <canvas ref={canvasRef} className="rounded-lg block" />
    </div>
  );
};
