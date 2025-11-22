import { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { getAlerts } from '../lib/api';
import { STRINGS } from '../lib/strings';

type Alert = Database['public']['Tables']['alerts']['Row'];

export function RecentAlerts({ refreshKey = 0 }: { refreshKey?: number }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getAlerts();
      setAlerts((data || []).slice(0, 3));
    };
    load();
  }, [refreshKey]);

  return (
    <div className="card p-6">
      <h3 className="font-display font-semibold text-rdcTextPrimary mb-4">Alertes récentes</h3>
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-rdcGrayText">Aucune alerte récente</p>
        ) : (
          alerts.map((a) => (
            <div key={a.id} className="border border-rdcGrayBorder rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-rdcRed mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rdcTextPrimary">{STRINGS.alertTypeLabels[a.type]} <span className="text-xs font-medium text-rdcGrayText">· {STRINGS.alertSeverityLabels[a.severity]}</span></p>
                  <p className="text-sm text-rdcGrayText line-clamp-2">{a.message}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 text-right">
        <a href="#" className="inline-block px-4 py-2 bg-rdcBlue text-white rounded-lg hover:bg-rdcBlueDark transition-colors">Voir toutes les alertes</a>
      </div>
    </div>
  );
}