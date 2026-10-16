/**
 * =====================================================
 * SYSTEMHEALTHCHECK.TSX - VERIFICAÇÃO DO SISTEMA
 * =====================================================
 *
 * Este componente faz uma VERIFICAÇÃO DE SAÚDE do sistema.
 * É como um "checkup" para ver se tudo está funcionando.
 *
 * FUNCIONALIDADES:
 * 1. Testa conexão com o banco de dados
 * 2. Verifica se todas as tabelas existem
 * 3. Mostra status online/offline
 * 4. Lista erros encontrados
 * 5. Permite rodar verificação novamente
 *
 * O QUE É VERIFICADO:
 * - Conexão geral com o Supabase
 * - Tabela de clientes
 * - Tabela de veículos
 * - Tabela de serviços
 * - Tabela de peças
 * - Tabela de orçamentos
 * - E outras tabelas do sistema
 *
 * QUANDO USAR:
 * - Quando algo não está funcionando
 * - Para diagnosticar problemas
 * - Para verificar se o sistema está online
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';
import { db } from '../lib/supabase';

// Resultado da verificação de saúde
interface HealthCheckResult {
  connection: boolean;           // Se conectou ao banco
  tables: Record<string, boolean>; // Status de cada tabela
  errors: string[];              // Lista de erros encontrados
}

const SystemHealthCheck: React.FC = () => {
  // ========================================
  // ESTADOS DO COMPONENTE
  // ========================================

  // Resultado da verificação
  const [healthStatus, setHealthStatus] = useState<HealthCheckResult | null>(null);

  // Se está executando a verificação
  const [isLoading, setIsLoading] = useState(false);

  // Quando foi a última verificação
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Status da conexão com a internet
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    // Monitor connection status
    const updateConnectionStatus = () => {
      setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    };

    window.addEventListener('online', updateConnectionStatus);
    window.addEventListener('offline', updateConnectionStatus);
    updateConnectionStatus();

    return () => {
      window.removeEventListener('online', updateConnectionStatus);
      window.removeEventListener('offline', updateConnectionStatus);
    };
  }, []);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const startTime = performance.now();
      const result = await db.healthCheck();
      setHealthStatus(result);
      setLastCheck(new Date());
      const endTime = performance.now();
      console.log(`Health check completed in ${endTime - startTime} milliseconds`);
    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus({
        connection: false,
        tables: {},
        errors: [`Failed to run health check: ${error}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-400" />
    );
  };

  const getOverallStatus = () => {
    if (!healthStatus) return 'unknown';
    if (!healthStatus.connection) return 'error';
    
    const tableStatuses = Object.values(healthStatus.tables);
    if (tableStatuses.every(status => status)) return 'healthy';
    if (tableStatuses.some(status => status)) return 'warning';
    return 'error';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              overallStatus === 'healthy' ? 'bg-green-400/10' :
              overallStatus === 'warning' ? 'bg-yellow-400/10' :
              overallStatus === 'error' ? 'bg-red-400/10' : 'bg-gray-400/10'
            }`}>
              {overallStatus === 'healthy' ? (
                <CheckCircle className="h-6 w-6 text-green-400" />
              ) : overallStatus === 'warning' ? (
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              ) : overallStatus === 'error' ? (
                <XCircle className="h-6 w-6 text-red-400" />
              ) : (
                <Database className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">System Health Check</h1>
              <p className="text-gray-400">
                Status do sistema e conectividade com o banco de dados
              </p>
            </div>
          </div>
          
          <button
            onClick={runHealthCheck}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verificar</span>
          </button>
        </div>

        {lastCheck && (
          <div className="mb-6 text-sm text-gray-400">
            Última verificação: {lastCheck.toLocaleString('pt-BR')}
          </div>
        )}

        {healthStatus && (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Status da Conexão</h3>
                {connectionStatus === 'online' ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-400" />
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(connectionStatus === 'online')}
                <span className={`font-medium ${
                  connectionStatus === 'online' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {connectionStatus === 'online' ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>

            {/* Connection Status */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white">Conectividade com Banco</h3>
                {healthStatus.connection ? (
                  <Wifi className="h-5 w-5 text-green-400" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-400" />
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(healthStatus.connection)}
                <span className={`font-medium ${
                  healthStatus.connection ? 'text-green-400' : 'text-red-400'
                }`}>
                  {healthStatus.connection ? 'Conectado ao Supabase' : 'Falha na conexão'}
                </span>
              </div>
            </div>

            {/* Tables Status */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Status das Tabelas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(healthStatus.tables).map(([table, status]) => (
                  <div key={table} className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <span className="text-gray-300 capitalize">{table}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {healthStatus.errors.length > 0 && (
              <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-3">Erros Encontrados</h3>
                <div className="space-y-2">
                  {healthStatus.errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {overallStatus === 'healthy' && (
              <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-400 font-medium">
                    Sistema funcionando corretamente! Todas as funcionalidades estão operacionais.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 text-blue-400 animate-spin" />
              <span className="text-white">Verificando sistema...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemHealthCheck;