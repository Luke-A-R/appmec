/**
 * =====================================================
 * SUPABASE.TS - CONEXÃO COM O BANCO DE DADOS
 * =====================================================
 *
 * Este arquivo é responsável por TODA a comunicação com o banco de dados.
 * Ele usa o Supabase, que é um serviço de banco de dados online.
 *
 * O QUE ESTE ARQUIVO FAZ:
 * 1. Conecta com o banco de dados na nuvem
 * 2. Define a estrutura dos dados (clientes, veículos, serviços, etc.)
 * 3. Fornece funções para salvar, buscar, alterar e apagar dados
 *
 * ESTRUTURA:
 * - Interfaces: Definem como os dados são organizados
 * - Funções "db": Fazem as operações no banco de dados
 */

import { createClient } from '@supabase/supabase-js';

// ========================================
// CONFIGURAÇÃO DA CONEXÃO
// ========================================
// Estas variáveis vêm do arquivo .env e contêm:
// - supabaseUrl: Endereço do banco de dados na internet
// - supabaseAnonKey: Chave de segurança para acessar o banco
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as configurações existem - se não existirem, o sistema não funciona
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cria a conexão com o banco de dados
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// DEFINIÇÃO DOS TIPOS DE DADOS (INTERFACES)
// ========================================
//_interfaces são como "moldes" que definem que informações cada tipo de dado tem
// Isso ajuda o sistema a saber exatamente que campos existem em cada tabela

/**
 * CLIENTE - Informações de cada cliente da oficina
 * Guarda dados pessoais para contato e identificação
 */

