export interface Atividade {
  id: number;
  data: string;
  categoria: string;
  descricao: string;
  importante: boolean;
  finalizada: boolean;
  ordem: number,
}

export const atividades: Atividade[] = [];