import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, AlertCircle } from 'lucide-react';

interface PinLockModalProps {
  correctPin: string;
  onUnlock: () => void;
  businessName: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  correctPin,
  onUnlock,
  businessName,
}) => {
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const next = enteredPin + digit;
    setEnteredPin(next);
    setError('');

    if (next.length === 4) {
      if (next === correctPin) {
        onUnlock();
      } else {
        setError('Incorrect PIN. Try 1234');
        setTimeout(() => {
          setEnteredPin('');
        }, 500);
      }
    }
  };

  const handleBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleBiometric = () => {
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-xs flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center mb-4 text-emerald-400 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-center">{businessName}</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center">
          Enter 4-digit security PIN to unlock
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                idx < enteredPin.length
                  ? 'bg-emerald-400 scale-110 shadow-md shadow-emerald-500/50'
                  : 'bg-slate-700 border border-slate-600'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-4 bg-rose-950/60 px-3 py-1.5 rounded-lg border border-rose-800">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-xl font-semibold flex items-center justify-center transition-colors shadow-sm"
            >
              {num}
            </button>
          ))}

          {/* Biometric simulation */}
          <button
            onClick={handleBiometric}
            title="Biometric Fingerprint Unlock"
            className="h-14 rounded-full bg-slate-800/80 hover:bg-slate-700 text-emerald-400 flex items-center justify-center transition-colors"
          >
            <Fingerprint className="w-6 h-6" />
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-full bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-xl font-semibold flex items-center justify-center transition-colors shadow-sm"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleBackspace}
            title="Backspace"
            className="h-14 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 active:text-white flex items-center justify-center transition-colors"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setEnteredPin(correctPin);
              onUnlock();
            }}
            className="text-[11px] text-slate-500 hover:text-emerald-400 underline"
          >
            Bypass / Default PIN: {correctPin}
          </button>
        </div>
      </div>
    </div>
  );
};
