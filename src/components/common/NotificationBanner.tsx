import React, { useState } from 'react';
import {
  Bell,
  Clock,
  FileText,
  Download,
  AlertTriangle,
  HardDrive,
  X,
  Zap,
  ShoppingBag,
} from 'lucide-react';
import { AppNotification, SmartBizState } from '../../types';
import { downloadJsonBackup, downloadMonthlyReportCsv } from '../../utils/notifications';
import { TabType } from './Navigation';

interface NotificationBannerProps {
  notifications?: AppNotification[];
  notification?: AppNotification | null;
  state?: SmartBizState;
  onOpenPaywall?: (reason?: 'sales_limit' | 'inventory_limit' | 'expiry' | 'general') => void;
  onOpenNotificationCenter?: () => void;
  onNavigate?: (tab: TabType) => void;
  onQuickAddSale?: () => void;
  onDismiss?: (id: string) => void;
  onAction?: (notification: AppNotification) => void;
  onViewAll?: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notifications,
  notification,
  state,
  onOpenPaywall,
  onOpenNotificationCenter,
  onNavigate,
  onQuickAddSale,
  onDismiss,
  onAction,
  onViewAll,
}) => {
  const [localDismissedIds, setLocalDismissedIds] = useState<string[]>([]);

  // Collect source notifications safely
  const rawList: AppNotification[] =
    notifications && Array.isArray(notifications)
      ? notifications
      : notification
      ? [notification]
      : [];

  const activeNotifs = (rawList || []).filter(
    n => Boolean(n && n.id) && !localDismissedIds.includes(n.id)
  );
  if (activeNotifs.length === 0) return null;

  // Pick highest priority active notification
  const current =
    activeNotifs.find(n => n.priority === 'critical') ||
    activeNotifs.find(n => n.priority === 'high') ||
    activeNotifs[0];

  if (!current) return null;

  const handleDismiss = (id: string) => {
    setLocalDismissedIds(prev => [...prev, id]);
    if (onDismiss) {
      onDismiss(id);
    }
  };

  const handleOpenCenter = () => {
    if (onOpenNotificationCenter) onOpenNotificationCenter();
    else if (onViewAll) onViewAll();
  };

  const getStyleForType = () => {
    if (current.type === 'subscription_countdown') {
      return 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 text-white';
    }
    if (current.type === 'end_of_day_sales') {
      return 'bg-gradient-to-r from-amber-600 to-orange-600 text-white';
    }
    if (current.type === 'monthly_reports') {
      return 'bg-gradient-to-r from-indigo-700 to-blue-700 text-white';
    }
    if (current.type === 'end_of_month_backup') {
      return 'bg-gradient-to-r from-emerald-700 to-teal-800 text-white';
    }
    return 'bg-slate-800 text-white';
  };

  const getIcon = () => {
    switch (current.type) {
      case 'subscription_countdown':
        return <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />;
      case 'end_of_day_sales':
        return <Clock className="w-4 h-4 text-amber-200 shrink-0" />;
      case 'monthly_reports':
        return <FileText className="w-4 h-4 text-blue-200 shrink-0" />;
      case 'end_of_month_backup':
        return <HardDrive className="w-4 h-4 text-emerald-200 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-slate-200 shrink-0" />;
    }
  };

  return (
    <div className={`px-3 sm:px-4 py-2 text-xs shadow-sm transition-all relative ${getStyleForType()}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-md bg-black/15 shrink-0">{getIcon()}</div>
          <div className="min-w-0 flex-1">
            <span className="font-bold mr-1.5">{current.title}:</span>
            <span className="opacity-95 text-[11px] sm:text-xs leading-snug">{current.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Direct Action Buttons */}
          {current.type === 'subscription_countdown' && (
            <button
              onClick={() => {
                if (onAction) onAction(current);
                else if (onOpenPaywall) onOpenPaywall('expiry');
              }}
              className="px-2.5 py-1 rounded-md bg-white text-rose-700 hover:bg-rose-50 text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-rose-600 fill-current" />
              <span>Renew ($2)</span>
            </button>
          )}

          {current.type === 'end_of_day_sales' && (
            <button
              onClick={() => {
                if (onAction) onAction(current);
                else if (onQuickAddSale) onQuickAddSale();
                else if (onNavigate) onNavigate('sales');
              }}
              className="px-2.5 py-1 rounded-md bg-white text-amber-900 hover:bg-amber-50 text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Record Sale</span>
            </button>
          )}

          {current.type === 'monthly_reports' && (
            <button
              onClick={() => {
                if (onAction) onAction(current);
                else if (state) downloadMonthlyReportCsv(state);
              }}
              className="px-2.5 py-1 rounded-md bg-white text-indigo-900 hover:bg-indigo-50 text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download Report</span>
            </button>
          )}

          {current.type === 'end_of_month_backup' && (
            <button
              onClick={() => {
                if (onAction) onAction(current);
                else if (state) downloadJsonBackup(state);
              }}
              className="px-2.5 py-1 rounded-md bg-white text-emerald-900 hover:bg-emerald-50 text-[11px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Download JSON Backup</span>
            </button>
          )}

          <button
            onClick={handleOpenCenter}
            className="px-2 py-1 rounded-md bg-black/20 hover:bg-black/30 text-[11px] text-white/90 transition-colors cursor-pointer"
            title="View all notifications"
          >
            All ({activeNotifs.length})
          </button>

          <button
            onClick={() => handleDismiss(current.id)}
            className="p-1 rounded-md hover:bg-black/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
