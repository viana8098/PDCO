import { useEffect, useState } from 'react'
import { SearchableSelect } from './SearchableSelect'
import { useFiltroPersistente } from '../lib/filtrosPersistentes'
import { COMITE_AMOSTRA } from '../lib/comiteAmostra'
import { adicionarComiteSimulado, useComitesSimulados } from '../lib/comiteSimulacao'

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
const CHECKLIST_VAZIO = { lider: null, equipe: null, participacao: null, entregas: null, evidencias: null }
const ROTULO_RESPOSTA = Object.fromEntries(RESPOSTAS.map((r) => [r.valor, r.rotulo]))

/**
 * Conteúdo da seção "Comitê" dentro de Minha Área — versão standalone,
 * SIMULADA: o formulário funciona de verdade (mesmas perguntas, mesma
 * validação do app corporativo), mas "Salvar" nunca fala com um servidor —
 * só guarda o registro na memória da aba (lib/comiteSimulacao.js), pra
 * testar o passo a passo sem comprometer nenhum dado real. Some ao
 * recarregar a página. O registro de verdade fica só no app corporativo.
 * Mesma regra de perfil do app corporativo: só administrador vê o formulário
 * de novo registro e o checklist no histórico — quem não é ("Responsável")
 * só consulta data, se ocorreu e motivo/considerações. No standalone o
 * contexto sempre marca `administrador: true`, então isso fica inerte por
 * ora, mas a estrutura acompanha o app corporativo.
 */
