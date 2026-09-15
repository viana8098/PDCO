/**
 * Configuração central da aplicação (lê variáveis de ambiente / .env).
 * Cópia estrutural de backend-presidente/src/config.ts.
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

function envOr(nome: string, fallback: string): string {
  const valor = process.env[nome];
  return valor && valor.trim() !== '' ? valor : fallback;
}

export const settings = {
  port: parseInt(envOr('PORT', '8020'), 10),

  corsOrigins: envOr('CORS_ORIGINS', 'http://localhost:5175,http://127.0.0.1:5175')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  // dw corporativo — fato_planejamento_planodeacao / acompanhamentos, somente leitura.
  sqlServer: envOr('SQL_SERVER', ''),
  sqlDatabase: envOr('SQL_DATABASE', 'dw'),
  sqlUser: envOr('SQL_USER', ''),
  sqlPassword: envOr('SQL_PASSWORD', ''),
};
