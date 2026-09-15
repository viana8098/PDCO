/**
 * Gera o snapshot estático usado no deploy do Cloudflare Pages (sem backend
 * em produção — ver functions/api/pdco/**). Lê filtros/planos/detalhes do
 * backend-pdco LOCAL (que precisa estar rodando e conectado ao dw real,
 * `npm run start:dev` em backend-pdco/) e grava em public/_data/pdco/.
 *
 * Anonimiza responsáveis: os nomes reais (formatados a partir do login do
 * dw) nunca chegam a ser escritos em disco — cada nome único vira
 * "Responsável NN", de forma estável (mesma pessoa = mesmo rótulo em todos
 * os planos/ações), antes de qualquer gravação. `login_responsavel` (o
 * login bruto) é descartado por completo do snapshot.
 *
 * Não há área de administrador congelada aqui: o registro qualitativo já
 * vem sempre somente-leitura da API (ver backend-pdco/src/services/pdco.service.ts).
 *
 * Uso: cd frontend-pdco && node scripts/gerar-snapshot.mjs
 * (rodar de novo sempre que quiser atualizar os dados do deploy estático.)
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = process.env.SNAPSHOT_BASE_URL ?? 'http://localhost:8020'
const OUT_DIR = path.resolve(__dirname, '..', 'public', '_data', 'pdco')
const CONCORRENCIA = 10

async function getJSON(url) {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`GET ${url} -> ${resp.status}`)
    return resp.json()
}

async function mapaComConcorrencia(itens, concorrencia, fn) {
    let indice = 0
    async function worker() {
        while (indice < itens.length) {
            const meu = indice++
            await fn(itens[meu])
        }
    }
    await Promise.all(Array.from({ length: concorrencia }, worker))
}

function escreverJSON(caminho, dados) {
    fs.mkdirSync(path.dirname(caminho), { recursive: true })
    fs.writeFileSync(caminho, JSON.stringify(dados, null, 2) + '\n', 'utf-8')
}

/** Monta nome-real -> "Responsável NN" (ordem alfabética, estável entre execuções). */
function montarMapaAnonimizacao(planos, detalhes) {
    const nomes = new Set()
    for (const plano of planos) {
        if (plano.responsavel) nomes.add(plano.responsavel.trim())
    }
    for (const detalhe of detalhes) {
        for (const acao of detalhe.acoes) {
            if (acao.responsavel) nomes.add(acao.responsavel.trim())
        }
    }

    const ordenados = [...nomes].sort((a, b) => a.localeCompare(b))
    const mapa = new Map()
    ordenados.forEach((nome, indice) => mapa.set(nome, `Responsável ${String(indice + 1).padStart(2, '0')}`))
    return mapa
}

function anonimizar(nome, mapa) {
    if (!nome) return nome
    return mapa.get(nome.trim()) ?? nome
}

function anonimizarPlano(plano, mapa) {
    const { login_responsavel, ...resto } = plano
    return { ...resto, responsavel: anonimizar(plano.responsavel, mapa) }
}

function anonimizarDetalhe(detalhe, mapa) {
    return {
        ...detalhe,
        plano: anonimizarPlano(detalhe.plano, mapa),
        acoes: detalhe.acoes.map((acao) => ({ ...acao, responsavel: anonimizar(acao.responsavel, mapa) })),
    }
}

async function main() {
    console.log(`Lendo backend-pdco em ${BASE}...`)

    const filtros = await getJSON(`${BASE}/api/pdco/filtros`)
    escreverJSON(path.join(OUT_DIR, 'filtros.json'), filtros)
    console.log(`filtros.json — ${filtros.planos.length} plano(s) no filtro`)

    const planos = await getJSON(`${BASE}/api/pdco`)
    console.log(`${planos.length} plano(s) encontrados — buscando detalhe de cada um...`)

    const detalhesPorPlano = new Map()
    await mapaComConcorrencia(planos, CONCORRENCIA, async (plano) => {
        const detalhe = await getJSON(`${BASE}/api/pdco/${encodeURIComponent(plano.cd_planoacao)}`)
        detalhesPorPlano.set(plano.cd_planoacao, detalhe)
    })

    const detalhes = [...detalhesPorPlano.values()]
    const mapaAnonimizacao = montarMapaAnonimizacao(planos, detalhes)
    console.log(`Anonimizando ${mapaAnonimizacao.size} responsável(is) único(s)...`)

    const planosComAcoes = []
    for (const plano of planos) {
        const detalhe = anonimizarDetalhe(detalhesPorPlano.get(plano.cd_planoacao), mapaAnonimizacao)
        escreverJSON(path.join(OUT_DIR, 'planos', `${plano.cd_planoacao}.json`), detalhe)
        planosComAcoes.push({ ...detalhe.plano, acoes_nomes: detalhe.acoes.map((a) => a.nome).filter(Boolean) })
    }

    escreverJSON(path.join(OUT_DIR, 'planos.json'), planosComAcoes)

    console.log(`Snapshot gerado em ${OUT_DIR}`)
    console.log(`${planosComAcoes.length} plano(s) — rode "npm run build" e faça o deploy pra atualizar o site.`)
}

main().catch((erro) => {
    console.error('Falhou:', erro.message)
    process.exit(1)
})
