/** Rotas do painel do PDCO. Baseado em controllers/presidente.controller.ts. */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { PdcoService } from '../services/pdco.service';
import type { DetalhePlanoPdco, FiltrosPdco, PlanoPdco } from '../schemas';

@Controller('api/pdco')
export class PdcoController {
  constructor(private readonly service: PdcoService) {}

  /** Valores dos filtros (Plano / Ação / Área). */
  @Get('filtros')
  filtros(): Promise<FiltrosPdco> {
    return this.service.filtros();
  }

  /** Lista de planos (com execução e resumo de ações calculados). */
  @Get()
  listar(
    @Query('plano') plano?: string,
    @Query('acao') acao?: string,
    @Query('area') area?: string,
  ): Promise<PlanoPdco[]> {
    return this.service.listarPlanos({ plano: plano || null, acao: acao || null, area: area || null });
  }

  /** Detalhe completo de um plano: info, ações, acompanhamento mensal e registro (somente-leitura). */
  @Get(':cdPlanoAcao')
  detalhar(@Param('cdPlanoAcao') cdPlanoAcao: string): Promise<DetalhePlanoPdco> {
    return this.service.detalharPlano(cdPlanoAcao);
  }
}
