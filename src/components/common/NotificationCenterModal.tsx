import React, { useState } from 'react';
import {
  Bell,
  X,
  Clock,
  FileText,
  Download,
  AlertTriangle,
  HardDrive,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { SmartBizState, AppNotification } from '../../types';
import {
  downloadJsonBackup,
  downloadMonthlyReportCsv,
  requestPushNotificationPermission,
  sendPushNotification,
} from '../../utils/notifications';
import { TabType } from './Navigation';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: SmartBizState;
  notifications: AppNotification[];
  onNavigate: (tab: TabType) => void;
  onOpenPaywall: (reason?: 'sales_limit' | 'inventory_limit' | 'expiry' | 'general') => void;
  onQuickAddSale?: () => void;
  onSimulateNotification?: (type: 'end_of_day' | 'monthly_report' | 'backup' | 'countdown_10' | 'countdown_2' | 'countdown_1' | 'countdown_0' | null) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  state,
  notifications,
  onNavigate,
  onOpenPaywall,
  onQuickAddSale,
  onSimulateNotification,
}) => {
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnablePush = async () => {
    const granted = await requestPushNotificationPermission();
    if (granted) {
      setPushStatus('Push notifications enabled successfully!');
      sendPushNotification(
        '🔔 SmartBiz Pocket Notifications Active',
        'You will now receive end-of-day sales reminders and subscription renewal alerts.'
      );
    } else {
      setPushStatus('Notification permission was declined or not supported in this browser.');
    }
    setTimeout(() => setPushStatus(null), 4000);
  };

  const handleDownloadBackup = () => {
    try {
      const { filename } = downloadJsonBackup(state);
      setDownloadSuccessMessage(`JSON Backup "${filename}" downloaded successfully to your phone!`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setDownloadSuccessMessage('Failed to download backup file.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    }
  };

  const handleDownloadReport = () => {
    try {
      const filename = downloadMonthlyReportCsv(state);
      setDownloadSuccessMessage(`Monthly Store Report "${filename}" downloaded successfully!`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setDownloadSuccessMessage('Failed to download report.');
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    }
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'end_of_day_sales':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'monthly_reports':
        return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'subscription_countdown':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'end_of_month_backup':
        return <HardDrive className="w-5 h-5 text-emerald-500" />;
      case 'subscription_renewed':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 text-emerald-300">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">System Reminders & Alerts</h3>
              <p className="text-[11px] text-emerald-200">
                {notifications.length} active notice{notifications.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {downloadSuccessMessage && (
          <div className="p-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {pushStatus && (
          <div className="p-2.5 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{pushStatus}</span>
          </div>
        )}

        {/* Notification List */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700">All caught up!</p>
              <p className="text-xs text-slate-400 mt-1">No pending notifications or urgent alerts.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  notif.priority === 'critical'
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : notif.priority === 'high'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-slate-50/80 border-slate-200/80 text-slate-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0">
                    {getIconForType(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                      {notif.priority === 'critical' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500 text-white font-bold uppercase tracking-wider">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>

                    {/* Action Buttons */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2 flex-wrap">
                      {/* Subscription countdown action */}
                      {notif.type === 'subscription_countdown' && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPaywall('expiry');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Renew Pro ($2/mo)</span>
                        </button>
                      )}

                      {/* End of day sales actions */}
                      {notif.type === 'end_of_day_sales' && (
                        <>
                          <button
                            onClick={() => {
                              onClose();
                              if (onQuickAddSale) onQuickAddSale();
                              else onNavigate('sales');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Record Sale</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onNavigate('sales');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            <span>Check Sales</span>
                          </button>
                        </>
                      )}

                      {/* Monthly stores report actions */}
                      {notif.type === 'monthly_reports' && (
                        <>
                          <button
                            onClick={handleDownloadReport}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Monthly Report (CSV)</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onNavigate('reports');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            <span>Open Reports</span>
                          </button>
                        </>
                      )}

                      {/* End of month backup action */}
                      {notif.type === 'end_of_month_backup' && (
                        <>
                          <button
                            onClick={handleDownloadBackup}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download JSON Backup</span>
                          </button>
                          <button
                            onClick={() => {
                              onClose();
                              onNavigate('backup');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            <span>Open Backup Module</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Web Push Notification Opt-in */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 mt-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-xs font-bold text-slate-800">Phone Push Notifications</div>
                <div className="text-[10px] text-slate-500">Receive alerts even when the app is closed</div>
              </div>
            </div>
            <button
              onClick={handleEnablePush}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              Enable Push
            </button>
          </div>

          {/* Testing & Simulator Controls for merchant & evaluator */}
          {onSimulateNotification && (
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Test Notification Scenarios</span>
                </span>
                <button
                  onClick={() => onSimulateNotification(null)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
                <button
                  onClick={() => onSimulateNotification('countdown_10')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-center cursor-pointer"
                >
                  10 Days Left
                </button>
                <button
                  onClick={() => onSimulateNotification('countdown_2')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-center cursor-pointer"
                >
                  2 Days Left
                </button>
                <button
                  onClick={() => onSimulateNotification('countdown_1')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-center cursor-pointer"
                >
                  1 Day Left
                </button>
                <button
                  onClick={() => onSimulateNotification('countdown_0')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-rose-700 font-medium text-center cursor-pointer"
                >
                  Same Day (0d)
                </button>
                <button
                  onClick={() => onSimulateNotification('end_of_day')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-center cursor-pointer"
                >
                  End of Day Alert
                </button>
                <button
                  onClick={() => onSimulateNotification('monthly_report')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-center cursor-pointer"
                >
                  Monthly Report Alert
                </button>
                <button
                  onClick={() => onSimulateNotification('backup')}
                  className="p-1.5 bg-white rounded border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-center cursor-pointer col-span-2"
                >
                  End of Month Backup Alert
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
