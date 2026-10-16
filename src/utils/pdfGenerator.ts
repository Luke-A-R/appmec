/**
 * =====================================================
 * PDFGENERATOR.TS - GERADOR DE DOCUMENTOS PDF
 * =====================================================
 *
 * Este arquivo é responsável por CRIAR ARQUIVOS PDF.
 * Ele gera documentos profissionais que podem ser:
 * - Propostas de serviço (orçamentos para clientes)
 * - Listas de peças (o que o cliente precisa trazer)
 * - Relatórios de serviço (o que foi feito)
 *
 * COMO FUNCIONA:
 * Usa uma biblioteca chamada jsPDF para criar o PDF.
 * O PDF é gerado no navegador e baixado automaticamente.
 *
 * DOCUMENTOS GERADOS:
 * 1. Proposta de Serviço - Orçamento detalhado para o cliente
 * 2. Lista de Peças - Peças que o cliente precisa trouxer
 * 3. Relatório de Serviço - Resumo do que foi feito
 */

import jsPDF from 'jspdf';

// ========================================
// DEFINIÇÃO DOS TIPOS DE DADOS
// ========================================

/**
 * Dados para criar uma Proposta de Serviço
 * Este é o orçamento que vai para o cliente
 */

export interface EmpresaData {
  nome: string;
  telefone?: string;
  email: string;
  logo_url?: string;
}


export interface EmpresaData {
  nome: string;
  telefone?: string;
  email: string;
  logo_url?: string;
}

interface ServiceProposalData {
  empresa: EmpresaData;
  empresa: EmpresaData;
  client: any;              // Dados do cliente
  vehicle: any;             // Dados do veículo
  services: string[];       // Lista de serviços que serão feitos
  parts?: string[];         // Peças que serão trocadas (opcional)
  estimatedPrice: number;   // Preço total estimado
  estimatedDuration: string; // Tempo estimado (ex: "3 dias")
  terms: string[];          // Termos e condições do serviço
}

/**
 * Dados para criar uma Lista de Peças
 *Documento que lista o que o cliente precisa trazer
 */
interface PartsListData {
  empresa: EmpresaData;
  empresa: EmpresaData;
  client: any;              // Dados do cliente
  vehicle: any;             // Dados do veículo
  parts: string[];          // Lista de peças necessárias
  notes?: string;           // Observações adicionais
}

/**
 * Dados para criar um Relatório de Serviço
 * Documento que mostra o que foi feito no serviço
 */
interface ProjectReportData {
  empresa: EmpresaData;
  empresa: EmpresaData;
  project: any;                 // Dados do projeto/serviço
  steps: any[];                 // Lista de etapas do serviço
  completedSteps: number;       // Quantas etapas foram concluídas
  totalSteps: number;           // Total de etapas
  totalEstimatedHours: number;  // Horas que eram previstas
  totalActualHours: number;     // Horas que foram gastas
  totalDaysWorked: number;      // Dias trabalhados
}

// ========================================
// FUNÇÕES AUXILIARES DE ESTILO
// ========================================

/**
 * Adiciona o cabeçalho profissional em todas as páginas
 * Inclui logo, nome da empresa e título do documento
 * @returns Posição Y após o cabeçalho (para continuar escrevendo)
 */
const addProfessionalHeader = (doc: jsPDF, title: string, empresa: EmpresaData) => {
  const pageWidth = doc.internal.pageSize.width;

  // ===== FUNDO DO CABEÇALHO =====
  // Retângulo cinza escuro no topo
  doc.setFillColor(30, 41, 59); // gray-800
  doc.rect(0, 0, pageWidth, 40, 'F');

  // ===== LOGO/ÍCONE =====
  // Quadrado azul que simula o logo
  doc.setFillColor(59, 130, 246); // blue-500
  doc.rect(20, 10, 8, 20, 'F');

  // ===== NOME DA EMPRESA =====
  doc.setTextColor(255, 255, 255); // Branco
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(empresa.nome || 'Oficina Mecânica', 35, 22);

  // Subtítulo
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestão Automotiva Profissional', 35, 28);

  // ===== TÍTULO DO DOCUMENTO =====
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - 20, 22, { align: 'right' });

  // Reseta fonte e cor para o normal
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  return 50; // Retorna posição Y onde o conteúdo pode começar
};

/**
 * Adiciona rodapé profissional em todas as páginas
 * Inclui informações de contato e data de geração
 */
