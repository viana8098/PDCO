// Diagnóstico cultural por área (Regra/Mercado/Relacionamento/Inovação e
// taxa de contaminação) — planilha "Resultados_CRF_por_Area.xlsx" fornecida
// pela consultoria (Taigéta CFR, Guia de Desdobramento 2026). Sem endpoint
// no dw: colado aqui como snapshot; para atualizar, gerar de novo a partir
// de uma planilha mais recente.
const RCF_POR_AREA = {
  "1.3 Governança Corporativa": "Forças Culturais\nRegra:79%\nMercado:81%\nRelacionamento:84%\nInovação:81%\nTaxa de contaminção 3A:0.36",
  "2.3.1 Educação Básica": "Força culturais\nRegra:81%\nMercado:81%\nRelacionamento:83%\nInovação:75%\nTaxa de contaminação\n3A:0.34\n1O:0.33\n4A:0.32\n3P:0.29",
  "3.4 Unidade Sesi Senai Agreste Sertão": "Força culturais:\nRegra:82%\nMercado:75%\nRelacionamento:77%\nInovação:66%\nTaxa de contaminação\n3A:0.46",
  "2.1.1.3 Suprimentos": "Força culturais\nRegra:74%\nMercado:78%\nRelacionamento:68%\nInovação:74%\nTaxa de contaminação\n3A:0.55",
  "3.2 Unidade Sesi Tabuleiro": "Força culturais\nRegra:68%\nMercado:80%\nRelacionamento:67%\nInovação:77%\nTaxa de contaminação:\n3A 0.59",
  "3.3 Escola Sesi Centro": "Força culturais\nRegra:79%\nMercado:74%\nRelacionamento:74%\nInovação:68%\nTaxa de contaminação\n3A:0.47\n3P:0.32\n1O:0.32",
  "2.5.1.3 Esporte": "Força culturais\nRegra:76%\nMercado:71%\nRelacionamento:62%\nInovação:68%\nTaxa de contaminação\n3A:0.6\n3P:0.49",
  "2.1.1.9 Gestão de Ativos": "Força culturais\nRegra:69%\nMercado:55%\nRelacionamento:63%\nInovação:58%\nTaxa de contaminação\n1S:0.33\n2R:0.32\n3A:0.41",
  "2.6 Diretoria Comercial e Marketing": "Força culturais\nRegra:56%\nMercado:46%\nRelacionamento:52%\nInovação:35%\nTaxa de contaminação\n1O:0.37\n2A:0.36\n2R:0.31\n3A:0.47\n3P:0.68\n4A:0.5\n4P:0.73",
  "1.5 Relações Institucionais": "Força culturais:\nRegra71%\nMercado:89%\nRelacionamento:74%\nInovação:78%\nTaxa de contaminação:\n3A 0.5\n1O 0.36\n3P 0.35",
  "3.1 Unidade Sesi Cambona": "Força culturais\nRegra:82%\nMercado:79%\nRelacionamento:83%\nInovação:67%\nTaxa de contaminação:\nNENHUMA",
  "2.1.1.4 Contratação e Alienação": "Força culturais\nRegra:87%\nMercado:82%\nRelacionamento:92%\nInovação:85%\nTaxa de contaminação:\nNENHUMA",
  "2.1.1.2 Financeiro": "Força culturais\nRegra:71%\nMercado:68%\nRelacionamento:71%\nInovação:58%\nTaxa de contaminação:\n3A:0.43 e 4A:0.39",
  "2.2.3 Gente e Cultura Organizacional": "Força culturais\nRegra:81%\nMercado:88%\nRelacionamento:82%\nInovação:80%\nTaxa de contaminação:\n3A:0.43",
  "3.6 Unidade Senai Poço": "Força culturais\nRegra:82%\nMercado:75%\nRelacionamento:86%\nInovação:67%\nTaxa de contaminação:\nNenhuma",
  "2.3.2 Educação Profissional": "Força culturais\nRegra:84%\nMercado:76%\nRelacionamento:84%\nInovação:69%\nTaxa de contaminação:\n3A 0.36\n3P 0.31",
  "2.4 Diretoria de Tecnologia, Inovação e Sustentabilidade Industrial": "Força culturais\nRegra:66%\nMercado:63%\nRelacionamento:65%\nInovação:46%\nTaxa de contaminação:\n1O:0.47\n1S:0.34\n3A:0.41\n3P:0.36\n4A:0.06\n4P:0.34",
  "2.5 Diretoria de Segurança e Saúde": "Força culturais\nRegra:78%\nMercado:82%\nRelacionamento:85%\nInovação:71%\nTaxa de contaminação:\nNenhuma",
  "2.2.1 Processos": "Força culturais:\nRegra:65%\nMercado:69%\nRelacionamento:74%\nInovação:60%\nTaxa de contaminação:\n1O 0.49\n3A 0.52\n3P 0.57\n4A 0.41",
  "2.2.4 Tecnologias Digitais": "Força culturais:\nRegra:76%\nMercado:98%\nRelacionamento:87%\nInovação:90%\nTaxa de contaminação:\n3A 0.38\n3P 0.41\nAP 0.40",
  "2.2.2 Estratégia Organizacional": "Força culturais:\nRegra:64%\nMercado:83%\nRelacionamento:66%\nInovação:69%\nTaxa de contaminação:\n3A 0.61\n1O 0.41",
  "1.4 Observatório": "Força culturais:\nRegra:75%\nMercado:77%\nRelacionamento:72%\nInovação:72%\nTaxa de contaminação:\n3A 0.57\n3P 0.31\n4A 0.31\n4P 0.39",
  "2.6.2 Comercial": "Força culturais:\nRegra:73%\nMercado:67%\nRelacionamento:70%\nInovação:60%\nTaxa de contaminação:\n3A 0.54\n3P 0.36\n4A 0.53\n1O 0.38",
  "2.1.1.6 Contabilidade": "Força culturais:\nRegra:80%\nMercado:91%\nRelacionamento:85%\nInovação:80%\nTaxa de contaminação:\nNenhuma",
  "2.1.1.5 Departamento Pessoal": "Força culturais:\nRegra:44%\nMercado:68%\nRelacionamento:62%\nInovação:60%\nTaxa de contaminação:\n1O 0.59\n1S 0.66\n2R 0.34\n3A 0.73\n3P 0.47\n4A 0.52",
  "3.5 Unidade Sesi Senai Benedito Bentes": "Força culturais:\nRegra:77%\nMercado:82%\nRelacionamento:77%\nInovação:70%\nTaxa de contaminação:\n3A 0.42",
  "2.1.1.1 Desenvolvimento Socioambiental": "Força culturais:\nRegra:78%\nMercado:72%\nRelacionamento:76%\nInovação:75%\nTaxa de contaminação:\n3A 0.44",
  "2.1.1.8 Transporte": "Força culturais:\nRegra:63%\nMercado:77%\nRelacionamento:69%\nInovação:65%\nTaxa de contaminação:\n3A 0.61\n1O 0.5",
  "2.1.1.7 Engenharia": "Força culturais:\nRegra:63%\nMercado:66%\nRelacionamento:64%\nInovação:59%\nTaxa de contaminação:\n3A 0.44\n1O 0.37\n4A 0.36",
}