export interface Empresa {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  logo_url?: string;
  plano_atual: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  empresa_id?: string;
  nome?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface Client {
  empresa_id?: string;
  id: string;              // Código único do cliente (gerado automaticamente)
  name: string;            // Nome completo do cliente
  email: string;           // Email para contato
  phone: string;           // Telefone para contato
  notes?: string;          // Observações adicionais (opcional)
  created_at: string;       // Data em que foi cadastrado
  updated_at: string;       // Data da última alteração
}

/**
 * VEÍCULO - Dados dos veículos dos clientes
 * Cada veículo pertence a um cliente específico
 */
export interface Vehicle {
  empresa_id?: string;
  id: string;              // Código único do veículo
  client_id: string;       // Código do cliente dono do veículo
  brand: string;            // Marca do veículo (ex: Fiat, Volkswagen)
  model: string;            // Modelo do veículo (ex: Uno, Gol)
  year: number;             // Ano de fabricação
  color?: string;           // Cor do veículo (opcional)
  license_plate?: string;   // Placa do veículo (opcional)
  notes?: string;           // Observações (opcional)
  // Checklist de danos - marca o que o veículo tem de defeito antes do serviço
  damage_checklist?: {
    scratches: boolean;      // Arranhões
    dents: boolean;          // Amassados
    rust: boolean;           // Ferrugem
    paint_damage: boolean;   // Danos na pintura
    broken_parts: boolean;   // Peças quebradas
    interior_damage: boolean; // Danos no interior
    tire_condition: boolean;  // Condição dos pneus
    other_issues: boolean;    // Outros problemas
    notes?: string;          // Observações sobre os danos
  };
  created_at: string;       // Data de cadastro
  updated_at: string;       // Data da última alteração
}

/**
 * PROJETO (SERVIÇO) - Cada serviço realizado na oficina
 * Guarda todas as informações sobre o trabalho sendo feito
 */
export interface Project {
  empresa_id?: string;
  id: string;               // Código único do serviço
  client_id: string;         // Código do cliente
  vehicle_id: string;        // Código do veículo
  title: string;             // Título/nome do serviço
  description: string;       // Descrição detalhada do que será feito
  service_type: string;      // Tipo do serviço (ex: Funilaria, Pintura)
  // Status do serviço (em que etapa está)
  status: 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  // Prioridade (o quão urgente é)
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;       // Data de início
  estimated_completion?: string; // Data prevista para término
  actual_completion?: string | null; // Data real de término
  estimated_cost: number;     // Custo estimado
  actual_cost: number;        // Custo real final
  progress_percentage: number; // Porcentagem concluída (0 a 100)
  notes?: string;             // Observações do mecânico
  client_notes?: string;      // Observações do cliente
  orcamento_id?: string;      // Código do orçamento relacionado
  started_at?: string;        // Quando começou
  completed_at?: string | null; // Quando terminou
  auto_status_update: boolean; // Se atualiza status automaticamente
  before_images?: string[];   // Fotos de antes do serviço
  after_images?: string[];    // Fotos de depois do serviço
  created_at: string;         // Data de criação
  updated_at: string;         // Data da última alteração
}

/**
 * ETAPA DO PROJETO - Cada etapa dentro de um serviço
 * Um serviço pode ter várias etapas (ex: desmontar, reparar, pintar, montar)
 */
export interface ProjectStep {
  empresa_id?: string;
  id: string;               // Código único da etapa
  servico_id: string;        // Código do serviço pai
  name: string;              // Nome da etapa
  description: string;       // Descrição do que fazer
  step_order: number;        // Ordem da etapa (1, 2, 3...)
  completed: boolean;        // Se a etapa foi concluída
  start_date?: string;       // Data de início da etapa
  completed_date?: string | null; // Data de término da etapa
  estimated_hours: number;    // Horas previstas
  actual_hours: number;       // Horas reais gastas
  responsible: string;       // Responsável pela etapa
  notes?: string;             // Observações
  days_worked?: number;       // Dias trabalhados
  images?: string[];          // Fotos da etapa
  created_at: string;         // Data de criação
  updated_at: string;         // Data da última alteração
}

/**
 * PEÇA - Peças no estoque da oficina
 * Controle de inventário de peças
 */
export interface Part {
  empresa_id?: string;
  id: string;                // Código único da peça
  name: string;               // Nome da peça
  category: string;           // Categoria (ex: Motor, Suspensão)
  brand: string;              // Marca da peça
  part_number: string;        // Número/código do fabricante
  description?: string;       // Descrição detalhada
  current_stock: number;      // Quantidade atual em estoque
  min_stock: number;          // Quantidade mínima (abaixo disso = alerta)
  max_stock: number;          // Quantidade máxima
  unit_price: number;         // Preço por unidade
  supplier?: string;          // Fornecedor
  location?: string;          // Onde está guardada na oficina
  // Status do estoque
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  created_at: string;        // Data de cadastro
  updated_at: string;        // Data da última alteração
}

/**
 * PEÇA DO CLIENTE - Peças que o cliente trouxe
 * Às vezes o cliente traz a própria peça para instalar
 */
export interface ClientPart {
  empresa_id?: string;
  id: string;                // Código único
  client_id: string;         // Código do cliente
  vehicle_id: string;        // Código do veículo
  part_id?: string;          // Código da peça cadastrada (opcional)
  part_name?: string;        // Nome da peça digitado livremente
  quantity: number;          // Quantidade trazida
  // Condição da peça
  condition: 'new' | 'used' | 'refurbished' | 'damaged';
  notes?: string;            // Observações
  received_date: string;     // Data em que recebeu
  created_at: string;        // Data de cadastro
  updated_at: string;        // Data da última alteração
}

/**
 * AGENDAMENTO - Consultas e serviços agendados
 * Controla a agenda da oficina
 */
export interface Schedule {
  empresa_id?: string;
  id: string;                // Código único do agendamento
  client_id?: string;        // Código do cliente (opcional)
  vehicle_id?: string;       // Código do veículo (opcional)
  servico_id?: string;       // Código do serviço relacionado (opcional)
  title: string;             // Título do agendamento
  service: string;           // Tipo de serviço
  scheduled_date: string;    // Data agendada
  scheduled_time: string;    // Horário agendado
  duration_hours: number;    // Duração prevista em horas
  // Status do agendamento
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high'; // Prioridade
  notes?: string;            // Observações
  created_at: string;        // Data de criação
  updated_at: string;        // Data da última alteração
}

/**
 * LISTA DE PEÇAS - Lista de peças que o cliente precisa trazer
 */
export interface PartsList {
  empresa_id?: string;
  id: string;                // Código único da lista
  client_id: string;         // Código do cliente
  vehicle_id: string;        // Código do veículo
  parts: string[];           // Lista de peças
  notes: string;             // Observações
  created_at: string;        // Data de criação
  updated_at: string;        // Data da última alteração
  client?: any;              // Dados do cliente (preenchido na busca)
  vehicle?: any;             // Dados do veículo (preenchido na busca)
}

/**
 * PROPOSTA (ORÇAMENTO) - Orçamentos para os clientes
 * Documento com preço previsto para o serviço
 */
export interface Proposal {
  empresa_id?: string;
  id: string;                // Código único do orçamento
  client_id: string;         // Código do cliente
  vehicle_id: string;        // Código do veículo
  title: string;             // Título do orçamento
  services: string[];        // Lista de serviços incluídos
  parts?: string[];          // Peças incluídas (opcional)
  estimated_price: number;   // Preço estimado total
  estimated_duration: string; // Tempo previsto
  terms: string[];           // Termos e condições
  // Status do orçamento
  status: 'pending' | 'sent' | 'signed' | 'rejected' | 'expired';
  pdf_url?: string;          // Link do PDF
  signed_pdf_url?: string;   // Link do PDF assinado
  signed_date?: string;      // Data da assinatura
  expires_at?: string;       // Data de validade
  notes?: string;            // Observações
  created_at: string;        // Data de criação
  updated_at: string;        // Data da última alteração
}

/**
 * REGISTRO DE RECEITA - Controle financeiro
 * Guarda informações sobre pagamentos recebidos
 */
export interface RevenueRecord {
  empresa_id?: string;
  id: string;                // Código único
  servico_id?: string;       // Código do serviço (opcional)
  client_id: string;         // Código do cliente
  description: string;       // Descrição da receita
  amount: number;            // Valor
  category: 'service' | 'parts' | 'labor' | 'other'; // Tipo de receita
  payment_method: 'cash' | 'card' | 'pix' | 'transfer' | 'check'; // Forma de pagamento
  payment_status: 'pending' | 'paid' | 'partial' | 'overdue'; // Status do pagamento
  due_date?: string;         // Data de vencimento
  paid_date?: string;        // Data em que foi pago
  month_year: string;        // Mês e ano (para relatórios)
  notes?: string | null;     // Observações
  created_at: string;        // Data de criação
  updated_at: string;        // Data da última alteração
}

// ========================================
// FUNÇÕES DO BANCO DE DADOS
// ========================================
// Este objeto "db" contém todas as funções para mexer no banco
// Cada função faz uma operação específica (criar, ler, alterar, apagar)
export const db = {
  // ========================================
  // TESTE DE CONEXÃO
  // ========================================
  /**
   * Testa se a conexão com o banco está funcionando
   * Útil para diagnosticar problemas
   */
  async testConnection(): Promise<boolean> {
    try {
      const startTime = performance.now();
      // Tenta fazer uma busca simples na tabela de clientes
      const { data, error } = await supabase
        .from('clients')
        .select('count')
        .limit(1);

      const endTime = performance.now();
      // Mostra no console quanto tempo demorou
      console.log(`Connection test took ${endTime - startTime} milliseconds`);
      // Se não houve erro, a conexão está OK
      return !error;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  },

  // ========================================
  // FUNÇÕES DE CLIENTES
  // ========================================

  /**
   * Busca todos os clientes cadastrados
   * Retorna uma lista ordenada pelo nome
   */
  async getClients(): Promise<Client[]> {
    try {
      const startTime = performance.now();
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name'); // Ordena por nome em ordem alfabética

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      const endTime = performance.now();
      console.log(`Fetched ${data?.length || 0} clients in ${endTime - startTime} milliseconds`);
      return data || [];
    } catch (error) {
      console.error('Failed to fetch clients:', error);
      return [];
    }
  },

  /**
   * Cria um novo cliente
   * @param client - Dados do cliente (sem id e datas, que são gerados automaticamente)
   */
  async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Client;
  },

  /**
   * Atualiza os dados de um cliente
   * @param id - Código do cliente
   * @param updates - Campos que serão alterados
   */
  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Client;
  },

