/**
 * Consultas do PDCO — cópia 1:1 de
 * gestao-api/src/app/modules/pdco/constants/pdco.sql.queries.ts (sem
 * REGISTRO_POR_PLANO/SALVAR_REGISTRO: esta versão não escreve em banco
 * nenhum).
 */

const FILTRO_SUBTIPO_PDCO = `(
      ds_subtipoacao LIKE N'%PDCO%Tático%Área%'
   OR ds_subtipoacao LIKE N'%PDCO%Estratégico%Transversal%'
)`;

export const PLANOS_E_ACOES = `
  SELECT DISTINCT
      cd_planoacao, ds_subtipoacao, st_planoacao,
      ds_oqueplanoacao, ds_porqueplanoacao,
      cd_unidadeplano, ds_unidadeplano,
      ds_loginrquemplanoacao,
      dt_inicioplanoacao, dt_fimplanoacao, dt_inicioprevistaplanoacao, dt_fimprevistaplanoacao,
      cd_acao, ds_oqueacao, ds_porqueacao, st_acao,
      dt_inicioprevistaacao, dt_fimprevistaacao, dt_iniciorealacao, dt_fimrealacao, ds_loginrquemacao
  FROM dw.fato_planejamento_planodeacao
  WHERE ${FILTRO_SUBTIPO_PDCO}
    AND cd_planoacao IS NOT NULL
`;

/** Carimbo da última carga do dw (`dt_carga`) nos planos PDCO — a data de atualização do snapshot. */
export const ULTIMA_CARGA = `
  SELECT MAX(dt_carga) AS ultima_carga
  FROM dw.fato_planejamento_planodeacao
  WHERE ${FILTRO_SUBTIPO_PDCO}
`;

export const ACOMPANHAMENTOS = `
  SELECT DISTINCT
      cd_planoacao, cd_acao,
      ds_acompanhamentoplanoacao, dt_inclusaoacompanhamentoplanoacao,
      ds_acompanhamentoacao, dt_inclusaoacompanhamentoacao
  FROM dw.fato_planejamento_acompanhamentosplanodeacao
  WHERE cd_planoacao IN :planos
    AND (ds_acompanhamentoplanoacao IS NOT NULL OR ds_acompanhamentoacao IS NOT NULL)
`;
