/**
 * Regras de negócio do PDCO — funções puras, sem I/O. Cópia estrutural de
 * gestao-api/src/app/modules/pdco/domain/pdco.rules.ts, sem as funções de
 * escopo por usuário (planoVisivelParaUsuario/usuarioPodeEditarPlano): esta
 * versão não tem login, sempre mostra todos os planos.
 */
import type { AcaoPdco, AcompanhamentoBruto, QuadranteAcompanhamento, ResumoAcoesPdco } from '../schemas';

const STATUS_CONCLUIDO = 'concluído';
const STATUS_CANCELADO = 'cancelado';

/** Percentual de execução do plano: concluídas / ações ativas (canceladas ficam fora). Sem ações ativas, null (não zero). */
export function calcularExecucao(acoes: Pick<AcaoPdco, 'status'>[]): number | null {
  const ativas = acoes.filter((acao) => normalizar(acao.status) !== STATUS_CANCELADO);
  if (ativas.length === 0) return null;
  const concluidas = ativas.filter((acao) => normalizar(acao.status) === STATUS_CONCLUIDO).length;
  return concluidas / ativas.length;
}

/** Resumo de ações para os cards de listagem (badge RAG no frontend). */
export function calcularResumoAcoes(acoes: Pick<AcaoPdco, 'status' | 'prazo_final'>[], hoje = new Date()): ResumoAcoesPdco {
  const ativas = acoes.filter((acao) => normalizar(acao.status) !== STATUS_CANCELADO);
  const concluidas = ativas.filter((acao) => normalizar(acao.status) === STATUS_CONCLUIDO).length;
  const atrasadas = ativas.filter((acao) => {
    if (normalizar(acao.status) === STATUS_CONCLUIDO) return false;
    if (!acao.prazo_final) return false;
    return new Date(acao.prazo_final) < hoje;
  }).length;

  return { total: ativas.length, concluidas, atrasadas };
}

/** Janela de 8 meses de acompanhamento a partir do início do plano. */
export function montarJanelaAcompanhamento(
  dataInicioPlano: Date | null,
  acompanhamentos: AcompanhamentoBruto[],
): QuadranteAcompanhamento[] {
  if (!dataInicioPlano) return [];

  const quadrantes: QuadranteAcompanhamento[] = [];
  for (let indice = 0; indice < 8; indice++) {
    const referencia = new Date(dataInicioPlano.getFullYear(), dataInicioPlano.getMonth() + indice, 1);
    quadrantes.push({
      mes: indice + 1,
      ano: referencia.getFullYear(),
      mes_referencia: referencia.getMonth() + 1,
      registros: [],
    });
  }

  for (const acompanhamento of acompanhamentos) {
    if (!acompanhamento.data) continue;
    const indice = diferencaEmMeses(dataInicioPlano, acompanhamento.data);
    if (indice < 0 || indice >= quadrantes.length) continue;
    quadrantes[indice].registros.push({
      texto: acompanhamento.texto,
      data: acompanhamento.data.toISOString().slice(0, 10),
      origem: acompanhamento.origem,
    });
  }

  return quadrantes;
}

function diferencaEmMeses(inicio: Date, data: Date): number {
  return (data.getFullYear() - inicio.getFullYear()) * 12 + (data.getMonth() - inicio.getMonth());
}

function normalizar(valor: string | null | undefined): string {
  return (valor || '').trim().toLowerCase();
}
