// Cálculos de apresentação do PDCO: score RAG, agrupamento por área, status.
// Tudo aqui é derivado do que a API já devolve (plano.execucao,
// plano.resumo_acoes, os quadrantes de acompanhamento) — nenhuma chamada
// extra, nenhum dado inventado.

export const RAG_COLOR = { verde: '#34d399', amarelo: '#fbbf24', vermelho: '#f87171' }
// Textos mostrados ao usuário. As chaves internas (verde/amarelo/vermelho) e os critérios do RAG não mudam.
export const RAG_LABEL = { verde: 'Em dia', amarelo: 'Atenção', vermelho: 'Crítico' }
export const RAG_BG = { verde: 'rgba(52,211,153,0.15)', amarelo: 'rgba(251,191,36,0.15)', vermelho: 'rgba(248,113,113,0.15)' }

const DIA_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Regra do status (Em dia / Atenção / Crítico)
// Todo plano parte de RAG_BASE pontos e perde pontos por execução baixa, ações
// atrasadas e falta de acompanhamento. Estes valores são a ÚNICA fonte da regra:
// o cálculo (calcRag) e a explicação mostrada ao usuário (RegraStatus) leem daqui.
// As chaves internas (verde/amarelo/vermelho) não mudam; o texto vem de RAG_LABEL.
// ---------------------------------------------------------------------------
export const RAG_BASE = 100
/** Score mínimo para cada nível: >= verde é Em dia; >= amarelo é Atenção; abaixo disso, Crítico. */
export const RAG_LIMITES = { verde: 70, amarelo: 45 }
export const RAG_FAIXA = { verde: '70 a 100 pontos', amarelo: '45 a 69 pontos', vermelho: 'menos de 45 pontos' }
export const RAG_REGRA = {
  execucaoBoa: 0.8, // >= 80% das ações concluídas: sem perda
  execucaoParcial: 0.4, // de 40% a 79%: perda parcial; abaixo de 40%: perda maior
  diasAcompanhamentoRecente: 60,
  penalidades: {
    semAcoes: 40,
    execucaoParcial: 25,
    execucaoBaixa: 50,
    porAtraso: 10,
    maxAtrasos: 30,
    semAcompanhamento: 20,
    acompanhamentoAntigo: 10,
  },
}

const pluralDias = (n) => (n === 1 ? '1 dia' : `${n} dias`)

/**
 * Quantidade e data do acompanhamento mais recente de um plano. A fonte é
 * `plano.resumo_acompanhamentos` (todos os registros; vem junto da listagem e
 * do detalhe — por isso o status é o mesmo nas duas telas). Só se a API for
 * antiga e não mandar esse resumo é que usa os quadrantes do detalhe; sem
 * nenhum dos dois, devolve null e o fator fica de fora.
 */
function resumoDeAcompanhamentos(plano, quadrantes) {
  if (plano.resumo_acompanhamentos) return plano.resumo_acompanhamentos
  if (!quadrantes) return null
  const registros = quadrantes.flatMap((q) => q.registros)
  const ultimo = registros.length ? registros.reduce((max, r) => (r.data > max ? r.data : max), registros[0].data) : null
  return { total: registros.length, ultimo }
}

/**
 * Score de saúde do plano (0-100) a partir do que já foi carregado:
 * `plano.resumo_acoes` (total/concluídas/atrasadas, sempre disponível — vem
 * junto de `/api/pdco` e do detalhe) e `plano.resumo_acompanhamentos`
 * (quantidade e data do último acompanhamento — também vem nas duas), então
 * a listagem e o detalhe calculam exatamente o mesmo score. Só com uma API
 * antiga, sem esse resumo, cai nos quadrantes de acompanhamento do detalhe
 * (`registros[].data`); sem nenhum dos dois, o fator fica de fora.
 */
