// Cliente do PDCO. Em dev, o Vite faz proxy de /api -> backend-pdco (porta
// 8020, ver vite.config.js). No deploy do Cloudflare Pages, /api/pdco é
// respondido pelas Functions em functions/api/pdco/**, que leem o snapshot
// estático — a mesma URL funciona nos dois ambientes.
const BASE = '/api/pdco'

function buildUrl(path, params) {
    let url = BASE + path
    if (params) {
        const query = Object.entries(params)
            .filter(([, v]) => v != null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&')
        if (query) url += (url.includes('?') ? '&' : '?') + query
    }
    return url
}

async function request(path, { params } = {}) {
    let response
    try {
        response = await fetch(buildUrl(path, params), { headers: { Accept: 'application/json' } })
    } catch (causa) {
        throw new Error(`Falha de rede ao consultar ${path}: ${causa?.message ?? causa}`)
    }

    if (!response.ok) {
        let detail = `Erro ${response.status}`
        try {
            const corpo = await response.json()
            if (corpo?.detail) detail = corpo.detail
        } catch {
            /* corpo não é JSON — mantém a mensagem padrão */
        }
        throw new Error(detail)
    }

    return response.json()
}

export const api = {
    /**
     * Dia da última carga do dw (yyyy-mm-dd) por trás do snapshot. É um arquivo estático
     * (public/_data/pdco/atualizacao.json), não uma rota — sem Function nem backend no ar.
     */
    atualizacao: async () => {
        const response = await fetch('/_data/pdco/atualizacao.json', { headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error(`Erro ${response.status}`)
        return response.json()
    },

    /** Valores dos filtros (Plano / Ação / Área). `_user` é mantido pra compatibilidade com o painel original — sem uso aqui. */
    filtros: (_user) => request('/filtros'),

    /** Lista de planos (com execução e resumo de ações calculados). */
    planos: (_user, { plano, acao, area } = {}) => request('', { params: { plano, acao, area } }),

    /** Detalhe completo de um plano: info, ações, acompanhamento mensal e registro (somente-leitura). */
    plano: (_user, cdPlanoAcao) => request(`/${encodeURIComponent(cdPlanoAcao)}`),
}
