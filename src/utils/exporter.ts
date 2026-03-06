import { Atividade } from '../services/atividades.service.js';
import PDFDocument from 'pdfkit';

export type ExportFormat = 'json' | 'csv' | 'pdf';

/**
 * Exporta atividades para JSON
 */
export function exportToJSON(atividades: Atividade[]): string {
  return JSON.stringify(atividades, null, 2);
}

/**
 * Exporta atividades para CSV
 */
export function exportToCSV(atividades: Atividade[]): string {
  if (atividades.length === 0) {
    return 'Nenhuma atividade encontrada';
  }

  // Cabeçalho do CSV
  const headers = ['ID', 'Data', 'Categoria', 'Descrição', 'Importante', 'Finalizada', 'Ordem', 'Criado em', 'Atualizado em'];
  const csvLines = [headers.join(',')];

  // Adicionar dados
  atividades.forEach(atividade => {
    const line = [
      atividade.id,
      atividade.data || '',
      `"${(atividade.categoria || '').replace(/"/g, '""')}"`,
      `"${(atividade.descricao || '').replace(/"/g, '""')}"`,
      atividade.importante ? 'Sim' : 'Não',
      atividade.finalizada ? 'Sim' : 'Não',
      atividade.ordem || 0,
      atividade.created_at ? new Date(atividade.created_at).toLocaleString('pt-BR') : '',
      atividade.updated_at ? new Date(atividade.updated_at).toLocaleString('pt-BR') : ''
    ];
    csvLines.push(line.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Exporta atividades para PDF
 */
export function exportToPDF(atividades: Atividade[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(20)
         .fillColor('#4F46E5')
         .text('Kard - Relatório de Atividades', { align: 'center' })
         .moveDown();

      doc.fontSize(10)
         .fillColor('#64748B')
         .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, { align: 'center' })
         .text(`Total de atividades: ${atividades.length}`, { align: 'center' })
         .moveDown(2);

      if (atividades.length === 0) {
        doc.fontSize(12)
           .fillColor('#64748B')
           .text('Nenhuma atividade encontrada', { align: 'center' });
      } else {
        // Estatísticas
        const concluidas = atividades.filter(a => a.finalizada).length;
        const importantes = atividades.filter(a => a.importante).length;

        doc.fontSize(12)
           .fillColor('#1E293B')
           .text('Estatísticas:', { underline: true })
           .moveDown(0.5);

        doc.fontSize(10)
           .text(`• Concluídas: ${concluidas} (${((concluidas / atividades.length) * 100).toFixed(1)}%)`)
           .text(`• Pendentes: ${atividades.length - concluidas}`)
           .text(`• Importantes: ${importantes}`)
           .moveDown(2);

        // Listar atividades
        doc.fontSize(12)
           .fillColor('#1E293B')
           .text('Atividades:', { underline: true })
           .moveDown(0.5);

        atividades.forEach((atividade, index) => {
          // Verifica se precisa adicionar nova página
          if (doc.y > 700) {
            doc.addPage();
          }

          // Status
          const statusIcon = atividade.finalizada ? '✓' : '○';
          const prioridadeIcon = atividade.importante ? '★' : '';

          doc.fontSize(11)
             .fillColor('#1E293B')
             .text(`${index + 1}. ${statusIcon} ${prioridadeIcon}`, { continued: true })
             .fillColor(atividade.finalizada ? '#10B981' : '#64748B')
             .text(` ${atividade.descricao || 'Sem descrição'}`);

          doc.fontSize(9)
             .fillColor('#64748B')
             .text(`   Categoria: ${atividade.categoria || 'Sem categoria'}`, { indent: 20 });

          if (atividade.data) {
            doc.text(`   Data: ${atividade.data}`, { indent: 20 });
          }

          doc.moveDown(0.5);
        });
      }

      // Rodapé
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8)
           .fillColor('#94A3B8')
           .text(
             `Página ${i + 1} de ${pages.count}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Valida o formato de exportação
 */
export function isValidExportFormat(format: string): format is ExportFormat {
  return ['json', 'csv', 'pdf'].includes(format);
}

/**
 * Obtém o Content-Type baseado no formato
 */
export function getContentType(format: ExportFormat): string {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    pdf: 'application/pdf'
  };
  return contentTypes[format];
}

/**
 * Obtém o nome do arquivo baseado no formato
 */
export function getFileName(format: ExportFormat): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `atividades-${timestamp}.${format}`;
}