  /**
   * Apaga um cliente
   * CUIDADO: Esta ação não pode ser desfeita!
   * @param id - Código do cliente
   */
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE VEÍCULOS
  // ========================================

  /**
   * Busca todos os veículos cadastrados
   * Inclui os dados do dono (cliente)
   */
  async getVehicles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          client:clients(name, email, phone)
        `)
        .order('brand');

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Cadastra um novo veículo
   * @param vehicle - Dados do veículo
   */
  async createVehicle(vehicle: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Vehicle;
  },

  /**
   * Atualiza os dados de um veículo
   * @param id - Código do veículo
   * @param updates - Campos que serão alterados
   */
  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Vehicle;
  },

  /**
   * Apaga um veículo
   * @param id - Código do veículo
   */
  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE PROJETOS (SERVIÇOS)
  // ========================================

  /**
   * Busca todos os serviços cadastrados
   * Inclui dados do cliente, veículo e orçamento
   */
  async getProjects(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select(`
          *,
          client:clients(name, email, phone),
          vehicle:vehicles(brand, model, year, license_plate),
          orcamento:orcamentos(status, signed_date)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Busca um serviço específico pelo ID
   * @param id - Código do serviço
   */
  async getProject(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('servicos')
      .select(`
        *,
        client:clients(name, email, phone),
        vehicle:vehicles(brand, model, year, license_plate),
        orcamento:orcamentos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Cria um novo serviço
   * Configura automaticamente alguns campos padrão
   */
  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'progress_percentage' | 'auto_status_update' | 'before_images' | 'after_images'>): Promise<Project> {
    const { data, error } = await supabase
      .from('servicos')
      .insert({
        ...project,
        auto_status_update: true,     // Habilita atualização automática de status
        before_images: [],             // Lista de fotos "antes" vazia
        after_images: []               // Lista de fotos "depois" vazia
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Project;
  },

  /**
   * Atualiza os dados de um serviço
   * Desabilita atualização automática quando marca como concluído
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    // Se estiver marcando como concluído, desabilita a atualização automática
    // Isso evita que o sistema crie receitas automaticamente
    if (updates.status === 'completed') {
      await supabase
        .from('servicos')
        .update({ auto_status_update: false })
        .eq('id', id);
    }

    const { data, error } = await supabase
      .from('servicos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Project;
  },

  /**
   * Apaga um serviço
   * CUIDADO: Apaga também as etapas e peças vinculadas!
   */
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE ETAPAS DO PROJETO
  // ========================================

  /**
   * Busca todas as etapas de um serviço
   * @param projectId - Código do serviço
   */
  async getProjectSteps(projectId: string): Promise<ProjectStep[]> {
    try {
      const { data, error } = await supabase
        .from('servico_etapas')
        .select('*')
        .eq('servico_id', projectId)
        .order('step_order'); // Ordena pela ordem da etapa

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Cria uma nova etapa em um serviço
   */
  async createProjectStep(step: Omit<ProjectStep, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectStep> {
    const { data, error } = await supabase
      .from('servico_etapas')
      .insert(step)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as ProjectStep;
  },

  /**
   * Atualiza uma etapa
   * Usado para marcar como concluída, adicionar notas, etc.
   */
  async updateProjectStep(id: string, updates: Partial<ProjectStep>): Promise<ProjectStep> {
    const { data, error } = await supabase
      .from('servico_etapas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as ProjectStep;
  },

  /**
   * Apaga uma etapa
   */
  async deleteProjectStep(id: string): Promise<void> {
    const { error } = await supabase
      .from('servico_etapas')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE PEÇAS (ESTOQUE)
  // ========================================

  /**
   * Busca todas as peças cadastradas no estoque
   */
  async getParts(): Promise<Part[]> {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Cadastra uma nova peça no estoque
   * O status é calculado automaticamente baseado no estoque atual
   */
  async createPart(part: Omit<Part, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Part> {
    // Calcula o status baseado na quantidade em estoque
    // Se não tem = sem estoque, se está no mínimo = estoque baixo, se está ok = em estoque
    let status: 'in-stock' | 'low-stock' | 'out-of-stock';
    if (part.current_stock === 0) {
      status = 'out-of-stock';
    } else if (part.current_stock <= part.min_stock) {
      status = 'low-stock';
    } else {
      status = 'in-stock';
    }

    const partWithStatus = {
      ...part,
      status
    };

    const { data, error } = await supabase
      .from('parts')
      .insert(partWithStatus)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Part;
  },

  /**
   * Atualiza os dados de uma peça
   */
  async updatePart(id: string, updates: Partial<Part>): Promise<Part> {
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Part;
  },

  /**
   * Apaga uma peça do estoque
   */
  async deletePart(id: string): Promise<void> {
    const { error } = await supabase
      .from('parts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE PEÇAS DO CLIENTE
  // ========================================

  /**
   * Busca as peças que os clientes trouxeram
   * Pode filtrar por cliente ou veículo
   */
  async getClientParts(clientId?: string, vehicleId?: string): Promise<any[]> {
    try {
      // Começa a busca incluindo dados relacionados
      let query = supabase
        .from('client_parts')
        .select(`
          *,
          client:clients(name),
          vehicle:vehicles(brand, model, year, license_plate),
          part:parts(name, brand, part_number, category)
        `);

      // Se especificou cliente, filtra por ele
      if (clientId) query = query.eq('client_id', clientId);
      // Se especificou veículo, filtra por ele
      if (vehicleId) query = query.eq('vehicle_id', vehicleId);

      const { data, error } = await query.order('received_date', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Registra uma peça que o cliente trouxe
   */
  async createClientPart(clientPart: Omit<ClientPart, 'id' | 'created_at' | 'updated_at'>): Promise<ClientPart> {
    const { data, error } = await supabase
      .from('client_parts')
      .insert(clientPart)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as ClientPart;
  },

  /**
   * Atualiza informação de uma peça do cliente
   */
  async updateClientPart(id: string, updates: Partial<ClientPart>): Promise<ClientPart> {
    const { data, error } = await supabase
      .from('client_parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as ClientPart;
  },

  /**
   * Remove uma peça do cliente do registro
   */
  async deleteClientPart(id: string): Promise<void> {
    const { error } = await supabase
      .from('client_parts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE PEÇAS DO PROJETO
  // ========================================

  /**
   * Busca as peças usadas em um serviço específico
   * @param projectId - Código do serviço
   */
  async getProjectParts(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('servico_pecas')
        .select(`
          *,
          part:parts(name, brand, part_number, category, unit_price)
        `)
        .eq('servico_id', projectId)
        .order('used_date', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Registra uma peça usada em um serviço
   */
  async createProjectPart(projectPart: any): Promise<any> {
    const { data, error } = await supabase
      .from('servico_pecas')
      .insert(projectPart)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  },

  /**
   * Remove uma peça de um serviço
   */
  async deleteProjectPart(id: string): Promise<void> {
    const { error } = await supabase
      .from('servico_pecas')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE AGENDAMENTOS
  // ========================================

  /**
   * Busca todos os agendamentos
   * Inclui dados do cliente, veículo e serviço
   */
  async getSchedules(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          client:clients(name),
          vehicle:vehicles(brand, model, year, license_plate),
          servico:servicos(title)
        `)
        .order('scheduled_date');

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Cria um novo agendamento
   */
  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Schedule;
  },

