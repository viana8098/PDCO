/**
 * Contratos de request/response do PDCO. Cópia estrutural dos typings do
 * módulo original (gestao-api/src/app/modules/pdco/typings/pdco.d.ts), sem
 * os campos de acesso/edição — esta versão não tem login: sempre mostra a
 * visão consolidada (equivalente a "administrador"), e o registro
 * qualitativo é sempre somente-leitura (sem banco próprio aqui).
 */

export interface OpcaoFiltro {
  valor: string;
  rotulo: string;
}

export interface FiltrosPdco {
  planos: OpcaoFiltro[];
  acoes: OpcaoFiltro[];
  areas: OpcaoFiltro[];
  /** Sempre true — sem login, a versão web mostra a visão consolidada. */
  administrador: boolean;
}

export interface ResumoAcoesPdco {
  total: number;
  concluidas: number;
  atrasadas: number;
}

export interface PlanoPdco {
  cd_planoacao: string;
  subtipo: string;
  status: string;
  area_codigo: string | null;
  area_nome: string | null;
  responsavel: string | null;
  login_responsavel: string | null;
  arquetipos_culturais: string | null;
  resultados_esperados: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  execucao: number | null;
  resumo_acoes: ResumoAcoesPdco | null;
}

export interface AcaoPdco {
  cd_acao: string;
  nome: string;
  status: string;
  prazo_inicial: string | null;
  prazo_final: string | null;
  responsavel: string | null;
}

export interface AcompanhamentoBruto {
  texto: string;
  data: Date | null;
  origem: 'plano' | 'acao';
  cd_acao: string | null;
}

export interface RegistroAcompanhamento {
  texto: string;
  data: string;
  origem: 'plano' | 'acao';
}

export interface QuadranteAcompanhamento {
  mes: number;
  ano: number;
  mes_referencia: number;
  registros: RegistroAcompanhamento[];
}

export interface IndicadorPdco {
  cd_codigo: number;
  nome: string;
  meta: string | null;
  realizado: string | null;
}

export interface RegistroQualitativo {
  pontos_criticos: string | null;
  fatores_sucesso: string | null;
  itens_fora_escopo: string | null;
  atualizado_por: string | null;
  atualizado_em: string | null;
}

export interface DetalhePlanoPdco {
  plano: PlanoPdco;
  acoes: AcaoPdco[];
  acompanhamento: QuadranteAcompanhamento[];
  indicadores: IndicadorPdco[];
  registro: RegistroQualitativo;
  /** Sempre false — sem backend real, "Salvar registros" não persiste (ver frontend-pdco). */
  pode_editar: boolean;
}

export interface PlanoComAcoes {
  plano: PlanoPdco;
  acoes: AcaoPdco[];
}
