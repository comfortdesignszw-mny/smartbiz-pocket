import React, { useState } from 'react';
import {
  X,
  FileText,
  ShieldCheck,
  CreditCard,
  Lock,
  Smartphone,
  ExternalLink,
  Printer,
  CheckCircle2,
  Phone,
  Scale,
} from 'lucide-react';

export type LegalDocType = 'terms' | 'privacy';

interface LegalModalProps {
  initialDoc?: LegalDocType;
  isOpen: boolean;
  onClose: () => void;
  onOpenDoc?: (doc: LegalDocType) => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  initialDoc = 'terms',
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc);

  // Sync tab if initialDoc changes when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialDoc);
    }
  }, [isOpen, initialDoc]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {activeTab === 'terms' ? 'Terms of Use & Service' : 'Privacy Policy & Data Security'}
              </h2>
              <p className="text-[10px] text-slate-400">
                SmartBiz Pocket • Effective Date: September 2026
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title="Print Document"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1.5 border-b border-slate-200 flex items-center gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Use</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Highlight Banner: RevenueCat & $2 Pro Plan */}
        <div className="bg-emerald-50 border-b border-emerald-200/70 px-4 py-2.5 flex items-start gap-2.5 text-xs text-emerald-950 shrink-0">
          <CreditCard className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-emerald-900">RevenueCat Paywall & Pro Subscription: </span>
            SmartBiz Pocket integrates a secure paywall powered by <strong>RevenueCat</strong>. The <strong>Pro Plan</strong> is billed at <strong>$2 monthly ($2.00 / month)</strong> to unlock unlimited sales, inventory expansion, automated backups, and developer tools.
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-slate-700 space-y-5 leading-relaxed">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">SmartBiz Pocket — Terms of Use</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Last Updated: September 14, 2026 • Published by Comfort Designs
                </p>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  1. Acceptance of Terms
                </h4>
                <p>
                  By accessing, downloading, installing, or utilizing the <strong>SmartBiz Pocket</strong> web application, progressive web app (PWA), or mobile application (collectively, the &ldquo;Service&rdquo;), you agree to be legally bound by these Terms of Use (&ldquo;Terms&rdquo;). If you do not agree to these Terms, please do not use the Service.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  2. Description of the Service
                </h4>
                <p>
                  SmartBiz Pocket is an offline-first bookkeeping, point-of-sale (POS), stock inventory management, and debtor tracking utility designed specifically for tuckshops, micro-retailers, sole traders, and small businesses in Zimbabwe and emerging markets. The application stores primary ledger records directly within your local device cache or browser storage.
                </p>
              </section>

              <section className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  3. RevenueCat Paywall & Pro Subscription ($2 Monthly)
                </h4>
                <p>
                  SmartBiz Pocket offers a Free Tier and a paid <strong>Pro Plan</strong>.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                  <li>
                    <strong>Third-Party Paywall Infrastructure:</strong> SmartBiz Pocket utilizes <strong>RevenueCat</strong> as its authoritative in-app purchase and subscription management backend service. RevenueCat verifies purchase receipts, verifies entitlement status across devices, and powers our in-app paywall.
                  </li>
                  <li>
                    <strong>Monthly Pricing:</strong> The Pro Plan subscription fee is <strong>$2.00 (two US dollars) per month</strong> (&ldquo;$2 monthly&rdquo;), or its local currency equivalent as determined by the relevant app store (Google Play, Apple App Store) or payment processor.
                  </li>
                  <li>
                    <strong>Billing & Renewal:</strong> Subscriptions are billed on a recurring monthly basis. Your payment method will be charged automatically at the start of each billing cycle unless you cancel the subscription at least 24 hours prior to the conclusion of the active billing period.
                  </li>
                  <li>
                    <strong>Pro Plan Entitlements:</strong> Subscribing to Pro unlocks unlimited sales and transaction logging, unlimited catalog items, automated daily backup prompts, custom receipt branding, multi-currency conversion tools, and full access to our Flutter & Drift native SQLite architecture hub.
                  </li>
                  <li>
                    <strong>Cancellation & Refunds:</strong> You can manage or cancel your subscription at any time through your Google Play Store, Apple App Store, or payment portal account settings. All subscription fees are non-refundable to the extent permitted by applicable law.
                  </li>
                </ul>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  4. User Responsibility & Data Backup
                </h4>
                <p>
                  Because SmartBiz Pocket operates with an offline-first architecture, your transaction, debtor, and stock data reside directly on your local device. While this guarantees 100% operational continuity without Internet connectivity, <strong>you are solely responsible for creating regular backups</strong> of your data using the built-in JSON export feature in the Backup tab.
                </p>
                <p className="text-[11px] text-slate-500">
                  Comfort Designs shall not be liable for data loss caused by clearing browser cookies/site storage, hardware damage, operating system reinstalls, or device theft.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  5. Intellectual Property
                </h4>
                <p>
                  All content, interface designs, branding, algorithms, software blueprints, and logos associated with SmartBiz Pocket are the intellectual property of <strong>Comfort Designs</strong> and are protected under applicable copyright and intellectual property laws.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  6. Disclaimer of Warranties & Limitation of Liability
                </h4>
                <p>
                  The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied. Comfort Designs does not guarantee that calculations of tax, debtor balances, or currency valuations will meet legal compliance requirements in all jurisdictions; merchants should verify numbers with certified accountants.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  7. Developer Contact & Inquiries
                </h4>
                <p>
                  For business inquiries, enterprise customizations, or technical assistance regarding these Terms:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-slate-800">Comfort Designs</p>
                    <p className="text-slate-500">Harare, Zimbabwe</p>
                  </div>
                  <a
                    href="tel:+263772824132"
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+263 77 282 4132</span>
                  </a>
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">SmartBiz Pocket — Privacy Policy</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Last Updated: September 14, 2026 • Published by Comfort Designs
                </p>
              </div>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  1. Our Privacy Commitment
                </h4>
                <p>
                  At SmartBiz Pocket (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), developed by <strong>Comfort Designs</strong>, we believe that small business ledger data is sacred. Our app is engineered from the ground up to respect your financial privacy: <strong>your sales figures, profit margins, customer phone numbers, and debtor lists remain exclusively on your local device.</strong>
                </p>
              </section>

              <section className="space-y-2 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  2. RevenueCat Paywall Integration & Subscription Data
                </h4>
                <p className="text-emerald-950">
                  SmartBiz Pocket incorporates the <strong>RevenueCat SDK and paywall service</strong> to power our <strong>Pro Plan</strong> ($2 monthly subscription).
                </p>
                <div className="space-y-1.5 text-[11px] text-emerald-900">
                  <p>
                    <strong>What RevenueCat Processes:</strong> When you view or interact with our Pro paywall, RevenueCat processes an anonymous, pseudonymous App User ID, device hardware platform identifiers, and store transaction receipts (from Google Play Store, Apple App Store, or Stripe/web billing) strictly to verify whether your Pro Plan subscription ($2/month) is active.
                  </p>
                  <p>
                    <strong>What RevenueCat DOES NOT Receive:</strong> RevenueCat has zero access to your store inventory items, wholesale purchase costs, daily sales tickets, debtor records, customer contacts, or net profit metrics.
                  </p>
                  <p>
                    You can review RevenueCat&rsquo;s privacy standards at{' '}
                    <a
                      href="https://www.revenuecat.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-emerald-800 inline-flex items-center gap-0.5"
                    >
                      revenuecat.com/privacy <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                    </a>.
                  </p>
                </div>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  3. Offline-First Local Storage Architecture
                </h4>
                <p>
                  All core application data is stored in your client web browser via <code>localStorage</code> or local device SQLite databases. This includes:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                  <li>Store profile details (shop name, owner name, currency preferences).</li>
                  <li>Product inventory entries, stock quantity levels, cost prices, and selling prices.</li>
                  <li>Customer names, addresses, notes, and WhatsApp telephone numbers.</li>
                  <li>Daily expense records, categories, and payment receipts.</li>
                  <li>Debtor balances, due dates, and repayment records.</li>
                </ul>
                <p>
                  None of this financial or operational data is transmitted, uploaded, mined, or sold to external marketing networks.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  4. Communication with Customers (WhatsApp & Phone)
                </h4>
                <p>
                  SmartBiz Pocket includes convenience shortcuts that trigger your device&rsquo;s standard WhatsApp client (via <code>https://wa.me/</code>) or phone dialer (<code>tel:</code>) to send itemized sales receipts or gentle payment reminders to debtors. These actions occur directly between your device and the third-party application; SmartBiz Pocket does not log or monitor your private communications.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  5. Data Retention & Deletion
                </h4>
                <p>
                  You retain complete authority over your records. You can delete individual products, sales, expenses, or debtors at any time. To purge all application records permanently, you may clear the application cache in browser settings or use the reset option in your device settings.
                </p>
              </section>

              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-emerald-600 rounded-xs"></span>
                  6. Contact Us Regarding Privacy
                </h4>
                <p>
                  If you have questions about how SmartBiz Pocket safeguards your business privacy or uses the RevenueCat paywall:
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-bold text-slate-800">Designed by Comfort Designs</p>
                    <p className="text-slate-500">Harare, Zimbabwe</p>
                  </div>
                  <a
                    href="tel:+263772824132"
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+263 77 282 4132</span>
                  </a>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Paywall powered by RevenueCat ($2/mo Pro)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            Close Document
          </button>
        </div>
      </div>
    </div>
  );
};
