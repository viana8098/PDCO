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

export interface ResumoAcompanhamentosPdco {
  /** Quantidade de acompanhamentos datados do plano (plano + ações), em qualquer data. */
  total: number;
  /** Data (yyyy-mm-dd) do acompanhamento mais recente; null se não há nenhum. */
  ultimo: string | null;
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
  resumo_acompanhamentos: ResumoAcompanhamentosPdco | null;
}

export interface AcaoPdco {
  cd_acao: string;
  nome: string;
  /** Descrição da ação (`ds_porqueacao` do dw); null quando não cadastrada. */
  descricao: string | null;
  status: string;
  prazo_inicial: string | null;
  prazo_final: string | null;
  /** Data real de conclusão (`dt_fimrealacao` do dw) — só existe para ações concluídas. */
  data_conclusao: string | null;
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

/** Registro de acompanhamento sem a janela de 8 meses — inclui a ação de origem, quando houver. */
export interface RegistroAcompanhamentoPlano extends RegistroAcompanhamento {
  cd_acao: string | null;
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
  /** Todos os acompanhamentos do plano (sem recorte de janela) — base da página Evolução Mensal. */
  registros_acompanhamento: RegistroAcompanhamentoPlano[];
  indicadores: IndicadorPdco[];
  registro: RegistroQualitativo;
  /** Sempre false — sem backend real, "Salvar registros" não persiste (ver frontend-pdco). */
  pode_editar: boolean;
}

export interface PlanoComAcoes {
  plano: PlanoPdco;
  acoes: AcaoPdco[];
}
