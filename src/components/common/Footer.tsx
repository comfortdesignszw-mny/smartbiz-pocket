import React from 'react';
import { ShieldCheck, FileText, Phone, Sparkles } from 'lucide-react';
import { LegalDocType } from '../legal/LegalModal';

interface FooterProps {
  onOpenLegal: (doc: LegalDocType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  return (
    <footer className="mt-8 pt-6 pb-6 border-t border-slate-200/80 text-center select-none">
      <div className="max-w-md mx-auto px-4 space-y-2">
        {/* Copyright Line */}
        <p className="text-xs font-semibold text-slate-700 tracking-normal">
          @2026 SmartBiz Pocket. All Rights Reserved.
        </p>

        {/* Designer Line with clickable contact */}
        <p className="text-[11px] text-slate-500 font-medium">
          <span>Designed by Comfort Designs-</span>
          <a
            href="tel:+263772824132"
            className="text-emerald-700 hover:text-emerald-800 hover:underline font-semibold transition-colors"
            title="Contact Comfort Designs"
          >
            +263772824132
          </a>
        </p>

        {/* Legal Links: Terms of Service & Privacy Policy */}
        <div className="flex items-center justify-center gap-3 pt-1 text-xs">
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="text-slate-600 hover:text-emerald-700 font-medium hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Terms of Service</span>
          </button>

          <span className="text-slate-300">•</span>

          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className="text-slate-600 hover:text-emerald-700 font-medium hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Trust badge / RevenueCat Pro notice */}
        <div className="pt-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/60 text-[10px] text-slate-500 font-medium">
            <Sparkles className="w-2.5 h-2.5 text-amber-500" />
            <span>RevenueCat Paywall • Pro Plan $2/Month</span>
          </span>
        </div>
      </div>
    </footer>
  );
};