  /**
   * Atualiza um agendamento
   */
  async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Schedule;
  },

  /**
   * Cancela/apaga um agendamento
   */
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE LISTAS DE PEÇAS
  // ========================================

  /**
   * Busca listas de peças que clientes precisam trazer
   */
  async getPartsLists(clientId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('parts_lists')
        .select(`
          *,
          client:clients(name, email, phone),
          vehicle:vehicles(brand, model, year, license_plate)
        `);

      if (clientId) query = query.eq('client_id', clientId);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching parts lists:', error);
      return [];
    }
  },

  /**
   * Cria uma nova lista de peças
   */
  async createPartsList(partsList: { client_id: string; vehicle_id: string; parts: string[]; notes?: string }): Promise<PartsList> {
    const { data, error } = await supabase
      .from('parts_lists')
      .insert(partsList)
      .select()
      .single();

    if (error) throw error;
    return data as PartsList;
  },

  /**
   * Atualiza uma lista de peças
   */
  async updatePartsList(id: string, updates: Partial<PartsList>): Promise<PartsList> {
    const { data, error } = await supabase
      .from('parts_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PartsList;
  },

  /**
   * Apaga uma lista de peças
   */
  async deletePartsList(id: string): Promise<void> {
    const { error } = await supabase
      .from('parts_lists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ========================================
  // FUNÇÕES DE ORÇAMENTOS (PROPOSTAS)
  // ========================================

  /**
   * Busca todos os orçamentos
   * Inclui dados do cliente e veículo
   */
  async getProposals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          *,
          client:clients(name, email, phone),
          vehicle:vehicles(brand, model, year, license_plate)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Cria um novo orçamento
   */
  async createProposal(proposal: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('orcamentos')
      .insert(proposal)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Proposal;
  },

  /**
   * Atualiza um orçamento
   */
  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    const { data, error } = await supabase
      .from('orcamentos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as Proposal;
  },

  /**
   * Apaga um orçamento
   */
  async deleteProposal(id: string): Promise<void> {
    const { error } = await supabase
      .from('orcamentos')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // FUNÇÕES DE RECEITAS (FINANCEIRO)
  // ========================================

  /**
   * Busca registros de receitas
   * Pode filtrar por mês específico
   */
  async getRevenueRecords(monthYear?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('revenue_records')
        .select(`
          *,
          client:clients(name),
          servico:servicos(title)
        `);

      if (monthYear) {
        const [year, month] = monthYear.split('-').map(Number);
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
        query = query.gte('paid_date', start).lt('paid_date', end);
      }

      const { data, error } = await query.order('paid_date', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Cria um novo registro de receita
   * Faz validações antes de salvar
   */
  async createRevenueRecord(record: Omit<RevenueRecord, 'id' | 'created_at' | 'updated_at'>): Promise<RevenueRecord> {
    console.log('Creating revenue record:', record);

    // Verifica se os campos obrigatórios foram preenchidos
    if (!record.client_id || !record.description || record.amount === undefined || record.amount === null || !record.month_year) {
      throw new Error('Campos obrigatórios não preenchidos');
    }

    // Verifica se o valor é positivo
    if (record.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }

    // Limpa e organiza os dados antes de salvar
    const cleanRecord = {
      client_id: record.client_id,
      description: record.description.trim(),
      amount: Number(record.amount),
      category: record.category,
      payment_method: record.payment_method,
      payment_status: record.payment_status,
      due_date: record.due_date || null,
      paid_date: record.paid_date || null,
      month_year: record.month_year,
      notes: record.notes || null,
      servico_id: record.servico_id || null
    };

    const { data, error } = await supabase
      .from('revenue_records')
      .insert(cleanRecord)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Revenue record created:', data);
    return data as RevenueRecord;
  },

  /**
   * Atualiza um registro de receita
   */
  async updateRevenueRecord(id: string, updates: Partial<RevenueRecord>): Promise<RevenueRecord> {
    const { data, error } = await supabase
      .from('revenue_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data as RevenueRecord;
  },

  /**
   * Apaga um registro de receita
   */
  async deleteRevenueRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('revenue_records')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },

  // ========================================
  // ESTATÍSTICAS DO DASHBOARD
  // ========================================

  /**
   * Busca todos os dados para o Dashboard
   * Calcula números totais e resumos
   */
  async getDashboardStats(): Promise<{
    totalClients: number;        // Total de clientes
    inProgressProjects: number;  // Serviços em andamento
    lowStockParts: number;       // Peças com estoque baixo
    monthlyRevenue: number;      // Receita do mês
    totalValue: number;          // Valor total do estoque
  }> {
    try {
      // Busca todos os dados necessários de uma vez (paralelo)
      const [clients, projects, parts, revenue] = await Promise.all([
        this.getClients(),
        this.getProjects(),
        this.getParts(),
        this.getRevenueRecords(new Date().toISOString().slice(0, 7)) // Mês atual
      ]);

      // Conta serviços em andamento (inclui não iniciados)
      const inProgressProjects = projects.filter(p =>
        p.status === 'in-progress' || p.status === 'not-started'
      );

      // Conta peças com estoque baixo ou zerado
      const lowStockParts = parts.filter(p =>
        p.status === 'low-stock' || p.status === 'out-of-stock'
      );

      // Calcula valor total do estoque
      const totalValue = parts.reduce((sum, part) =>
        sum + (part.current_stock * part.unit_price), 0
      );

      // Soma receitas pagas do mês
      const monthlyRevenue = revenue
        .filter(r => r.payment_status === 'paid')
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        totalClients: clients.length,
        inProgressProjects: inProgressProjects.length,
        lowStockParts: lowStockParts.length,
        monthlyRevenue,
        totalValue
      };
    } catch (error) {
      // Se der erro, retorna valores zerados
      return {
        totalClients: 0,
        inProgressProjects: 0,
        lowStockParts: 0,
        monthlyRevenue: 0,
        totalValue: 0
      };
    }
  },

  // ========================================
  // VERIFICAÇÃO DE SAÚDE DO SISTEMA
  // ========================================

  /**
   * Verifica se tudo está funcionando
   * Testa conexão e todas as tabelas do banco
   */
  async healthCheck(): Promise<{
    connection: boolean;           // Se conectou ao banco
    tables: Record<string, boolean>; // Status de cada tabela
    errors: string[];              // Lista de erros encontrados
  }> {
    const result = {
      connection: false,
      tables: {} as Record<string, boolean>,
      errors: [] as string[]
    };

    try {
      // Testa a conexão com o banco
      result.connection = await this.testConnection();

      if (!result.connection) {
        result.errors.push('Failed to connect to Supabase');
        return result;
      }

      // Lista de todas as tabelas que devem existir
      const tables = ['clients', 'vehicles', 'servicos', 'servico_etapas', 'parts', 'client_parts', 'servico_pecas', 'schedules', 'orcamentos', 'revenue_records'];

      // Testa cada tabela individualmente
      for (const table of tables) {
        try {
          // Tenta fazer uma busca simples na tabela
          const { error } = await supabase
            .from(table)
            .select('count')
            .limit(1);

          // Se não deu erro, a tabela está OK
          result.tables[table] = !error;
          if (error) {
            result.errors.push(`Table ${table}: ${error.message}`);
          }
        } catch (error: any) {
          result.tables[table] = false;
          result.errors.push(`Table ${table}: ${error.message}`);
        }
      }

    } catch (error: any) {
      result.errors.push(`Health check failed: ${error.message}`);
    }

    return result;
  }
};
