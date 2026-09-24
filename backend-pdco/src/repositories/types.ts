/**
 * Contrato da camada de dados. Cópia estrutural de
 * backend-presidente/src/repositories/types.ts.
 */
import type { PlanoComAcoes } from '../schemas';

export interface Cache {
  planos: Map<string, PlanoComAcoes>;
  acompanhamentos: Map<string, import('../schemas').AcompanhamentoBruto[]>;
  /** Última carga (`dt_carga`) do dw por trás deste cache, yyyy-mm-ddTHH:mm:ss como no banco; nulo se não deu pra saber. */
  atualizadoEm: string | null;
}

export interface PlanoRepository {
  carregarCache(): Promise<Cache>;
}

// Token de injeção — interfaces TS somem em tempo de execução.
export const PLANO_REPOSITORY = 'PLANO_REPOSITORY';