const addProfessionalFooter = (doc: jsPDF, empresa: EmpresaData) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Linha separadora
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

  // Texto do rodapé
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // gray-500

  // Três linhas de informação
  const footerText = [
    `${empresa.nome || 'Oficina Mecânica'} - Oficina Especializada`,
    `Email: ${empresa.email || 'Não informado'} | Telefone: ${empresa.telefone || 'Não informado'}`,
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`
  ];

  // Centraliza cada linha
  footerText.forEach((text, index) => {
    doc.text(text, pageWidth / 2, pageHeight - 18 + (index * 4), { align: 'center' });
  });
};

/**
 * Adiciona uma seção com título estilizado
 * Usado para separar partes do documento
 * @returns Posição Y após a seção
 */
const addSection = (doc: jsPDF, title: string, yPosition: number) => {
  const pageWidth = doc.internal.pageSize.width;

  // Fundo cinza claro para a seção
  doc.setFillColor(249, 250, 251); // gray-50
  doc.rect(20, yPosition - 2, pageWidth - 40, 12, 'F');

  // Título da seção
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55); // gray-800
  doc.text(title, 25, yPosition + 6);

  // Linha azul abaixo do título
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(2);
  doc.line(25, yPosition + 8, pageWidth - 25, yPosition + 8);

  // Reseta fonte para normal
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  return yPosition + 15; // Retorna próxima posição Y
};

// ========================================
// FUNÇÃO: GERAR PROPOSTA DE SERVIÇO
// ========================================

/**
 * Gera um PDF com a proposta de serviço (orçamento)
 * Este documento vai para o cliente assinar
 *
 * @param data - Dados da proposta
 * @returns Nome do arquivo gerado
 */
export const generateServiceProposal = async (data: ServiceProposalData) => {
  // Cria um novo documento PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // ===== CABEÇALHO =====
  let yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO', data.empresa);
  yPosition += 10;

  // ===== NÚMERO E DATA =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // blue-500
  doc.text(`Proposta Nº: ${Date.now().toString().slice(-6)}`, 20, yPosition);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, yPosition, { align: 'right' });

  yPosition += 15;

  // ===== SEÇÃO: DADOS DO CLIENTE =====
  yPosition = addSection(doc, 'DADOS DO CLIENTE', yPosition);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81); // gray-700

  // Informações do cliente
  const clientInfo = [
    `Nome: ${data.client.name}`,
    `Email: ${data.client.email}`,
    `Telefone: ${data.client.phone}`
  ];

  clientInfo.forEach((info, index) => {
    doc.text(info, 25, yPosition + (index * 6));
  });

  yPosition += 25;

  // ===== SEÇÃO: DADOS DO VEÍCULO =====
  yPosition = addSection(doc, 'DADOS DO VEÍCULO', yPosition);

  // Informações do veículo
  const vehicleInfo = [
    `Veículo: ${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year}`,
    data.vehicle.color ? `Cor: ${data.vehicle.color}` : '',
    data.vehicle.license_plate ? `Placa: ${data.vehicle.license_plate}` : ''
  ].filter(Boolean); // Remove strings vazias

  vehicleInfo.forEach((info, index) => {
    doc.text(info, 25, yPosition + (index * 6));
  });

  yPosition += Math.max(vehicleInfo.length * 6, 18) + 10;

  // ===== SEÇÃO: SERVIÇOS PROPOSTOS =====
  yPosition = addSection(doc, 'SERVIÇOS PROPOSTOS', yPosition);

  // Lista cada serviço
  data.services.forEach((service, index) => {
    // Verifica se precisa de nova página
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
      yPosition += 20;
    }

    // Bolinha azul como marcador
    doc.setFillColor(59, 130, 246);
    doc.circle(28, yPosition + 3, 1.5, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(service, 35, yPosition + 5);
    yPosition += 8;
  });

  yPosition += 10;

  // ===== SEÇÃO: PEÇAS (se houver) =====
  if (data.parts && data.parts.length > 0) {
    // Verifica se precisa de nova página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
      yPosition += 20;
    }

    yPosition = addSection(doc, 'PEÇAS A SEREM TROCADAS', yPosition);

    // Lista cada peça
    data.parts.forEach((part, index) => {
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
        yPosition += 20;
      }

      // Bolinha roxa como marcador
      doc.setFillColor(168, 85, 247); // purple-500
      doc.circle(28, yPosition + 3, 1.5, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(part, 35, yPosition + 5);
      yPosition += 8;
    });

    yPosition += 10;
  }

  // ===== SEÇÃO: VALORES E CONDIÇÕES =====
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'VALORES E CONDIÇÕES', yPosition);

  // Caixa de destaque para o preço
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(1);
  doc.rect(25, yPosition, pageWidth - 50, 25, 'FD');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // blue-500
  doc.text('VALOR TOTAL:', 30, yPosition + 10);
  doc.text(`R$ ${data.estimatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 30, yPosition + 10, { align: 'right' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text(`Prazo Estimado: ${data.estimatedDuration}`, 30, yPosition + 20);

  yPosition += 35;

  // ===== SEÇÃO: TERMOS E CONDIÇÕES =====
  if (yPosition > pageHeight - 120) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'TERMOS E CONDIÇÕES', yPosition);

  // Lista cada termo
  data.terms.forEach((term, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
      yPosition += 20;
    }

    // Formata o texto (quebra linhas se muito longo)
    const termText = `${index + 1}. ${term}`;
    const lines = doc.splitTextToSize(termText, pageWidth - 50);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81); // gray-700
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 5 + 3;
  });

  yPosition += 15;

  // ===== SEÇÃO: ASSINATURA =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'PROPOSTA DE SERVIÇO (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'ACEITE E ASSINATURA', yPosition);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81); // gray-700
  doc.text('Declaro estar de acordo com os serviços e condições apresentados neste orçamento:', 25, yPosition);

  yPosition += 10;

  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text('Assinatura digital (Gov.br ou plataforma validada) ou física são aceitas.', 25, yPosition);

  yPosition += 15;

  // Linhas para assinatura
  const signatureBoxWidth = (pageWidth - 60) / 2;

  // Linha para assinatura do cliente
  doc.setDrawColor(209, 213, 219); // gray-300
  doc.setLineWidth(0.5);
  doc.line(25, yPosition + 15, 25 + signatureBoxWidth, yPosition + 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Assinatura do Cliente', 25, yPosition + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.client.name}`, 25, yPosition + 28);

  // Linha para data
  doc.line(pageWidth - 25 - signatureBoxWidth, yPosition + 15, pageWidth - 25, yPosition + 15);
  doc.setFont('helvetica', 'bold');
  doc.text('Data', pageWidth - 25 - signatureBoxWidth, yPosition + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('___/___/______', pageWidth - 25 - signatureBoxWidth, yPosition + 28);

  // ===== RODAPÉ =====
  addProfessionalFooter(doc, data.empresa);

  // Salva o PDF com nome do cliente
  const fileName = `proposta-${data.client.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(fileName);

  return fileName;
};

// ========================================
// FUNÇÃO: GERAR LISTA DE PEÇAS
// ========================================

/**
 * Gera um PDF com a lista de peças que o cliente precisa trazer
 *
 * @param data - Dados da lista
 * @returns Nome do arquivo gerado
 */
export const generatePartsListPDF = (data: PartsListData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // ===== CABEÇALHO =====
  let yPosition = addProfessionalHeader(doc, 'LISTA DE PEÇAS', data.empresa);
  yPosition += 10;

  // ===== NÚMERO E DATA =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(`Lista Nº: ${Date.now().toString().slice(-6)}`, 20, yPosition);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, yPosition, { align: 'right' });

  yPosition += 15;

  // ===== SEÇÃO: DADOS DO CLIENTE =====
  yPosition = addSection(doc, 'DADOS DO CLIENTE', yPosition);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  const clientInfo = [
    `Nome: ${data.client.name}`,
    `Email: ${data.client.email}`,
    `Telefone: ${data.client.phone}`
  ];

  clientInfo.forEach((info, index) => {
    doc.text(info, 25, yPosition + (index * 6));
  });

  yPosition += 25;

  // ===== SEÇÃO: DADOS DO VEÍCULO =====
  if (data.vehicle) {
    yPosition = addSection(doc, 'DADOS DO VEÍCULO', yPosition);

    const vehicleInfo = [
      `Veículo: ${data.vehicle.brand} ${data.vehicle.model} ${data.vehicle.year}`,
      data.vehicle.color ? `Cor: ${data.vehicle.color}` : '',
      data.vehicle.license_plate ? `Placa: ${data.vehicle.license_plate}` : ''
    ].filter(Boolean);

    vehicleInfo.forEach((info, index) => {
      doc.text(info, 25, yPosition + (index * 6));
    });

    yPosition += Math.max(vehicleInfo.length * 6, 18) + 10;
  }

  // ===== SEÇÃO: LISTA DE PEÇAS =====
  yPosition = addSection(doc, 'LISTA DE PEÇAS', yPosition);

  // Lista cada peça com numeração
  data.parts.forEach((part, index) => {
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'LISTA DE PEÇAS (cont.)', data.empresa);
      yPosition += 20;
    }

    // Bolinha roxa como marcador
    doc.setFillColor(168, 85, 247); // purple-500
    doc.circle(28, yPosition + 3, 1.5, 'F');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(`${index + 1}. ${part}`, 35, yPosition + 5);
    yPosition += 8;
  });

  yPosition += 15;

  // ===== SEÇÃO: OBSERVAÇÕES =====
  if (data.notes && data.notes.trim()) {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'LISTA DE PEÇAS (cont.)', data.empresa);
      yPosition += 20;
    }

    yPosition = addSection(doc, 'OBSERVAÇÕES', yPosition);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    const notes = doc.splitTextToSize(data.notes, pageWidth - 50);
    doc.text(notes, 25, yPosition);
    yPosition += notes.length * 5 + 15;
  }

  // ===== SEÇÃO: RESUMO =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'LISTA DE PEÇAS (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'RESUMO', yPosition);

  // Caixa de resumo
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(1);
  doc.rect(25, yPosition, pageWidth - 50, 20, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246); // blue-500
  doc.text('TOTAL DE PEÇAS:', 30, yPosition + 8);
  doc.text(`${data.parts.length} item(ns)`, pageWidth - 30, yPosition + 8, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 30, yPosition + 15);

  // ===== RODAPÉ =====
  addProfessionalFooter(doc, data.empresa);

  // Salva o PDF
  const fileName = `lista-pecas-${data.client.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(fileName);

  return fileName;
};

// ========================================
// FUNÇÃO: GERAR RELATÓRIO DE SERVIÇO
// ========================================

/**
 * Gera um PDF com o relatório completo do serviço realizado
 * Mostra o que foi feito, fotos antes/depois, e resumo financeiro
 *
 * @param data - Dados do relatório
 * @returns Nome do arquivo gerado
 */
export const generateProjectReport = (data: ProjectReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // ===== CABEÇALHO =====
  let yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS', data.empresa);
  yPosition += 10;

  // ===== NÚMERO E DATA =====
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(`Relatório Nº: ${data.project.id.slice(-8).toUpperCase()}`, 20, yPosition);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 20, yPosition, { align: 'right' });

  yPosition += 15;

  // ===== SEÇÃO: INFORMAÇÕES DO SERVIÇO =====
  yPosition = addSection(doc, 'INFORMAÇÕES DO SERVIÇO', yPosition);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);

  const projectInfo = [
    `Título: ${data.project.title}`,
    `Cliente: ${data.project.client?.name || 'N/A'}`,
    `Veículo: ${data.project.vehicle?.brand || ''} ${data.project.vehicle?.model || ''} ${data.project.vehicle?.year || ''}`,
    `Status: ${getStatusText(data.project.status)}`
  ];

  projectInfo.forEach((info, index) => {
    doc.text(info, 25, yPosition + (index * 6));
  });

  yPosition += 45;

  // ===== SEÇÃO: FOTOS DO SERVIÇO =====
  // (Se houver fotos de antes/depois cadastradas)
  if ((data.project.before_images && data.project.before_images.length > 0) ||
      (data.project.after_images && data.project.after_images.length > 0)) {

    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
      yPosition += 20;
    }

    yPosition = addSection(doc, 'FOTOS DO SERVIÇO', yPosition);

    const imageWidth = 80;
    const imageHeight = 60;
    const spacing = 10;

    // Fotos ANTES
    if (data.project.before_images && data.project.before_images.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Fotos Antes:', 25, yPosition);
      yPosition += 10;

      let xPosition = 25;
      let imagesInRow = 0;
      const maxImagesPerRow = 2;

      data.project.before_images.forEach((imageUrl: string, __index: number) => {
        if (imagesInRow >= maxImagesPerRow) {
          yPosition += imageHeight + spacing;
          xPosition = 25;
          imagesInRow = 0;

          if (yPosition > pageHeight - 100) {
            doc.addPage();
            yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
            yPosition += 20;
          }
        }

        try {
          // Adiciona imagem se for base64 válida
          if (imageUrl.startsWith('data:image/')) {
            doc.addImage(imageUrl, 'JPEG', xPosition, yPosition, imageWidth, imageHeight);
          } else {
            // Placeholder se imagem inválida
            doc.setFillColor(240, 240, 240);
            doc.rect(xPosition, yPosition, imageWidth, imageHeight, 'F');
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('Imagem não disponível', xPosition + imageWidth/2, yPosition + imageHeight/2, { align: 'center' });
          }
        } catch (_error) {
          // Fallback se der erro
          doc.setFillColor(240, 240, 240);
          doc.rect(xPosition, yPosition, imageWidth, imageHeight, 'F');
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text('Erro ao carregar imagem', xPosition + imageWidth/2, yPosition + imageHeight/2, { align: 'center' });
        }

        xPosition += imageWidth + spacing;
        imagesInRow++;
      });

      yPosition += imageHeight + spacing * 2;
    }

    // Fotos DEPOIS
    if (data.project.after_images && data.project.after_images.length > 0) {
      if (yPosition > pageHeight - 100) {
        doc.addPage();
        yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
        yPosition += 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Fotos Depois:', 25, yPosition);
      yPosition += 10;

      let xPosition = 25;
      let imagesInRow = 0;
      const maxImagesPerRow = 2;

      data.project.after_images.forEach((imageUrl: string, __index: number) => {
        if (imagesInRow >= maxImagesPerRow) {
          yPosition += imageHeight + spacing;
          xPosition = 25;
          imagesInRow = 0;

          if (yPosition > pageHeight - 100) {
            doc.addPage();
            yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
            yPosition += 20;
          }
        }

        try {
          if (imageUrl.startsWith('data:image/')) {
            doc.addImage(imageUrl, 'JPEG', xPosition, yPosition, imageWidth, imageHeight);
          } else {
            doc.setFillColor(240, 240, 240);
            doc.rect(xPosition, yPosition, imageWidth, imageHeight, 'F');
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('Imagem não disponível', xPosition + imageWidth/2, yPosition + imageHeight/2, { align: 'center' });
          }
        } catch (_error) {
          doc.setFillColor(240, 240, 240);
          doc.rect(xPosition, yPosition, imageWidth, imageHeight, 'F');
          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);
          doc.text('Erro ao carregar imagem', xPosition + imageWidth/2, yPosition + imageHeight/2, { align: 'center' });
        }

        xPosition += imageWidth + spacing;
        imagesInRow++;
      });

      yPosition += imageHeight + spacing * 2;
    }
  }

  // ===== SEÇÃO: DETALHAMENTO DOS SERVIÇOS =====
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'DETALHAMENTO DOS SERVIÇOS', yPosition);

  // Lista cada etapa do serviço
  data.steps.forEach((step, _index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
      yPosition += 20;
    }

    // Ícone de status (check ou círculo)
    const statusIcon = step.completed ? '✓' : '○';
    const statusColor = step.completed ? [34, 197, 94] : [156, 163, 175]; // verde ou cinza

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`${statusIcon} ${index + 1}. ${step.name}`, 25, yPosition);

    yPosition += 8;

    doc.setFont('helvetica', 'normal');

    // Descrição/peças da etapa
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);

    // Verifica se a descrição tem múltiplas peças (separadas por vírgula)
    const descriptionParts = step.description.split(',').map((p: string) => p.trim()).filter((p: string) => p);

    if (descriptionParts.length > 1) {
      // Mostra cada peça em linha separada
      descriptionParts.forEach((part: string) => {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
          yPosition += 20;
        }

        // Bolinha roxa
        doc.setFillColor(168, 85, 247);
        doc.circle(28, yPosition + 3, 1.5, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        doc.text(part, 35, yPosition + 5);
        yPosition += 8;
      });
    } else {
      const description = doc.splitTextToSize(step.description, pageWidth - 50);
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      doc.text(description, 30, yPosition);
      yPosition += description.length * 4 + 3;
    }

    yPosition += 4;

    // Metadados da etapa
    const metadata = [];
    if (step.responsible) metadata.push(`Responsável: ${step.responsible}`);
    if (step.actual_hours && step.actual_hours > 0) metadata.push(`Horas Trabalhadas: ${step.actual_hours}h`);
    if (step.days_worked && step.days_worked > 0) metadata.push(`Dias Trabalhados: ${step.days_worked}`);
    if (step.completed && step.completed_date) {
      metadata.push(`Concluído: ${new Date(step.completed_date).toLocaleDateString('pt-BR')}`);
    }

    if (metadata.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
        yPosition += 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(metadata.join(' • '), 30, yPosition);
      yPosition += 6;
    }

    // Observações da etapa
    if (step.notes) {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      const notes = doc.splitTextToSize(`Observações: ${step.notes}`, pageWidth - 50);
      doc.text(notes, 30, yPosition);
      yPosition += notes.length * 4;
    }

    yPosition += 8;
  });

  // ===== SEÇÃO: OBSERVAÇÕES DO SERVIÇO =====
  if ((data.project.notes && data.project.notes.trim()) ||
      (data.project.client_notes && data.project.client_notes.trim())) {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
      yPosition += 20;
    }

    yPosition = addSection(doc, 'OBSERVAÇÕES DO SERVIÇO', yPosition);

    if (data.project.client_notes && data.project.client_notes.trim()) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text('Observações do Cliente:', 25, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const clientNotes = doc.splitTextToSize(data.project.client_notes, pageWidth - 50);
      doc.text(clientNotes, 25, yPosition);
      yPosition += clientNotes.length * 5 + 8;
    }

    if (data.project.notes && data.project.notes.trim()) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
        yPosition += 20;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 41, 55);
      doc.text('Observações Internas:', 25, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      const internalNotes = doc.splitTextToSize(data.project.notes, pageWidth - 50);
      doc.text(internalNotes, 25, yPosition);
      yPosition += internalNotes.length * 5 + 10;
    }

    yPosition += 10;
  }

  // ===== SEÇÃO: RESUMO EXECUTIVO =====
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'RESUMO EXECUTIVO', yPosition);

  // Cards de resumo
  const summaryData = [
    { label: 'Serviços Concluídos', value: `${data.completedSteps}/${data.totalSteps}`, color: [34, 197, 94] },
    { label: 'Horas Trabalhadas', value: `${data.totalActualHours || 0}h`, color: [59, 130, 246] },
    { label: 'Dias Trabalhados', value: `${data.totalDaysWorked || 0}`, color: [168, 85, 247] },
    { label: 'Custo Total', value: `R$ ${data.project.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, color: [34, 197, 94] }
  ];

  const cardWidth = (pageWidth - 60) / 2;
  const cardHeight = 25;

  summaryData.forEach((item, _index) => {
    const x = 25 + (index % 2) * (cardWidth + 10);
    const y = yPosition + Math.floor(index / 2) * (cardHeight + 5);

    // Fundo do card
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.rect(x, y, cardWidth, cardHeight, 'FD');

    // Barra colorida à esquerda
    doc.setFillColor(item.color[0], item.color[1], item.color[2]);
    doc.rect(x, y, 3, cardHeight, 'F');

    // Texto
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(item.label, x + 8, y + 8);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(item.value, x + 8, y + 18);
  });

  yPosition += 60;

  // ===== SEÇÃO: RESUMO FINANCEIRO =====
  if (yPosition > pageHeight - 100) {
    doc.addPage();
    yPosition = addProfessionalHeader(doc, 'RELATÓRIO DE SERVIÇOS (cont.)', data.empresa);
    yPosition += 20;
  }

  yPosition = addSection(doc, 'RESUMO FINANCEIRO', yPosition);

  const financialData = [
    { label: 'Custo Total:', value: `R$ ${data.project.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` }
  ];

  financialData.forEach((item) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(item.label, 25, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(item.value, pageWidth - 25, yPosition, { align: 'right' });
  });

  yPosition += 15;

  // ===== RODAPÉ =====
  addProfessionalFooter(doc, data.empresa);

  // Salva o PDF
  const fileName = `relatorio-servico-${data.project.title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  doc.save(fileName);

  return fileName;
};

// ========================================
// FUNÇÕES AUXILIARES DE TEXTO
// ========================================

/**
 * Converte código de status para texto em português
 */
const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'in-progress':
      return 'Em Progresso';
    case 'not-started':
      return 'Não Iniciado';
    case 'on-hold':
      return 'Pausado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

/**
 * Converte código de prioridade para texto em português
 */
const __getPriorityText = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Urgente';
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
      return 'Baixa';
    default:
      return priority;
  }
};
