import React, { useEffect } from "react";

export default function Toast({ message, type = "success", position = "top-right", onClose }) {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const isCenter = position === "top-center";
  const posClasses = isCenter
    ? "top-6 left-1/2 -translate-x-1/2 animate-fade-in-down"
    : "top-6 right-6 animate-slide-in-right";

  const isError = type === "error";
  const borderClass = isError ? "border-l-rose-500" : "border-l-emerald-500";
  const dotColorClass = isError ? "bg-rose-500" : "bg-emerald-500";
  const pingColorClass = isError ? "bg-rose-400" : "bg-emerald-400";

  return (
    <div className={`fixed z-[9999] ${posClasses}`}>
      <div className={`flex items-center gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 text-slate-100 py-3.5 px-5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-l-4 ${borderClass}`}>
        <span className="flex h-2 w-2 relative">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColorClass} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClass}`}></span>
        </span>
        <span className="text-xs font-semibold tracking-wide">{message}</span>
      </div>
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
