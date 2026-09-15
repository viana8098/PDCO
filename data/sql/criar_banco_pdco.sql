-- ============================================================================
-- Tabela própria do PDCO (Painel de Cultura Organizacional).
-- Vive no banco dedicado `aplicacaopdco` (SQLSERV02\SQL01_I2) — diferente do
-- PPR/PRESIDENTE, que compartilham `aplicacaopprprod`.
-- Script idempotente: não recria nem apaga tabela se já existir.
-- ============================================================================

USE aplicacaopdco;
GO

-- Campos qualitativos abertos por plano: pontos críticos, fatores de sucesso
-- e itens fora do escopo. Uma linha por plano — cada gravação sobrescreve o
-- valor anterior (sem histórico de versões, igual às customizações do PPR).
-- Editável pelo gestor responsável pelo plano (ds_loginrquemplanoacao no dw)
-- ou por um administrador (data/acessos.json).
IF NOT EXISTS (
    SELECT 1 FROM sys.tables t
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = 'dbo' AND t.name = 'pdco_registro'
)
BEGIN
    CREATE TABLE dbo.pdco_registro (
        cd_planoacao         NVARCHAR(50)   NOT NULL PRIMARY KEY,
        ds_pontos_criticos   NVARCHAR(MAX)  NULL,
        ds_fatores_sucesso   NVARCHAR(MAX)  NULL,
        ds_itens_fora_escopo NVARCHAR(MAX)  NULL,
        cd_usuarioalteracao  NVARCHAR(255)  NULL,
        dt_alteracao         DATETIME2      NOT NULL DEFAULT SYSDATETIME()
    );

    EXEC sys.sp_addextendedproperty @name = N'MS_Description',
        @value = N'Registro qualitativo do PDCO por plano de ação: pontos críticos, fatores de sucesso e itens fora do escopo, preenchidos pelo gestor responsável ou por um administrador. cd_planoacao referencia dw.fato_planejamento_planodeacao (fonte externa, sem FK física — bancos diferentes).',
        @level0type = N'SCHEMA', @level0name = 'dbo',
        @level1type = N'TABLE',  @level1name = 'pdco_registro';

    PRINT 'Tabela dbo.pdco_registro criada com sucesso.';
END
ELSE
BEGIN
    PRINT 'Tabela dbo.pdco_registro já existe — nada foi alterado.';
END
GO
