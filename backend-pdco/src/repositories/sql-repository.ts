/**
 * Acesso ao dw — pool do SQL Server, placeholders `:nome` resolvidos em
 * parâmetros, e as mesmas transformações do módulo original
 * (gestao-api/src/app/modules/pdco/services/pdco.repository.service.ts).
 * Só roda local, uma vez por execução do script de snapshot.
 */
import { Injectable } from '@nestjs/common';
import mssql from 'mssql';
import { settings } from '../config';
import type { AcaoPdco, AcompanhamentoBruto, PlanoPdco } from '../schemas';
import type { Cache, PlanoRepository } from './types';
import * as queries from './sql-queries';

interface PlanoAcaoRow {
  cd_planoacao: string;
  ds_subtipoacao: string;
  st_planoacao: string;
  ds_oqueplanoacao: string | null;
  ds_porqueplanoacao: string | null;
  cd_unidadeplano: string | null;
  ds_unidadeplano: string | null;
  ds_loginrquemplanoacao: string | null;
  dt_inicioplanoacao: Date | null;
  dt_fimplanoacao: Date | null;
  dt_inicioprevistaplanoacao: Date | null;
  dt_fimprevistaplanoacao: Date | null;
  cd_acao: string | null;
  ds_oqueacao: string | null;
  st_acao: string | null;
  dt_inicioprevistaacao: Date | null;
  dt_fimprevistaacao: Date | null;
  dt_iniciorealacao: Date | null;
  dt_fimrealacao: Date | null;
  ds_loginrquemacao: string | null;
}

interface AcompanhamentoRow {
  cd_planoacao: string;
  cd_acao: string | null;
  ds_acompanhamentoplanoacao: string | null;
  dt_inclusaoacompanhamentoplanoacao: Date | null;
  ds_acompanhamentoacao: string | null;
  dt_inclusaoacompanhamentoacao: Date | null;
}

@Injectable()
export class SqlRepository implements PlanoRepository {
  private pool: Promise<mssql.ConnectionPool> | null = null;

  public async carregarCache(): Promise<Cache> {
    const linhasPlanos = await this.query<PlanoAcaoRow>(queries.PLANOS_E_ACOES);
    const planos = agruparPlanosEAcoes(linhasPlanos);

    const idsPlanos = [...planos.keys()];
    const linhasAcompanhamentos = idsPlanos.length
      ? await this.query<AcompanhamentoRow>(queries.ACOMPANHAMENTOS, { planos: idsPlanos })
      : [];
    const acompanhamentos = agruparAcompanhamentos(linhasAcompanhamentos);

    return { planos, acompanhamentos };
  }

  private async conexao(): Promise<mssql.ConnectionPool> {
    if (!this.pool) {
      this.pool = new mssql.ConnectionPool(this.mssqlConfig()).connect();
      this.pool.catch(() => {
        this.pool = null;
      });
    }
    return this.pool;
  }

  private async query<T = any>(texto: string, params: Record<string, any> = {}): Promise<T[]> {
    const pool = await this.conexao();
    const request = pool.request();
    const declarados = new Set<string>();

    const declarar = (nome: string, valor: any) => {
      if (declarados.has(nome)) return;
      request.input(nome, valor);
      declarados.add(nome);
    };

    const sql = texto.replace(/:(\w+)/g, (original, nome) => {
      if (!(nome in params)) return original;
      const valor = params[nome];

      if (!Array.isArray(valor)) {
        declarar(nome, valor);
        return `@${nome}`;
      }

      if (valor.length === 0) return '(NULL)';
      const nomeados = valor.map((item, indice) => {
        const parametro = `${nome}_${indice}`;
        declarar(parametro, item);
        return `@${parametro}`;
      });
      return `(${nomeados.join(',')})`;
    });

    const resposta = await request.query<T>(sql);
    return resposta.recordset || [];
  }

  /**
   * Formatos aceitos em SQL_SERVER:
   *   host\INSTANCIA        instância nomeada (exige o SQL Browser em UDP 1434)
   *   host,porta            porta TCP direta (dispensa o SQL Browser)
   *   host\INSTANCIA,porta  a porta tem precedência e a instância é ignorada
   */
  private mssqlConfig(): mssql.config {
    if (!settings.sqlServer) {
      throw new Error('SQL_SERVER não configurado (.env).');
    }

    let server = settings.sqlServer;
    let instanceName: string | undefined;
    let port: number | undefined;

    if (server.includes(',')) {
      const separador = server.lastIndexOf(',');
      const informada = parseInt(server.slice(separador + 1).trim(), 10);
      if (!Number.isNaN(informada)) port = informada;
      server = server.slice(0, separador);
    }

    if (server.includes('\\')) {
      const separador = server.indexOf('\\');
      instanceName = server.slice(separador + 1);
      server = server.slice(0, separador);
    }

    return {
      server,
      ...(port ? { port } : {}),
      ...(settings.sqlUser ? { user: settings.sqlUser, password: settings.sqlPassword || '' } : {}),
      database: settings.sqlDatabase,
      options: {
        instanceName: port ? undefined : instanceName,
        trustedConnection: !settings.sqlUser,
        trustServerCertificate: true,
        enableArithAbort: true,
        encrypt: false,
      },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
      connectionTimeout: 30000,
      requestTimeout: 60000,
    };
  }
}

