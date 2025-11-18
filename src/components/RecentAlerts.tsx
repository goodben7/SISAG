import { useEffect, useState } from 'react';
import { AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Alert = Database['public']['Tables']['alerts']['Row'];

export function RecentAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(3);
      setAlerts(data || []);
    };
    load();
  }, []);

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
                  <p className="text-sm font-semibold text-rdcTextPrimary">{a.type.replace('_',' ')}</p>
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