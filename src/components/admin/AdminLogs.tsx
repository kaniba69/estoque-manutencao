import React, { useState } from 'react';
import { SystemLog } from '../../types';
import { ShieldCheck, Search, RefreshCw, Clock, User } from 'lucide-react';

interface AdminLogsProps {
  logs: SystemLog[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AdminLogs: React.FC<AdminLogsProps> = ({
  logs,
  isLoading,
  onRefresh
}) => {
  const [filter, setFilter] = useState('');

  const filteredLogs = logs.filter(l => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.userName && l.userName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit',sans-serif]">
                Trilha de Auditoria e Logs do Sistema
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreamento imutável de todas as ações administrativas, alterações de catálogo e logins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar logs..."
                className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Detalhes do Evento</th>
                <th className="px-4 py-3">Usuário Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 font-sans">
                    Nenhum log de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-700 font-sans">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-sans text-xs max-w-md leading-relaxed">
                      {log.details}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-sans text-slate-700 font-medium">
                      {log.userName || 'Sistema Automático'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
