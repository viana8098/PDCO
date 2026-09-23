// Diagnóstico cultural por área (Forças Culturais + Taxa de contaminação) —
// planilha "Resultados_CRF_por_Area.xlsx" fornecida pela consultoria
// (Taigéta CFR, Guia de Desdobramento 2026). Sem endpoint no dw: colado aqui
// como snapshot estruturado; para atualizar, gerar de novo a partir de uma
// planilha mais recente. `contaminacao` vem na ordem em que a planilha lista
// os códigos; área sem nenhum ("NENHUMA"/"Nenhuma" na planilha) fica com [].
const RCF_POR_AREA = {
  "1.3 Governança Corporativa": { forcas: { regra: 79, mercado: 81, relacionamento: 84, inovacao: 81 }, contaminacao: [{ codigo: '3A', valor: 0.36 }] },
  "2.3.1 Educação Básica": { forcas: { regra: 81, mercado: 81, relacionamento: 83, inovacao: 75 }, contaminacao: [{ codigo: '3A', valor: 0.34 }, { codigo: '1O', valor: 0.33 }, { codigo: '4A', valor: 0.32 }, { codigo: '3P', valor: 0.29 }] },
  "3.4 Unidade Sesi Senai Agreste Sertão": { forcas: { regra: 82, mercado: 75, relacionamento: 77, inovacao: 66 }, contaminacao: [{ codigo: '3A', valor: 0.46 }] },
  "2.1.1.3 Suprimentos": { forcas: { regra: 74, mercado: 78, relacionamento: 68, inovacao: 74 }, contaminacao: [{ codigo: '3A', valor: 0.55 }] },
  "3.2 Unidade Sesi Tabuleiro": { forcas: { regra: 68, mercado: 80, relacionamento: 67, inovacao: 77 }, contaminacao: [{ codigo: '3A', valor: 0.59 }] },
  "3.3 Escola Sesi Centro": { forcas: { regra: 79, mercado: 74, relacionamento: 74, inovacao: 68 }, contaminacao: [{ codigo: '3A', valor: 0.47 }, { codigo: '3P', valor: 0.32 }, { codigo: '1O', valor: 0.32 }] },
  "2.5.1.3 Esporte": { forcas: { regra: 76, mercado: 71, relacionamento: 62, inovacao: 68 }, contaminacao: [{ codigo: '3A', valor: 0.6 }, { codigo: '3P', valor: 0.49 }] },
  "2.1.1.9 Gestão de Ativos": { forcas: { regra: 69, mercado: 55, relacionamento: 63, inovacao: 58 }, contaminacao: [{ codigo: '1S', valor: 0.33 }, { codigo: '2R', valor: 0.32 }, { codigo: '3A', valor: 0.41 }] },
  "2.6 Diretoria Comercial e Marketing": { forcas: { regra: 56, mercado: 46, relacionamento: 52, inovacao: 35 }, contaminacao: [{ codigo: '1O', valor: 0.37 }, { codigo: '2A', valor: 0.36 }, { codigo: '2R', valor: 0.31 }, { codigo: '3A', valor: 0.47 }, { codigo: '3P', valor: 0.68 }, { codigo: '4A', valor: 0.5 }, { codigo: '4P', valor: 0.73 }] },
  "1.5 Relações Institucionais": { forcas: { regra: 71, mercado: 89, relacionamento: 74, inovacao: 78 }, contaminacao: [{ codigo: '3A', valor: 0.5 }, { codigo: '1O', valor: 0.36 }, { codigo: '3P', valor: 0.35 }] },
  "3.1 Unidade Sesi Cambona": { forcas: { regra: 82, mercado: 79, relacionamento: 83, inovacao: 67 }, contaminacao: [] },
  "2.1.1.4 Contratação e Alienação": { forcas: { regra: 87, mercado: 82, relacionamento: 92, inovacao: 85 }, contaminacao: [] },
  "2.1.1.2 Financeiro": { forcas: { regra: 71, mercado: 68, relacionamento: 71, inovacao: 58 }, contaminacao: [{ codigo: '3A', valor: 0.43 }, { codigo: '4A', valor: 0.39 }] },
  "2.2.3 Gente e Cultura Organizacional": { forcas: { regra: 81, mercado: 88, relacionamento: 82, inovacao: 80 }, contaminacao: [{ codigo: '3A', valor: 0.43 }] },
  "3.6 Unidade Senai Poço": { forcas: { regra: 82, mercado: 75, relacionamento: 86, inovacao: 67 }, contaminacao: [] },
  "2.3.2 Educação Profissional": { forcas: { regra: 84, mercado: 76, relacionamento: 84, inovacao: 69 }, contaminacao: [{ codigo: '3A', valor: 0.36 }, { codigo: '3P', valor: 0.31 }] },
  "2.4 Diretoria de Tecnologia, Inovação e Sustentabilidade Industrial": { forcas: { regra: 66, mercado: 63, relacionamento: 65, inovacao: 46 }, contaminacao: [{ codigo: '1O', valor: 0.47 }, { codigo: '1S', valor: 0.34 }, { codigo: '3A', valor: 0.41 }, { codigo: '3P', valor: 0.36 }, { codigo: '4A', valor: 0.06 }, { codigo: '4P', valor: 0.34 }] },
  "2.5 Diretoria de Segurança e Saúde": { forcas: { regra: 78, mercado: 82, relacionamento: 85, inovacao: 71 }, contaminacao: [] },
  "2.2.1 Processos": { forcas: { regra: 65, mercado: 69, relacionamento: 74, inovacao: 60 }, contaminacao: [{ codigo: '1O', valor: 0.49 }, { codigo: '3A', valor: 0.52 }, { codigo: '3P', valor: 0.57 }, { codigo: '4A', valor: 0.41 }] },
  "2.2.4 Tecnologias Digitais": { forcas: { regra: 76, mercado: 98, relacionamento: 87, inovacao: 90 }, contaminacao: [{ codigo: '3A', valor: 0.38 }, { codigo: '3P', valor: 0.41 }, { codigo: 'AP', valor: 0.4 }] },
  "2.2.2 Estratégia Organizacional": { forcas: { regra: 64, mercado: 83, relacionamento: 66, inovacao: 69 }, contaminacao: [{ codigo: '3A', valor: 0.61 }, { codigo: '1O', valor: 0.41 }] },
  "1.4 Observatório": { forcas: { regra: 75, mercado: 77, relacionamento: 72, inovacao: 72 }, contaminacao: [{ codigo: '3A', valor: 0.57 }, { codigo: '3P', valor: 0.31 }, { codigo: '4A', valor: 0.31 }, { codigo: '4P', valor: 0.39 }] },
  "2.6.2 Comercial": { forcas: { regra: 73, mercado: 67, relacionamento: 70, inovacao: 60 }, contaminacao: [{ codigo: '3A', valor: 0.54 }, { codigo: '3P', valor: 0.36 }, { codigo: '4A', valor: 0.53 }, { codigo: '1O', valor: 0.38 }] },
  "2.1.1.6 Contabilidade": { forcas: { regra: 80, mercado: 91, relacionamento: 85, inovacao: 80 }, contaminacao: [] },
  "2.1.1.5 Departamento Pessoal": { forcas: { regra: 44, mercado: 68, relacionamento: 62, inovacao: 60 }, contaminacao: [{ codigo: '1O', valor: 0.59 }, { codigo: '1S', valor: 0.66 }, { codigo: '2R', valor: 0.34 }, { codigo: '3A', valor: 0.73 }, { codigo: '3P', valor: 0.47 }, { codigo: '4A', valor: 0.52 }] },
  "3.5 Unidade Sesi Senai Benedito Bentes": { forcas: { regra: 77, mercado: 82, relacionamento: 77, inovacao: 70 }, contaminacao: [{ codigo: '3A', valor: 0.42 }] },
  "2.1.1.1 Desenvolvimento Socioambiental": { forcas: { regra: 78, mercado: 72, relacionamento: 76, inovacao: 75 }, contaminacao: [{ codigo: '3A', valor: 0.44 }] },
  "2.1.1.8 Transporte": { forcas: { regra: 63, mercado: 77, relacionamento: 69, inovacao: 65 }, contaminacao: [{ codigo: '3A', valor: 0.61 }, { codigo: '1O', valor: 0.5 }] },
  "2.1.1.7 Engenharia": { forcas: { regra: 63, mercado: 66, relacionamento: 64, inovacao: 59 }, contaminacao: [{ codigo: '3A', valor: 0.44 }, { codigo: '1O', valor: 0.37 }, { codigo: '4A', valor: 0.36 }] },
}

