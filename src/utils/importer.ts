import { Atividade } from '../services/atividades.service.js';

interface ImportValidationResult {
  success: boolean;
  error?: string;
  details?: any[];
}

/**
 * Importar atividades de JSON
 */
export function importFromJSON(jsonData: string | any[]): any[] {
  try {
    let data: any[];
    
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    } else {
      data = jsonData;
    }
    
    // Se o JSON estiver no formato { data: [...] }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      data = data.data;
    }
    
    if (!Array.isArray(data)) {
      throw new Error('Formato JSON inválido. Esperado um array de atividades.');
    }
    
    return data;
  } catch (error: any) {
    throw new Error(`Erro ao processar JSON: ${error.message}`);
  }
}

/**
 * Importar atividades de CSV
 */
export function importFromCSV(csvData: string): any[] {
  try {
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('Arquivo CSV vazio ou sem dados');
    }
    
    // Ler cabeçalho
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Validar cabeçalho obrigatório
    const requiredHeaders = ['data', 'categoria', 'descricao'];
    const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`);
    }
    
    // Processar linhas
    const atividades = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      
      if (values.length !== header.length) {
        throw new Error(`Linha ${i + 1}: número de colunas não corresponde ao cabeçalho`);
      }
      
      const atividade: any = {};
      
      header.forEach((key, index) => {
        let value = values[index].trim();
        
        // Converter valores booleanos
        if (key === 'importante' || key === 'finalizada') {
          value = value.toLowerCase() === 'true' || value === '1' || value === 'sim';
        }
        
        atividade[key] = value;
      });
      
      atividades.push(atividade);
    }
    
    return atividades;
  } catch (error: any) {
    throw new Error(`Erro ao processar CSV: ${error.message}`);
  }
}

/**
 * Parser de linha CSV (lida com vírgulas dentro de aspas)
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current);
  
  return values.map(v => v.replace(/^"|"$/g, ''));
}

/**
 * Validar estrutura dos dados importados
 */
export function validateImportData(atividades: any[]): ImportValidationResult {
  if (!Array.isArray(atividades)) {
    return {
      success: false,
      error: 'Dados devem ser um array de atividades'
    };
  }
  
  if (atividades.length === 0) {
    return {
      success: false,
      error: 'Nenhuma atividade para importar'
    };
  }
  
  const errors: any[] = [];
  
  atividades.forEach((atividade, index) => {
    const lineErrors: string[] = [];
    
    // Validar campos obrigatórios
    if (!atividade.data) {
      lineErrors.push('Campo "data" é obrigatório');
    } else {
      // Validar formato de data
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(atividade.data)) {
        lineErrors.push('Campo "data" deve estar no formato YYYY-MM-DD');
      }
    }
    
    if (!atividade.categoria) {
      lineErrors.push('Campo "categoria" é obrigatório');
    }
    
    if (!atividade.descricao) {
      lineErrors.push('Campo "descricao" é obrigatório');
    }
    
    // Validar tipos
    if (atividade.importante !== undefined && typeof atividade.importante !== 'boolean') {
      lineErrors.push('Campo "importante" deve ser booleano');
    }
    
    if (atividade.finalizada !== undefined && typeof atividade.finalizada !== 'boolean') {
      lineErrors.push('Campo "finalizada" deve ser booleano');
    }
    
    if (lineErrors.length > 0) {
      errors.push({
        linha: index + 1,
        erros: lineErrors
      });
    }
  });
  
  if (errors.length > 0) {
    return {
      success: false,
      error: 'Dados inválidos encontrados',
      details: errors
    };
  }
  
  return {
    success: true
  };
}

/**
 * Gerar template CSV para importação
 */
export function generateCSVTemplate(): string {
  const headers = ['data', 'categoria', 'descricao', 'importante', 'finalizada'];
  const example = [
    '2024-01-15',
    'Trabalho',
    'Reunião com equipe',
    'true',
    'false'
  ];
  
  return `${headers.join(',')}\n${example.join(',')}`;
}

/**
 * Gerar template JSON para importação
 */
export function generateJSONTemplate(): string {
  const template = [
    {
      data: '2024-01-15',
      categoria: 'Trabalho',
      descricao: 'Reunião com equipe',
      importante: true,
      finalizada: false
    }
  ];
  
  return JSON.stringify(template, null, 2);
}