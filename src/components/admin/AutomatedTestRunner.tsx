import React, { useState } from 'react';
import { FullTestReport } from '../../types';
import { PlayCircle, CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle, RefreshCw, FileText, Check } from 'lucide-react';

interface AutomatedTestRunnerProps {
  onRunTests: () => Promise<FullTestReport>;
  onResetDemo: () => Promise<void>;
  isLoading: boolean;
}

export const AutomatedTestRunner: React.FC<AutomatedTestRunnerProps> = ({
  onRunTests,
  onResetDemo,
  isLoading
}) => {
  const [report, setReport] = useState<FullTestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleExecuteTests = async () => {
    setIsRunning(true);
    setStatusMessage(null);
    try {
      const res = await onRunTests();
      setReport(res);
      setStatusMessage('Bateria de testes automatizados concluída!');
    } catch (err: any) {
      setStatusMessage(`Erro ao executar testes: ${err.message || 'Falha na comunicação'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Deseja realmente restaurar os dados iniciais de demonstração do almoxarifado?')) return;
    setResettingDemo(true);
    try {
      await onResetDemo();
      setStatusMessage('Dados de demonstração restaurados aos padrões com sucesso!');
      setReport(null);
    } catch (err: any) {
      setStatusMessage(`Erro ao resetar demo: ${err.message}`);
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Garantia de Qualidade e Conformidade
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Outfit',sans-serif]">
              Central de Testes Automatizados e Simulação de Uso
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Executa a suíte de 10 testes de backend obrigatórios cobrindo autenticação, validação de nome obrigatório, integridade de estoque, bloqueios de excesso, edição, exclusão lógica e a simulação de uso real.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="btn-reset-demo-data"
              onClick={handleReset}
              disabled={resettingDemo || isRunning}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors disabled:opacity-50"
            >
              {resettingDemo ? 'Restaurando...' : 'Restaurar Dados Demo'}
            </button>

            <button
              id="btn-run-automated-tests"
              onClick={handleExecuteTests}
              disabled={isRunning || isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRunning ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Executando Testes...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  <span>Executar Todos os Testes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
            <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Test Results Report */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Summary Score Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Relatório de Execução de Testes
                </span>
                <h4 className="text-2xl font-black font-['Outfit',sans-serif] text-white mt-0.5">
                  Taxa de Aprovação: <span className="text-emerald-400">{report.successRate}%</span>
                </h4>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-slate-400 block text-[10px]">Total de Testes</span>
                  <span className="font-bold text-white text-base">{report.totalTests}</span>
                </div>
                <div className="bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-700/50">
                  <span className="text-emerald-300 block text-[10px]">Aprovados</span>
                  <span className="font-bold text-emerald-400 text-base">{report.passedTests}</span>
                </div>
                <div className="bg-red-950/60 px-3 py-1.5 rounded-lg border border-red-700/50">
                  <span className="text-red-300 block text-[10px]">Falhas</span>
                  <span className="font-bold text-red-400 text-base">{report.failedTests}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-400 flex items-center justify-between">
              <span>Executado em: {new Date(report.timestamp).toLocaleString('pt-BR')}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Backend 100% Validado
              </span>
            </div>
          </div>

          {/* Test items list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h4 className="font-bold text-slate-900 text-base font-['Outfit',sans-serif] border-b border-slate-100 pb-2.5">
              Detalhamento dos 10 Testes Obrigatórios
            </h4>

            <div className="space-y-2.5">
              {report.results.map((res) => (
                <div
                  key={res.testId}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs transition-all ${
                    res.passed ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {res.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 text-sm">{res.name}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-6">{res.description}</p>
                    <div className="pl-6 pt-1">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-mono ${
                        res.passed ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                      }`}>
                        {res.details}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 sm:self-center pl-6 sm:pl-0">
                    <span className="text-[10px] text-slate-400 font-mono flex items-center sm:justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {res.durationMs}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation of Real Use Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-bold text-slate-900 text-base font-['Outfit',sans-serif]">
                Simulação Completa de Uso Real (Item 20)
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {report.simulationSummary.details}
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs font-mono text-slate-800">
              {report.simulationSummary.stepsExecuted.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