export function ComiteSecao({ administrador, opcoesArea, carregandoFiltros }) {
    const [areaNome, setAreaNome] = useFiltroPersistente('comite:area', '')
    const simulados = useComitesSimulados(areaNome)
    const historicoBruto = [...simulados, ...COMITE_AMOSTRA]
    const historico = administrador ? historicoBruto : historicoBruto.map((c) => ({ ...c, checklist: null, diario_bordo: null }))

    const [data, setData] = useState('')
    const [ocorreu, setOcorreu] = useState(null)
    const [motivo, setMotivo] = useState('')
    const [consideracoes, setConsideracoes] = useState('')
    const [checklist, setChecklist] = useState(CHECKLIST_VAZIO)
    const [diarioBordo, setDiarioBordo] = useState('')
    const [salvo, setSalvo] = useState(false)

    // Trocar de área limpa o formulário: evita "salvar" um rascunho de uma área na área errada.
    useEffect(() => {
        setData('')
        setOcorreu(null)
        setMotivo('')
        setConsideracoes('')
        setChecklist(CHECKLIST_VAZIO)
        setDiarioBordo('')
        setSalvo(false)
    }, [areaNome])

    const podeSalvar = !!areaNome && !!data && (ocorreu === false ? motivo.trim() !== '' : ocorreu === true)

    function handleSalvar() {
        if (!podeSalvar) return
        const registro =
            ocorreu === false
                ? { cd_comite: `sim-${Date.now()}`, data, ocorreu: false, motivo_nao_ocorreu: motivo, simulado: true }
                : { cd_comite: `sim-${Date.now()}`, data, ocorreu: true, consideracoes, checklist, diario_bordo: diarioBordo.trim() || null, simulado: true }
        adicionarComiteSimulado(areaNome, registro)
        setSalvo(true)
        setData('')
        setOcorreu(null)
        setMotivo('')
        setConsideracoes('')
        setChecklist(CHECKLIST_VAZIO)
        setDiarioBordo('')
    }

    return (
        <div className="pdco-comite-secao">
            <div className="pdco-section-head">
                <h2 className="pdco-section-title">Comitê da Cultura</h2>
            </div>

            <p className="pdco-comite-aviso-simulacao">
                <b>Simulação:</b> este formulário não envia dado nenhum — o que você digitar fica só nesta aba e some ao
                recarregar a página. É só pra testar o passo a passo. Os registros reais ficam no app corporativo, com login
                de administrador.
            </p>

            <div className="pdco-filters-row">
                <div className="pdco-filter-pill">
                    <label>Área</label>
                    <SearchableSelect
                        value={areaNome}
                        onChange={setAreaNome}
                        options={opcoesArea}
                        todosLabel="Selecione uma área"
                        disabled={carregandoFiltros}
                    />
                </div>
            </div>

            {!areaNome ? (
                <p className="pdco-vazio">Escolha uma área para simular o registro de um comitê.</p>
            ) : (
                <>
                    {!administrador && (
                        <p className="pdco-comite-aviso-leitura">
                            Você vê o histórico dos comitês desta área. Só administradores registram um novo comitê.
                        </p>
                    )}

                    {administrador && (
                        <section className="pdco-panel">
                            <div className="pdco-panel-header">
                                <p className="pdco-kicker">Simular novo registro — {areaNome}</p>
                                <h2 className="pdco-panel-title">Comitê da Cultura</h2>
                            </div>

                            <div className="pdco-registro">
                                <div className="pdco-registro-campo">
                                    <label htmlFor="comite-data">Data do Comitê *</label>
                                    <input id="comite-data" type="date" className="pdco-input-data" value={data} onChange={(e) => setData(e.target.value)} />
                                </div>

                                <div className="pdco-registro-campo">
                                    <label id="comite-ocorreu-label">Ocorreu o comitê? *</label>
                                    <div className="pdco-toggle-group" role="radiogroup" aria-labelledby="comite-ocorreu-label">
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={ocorreu === true}
                                            className={ocorreu === true ? 'pdco-toggle-ativo' : ''}
                                            onClick={() => setOcorreu(true)}
                                        >
                                            Sim
                                        </button>
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={ocorreu === false}
                                            className={ocorreu === false ? 'pdco-toggle-ativo' : ''}
                                            onClick={() => setOcorreu(false)}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>

                                {ocorreu === false && (
                                    <div className="pdco-registro-campo">
                                        <label htmlFor="comite-motivo">Motivo da não realização do comitê *</label>
                                        <textarea id="comite-motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                                    </div>
                                )}

                                {ocorreu === true && (
                                    <>
                                        <div className="pdco-registro-campo">
                                            <label htmlFor="comite-consideracoes">Considerações sobre o momento (combinados e deliberações)</label>
                                            <textarea
                                                id="comite-consideracoes"
                                                rows={5}
                                                value={consideracoes}
                                                onChange={(e) => setConsideracoes(e.target.value)}
                                                placeholder="Observações, acordos, decisões, encaminhamentos, responsáveis e prazos discutidos no encontro."
                                            />
                                        </div>

                                        <div className="pdco-registro-campo">
                                            <label>Checklist da Efetividade do Comitê da Cultura</label>
                                            <div className="pdco-checklist">
                                                {CRITERIOS.map((c, indice) => (
                                                    <div className="pdco-checklist-linha" key={c.chave}>
                                                        <span className="pdco-checklist-pergunta">
                                                            <b>{indice + 1}.</b> {c.texto}
                                                        </span>
                                                        <div className="pdco-toggle-group" role="radiogroup" aria-label={c.texto}>
                                                            {RESPOSTAS.map((r) => (
                                                                <button
                                                                    type="button"
                                                                    key={r.valor}
                                                                    role="radio"
                                                                    aria-checked={checklist[c.chave] === r.valor}
                                                                    className={checklist[c.chave] === r.valor ? 'pdco-toggle-ativo' : ''}
                                                                    onClick={() => setChecklist((atual) => ({ ...atual, [c.chave]: r.valor }))}
                                                                >
                                                                    {r.rotulo}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pdco-registro-campo">
                                            <label htmlFor="comite-diario-bordo">Diário de bordo</label>
                                            <textarea
                                                id="comite-diario-bordo"
                                                rows={4}
                                                value={diarioBordo}
                                                onChange={(e) => setDiarioBordo(e.target.value)}
                                                placeholder="Anotações livres do administrador sobre este comitê."
                                            />
                                            <span className="pdco-registro-dica">Campo restrito: só administradores veem o diário de bordo.</span>
                                        </div>
                                    </>
                                )}

                                <div className="pdco-registro-rodape">
                                    <button type="button" className="pdco-save-button" disabled={!podeSalvar} onClick={handleSalvar}>
                                        Salvar comitê (simulação)
                                    </button>
                                    {salvo && <span className="pdco-registro-sucesso">Registrado na simulação — veja no histórico abaixo.</span>}
                                </div>
                            </div>
                        </section>
                    )}

                    <section className="pdco-panel">
                        <div className="pdco-panel-header">
                            <p className="pdco-kicker">Histórico (amostra + simulação)</p>
                            <h2 className="pdco-panel-title">Comitês registrados — {areaNome}</h2>
                            <p className="pdco-panel-subtitle">
                                Os itens marcados como simulação vieram do formulário acima, só nesta aba. Os demais são exemplo
                                fixo, ilustrativo.
                            </p>
                        </div>

                        <div className="pdco-comite-historico">
                            {historico.map((c) => (
                                <ComiteHistoricoItem key={c.cd_comite} comite={c} />
                            ))}
                        </div>
                    </section>
                </>
            )}
        </div>
    )
}

function formatarData(iso) {
    if (!iso) return '—'
    return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
}

/** Um item do histórico — mesma lógica condicional do formulário: só motivo, ou só considerações + checklist. */
function ComiteHistoricoItem({ comite }) {
    return (
        <div className="pdco-comite-item">
            <div className="pdco-comite-item-cabeca">
                <span className="pdco-comite-item-data">{formatarData(comite.data)}</span>
                <span className="pdco-comite-item-selos">
                    {comite.simulado && <span className="pdco-comite-item-selo-simulado">Simulação</span>}
                    <span className={`pdco-comite-item-status ${comite.ocorreu ? 'pdco-comite-item-ocorreu' : 'pdco-comite-item-nao-ocorreu'}`}>
                        {comite.ocorreu ? 'Ocorreu' : 'Não ocorreu'}
                    </span>
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
                    {comite.diario_bordo && (
                        <p className="pdco-comite-item-texto pdco-comite-item-quebras pdco-comite-item-diario">
                            <b>Diário de bordo:</b> {comite.diario_bordo}
                        </p>
                    )}
                </>
            )}
        </div>
    )
}