// O nome da área no dw nem sempre é idêntico ao da planilha (ex.: planilha
// "1.4 Observatório", dw "1.4 Observatório Da Indústria"). O casamento tenta, em
// ordem, do mais seguro ao mais frouxo, e só aceita quando há um candidato claro:
//   1) nome idêntico (sem diferença de maiúsculas, acentos, pontuação ou espaços);
//   2) mesmo código da área (1.4, 2.2.3…) e ao menos uma palavra do nome em comum;
//   3) sem código (ou código que a planilha não tem): nome idêntico ao da planilha
//      sem o código, ou um nome contido no outro — só se houver um único candidato.
const PALAVRAS_VAZIAS = new Set(['a', 'o', 'as', 'os', 'da', 'de', 'do', 'das', 'dos', 'e', 'em'])

function normalizar(nome) {
    return (nome || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

/** "1.4 observatorio da industria" -> { codigo: '1.4', nome: 'observatorio da industria', palavras: Set } */
function decompor(nomeNormalizado) {
    const achado = nomeNormalizado.match(/^(\d+(?:\.\d+)*)\.?(?:\s+(.*))?$/)
    const codigo = achado ? achado[1] : null
    const nome = achado ? (achado[2] ?? '') : nomeNormalizado
    const palavras = new Set(nome.split(' ').filter((p) => p && !PALAVRAS_VAZIAS.has(p)))
    return { codigo, nome, palavras }
}

const ENTRADAS = Object.entries(RCF_POR_AREA).map(([area, texto]) => {
    const completo = normalizar(area)
    return { area, completo, texto, ...decompor(completo) }
})

const compartilha = (a, b) => [...a].some((p) => b.has(p))
const contem = (maior, menor) => menor.size > 0 && [...menor].every((p) => maior.has(p))

export function obterRcfDaArea(areaNome) {
    const completo = normalizar(areaNome)
    if (!completo) return null
    const alvo = decompor(completo)

    const identica = ENTRADAS.find((e) => e.completo === completo)
    if (identica) return identica.texto

    if (alvo.codigo) {
        const mesmoCodigo = ENTRADAS.find((e) => e.codigo === alvo.codigo && compartilha(e.palavras, alvo.palavras))
        if (mesmoCodigo) return mesmoCodigo.texto
    }

    // Código conhecido pela planilha mas com nome sem nada em comum: não arrisca.
    if (alvo.codigo && ENTRADAS.some((e) => e.codigo === alvo.codigo)) return null

    const mesmoNome = ENTRADAS.filter((e) => e.nome && e.nome === alvo.nome)
    if (mesmoNome.length === 1) return mesmoNome[0].texto

    const parecidas = ENTRADAS.filter((e) => contem(e.palavras, alvo.palavras) || contem(alvo.palavras, e.palavras))
    return parecidas.length === 1 ? parecidas[0].texto : null
}
