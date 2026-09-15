/**
 * Contrato da camada de dados. Cópia estrutural de
 * backend-presidente/src/repositories/types.ts.
 */
import type { PlanoComAcoes } from '../schemas';

export interface Cache {
  planos: Map<string, PlanoComAcoes>;
  acompanhamentos: Map<string, import('../schemas').AcompanhamentoBruto[]>;
}

export interface PlanoRepository {
  carregarCache(): Promise<Cache>;
}

// Token de injeção — interfaces TS somem em tempo de execução.
export const PLANO_REPOSITORY = 'PLANO_REPOSITORY';
