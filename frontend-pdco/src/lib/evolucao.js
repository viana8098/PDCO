// Lógica da página Evolução Mensal — funções puras, sem I/O nem React. Tudo é
// derivado do que a API já entrega (ações com prazo/status/data_conclusao e os
// registros de acompanhamento); nenhum número é inventado. Este arquivo é
// idêntico nos dois apps (standalone e corporativo).
//
// Modelo: calendário único de 8 meses (ver inicioDoCiclo). Cada mês é lido pelo
// estado das ações no FIM do mês (ou até hoje, no mês em curso):
//   concluída em M = status Concluído e data de conclusão <= fim de M
//   atrasada em M  = não concluída em M, não cancelada, prazo final <= fim de M
// "Nova conclusão", "novo atraso" e "atraso regularizado" só são afirmados
// quando dá pra provar ação por ação, comparando o estado nos dois fins de mês
// (nunca pela diferença entre totais). O dw guarda só o estado atual: prazo
// replanejado ou status que mudou sem passar por "Concluído" não aparecem.

import { acaoCancelada, acaoConcluida, tituloDoPlano } from './pdcoCalc'

export const TOTAL_MESES = 8

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const pad = (n) => String(n).padStart(2, '0')
const menorIso = (a, b) => (a < b ? a : b)

/** "2 ações"/"1 ação" — `formaPlural` só quando não é simplesmente singular + "s". */
export function plural(n, singular, formaPlural) {
  return `${n} ${n === 1 ? singular : (formaPlural ?? `${singular}s`)}`
}

