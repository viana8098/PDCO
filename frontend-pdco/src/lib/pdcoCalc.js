// Cálculos de apresentação do PDCO: score RAG, agrupamento por área, status.
// Tudo aqui é derivado do que a API já devolve (plano.execucao,
// plano.resumo_acoes, os quadrantes de acompanhamento) — nenhuma chamada
// extra, nenhum dado inventado.

export const RAG_COLOR = { verde: '#34d399', amarelo: '#fbbf24', vermelho: '#f87171' }
export const RAG_LABEL = { verde: 'Verde', amarelo: 'Amarelo', vermelho: 'Vermelho' }
export const RAG_BG = { verde: 'rgba(52,211,153,0.15)', amarelo: 'rgba(251,191,36,0.15)', vermelho: 'rgba(248,113,113,0.15)' }

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * Score de saúde do plano (0-100) a partir do que já foi carregado:
 * `plano.resumo_acoes` (total/concluídas/atrasadas, sempre disponível — vem
 * junto de `/api/pdco` e do detalhe) e, quando disponíveis, os quadrantes
 * de acompanhamento do detalhe (`registros[].data`) para o fator de
 * recência. Nas listagens (sem detalhe carregado), o fator de acompanhamento
 * fica de fora — o score é uma aproximação mais simples, só com execução e
 * atrasos.
 */
export function calcRag(plano, quadrantesAcompanhamento) {
  const motivos = []
  let score = 100
  const resumo = plano.resumo_acoes
  const total = resumo?.total ?? 0
  const concluidas = resumo?.concluidas ?? 0
  const atrasadas = resumo?.atrasadas ?? 0
  const pct = total > 0 ? concluidas / total : 0

  if (total === 0) {
    score -= 40
    motivos.push('Plano sem ações cadastradas')
  } else if (pct >= 0.8) {
    motivos.push(`${Math.round(pct * 100)}% das ações concluídas`)
  } else if (pct >= 0.4) {
    score -= 25
    motivos.push(`${Math.round(pct * 100)}% das ações concluídas (parcial)`)
  } else {
    score -= 50
    motivos.push(`Apenas ${Math.round(pct * 100)}% das ações concluídas`)
  }

  if (atrasadas > 0) {
    score -= Math.min(atrasadas * 10, 30)
    motivos.push(`${atrasadas} ação(ões) atrasada(s)`)
  }

  if (quadrantesAcompanhamento) {
    const registros = quadrantesAcompanhamento.flatMap((q) => q.registros)
    if (registros.length === 0) {
      score -= 20
      motivos.push('Sem acompanhamentos registrados')
    } else {
      const maisRecente = registros.reduce((max, r) => (r.data > max ? r.data : max), registros[0].data)
      const dias = (Date.now() - new Date(maisRecente).getTime()) / DIA_MS
      if (dias > 60) {
        score -= 10
        motivos.push('Sem acompanhamento recente (>60 dias)')
      } else {
        motivos.push('Acompanhamento recente registrado')
      }
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  let nivel = 'vermelho'
  if (score >= 70) nivel = 'verde'
  else if (score >= 45) nivel = 'amarelo'

  return { nivel, score, motivos, pct: Math.round(pct * 100), concluidas, total, atrasadas }
}

/** Agrupa a lista de planos (já no escopo do usuário) por área, com o rollup RAG de cada uma. */
export function agruparPorArea(planos) {
  const porArea = new Map()
  for (const plano of planos) {
    const chave = plano.area_codigo || plano.area_nome || 'sem-area'
    if (!porArea.has(chave)) {
      porArea.set(chave, { chave, nome: plano.area_nome || 'Sem área', planos: [] })
    }
    porArea.get(chave).planos.push(plano)
  }

  return [...porArea.values()]
    .map((area) => {
      const rags = area.planos.map((p) => calcRag(p))
      const contagem = { verde: 0, amarelo: 0, vermelho: 0 }
      rags.forEach((r) => contagem[r.nivel]++)
      const scoreMedio = rags.length ? Math.round(rags.reduce((s, r) => s + r.score, 0) / rags.length) : 0
      const atrasadas = rags.reduce((s, r) => s + r.atrasadas, 0)
      return { ...area, total: area.planos.length, ...contagem, score: scoreMedio, atrasadas }
    })
    .sort((a, b) => a.nome.localeCompare(b.nome))
}

/** "Tático" ou "Estratégico" a partir do texto bruto do subtipo (`ds_subtipoacao`). */
export function tipoResumido(subtipo) {
  const valor = (subtipo || '').toLowerCase()
  if (valor.includes('estratégico') || valor.includes('estrategico')) return 'Estratégico'
  if (valor.includes('tático') || valor.includes('tatico')) return 'Tático'
  return null
}

/** % de ações concluídas (ponderado) numa lista de planos — usado nos medidores do banner executivo. */
export function pctConcluido(planos) {
  const total = planos.reduce((s, p) => s + (p.resumo_acoes?.total ?? 0), 0)
  const concluidas = planos.reduce((s, p) => s + (p.resumo_acoes?.concluidas ?? 0), 0)
  return total > 0 ? Math.round((concluidas / total) * 100) : 0
}

/** Título de exibição do plano — a EPA não tem um campo "título" dedicado, então usamos o resumo dos arquétipos culturais (ds_oqueplanoacao). */
export function tituloDoPlano(plano) {
  const resumo = (plano.arquetipos_culturais || '').trim()
  if (!resumo) return `Plano ${plano.cd_planoacao}`
  return resumo.length > 90 ? `${resumo.slice(0, 89)}…` : resumo
}

/**
 * Índice (0-based) do mês de `alvoIso` em relação ao mês de `dataInicioIso` —
 * mesma conta que o backend usa para montar os quadrantes de acompanhamento
 * (domain/pdco.rules.ts#montarJanelaAcompanhamento), replicada aqui para
 * encaixar as ações concluídas no mesmo balde mensal.
 */
export function indiceMesRelativo(dataInicioIso, alvoIso) {
  if (!dataInicioIso || !alvoIso) return null
  const inicio = new Date(`${dataInicioIso}T00:00:00`)
  const alvo = new Date(`${alvoIso}T00:00:00`)
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(alvo.getTime())) return null
  return (alvo.getFullYear() - inicio.getFullYear()) * 12 + (alvo.getMonth() - inicio.getMonth())
}

export function formatarData(iso) {
  if (!iso) return '—'
  const data = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Slug de classe CSS a partir de um status bruto (`pdco-status-<slug>`), com fallback neutro embutido no CSS. */
export function classeStatus(status) {
  return (status || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}
