/**
 * Monta as respostas do PDCO. Cópia estrutural de
 * gestao-api/src/app/modules/pdco/services/pdco.service.ts, sem o escopo
 * por usuário — esta versão não tem login, sempre mostra todos os planos
 * (equivalente ao que o módulo original chama de "administrador").
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  calcularExecucao,
  calcularResumoAcoes,
  listarRegistrosAcompanhamento,
  montarJanelaAcompanhamento,
} from '../domain/pdco.rules';
import { PLANO_REPOSITORY, type Cache, type PlanoRepository } from '../repositories/types';
import type { DetalhePlanoPdco, FiltrosPdco, OpcaoFiltro, PlanoPdco } from '../schemas';

export interface FiltroPlanos {
  plano?: string | null;
  acao?: string | null;
  area?: string | null;
}

@Injectable()
export class PdcoService {
  @Inject(PLANO_REPOSITORY) private readonly repository: PlanoRepository;

  private cachePromise: Promise<Cache> | null = null;

  public async filtros(): Promise<FiltrosPdco> {
    const cache = await this.obterCache();

    const planos: OpcaoFiltro[] = [...cache.planos.values()]
      .map(({ plano }) => ({ valor: plano.cd_planoacao, rotulo: rotuloPlano(plano) }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo));

    const areas = new Map<string, string>();
    const acoes = new Map<string, string>();
    for (const { plano, acoes: acoesDoPlano } of cache.planos.values()) {
      if (plano.area_nome) areas.set(plano.area_nome, plano.area_nome);
      for (const acao of acoesDoPlano) {
        if (acao.nome) acoes.set(acao.nome, acao.nome);
      }
    }

    return { planos, areas: ordenarOpcoes(areas), acoes: ordenarOpcoes(acoes), administrador: true };
  }

  public async listarPlanos(filtro: FiltroPlanos = {}): Promise<PlanoPdco[]> {
    const cache = await this.obterCache();

    const planos: PlanoPdco[] = [];
    for (const { plano, acoes } of cache.planos.values()) {
      if (filtro.plano && plano.cd_planoacao !== filtro.plano) continue;
      if (filtro.area && plano.area_nome !== filtro.area) continue;
      if (filtro.acao && !acoes.some((acao) => acao.nome === filtro.acao)) continue;

      planos.push({ ...plano, execucao: calcularExecucao(acoes), resumo_acoes: calcularResumoAcoes(acoes) });
    }

    return planos.sort((a, b) => (a.area_nome ?? '').localeCompare(b.area_nome ?? ''));
  }

  public async detalharPlano(cdPlanoAcao: string): Promise<DetalhePlanoPdco> {
    const cache = await this.obterCache();
    const encontrado = cache.planos.get(cdPlanoAcao);
    if (!encontrado) {
      throw new NotFoundException('Plano não encontrado.');
    }

    const { plano, acoes } = encontrado;
    const acompanhamentosBrutos = cache.acompanhamentos.get(cdPlanoAcao) ?? [];
    const dataInicio = plano.data_inicio ? new Date(plano.data_inicio) : null;

    return {
      plano: { ...plano, execucao: calcularExecucao(acoes), resumo_acoes: calcularResumoAcoes(acoes) },
      acoes,
      acompanhamento: montarJanelaAcompanhamento(dataInicio, acompanhamentosBrutos),
      registros_acompanhamento: listarRegistrosAcompanhamento(acompanhamentosBrutos),
      // Indicadores/KR: best-effort no módulo original (sem chave confirmada com o dw) — sempre vazio aqui também.
      indicadores: [],
      // Sem backend real no deploy estático: registro qualitativo é sempre somente-leitura.
      registro: {
        pontos_criticos: null,
        fatores_sucesso: null,
        itens_fora_escopo: null,
        atualizado_por: null,
        atualizado_em: null,
      },
      pode_editar: false,
    };
  }

  /** Carrega o dw uma única vez por execução — o script de snapshot faz muitas chamadas seguidas. */
  private obterCache(): Promise<Cache> {
    if (!this.cachePromise) {
      this.cachePromise = this.repository.carregarCache().catch((erro) => {
        this.cachePromise = null;
        throw erro;
      });
    }
    return this.cachePromise;
  }
}

function rotuloPlano(plano: PlanoPdco): string {
  const resumo = (plano.arquetipos_culturais || '').trim();
  const base = plano.area_nome ? `${plano.area_nome} — ` : '';
  return resumo ? `${base}${truncar(resumo, 80)}` : `${base}Plano ${plano.cd_planoacao}`;
}

function truncar(texto: string, tamanho: number): string {
  return texto.length > tamanho ? `${texto.slice(0, tamanho - 1)}…` : texto;
}

function ordenarOpcoes(mapa: Map<string, string>): OpcaoFiltro[] {
  return [...mapa.values()].sort((a, b) => a.localeCompare(b)).map((valor) => ({ valor, rotulo: valor }));
}