// Diagnóstico único, válido para todos os planos Estratégicos (transversais —
// não têm área específica na planilha da consultoria, por isso não entram em
// RCF_POR_AREA). Fornecido pelo cliente em 23/09/2026.
export const DIAGNOSTICO_CULTURA_ORGANIZACIONAL = {
  forcas: { regra: 74, mercado: 70, relacionamento: 74, inovacao: 60 },
  contaminacao: [
    { codigo: '3A', valor: 0.3 },
    { codigo: '4A', valor: 0.28 },
    { codigo: '1O', valor: 0.28 },
    { codigo: '3P', valor: 0.25 },
    { codigo: '2R', valor: 0.25 },
    { codigo: '4P', valor: 0.24 },
    { codigo: '2A', valor: 0.21 },
    { codigo: '1S', valor: 0.19 },
  ],
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
        .replace(/[̀-ͯ]/g, '')
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

const ENTRADAS = Object.entries(RCF_POR_AREA).map(([area, dados]) => {
    const completo = normalizar(area)
    return { area, completo, dados, ...decompor(completo) }
})

const compartilha = (a, b) => [...a].some((p) => b.has(p))
const contem = (maior, menor) => menor.size > 0 && [...menor].every((p) => maior.has(p))

/** Diagnóstico cultural (Forças Culturais + Taxa de contaminação) da área de um plano Tático; null sem candidato seguro. */
export function obterRcfDaArea(areaNome) {
    const completo = normalizar(areaNome)
    if (!completo) return null
    const alvo = decompor(completo)

    const identica = ENTRADAS.find((e) => e.completo === completo)
    if (identica) return identica.dados

    if (alvo.codigo) {
        const mesmoCodigo = ENTRADAS.find((e) => e.codigo === alvo.codigo && compartilha(e.palavras, alvo.palavras))
        if (mesmoCodigo) return mesmoCodigo.dados
    }

    // Código conhecido pela planilha mas com nome sem nada em comum: não arrisca.
    if (alvo.codigo && ENTRADAS.some((e) => e.codigo === alvo.codigo)) return null

    const mesmoNome = ENTRADAS.filter((e) => e.nome && e.nome === alvo.nome)
    if (mesmoNome.length === 1) return mesmoNome[0].dados

    const parecidas = ENTRADAS.filter((e) => contem(e.palavras, alvo.palavras) || contem(alvo.palavras, e.palavras))
    return parecidas.length === 1 ? parecidas[0].dados : null
}
