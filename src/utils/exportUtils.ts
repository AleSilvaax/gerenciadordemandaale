import { Service } from '@/types/serviceTypes';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função para exportar dados para CSV
export const exportToCSV = (services: Service[], filename: string = 'demandas'): void => {
  try {
    console.log('[EXPORT] Exportando', services.length, 'serviços para CSV');
    
    // Cabeçalhos das colunas
    const headers = [
      'Número',
      'Título',
      'Cliente',
      'Localização',
      'Status',
      'Prioridade',
      'Tipo de Serviço',
      'Técnico',
      'Data de Criação',
      'Data de Vencimento',
      'Descrição'
    ];

    // Converter dados para CSV
    const csvData = services.map(service => [
      service.number || '',
      service.title || '',
      service.client || '',
      service.location || '',
      service.status || '',
      service.priority || '',
      service.serviceType || '',
      service.technician?.name || 'Não atribuído',
      service.creationDate ? format(new Date(service.creationDate), 'dd/MM/yyyy', { locale: ptBR }) : '',
      service.dueDate ? format(new Date(service.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : '',
      service.description || ''
    ]);

    // Juntar cabeçalhos e dados
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => 
        // Escapar aspas e adicionar aspas se necessário
        `"${String(field).replace(/"/g, '""')}"`
      ).join(','))
      .join('\n');

    // Criar e baixar arquivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${services.length} demandas exportadas para CSV!`);
    console.log('[EXPORT] CSV gerado com sucesso');
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar CSV:', error);
    toast.error('Erro ao exportar arquivo CSV');
  }
};

// Função para exportar dados para Excel (formato CSV compatível)
export const exportToExcel = (services: Service[], filename: string = 'demandas'): void => {
  try {
    console.log('[EXPORT] Exportando', services.length, 'serviços para Excel');
    
    // Cabeçalhos mais detalhados para Excel
    const headers = [
      'Número da OS',
      'Título da Demanda',
      'Cliente',
      'Localização',
      'Endereço',
      'Cidade',
      'Status',
      'Prioridade',
      'Tipo de Serviço',
      'Técnico Responsável',
      'Data de Criação',
      'Data de Vencimento',
      'Data de Conclusão',
      'Descrição',
      'Observações',
      'Total de Fotos',
      'Total de Mensagens'
    ];

    // Converter dados para formato Excel
    const excelData = services.map(service => [
      service.number || '',
      service.title || '',
      service.client || '',
      service.location || '',
      service.address || '',
      service.city || '',
      service.status || '',
      service.priority || '',
      service.serviceType || '',
      service.technician?.name || 'Não atribuído',
      service.creationDate ? format(new Date(service.creationDate), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
      service.dueDate ? format(new Date(service.dueDate), 'dd/MM/yyyy', { locale: ptBR }) : '',
      service.date ? format(new Date(service.date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '',
      service.description || '',
      service.notes || '',
      service.photos?.length || 0,
      service.messages?.length || 0
    ]);

    // Juntar cabeçalhos e dados
    const csvContent = [headers, ...excelData]
      .map(row => row.map(field => 
        `"${String(field).replace(/"/g, '""')}"`
      ).join(','))
      .join('\n');

    // Criar e baixar arquivo Excel (CSV)
    const BOM = '\uFEFF'; // Byte Order Mark para UTF-8
    const blob = new Blob([BOM + csvContent], { 
      type: 'application/vnd.ms-excel;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${services.length} demandas exportadas para Excel!`);
    console.log('[EXPORT] Excel gerado com sucesso');
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar Excel:', error);
    toast.error('Erro ao exportar arquivo Excel');
  }
};

// Função para exportar estatísticas resumidas
export const exportStatistics = (services: Service[], filename: string = 'estatisticas'): void => {
  try {
    console.log('[EXPORT] Exportando estatísticas dos serviços');
    
    // Calcular estatísticas
    const total = services.length;
    const completed = services.filter(s => s.status === 'concluido').length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const cancelled = services.filter(s => s.status === 'cancelado').length;
    
    const highPriority = services.filter(s => s.priority === 'alta').length;
    const mediumPriority = services.filter(s => s.priority === 'media').length;
    const lowPriority = services.filter(s => s.priority === 'baixa').length;
    
    // Contar por tipo de serviço
    const serviceTypeCounts = services.reduce((acc, service) => {
      const type = service.serviceType || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contar por técnico
    const technicianCounts = services.reduce((acc, service) => {
      const techName = service.technician?.name || 'Não atribuído';
      acc[techName] = (acc[techName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Criar dados para exportação
    const statisticsData = [
      ['RELATÓRIO DE ESTATÍSTICAS'],
      [`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`],
      [''],
      ['RESUMO GERAL'],
      ['Total de Demandas', total.toString()],
      ['Concluídas', completed.toString()],
      ['Pendentes', pending.toString()],
      ['Canceladas', cancelled.toString()],
      ['Taxa de Conclusão', `${total > 0 ? Math.round((completed / total) * 100) : 0}%`],
      [''],
      ['DISTRIBUIÇÃO POR PRIORIDADE'],
      ['Alta Prioridade', highPriority.toString()],
      ['Média Prioridade', mediumPriority.toString()],
      ['Baixa Prioridade', lowPriority.toString()],
      [''],
      ['DISTRIBUIÇÃO POR TIPO DE SERVIÇO'],
      ...Object.entries(serviceTypeCounts).map(([type, count]) => [type, count.toString()]),
      [''],
      ['DISTRIBUIÇÃO POR TÉCNICO'],
      ...Object.entries(technicianCounts).map(([tech, count]) => [tech, count.toString()])
    ];

    // Converter para CSV
    const csvContent = statisticsData
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Criar e baixar arquivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Relatório de estatísticas exportado!');
    console.log('[EXPORT] Estatísticas exportadas com sucesso');
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar estatísticas:', error);
    toast.error('Erro ao exportar estatísticas');
  }
};