export function calcRag(plano, quadrantesAcompanhamento) {
  const motivos = []
  // Passo a passo dos pontos (o que cada critério tirou), para explicar o status ao usuário.
  const criterios = []
  const P = RAG_REGRA.penalidades
  let score = RAG_BASE
  const resumo = plano.resumo_acoes
  const total = resumo?.total ?? 0
  const concluidas = resumo?.concluidas ?? 0
  const atrasadas = resumo?.atrasadas ?? 0
  const pct = total > 0 ? concluidas / total : 0
  const pctTxt = Math.round(pct * 100)
  const execucao = (situacao, pontos) => criterios.push({ chave: 'execucao', titulo: 'Execução das ações', situacao, pontos })

  if (total === 0) {
    score -= P.semAcoes
    motivos.push('Plano sem ações cadastradas')
    execucao('Plano sem ações cadastradas', -P.semAcoes)
  } else if (pct >= RAG_REGRA.execucaoBoa) {
    motivos.push(`${pctTxt}% das ações concluídas`)
    execucao(`${concluidas} de ${total} ações concluídas (${pctTxt}%) — 80% ou mais`, 0)
  } else if (pct >= RAG_REGRA.execucaoParcial) {
    score -= P.execucaoParcial
    motivos.push(`${pctTxt}% das ações concluídas (parcial)`)
    execucao(`${concluidas} de ${total} ações concluídas (${pctTxt}%) — de 40% a 79%`, -P.execucaoParcial)
  } else {
    score -= P.execucaoBaixa
    motivos.push(`Apenas ${pctTxt}% das ações concluídas`)
    execucao(`${concluidas} de ${total} ações concluídas (${pctTxt}%) — menos de 40%`, -P.execucaoBaixa)
  }

  if (atrasadas > 0) {
    const perda = Math.min(atrasadas * P.porAtraso, P.maxAtrasos)
    score -= perda
    motivos.push(`${atrasadas} ação(ões) atrasada(s)`)
    criterios.push({
      chave: 'atrasos',
      titulo: 'Ações atrasadas',
      situacao: `${atrasadas} ${atrasadas === 1 ? 'ação atrasada' : 'ações atrasadas'} (−${P.porAtraso} por ação, no máximo −${P.maxAtrasos})`,
      pontos: -perda,
    })
  } else {
    criterios.push({ chave: 'atrasos', titulo: 'Ações atrasadas', situacao: 'Nenhuma ação atrasada', pontos: 0 })
  }

  const acompanhamentos = resumoDeAcompanhamentos(plano, quadrantesAcompanhamento)
  if (acompanhamentos) {
    const acompanhamento = (situacao, pontos) => criterios.push({ chave: 'acompanhamento', titulo: 'Acompanhamento', situacao, pontos })
    if (acompanhamentos.total === 0) {
      score -= P.semAcompanhamento
      motivos.push('Sem acompanhamentos registrados')
      acompanhamento('Nenhum acompanhamento registrado', -P.semAcompanhamento)
    } else {
      const dias = (Date.now() - new Date(acompanhamentos.ultimo).getTime()) / DIA_MS
      const quando = dias < 1 ? 'hoje' : `há ${pluralDias(Math.floor(dias))}`
      if (dias > RAG_REGRA.diasAcompanhamentoRecente) {
        score -= P.acompanhamentoAntigo
        motivos.push('Sem acompanhamento recente (>60 dias)')
        acompanhamento(`Último acompanhamento ${quando} — mais de ${RAG_REGRA.diasAcompanhamentoRecente} dias sem registro`, -P.acompanhamentoAntigo)
      } else {
        motivos.push('Acompanhamento recente registrado')
        acompanhamento(`Último acompanhamento ${quando} — dentro de ${RAG_REGRA.diasAcompanhamentoRecente} dias`, 0)
      }
    }
  }

  score = Math.max(0, Math.min(RAG_BASE, Math.round(score)))
  let nivel = 'vermelho'
  if (score >= RAG_LIMITES.verde) nivel = 'verde'
  else if (score >= RAG_LIMITES.amarelo) nivel = 'amarelo'

  return { nivel, score, motivos, criterios, pct: pctTxt, concluidas, total, atrasadas }
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

// ---------------------------------------------------------------------------
// Cores dos anéis de "Conclusão de ações" (banner). Não é o status do plano (RAG_*): aqui a faixa é o
// percentual de ações concluídas. Única fonte: o anel (CultureGauge) e o "i" (InfoConclusao) leem daqui.
// ---------------------------------------------------------------------------
/** Percentual mínimo para cada nível: >= verde é Em dia; >= amarelo é Atenção; abaixo disso, Crítico. */
export const CONCLUSAO_LIMITES = { verde: 70, amarelo: 45 }
export const CONCLUSAO_FAIXA = {
  verde: `${CONCLUSAO_LIMITES.verde}% a 100%`,
  amarelo: `${CONCLUSAO_LIMITES.amarelo}% a ${CONCLUSAO_LIMITES.verde - 1}%`,
  vermelho: `menos de ${CONCLUSAO_LIMITES.amarelo}%`,
}
export function nivelDaConclusao(pct) {
  if (pct >= CONCLUSAO_LIMITES.verde) return 'verde'
  if (pct >= CONCLUSAO_LIMITES.amarelo) return 'amarelo'
  return 'vermelho'
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

const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

/** Chave numérica do mês de calendário (ano*12 + mês) de uma data ISO (yyyy-mm-dd); null se não houver/for inválida. */
export function chaveDoMes(iso) {
  if (!iso) return null
  const data = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(data.getTime())) return null
  return data.getFullYear() * 12 + data.getMonth()
}

/** "Setembro/2026" a partir da chave do mês (ver chaveDoMes). */
export function rotuloDaChave(chave) {
  return `${MESES_LONGOS[((chave % 12) + 12) % 12]}/${Math.floor(chave / 12)}`
}

const semStatus = (acao) => (acao.status || '').trim().toLowerCase()

export function acaoCancelada(acao) {
  return semStatus(acao).startsWith('cancel')
}

export function acaoConcluida(acao) {
  const status = semStatus(acao)
  return status === 'concluído' || status === 'concluido'
}

/** Atrasada: nem concluída nem cancelada, com prazo final já vencido — mesmo critério do resumo do back-end. */
export function acaoAtrasada(acao, hoje = new Date()) {
  if (acaoCancelada(acao) || acaoConcluida(acao) || !acao.prazo_final) return false
  return new Date(acao.prazo_final) < hoje
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