/** Data de hoje (fuso local) em yyyy-mm-dd — datas ISO comparam certo como texto. */
export function hojeLocalIso(data = new Date()) {
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}`
}

/** Chave do mês de calendário (ano*12 + mês 0-based) de uma data ISO. */
export function chaveDoIso(iso) {
  if (!iso) return null
  const ano = Number(iso.slice(0, 4))
  const mes = Number(iso.slice(5, 7))
  if (!ano || !mes) return null
  return ano * 12 + (mes - 1)
}

export function ultimoDiaDoMes(chave) {
  const ano = Math.floor(chave / 12)
  const mes = chave % 12
  return `${ano}-${pad(mes + 1)}-${pad(new Date(ano, mes + 1, 0).getDate())}`
}

/** "Ago/2026" a partir da chave do mês. */
export function rotuloDoMes(chave) {
  return `${MESES_CURTOS[chave % 12]}/${Math.floor(chave / 12)}`
}

/** dd/mm/aaaa a partir de yyyy-mm-dd (sem passar por Date, então sem surpresa de fuso). */
export function dataBr(iso) {
  if (!iso) return '—'
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

export const dataCurta = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

const utc = (iso) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))

/** Dias corridos de `deIso` até `ateIso` (negativo se `ateIso` for anterior). */
export function diasEntre(deIso, ateIso) {
  return Math.round((utc(ateIso) - utc(deIso)) / 86400000)
}

export function chaveDaArea(plano) {
  return plano.area_codigo || plano.area_nome || 'sem-area'
}

/**
 * Início do ciclo: o "Mês 1" é sempre o mês de início do plano iniciado mais
 * recentemente (entre os que já começaram — plano com início futuro não conta).
 * Calculado sobre todos os planos, sem o filtro de área, pra numeração dos
 * meses não mudar com o filtro.
 */
export function inicioDoCiclo(detalhes, hojeIso) {
  let maisRecente = null
  for (const { plano } of detalhes) {
    const inicio = plano.data_inicio
    if (!inicio || inicio > hojeIso) continue
    if (!maisRecente || inicio > maisRecente) maisRecente = inicio
  }
  return maisRecente
}

/** Os 8 meses do ciclo com as datas de referência de cada um; null se nenhum plano começou ainda. */
export function montarCiclo(detalhes, hojeIso) {
  const inicio = inicioDoCiclo(detalhes, hojeIso)
  if (!inicio) return null

  const chaveInicio = chaveDoIso(inicio)
  const chaveHoje = chaveDoIso(hojeIso)
  const meses = Array.from({ length: TOTAL_MESES }, (_, i) => {
    const chave = chaveInicio + i
    return {
      mes: i + 1,
      chave,
      ano: Math.floor(chave / 12),
      rotulo: rotuloDoMes(chave),
      futuro: chave > chaveHoje,
      atual: chave === chaveHoje,
    }
  })
  const mesAtual = Math.min(Math.max(chaveHoje - chaveInicio + 1, 1), TOTAL_MESES)
  return { inicio, chaveInicio, meses, mesAtual }
}

// --------------------------------------------------------------------------
// Estado de uma ação numa data de referência
// --------------------------------------------------------------------------

/** Data real de conclusão; sem ela (API antiga), cai no prazo — aproximação já usada antes. */
export function dataDeConclusao(acao) {
  if (!acaoConcluida(acao)) return null
  return acao.data_conclusao ?? acao.prazo_final ?? null
}

export function concluidaEm(acao, refIso) {
  if (!acaoConcluida(acao)) return false
  const conclusao = dataDeConclusao(acao)
  // Concluída sem data nenhuma: conta como concluída em qualquer data, mas nunca
  // como "nova conclusão" de um mês (não dá pra provar quando foi).
  return conclusao === null || conclusao <= refIso
}

/** Mesmo critério do resumo do back-end: prazo já iniciado/vencido e ação nem concluída nem cancelada. */
export function atrasadaEm(acao, refIso) {
  if (acaoCancelada(acao) || !acao.prazo_final) return false
  return !concluidaEm(acao, refIso) && acao.prazo_final <= refIso
}

// --------------------------------------------------------------------------
// Universo (planos filtrados por área) e itens da linha do tempo
// --------------------------------------------------------------------------

function montarUniverso(detalhes, areaFiltro) {
  const acoes = []
  const registros = []
  const anexos = []
  for (const detalhe of detalhes) {
    const { plano } = detalhe
    // Área é atributo do plano: o filtro vale pra todas as ações/registros/anexos dele.
    if (areaFiltro && chaveDaArea(plano) !== areaFiltro) continue

    const porCodigo = new Map(detalhe.acoes.map((acao) => [acao.cd_acao, acao]))
    for (const acao of detalhe.acoes) {
      if (!acaoCancelada(acao)) acoes.push({ plano, acao })
    }
    // `registros_acompanhamento` traz todos; sem ele (API antiga) cai na janela de 8 meses.
    const lista = detalhe.registros_acompanhamento ?? detalhe.acompanhamento.flatMap((q) => q.registros)
    for (const registro of lista) {
      if (!registro.data) continue
      registros.push({ plano, registro, acao: registro.cd_acao ? (porCodigo.get(registro.cd_acao) ?? null) : null })
    }
    for (const anexo of detalhe.anexos ?? []) {
      anexos.push({ plano, anexo })
    }
  }
  return { acoes, registros, anexos }
}

function detalhesDaAcao(plano, acao) {
  const detalhes = [
    { rotulo: 'Plano', valor: tituloDoPlano(plano) },
    { rotulo: 'Área', valor: plano.area_nome || '—' },
    { rotulo: 'Status', valor: acao.status || '—' },
    { rotulo: 'Responsável', valor: acao.responsavel || '—' },
    { rotulo: 'Prazo previsto', valor: dataBr(acao.prazo_final) },
  ]
  if (acaoConcluida(acao)) detalhes.push({ rotulo: 'Concluída em', valor: dataBr(dataDeConclusao(acao)) })
  return detalhes
}

const badge = (id, rotulo) => ({ id, rotulo })

function itemConcluida(plano, acao, regularizou) {
  const conclusao = dataDeConclusao(acao)
  const prazo = acao.prazo_final
  const dias = prazo && conclusao ? diasEntre(prazo, conclusao) : null
  let descricao = 'Ação concluída.'
  if (dias !== null && dias > 0) descricao = `Concluída ${plural(dias, 'dia')} após o prazo previsto (${dataBr(prazo)}).`
  else if (dias !== null) descricao = `Concluída dentro do prazo previsto (${dataBr(prazo)}).`
  if (regularizou) descricao += ' O atraso foi regularizado.'

  return {
    id: `acao:${plano.cd_planoacao}:${acao.cd_acao}`,
    tipo: 'acao',
    tags: regularizou ? ['concluida', 'regularizada'] : ['concluida'],
    badges: regularizou ? [badge('concluida', 'Concluída'), badge('regularizada', 'Regularizada')] : [badge('concluida', 'Concluída')],
    titulo: acao.nome,
    descricao,
    data: conclusao,
    rotuloData: `Concluída em ${dataBr(conclusao)}`,
    responsavel: acao.responsavel,
    detalhes: detalhesDaAcao(plano, acao),
  }
}

function itemNovoAtraso(plano, acao, refIso) {
  const dias = diasEntre(acao.prazo_final, refIso)
  const descricao =
    dias > 0
      ? `O prazo (${dataBr(acao.prazo_final)}) venceu sem conclusão: ${plural(dias, 'dia')} de atraso em ${dataBr(refIso)}.`
      : `O prazo (${dataBr(acao.prazo_final)}) chegou e a ação ainda não foi concluída.`
  const detalhes = detalhesDaAcao(plano, acao)
  detalhes.push({ rotulo: 'Dias em atraso', valor: String(Math.max(dias, 0)) })

  return {
    id: `acao:${plano.cd_planoacao}:${acao.cd_acao}`,
    tipo: 'acao',
    tags: ['novo_atraso'],
    badges: [badge('novo_atraso', 'Novo atraso')],
    titulo: acao.nome,
    descricao,
    data: acao.prazo_final,
    rotuloData: `Prazo: ${dataBr(acao.prazo_final)}`,
    responsavel: acao.responsavel,
    detalhes,
  }
}

function itemSemAlteracao(plano, acao, { atrasada, concluida, refIso }) {
  const prazo = acao.prazo_final
  let tag = 'em_dia'
  let rotulo = acao.status || 'Em andamento'
  let descricao = prazo ? `${rotulo} — prazo previsto em ${dataBr(prazo)}.` : `${rotulo} — sem prazo definido.`
  if (atrasada) {
    tag = 'continua_atrasada'
    rotulo = 'Continua atrasada'
    descricao = `Segue sem conclusão desde o prazo (${dataBr(prazo)}): ${plural(diasEntre(prazo, refIso), 'dia')} de atraso em ${dataBr(refIso)}.`
  } else if (concluida) {
    tag = 'concluida_antes'
    rotulo = 'Concluída antes'
    descricao = `Concluída em ${dataBr(dataDeConclusao(acao))}, antes do período.`
  }
  return {
    id: `acao:${plano.cd_planoacao}:${acao.cd_acao}`,
    tipo: 'acao',
    tags: [tag],
    badges: [badge(tag, rotulo)],
    titulo: acao.nome,
    descricao,
    data: prazo,
    rotuloData: prazo ? `Prazo: ${dataBr(prazo)}` : 'Sem prazo',
    responsavel: acao.responsavel,
    detalhes: detalhesDaAcao(plano, acao),
  }
}

function itemAcompanhamento(plano, registro, acao, indice) {
  const texto = (registro.texto || '').trim()
  return {
    id: `registro:${indice}`,
    tipo: 'acompanhamento',
    tags: ['acompanhamento'],
    badges: [badge('acompanhamento', 'Acompanhamento')],
    titulo: acao ? acao.nome : tituloDoPlano(plano),
    descricao: texto,
    data: registro.data,
    rotuloData: `Registrado em ${dataBr(registro.data)}`,
    // O dw não guarda quem escreveu o acompanhamento — atribuído ao responsável do
    // plano, a melhor aproximação disponível.
    responsavel: plano.responsavel,
    detalhes: [
      { rotulo: 'Origem', valor: acao ? 'Acompanhamento da ação' : 'Acompanhamento do plano' },
      { rotulo: 'Plano', valor: tituloDoPlano(plano) },
      { rotulo: 'Área', valor: plano.area_nome || '—' },
    ],
  }
}

function itemAnexo(plano, anexo) {
  return {
    id: `anexo:${plano.cd_planoacao}:${anexo.cd_anexo}`,
    tipo: 'anexo',
    tags: ['anexo'],
    badges: [badge('anexo', 'Anexo')],
    titulo: anexo.nome_arquivo,
    descricao: `Evidência anexada ao plano ${tituloDoPlano(plano)}.`,
    data: anexo.data,
    rotuloData: `Anexada em ${dataBr(anexo.data)}`,
    responsavel: anexo.anexado_por,
    detalhes: [
      { rotulo: 'Plano', valor: tituloDoPlano(plano) },
      { rotulo: 'Área', valor: plano.area_nome || '—' },
    ],
  }
}

const porDataDesc = (a, b) => (b.data || '').localeCompare(a.data || '')
const ORDEM_SEM_ALTERACAO = { continua_atrasada: 0, em_dia: 1, concluida_antes: 2 }

/**
 * Tudo o que aconteceu entre o fim de `deIso` (exclusive) e `ateIso` (inclusive).
 * Cada ação cai em exatamente um balde (concluída / novo atraso / sem alteração);
 * "atraso regularizado" não é balde: é uma conclusão de ação que estava atrasada
 * em `deIso` (a única saída possível de um atraso, já que o prazo é fixo).
 */
export function eventosDoIntervalo(univ, deIso, ateIso, ciclo) {
  const concluidas = []
  const novosAtrasos = []
  const semAlteracao = []
  for (const { plano, acao } of univ.acoes) {
    const concluidaDe = concluidaEm(acao, deIso)
    const concluidaAte = concluidaEm(acao, ateIso)
    const atrasadaDe = atrasadaEm(acao, deIso)
    const atrasadaAte = atrasadaEm(acao, ateIso)
    if (concluidaAte && !concluidaDe) concluidas.push(itemConcluida(plano, acao, atrasadaDe))
    else if (atrasadaAte && !atrasadaDe) novosAtrasos.push(itemNovoAtraso(plano, acao, ateIso))
    else semAlteracao.push(itemSemAlteracao(plano, acao, { atrasada: atrasadaAte, concluida: concluidaAte, refIso: ateIso }))
  }

  const acompanhamentos = []
  univ.registros.forEach(({ plano, registro, acao }, indice) => {
    if (registro.data > deIso && registro.data <= ateIso) acompanhamentos.push(itemAcompanhamento(plano, registro, acao, indice))
  })

  // Anexo pertence ao mês do ciclo escolhido por quem anexou (`anexo.mes`, 1-8).
  const anexos = []
  const chaveDe = chaveDoIso(deIso)
  const chaveAte = chaveDoIso(ateIso)
  for (const { plano, anexo } of univ.anexos) {
    if (!anexo.mes || anexo.mes < 1 || anexo.mes > TOTAL_MESES) continue
    const chaveDoAnexo = ciclo.chaveInicio + anexo.mes - 1
    if (chaveDoAnexo > chaveDe && chaveDoAnexo <= chaveAte) anexos.push(itemAnexo(plano, anexo))
  }

  concluidas.sort(porDataDesc)
  novosAtrasos.sort(porDataDesc)
  acompanhamentos.sort(porDataDesc)
  anexos.sort(porDataDesc)
  semAlteracao.sort((a, b) => ORDEM_SEM_ALTERACAO[a.tags[0]] - ORDEM_SEM_ALTERACAO[b.tags[0]] || (a.data || '').localeCompare(b.data || ''))
  return { concluidas, novosAtrasos, acompanhamentos, anexos, semAlteracao }
}

const ehRegularizada = (item) => item.tags.includes('regularizada')

function avaliarMes(univ, ciclo, chave, hojeIso) {
  const refIso = menorIso(ultimoDiaDoMes(chave), hojeIso)
  const refAnteriorIso = ultimoDiaDoMes(chave - 1)
  const ev = eventosDoIntervalo(univ, refAnteriorIso, refIso, ciclo)
  const atrasadas = univ.acoes.reduce((n, { acao }) => n + (atrasadaEm(acao, refIso) ? 1 : 0), 0)
  return {
    refIso,
    refAnteriorIso,
    ev,
    metricas: {
      concluidas: ev.concluidas.length,
      acompanhamentos: ev.acompanhamentos.length,
      anexos: ev.anexos.length,
      // Estoque no fim do mês (as demais métricas são fluxo do mês).
      atrasadas,
      novosAtrasos: ev.novosAtrasos.length,
      regularizados: ev.concluidas.filter(ehRegularizada).length,
    },
  }
}

/** Avalia cada mês já iniciado do ciclo; meses futuros ficam sem métricas. */
export function analisarCiclo(detalhes, ciclo, areaFiltro, hojeIso) {
  const univ = montarUniverso(detalhes, areaFiltro)
  const meses = ciclo.meses.map((mes) => {
    if (mes.futuro) return { ...mes, metricas: null, ev: null, eventos: [] }
    const avaliado = avaliarMes(univ, ciclo, mes.chave, hojeIso)
    const { ev } = avaliado
    const eventos = [...ev.concluidas, ...ev.novosAtrasos, ...ev.acompanhamentos, ...ev.anexos].sort(porDataDesc)
    return { ...mes, ...avaliado, eventos }
  })
  const temDados = univ.acoes.length + univ.registros.length + univ.anexos.length > 0
  // Só o app corporativo tem anexos (banco próprio): a API do standalone nem manda o campo.
  const temAnexos = detalhes.some((detalhe) => Array.isArray(detalhe.anexos))
  return { univ, meses, temDados, temAnexos, hojeIso }
}

/**
 * Compara o estado no fim do mês `de` com o fim do mês `para` (índices 1-8 do
 * ciclo, já normalizados de <= para). Com de === para, compara `para` com o mês
 * de calendário imediatamente anterior (que, no Mês 1, é anterior ao ciclo).
 * Os cartões mostram cada mês por si (fluxo de conclusões/registros, estoque de
 * atrasos); as mudanças cobrem o intervalo entre os dois fins de mês.
 */
export function compararMeses(analise, ciclo, de, para) {
  const B = analise.meses[para - 1]
  const mesmo = de === para
  const A = mesmo
    ? (() => {
        const chave = B.chave - 1
        return { chave, rotulo: rotuloDoMes(chave), mes: null, ...avaliarMes(analise.univ, ciclo, chave, analise.hojeIso) }
      })()
    : analise.meses[de - 1]
  const adjacente = mesmo || para - de === 1
  const deRefIso = mesmo ? B.refAnteriorIso : A.refIso
  const ev = adjacente ? B.ev : eventosDoIntervalo(analise.univ, deRefIso, B.refIso, ciclo)

  const regularizados = ev.concluidas.filter(ehRegularizada).length
  return {
    de: { mes: A.mes, chave: A.chave, rotulo: A.rotulo },
    para: { mes: B.mes, chave: B.chave, rotulo: B.rotulo, atual: B.atual, refIso: B.refIso },
    mesmo,
    adjacente,
    temAnexos: analise.temAnexos,
    metricas: { de: A.metricas, para: B.metricas },
    ev,
    totais: {
      concluidas: ev.concluidas.length,
      novosAtrasos: ev.novosAtrasos.length,
      regularizados,
      acompanhamentos: ev.acompanhamentos.length,
      anexos: ev.anexos.length,
      continuamAtrasadas: ev.semAlteracao.filter((i) => i.tags.includes('continua_atrasada')).length,
      semAlteracao: ev.semAlteracao.length,
    },
  }
}

// --------------------------------------------------------------------------
// Filtros por indicador (cartões e faixa de resumo)
// --------------------------------------------------------------------------

/** `grupos`: quais blocos de "O que mudou" aparecem; `tags`: quais eventos entram na linha do tempo completa. */
export const FOCOS = {
  concluidas: { rotulo: 'Ações concluídas', grupos: ['concluidas'], tags: ['concluida'] },
  novos_atrasos: { rotulo: 'Novos atrasos', grupos: ['novos_atrasos'], tags: ['novo_atraso'] },
  regularizados: { rotulo: 'Atrasos regularizados', grupos: ['regularizados'], tags: ['regularizada'] },
  acompanhamentos: { rotulo: 'Acompanhamentos', grupos: ['acompanhamentos'], tags: ['acompanhamento'] },
  anexos: { rotulo: 'Anexos', grupos: ['anexos'], tags: ['anexo'] },
}

export function itemNoFoco(item, foco) {
  return !foco || FOCOS[foco].tags.some((tag) => item.tags.includes(tag))
}

/** Blocos da seção "O que mudou". Sem foco: os de mudança + "Sem alteração" (recolhido); com foco: só os do indicador. */
export function montarGrupos(comp, foco) {
  const { ev } = comp
  const todos = [
    { id: 'concluidas', titulo: 'Concluídas', itens: ev.concluidas },
    { id: 'novos_atrasos', titulo: 'Novos atrasos', itens: ev.novosAtrasos },
    { id: 'regularizados', titulo: 'Atrasos resolvidos', itens: ev.concluidas.filter(ehRegularizada) },
    { id: 'acompanhamentos', titulo: 'Novos acompanhamentos', itens: ev.acompanhamentos },
    { id: 'anexos', titulo: 'Anexos', itens: ev.anexos },
    { id: 'sem_alteracao', titulo: 'Sem alteração', itens: ev.semAlteracao, recolhido: true },
  ]
  if (foco) return todos.filter((g) => FOCOS[foco].grupos.includes(g.id))
  return todos.filter((g) => g.itens.length > 0 || g.id !== 'anexos')
}

// --------------------------------------------------------------------------
// Textos dos cartões e da faixa de resumo
// --------------------------------------------------------------------------

function variacao(delta, { mais, menos, tomSobe, tomDesce }) {
  if (delta === 0) return { seta: '→', texto: 'Sem variação', tom: 'neutro' }
  return delta > 0
    ? { seta: '↑', texto: mais(delta), tom: tomSobe }
    : { seta: '↓', texto: menos(-delta), tom: tomDesce }
}

/**
 * Os 3 cartões comparativos: ações concluídas, acompanhamentos e anexos. `tom`: bom (verde) / ruim
 * (vermelho) / atencao (âmbar) / info (azul) / anexo (roxo) / neutro. O cartão de anexos sempre aparece;
 * sem anexos no app (standalone) o valor é 0, igual à aba "Anexos de evidência (0)" do plano.
 */
export function montarCards(comp) {
  const { de, para, adjacente, metricas } = comp
  const ligacao = (a, b) => (adjacente ? `${a} no mês anterior → ${b} neste mês` : `${a} em ${de.rotulo} → ${b} em ${para.rotulo}`)

  const dConcluidas = metricas.para.concluidas - metricas.de.concluidas
  const dAcomp = metricas.para.acompanhamentos - metricas.de.acompanhamentos
  const dAnexos = metricas.para.anexos - metricas.de.anexos

  return [
    {
      id: 'concluidas',
      rotulo: 'Ações concluídas',
      valor: metricas.para.concluidas,
      comparacao: ligacao(metricas.de.concluidas, metricas.para.concluidas),
      variacao: variacao(dConcluidas, {
        mais: (n) => `${plural(n, 'conclusão', 'conclusões')} a mais`,
        menos: (n) => `${plural(n, 'conclusão', 'conclusões')} a menos`,
        tomSobe: 'bom',
        tomDesce: 'atencao',
      }),
    },
    {
      id: 'acompanhamentos',
      rotulo: 'Acompanhamentos',
      valor: metricas.para.acompanhamentos,
      comparacao: ligacao(metricas.de.acompanhamentos, metricas.para.acompanhamentos),
      variacao: variacao(dAcomp, {
        mais: (n) => `${plural(n, 'registro')} a mais`,
        menos: (n) => `${plural(n, 'registro')} a menos`,
        tomSobe: 'info',
        tomDesce: 'info',
      }),
    },
    {
      id: 'anexos',
      rotulo: 'Anexos',
      valor: metricas.para.anexos,
      comparacao: ligacao(metricas.de.anexos, metricas.para.anexos),
      variacao: variacao(dAnexos, {
        mais: (n) => `${plural(n, 'anexo')} a mais`,
        menos: (n) => `${plural(n, 'anexo')} a menos`,
        tomSobe: 'anexo',
        tomDesce: 'anexo',
      }),
    },
  ]
}

/** Faixa "Resumo de Set/2026 — 2 ações concluídas · …": cada item vira filtro. */
export function montarFaixa(comp) {
  const { totais, para, de, adjacente, mesmo } = comp
  const parcial = para.atual ? ` (até ${dataCurta(para.refIso)})` : ''
  const titulo = adjacente || mesmo ? `Resumo de ${para.rotulo}${parcial}` : `Mudanças de ${de.rotulo} a ${para.rotulo}${parcial}`
  const itens = [
    { foco: 'concluidas', valor: totais.concluidas, texto: plural(totais.concluidas, 'ação concluída', 'ações concluídas'), tom: 'bom' },
    { foco: 'novos_atrasos', valor: totais.novosAtrasos, texto: plural(totais.novosAtrasos, 'novo atraso', 'novos atrasos'), tom: 'ruim' },
    { foco: 'acompanhamentos', valor: totais.acompanhamentos, texto: plural(totais.acompanhamentos, 'novo acompanhamento', 'novos acompanhamentos'), tom: 'info' },
    { foco: 'regularizados', valor: totais.regularizados, texto: plural(totais.regularizados, 'atraso regularizado', 'atrasos regularizados'), tom: 'bom' },
  ]
  if (comp.temAnexos) itens.push({ foco: 'anexos', valor: totais.anexos, texto: plural(totais.anexos, 'anexo'), tom: 'anexo' })
  return { titulo, itens }
}
