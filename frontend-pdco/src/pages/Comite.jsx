import { Navigate } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { SearchableSelect } from '../components/SearchableSelect'
import { useFiltroPersistente } from '../lib/filtrosPersistentes'
import { usePdco } from '../lib/PdcoContext'
import { api } from '../lib/api'
import { COMITE_AMOSTRA } from '../lib/comiteAmostra'

const CRITERIOS = [
    { chave: 'lider', texto: 'O líder responsável esteve presente e participou do encontro?' },
    { chave: 'equipe', texto: 'Houve participação de outros integrantes da equipe no comitê?' },
    { chave: 'participacao', texto: 'Os participantes contribuíram com relatos, dúvidas ou propostas durante a discussão?' },
    { chave: 'entregas', texto: 'As entregas acordadas no comitê anterior foram realizadas dentro do prazo?' },
    { chave: 'evidencias', texto: 'A área apresentou evidências do andamento das ações e definiu os próximos passos, com responsáveis e prazos?' },
]
const RESPOSTAS = [
    { valor: 'atendeu', rotulo: 'Atendeu' },
    { valor: 'parcial', rotulo: 'Atendeu parcialmente' },
    { valor: 'nao_atendeu', rotulo: 'Não atendeu' },
]
const ROTULO_RESPOSTA = Object.fromEntries(RESPOSTAS.map((r) => [r.valor, r.rotulo]))

/**
 * Comitê da Cultura — versão standalone, só leitura. O registro de verdade
 * (data, motivo, considerações, checklist) fica no banco próprio do app
 * corporativo, que exige login de administrador; este deploy é estático e
 * público, sem backend pra sustentar essa escrita. Esta tela mostra uma
 * AMOSTRA fictícia (lib/comiteAmostra.js) só pra visualizar o layout — nunca
 * dado real de comitê.
 */
export default function Comite() {
    const { user, administrador, carregando } = usePdco()
    const [areaNome, setAreaNome] = useFiltroPersistente('comite:area', '')

    const filtros = useAsync(() => api.filtros(user), [user], !!user && administrador)
    const opcoesArea = filtros.dados?.areas ?? []

    if (carregando) return <div className="pdco-page pdco-estado">Carregando…</div>
    if (!administrador) return <Navigate to="/" replace />

    return (
        <div className="pdco-page">
            <div className="pdco-page-head">
                <h1 className="pdco-page-title">Comitê da Cultura</h1>
                <p className="pdco-page-sub">Registro dos encontros mensais de cada área com a consultoria.</p>
            </div>

            <div className="pdco-filters-row">
                <div className="pdco-filter-pill">
                    <label>Área</label>
                    <SearchableSelect
                        value={areaNome}
                        onChange={setAreaNome}
                        options={opcoesArea}
                        todosLabel="Selecione uma área"
                        disabled={!filtros.dados}
                    />
                </div>
            </div>

            {!areaNome ? (
                <p className="pdco-vazio">Escolha uma área para ver um exemplo do histórico de comitês.</p>
            ) : (
                <section className="pdco-panel">
                    <div className="pdco-panel-header">
                        <p className="pdco-kicker">Amostra — {areaNome}</p>
                        <h2 className="pdco-panel-title">Comitês registrados</h2>
                        <p className="pdco-panel-subtitle">
                            Dados de exemplo, só para visualização do layout. Os registros reais desta seção ficam no ambiente
                            corporativo, com login de administrador.
                        </p>
                    </div>

                    <div className="pdco-comite-historico">
                        {COMITE_AMOSTRA.map((c) => (
                            <ComiteHistoricoItem key={c.cd_comite} comite={c} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}

function formatarData(iso) {
    if (!iso) return '—'
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/** Um item do histórico — mesma lógica condicional do formulário corporativo: só motivo, ou só considerações + checklist. */
function ComiteHistoricoItem({ comite }) {
    return (
        <div className="pdco-comite-item">
            <div className="pdco-comite-item-cabeca">
                <span className="pdco-comite-item-data">{formatarData(comite.data)}</span>
                <span className={`pdco-comite-item-status ${comite.ocorreu ? 'pdco-comite-item-ocorreu' : 'pdco-comite-item-nao-ocorreu'}`}>
                    {comite.ocorreu ? 'Ocorreu' : 'Não ocorreu'}
                </span>
            </div>

            {!comite.ocorreu ? (
                <p className="pdco-comite-item-texto">
                    <b>Motivo:</b> {comite.motivo_nao_ocorreu || '—'}
                </p>
            ) : (
                <>
                    {comite.consideracoes && (
                        <p className="pdco-comite-item-texto pdco-comite-item-quebras">
                            <b>Considerações:</b> {comite.consideracoes}
                        </p>
                    )}
                    {comite.checklist && (
                        <ul className="pdco-comite-item-checklist">
                            {CRITERIOS.map((c, indice) => (
                                <li key={c.chave}>
                                    <span>
                                        {indice + 1}. {c.texto}
                                    </span>
                                    <b>{comite.checklist[c.chave] ? ROTULO_RESPOSTA[comite.checklist[c.chave]] : '—'}</b>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    )
}
