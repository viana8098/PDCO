import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { agruparPorArea, pctConcluido, tipoResumido, RAG_COLOR } from '../lib/pdcoCalc'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'

const NIVEIS = [
    { chave: 'todos', rotulo: 'Todos' },
    { chave: 'verde', rotulo: 'Verde' },
    { chave: 'amarelo', rotulo: 'Amarelo' },
    { chave: 'vermelho', rotulo: 'Vermelho' },
]

// Visão consolidada por área — só administrador (visão de leitura de todos
// os planos, sem PIN: o acesso já foi resolvido pela API em /pdco/acesso).
export default function Diretoria() {
    const { user, administrador, carregando } = usePdco()
    const [tipo, setTipo] = useState('todos')
    const [nivel, setNivel] = useState('todos')

    const planos = useAsync(() => api.planos(user), [user], !!user && administrador)

    const areas = useMemo(() => {
        const lista = tipo === 'todos' ? planos.dados ?? [] : (planos.dados ?? []).filter((p) => tipoResumido(p.subtipo) === tipo)
        return agruparPorArea(lista).filter((a) => nivel === 'todos' || a[nivel] > 0)
    }, [planos.dados, tipo, nivel])

    const contagem = { verde: 0, amarelo: 0, vermelho: 0 }
    areas.forEach((a) => {
        contagem.verde += a.verde
        contagem.amarelo += a.amarelo
        contagem.vermelho += a.vermelho
    })

    if (carregando) return <div className="pdco-page pdco-estado">Carregando…</div>
    if (!administrador) return <Navigate to="/" replace />
    if (!planos.dados) {
        return <div className="pdco-page">{planos.erro ? <p className="pdco-estado pdco-erro">{planos.erro}</p> : <p className="pdco-estado">Carregando…</p>}</div>
    }

    const totalPlanos = planos.dados.length
    const totalAcoes = planos.dados.reduce((s, p) => s + (p.resumo_acoes?.total ?? 0), 0)
    const pctAcoes = pctConcluido(planos.dados)

    return (
        <div className="pdco-page">
            <div className="pdco-page-head">
                <h1 className="pdco-page-title">Visão da Diretoria</h1>
                <p className="pdco-page-sub">Painel gerencial consolidado de todas as áreas. Clique numa área para detalhar.</p>
            </div>

            <div className="pdco-stat-grid">
                <Stat label="Total de planos" valor={totalPlanos} />
                <Stat label="Total de ações" valor={totalAcoes} />
                <Stat label="% ações concluídas" valor={`${pctAcoes}%`} />
                <div className="pdco-panel pdco-stat pdco-stat-rag">
                    <p className="pdco-stat-label">Distribuição RAG</p>
                    <div className="pdco-rag-bar">
                        {totalPlanos > 0 &&
                            [
                                ['verde', contagem.verde],
                                ['amarelo', contagem.amarelo],
                                ['vermelho', contagem.vermelho],
                            ].map(([k, v]) => v > 0 && (
                                <span key={k} style={{ width: `${(v / totalPlanos) * 100}%`, backgroundColor: RAG_COLOR[k] }} />
                            ))}
                    </div>
                    <div className="pdco-rag-legend">
                        <span style={{ color: RAG_COLOR.verde }}>V {contagem.verde}</span>
                        <span style={{ color: RAG_COLOR.amarelo }}>A {contagem.amarelo}</span>
                        <span style={{ color: RAG_COLOR.vermelho }}>R {contagem.vermelho}</span>
                    </div>
                </div>
            </div>

            <div className="pdco-filters-row">
                <div className="pdco-filter-pill">
                    <label htmlFor="dir-tipo">Tipo</label>
                    <select id="dir-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="todos">Todos os tipos</option>
                        <option value="Tático">Tático</option>
                        <option value="Estratégico">Estratégico</option>
                    </select>
                </div>
                <div className="pdco-toggle-group">
                    {NIVEIS.map((n) => (
                        <button key={n.chave} type="button" className={nivel === n.chave ? 'pdco-toggle-ativo' : ''} onClick={() => setNivel(n.chave)}>
                            {n.rotulo}
                        </button>
                    ))}
                </div>
            </div>

            <section className="pdco-panel">
                <div className="pdco-panel-header">
                    <h2 className="pdco-panel-title">Visão por área</h2>
                    <p className="pdco-panel-subtitle">Clique numa área para ver seus planos.</p>
                </div>
                <div className="pdco-area-list">
                    {areas.map((a) => (
                        <Link key={a.chave} to={`/area/${encodeURIComponent(a.chave)}`} className="pdco-area-row">
                            <div className="pdco-area-row-main">
                                <p className="pdco-area-row-nome">{a.nome}</p>
                                <p className="pdco-area-row-meta">{a.total} plano(s){a.atrasadas > 0 ? ` · ${a.atrasadas} ação(ões) em atraso` : ''}</p>
                            </div>
                            <div className="pdco-area-row-rag">
                                <span style={{ color: RAG_COLOR.verde }}>{a.verde}</span>
                                <span style={{ color: RAG_COLOR.amarelo }}>{a.amarelo}</span>
                                <span style={{ color: RAG_COLOR.vermelho }}>{a.vermelho}</span>
                            </div>
                            <span className="pdco-area-row-score">{a.score}</span>
                        </Link>
                    ))}
                    {areas.length === 0 && <p className="pdco-vazio">Nenhuma área corresponde aos filtros.</p>}
                </div>
            </section>
        </div>
    )
}

function Stat({ label, valor }) {
    return (
        <div className="pdco-panel pdco-stat">
            <p className="pdco-stat-label">{label}</p>
            <p className="pdco-stat-valor">{valor}</p>
        </div>
    )
}
