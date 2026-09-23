import { useMemo } from 'react'
import { useAsync } from '../lib/useAsync'
import { PlanCard } from '../components/PlanCard'
import { ContadorAnimado } from '../components/Animados'
import { InfoStatus } from '../components/InfoStatus'
import { calcRag, tipoResumido, RAG_COLOR, RAG_LABEL } from '../lib/pdcoCalc'
import { useFiltroPersistente } from '../lib/filtrosPersistentes'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

/** Planos Estratégicos — visão compartilhada de todos os planos desse tipo entre as áreas. */
export default function Estrategicos() {
    const { user } = usePdco()
    const planos = useAsync(() => api.planos(user), [user], !!user)
    // A área é compartilhada com as outras telas (lib/filtrosPersistentes.js) pelo NOME; aqui é a chave da área.
    const [areaNome, setAreaNome] = useFiltroPersistente('area', '')

    const estrategicos = useMemo(() => (planos.dados ?? []).filter((p) => tipoResumido(p.subtipo) === 'Estratégico'), [planos.dados])

    const areas = useMemo(() => {
        const mapa = new Map()
        for (const p of estrategicos) {
            const chave = p.area_codigo || p.area_nome || 'sem-area'
            if (!mapa.has(chave)) mapa.set(chave, { chave, nome: p.area_nome || 'Sem área', total: 0 })
            mapa.get(chave).total++
        }
        return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome))
    }, [estrategicos])

    const areaFiltro = areaNome ? (areas.find((a) => a.nome === areaNome)?.chave ?? 'todas') : 'todas'
    const setAreaFiltro = (chave) => setAreaNome(chave === 'todas' ? '' : (areas.find((a) => a.chave === chave)?.nome ?? ''))

    const filtrados = areaFiltro === 'todas' ? estrategicos : estrategicos.filter((p) => (p.area_codigo || p.area_nome || 'sem-area') === areaFiltro)

    const contagem = { verde: 0, amarelo: 0, vermelho: 0 }
    filtrados.forEach((p) => contagem[calcRag(p).nivel]++)

    if (!planos.dados) {
        return <div className="pdco-page pdco-estado">{planos.erro ? <span className="pdco-erro">{planos.erro}</span> : 'Carregando planos…'}</div>
    }

    return (
        <div className="pdco-page">
            <div className="pdco-page-head">
                <h1 className="pdco-page-title">Planos Estratégicos</h1>
                <p className="pdco-page-sub">Visão compartilhada de todos os planos estratégicos entre as áreas.</p>
            </div>

            <div className="pdco-filters-row">
                <button
                    type="button"
                    className={`pdco-estrat-pill ${areaFiltro === 'todas' ? 'pdco-estrat-pill-ativa' : ''}`}
                    onClick={() => setAreaFiltro('todas')}
                >
                    Todas ({estrategicos.length})
                </button>
                {areas.map((a) => (
                    <button
                        type="button"
                        key={a.chave}
                        className={`pdco-estrat-pill ${areaFiltro === a.chave ? 'pdco-estrat-pill-ativa' : ''}`}
                        onClick={() => setAreaFiltro(a.chave)}
                    >
                        {a.nome} ({a.total})
                    </button>
                ))}
            </div>

            <div className="pdco-rag-legend-row">
                {['verde', 'amarelo', 'vermelho'].map((k) => (
                    <span key={k} style={{ color: RAG_COLOR[k] }}>
                        ● <ContadorAnimado valor={contagem[k]} /> {RAG_LABEL[k]}
                    </span>
                ))}
                <InfoStatus />
            </div>

            {filtrados.length === 0 ? (
                <p className="pdco-vazio">Nenhum plano estratégico nesta área.</p>
            ) : (
                <div className="pdco-card-grid" key={areaFiltro}>
                    {filtrados.map((p, i) => (
                        <PlanCard key={p.cd_planoacao} plano={p} indice={i} mostrarTipo={false} />
                    ))}
                </div>
            )}
        </div>
    )
}