function agruparPlanosEAcoes(linhas: PlanoAcaoRow[]): Map<string, { plano: PlanoPdco; acoes: AcaoPdco[] }> {
  const planos = new Map<string, { plano: PlanoPdco; acoes: AcaoPdco[] }>();

  for (const linha of linhas) {
    if (!planos.has(linha.cd_planoacao)) {
      planos.set(linha.cd_planoacao, { plano: transformarPlano(linha), acoes: [] });
    }
    if (linha.cd_acao) {
      planos.get(linha.cd_planoacao)!.acoes.push(transformarAcao(linha));
    }
  }

  return planos;
}

function agruparAcompanhamentos(linhas: AcompanhamentoRow[]): Map<string, AcompanhamentoBruto[]> {
  const acompanhamentos = new Map<string, AcompanhamentoBruto[]>();
  // A tabela do dw é larga (plano×ação×acompanhamento): o mesmo texto de
  // acompanhamento vem repetido em várias linhas. Mantém só um por
  // origem/ação/texto/dia.
  const jaVistos = new Set<string>();

  const adicionar = (cdPlanoAcao: string, registro: AcompanhamentoBruto) => {
    const chave = [
      cdPlanoAcao,
      registro.origem,
      registro.cd_acao ?? '',
      registro.texto.trim().replace(/\s+/g, ' ').toLowerCase(),
      registro.data ? registro.data.toISOString().slice(0, 10) : '',
    ].join('|');
    if (jaVistos.has(chave)) return;
    jaVistos.add(chave);

    const lista = acompanhamentos.get(cdPlanoAcao) ?? [];
    lista.push(registro);
    acompanhamentos.set(cdPlanoAcao, lista);
  };

  for (const linha of linhas) {
    if (linha.ds_acompanhamentoplanoacao) {
      adicionar(linha.cd_planoacao, {
        texto: linha.ds_acompanhamentoplanoacao,
        data: linha.dt_inclusaoacompanhamentoplanoacao,
        origem: 'plano',
        cd_acao: null,
      });
    }
    if (linha.ds_acompanhamentoacao) {
      adicionar(linha.cd_planoacao, {
        texto: linha.ds_acompanhamentoacao,
        data: linha.dt_inclusaoacompanhamentoacao,
        origem: 'acao',
        cd_acao: linha.cd_acao,
      });
    }
  }

  return acompanhamentos;
}

function transformarPlano(linha: PlanoAcaoRow): PlanoPdco {
  return {
    cd_planoacao: linha.cd_planoacao,
    subtipo: linha.ds_subtipoacao,
    status: linha.st_planoacao,
    area_codigo: linha.cd_unidadeplano,
    area_nome: linha.ds_unidadeplano,
    responsavel: formatarNomeDoLogin(linha.ds_loginrquemplanoacao),
    login_responsavel: linha.ds_loginrquemplanoacao,
    arquetipos_culturais: linha.ds_oqueplanoacao,
    resultados_esperados: linha.ds_porqueplanoacao,
    // Prioriza a data prevista: a real (dt_inicioplanoacao) às vezes vem de um
    // cadastro antigo do EPA bem anterior ao ciclo atual de ações do plano.
    data_inicio: dataIso(linha.dt_inicioprevistaplanoacao ?? linha.dt_inicioplanoacao),
    data_fim: dataIso(linha.dt_fimplanoacao ?? linha.dt_fimprevistaplanoacao),
    execucao: null,
    resumo_acoes: null,
  };
}

function transformarAcao(linha: PlanoAcaoRow): AcaoPdco {
  return {
    cd_acao: linha.cd_acao!,
    nome: linha.ds_oqueacao ?? '',
    status: linha.st_acao ?? '',
    prazo_inicial: dataIso(linha.dt_inicioprevistaacao ?? linha.dt_iniciorealacao),
    prazo_final: dataIso(linha.dt_fimprevistaacao ?? linha.dt_fimrealacao),
    data_conclusao: dataIso(linha.dt_fimrealacao),
    responsavel: formatarNomeDoLogin(linha.ds_loginrquemacao),
  };
}

/** O dw só guarda o login institucional — formata como um nome apresentável (melhor aproximação disponível). */
function formatarNomeDoLogin(login: string | null | undefined): string | null {
  if (!login) return null;
  return login
    .split('.')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase())
    .join(' ');
}

function dataIso(data: Date | null | undefined): string | null {
  if (!data) return null;
  return new Date(data).toISOString().slice(0, 10);
}
