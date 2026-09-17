import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Combobox com busca — substitui um <select> nativo quando a lista de
 * opções é longa (Área/Ação). Setas percorrem, Enter escolhe, Esc fecha,
 * clique fora fecha. `options` no mesmo formato de OpcaoFiltro ({valor, rotulo}).
 */
export function SearchableSelect({ value, options, onChange, todosLabel, disabled, minimoParaBuscar = 6 }) {
    const [aberto, setAberto] = useState(false)
    const [termo, setTermo] = useState('')
    const [ativo, setAtivo] = useState(0)
    const raiz = useRef(null)
    const buscaRef = useRef(null)

    const selecionada = options.find((o) => o.valor === value)
    const rotuloAtual = selecionada ? selecionada.rotulo : todosLabel
    const comBusca = options.length >= minimoParaBuscar

    const filtradas = useMemo(() => {
        const alvo = termo.trim().toLowerCase()
        const lista = alvo ? options.filter((o) => o.rotulo.toLowerCase().includes(alvo)) : options
        return [{ valor: '', rotulo: todosLabel }, ...lista]
    }, [options, termo, todosLabel])

    useEffect(() => {
        if (!aberto) return
        function aoClicarFora(e) {
            if (raiz.current && !raiz.current.contains(e.target)) setAberto(false)
        }
        document.addEventListener('mousedown', aoClicarFora)
        return () => document.removeEventListener('mousedown', aoClicarFora)
    }, [aberto])

    useEffect(() => {
        if (aberto) {
            setTermo('')
            setAtivo(0)
            // preventScroll: sem isso, o foco no campo de busca faz o navegador
            // rolar a página inteira na horizontal em telas estreitas (a barra de
            // rolagem some, mas o body fica deslocado até o usuário rolar de volta).
            if (comBusca) setTimeout(() => buscaRef.current?.focus({ preventScroll: true }), 0)
        }
    }, [aberto])

    function escolher(opcao) {
        onChange(opcao.valor)
        setAberto(false)
    }

    function aoTeclar(e) {
        if (e.key === 'Escape') {
            setAberto(false)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setAtivo((i) => Math.min(i + 1, filtradas.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setAtivo((i) => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && filtradas[ativo]) {
            e.preventDefault()
            escolher(filtradas[ativo])
        }
    }

    return (
        <div className="pdco-searchable" ref={raiz}>
            <button
                type="button"
                className="pdco-searchable-trigger"
                disabled={disabled}
                onClick={() => setAberto((a) => !a)}
            >
                <span className="pdco-searchable-valor">{rotuloAtual}</span>
                <span className={`pdco-searchable-caret ${aberto ? 'pdco-searchable-caret-aberto' : ''}`}>▾</span>
            </button>

            {aberto && (
                <div className="pdco-searchable-painel" onKeyDown={aoTeclar}>
                    {comBusca && (
                        <input
                            ref={buscaRef}
                            className="pdco-searchable-busca"
                            placeholder="Buscar…"
                            value={termo}
                            onChange={(e) => {
                                setTermo(e.target.value)
                                setAtivo(0)
                            }}
                        />
                    )}
                    <ul className="pdco-searchable-lista">
                        {filtradas.map((opcao, indice) => (
                            <li key={opcao.valor || '__todos'}>
                                <button
                                    type="button"
                                    className={`pdco-searchable-item ${indice === ativo ? 'pdco-searchable-item-ativo' : ''} ${
                                        opcao.valor === value ? 'pdco-searchable-item-selecionado' : ''
                                    }`}
                                    onMouseEnter={() => setAtivo(indice)}
                                    onClick={() => escolher(opcao)}
                                >
                                    {opcao.rotulo}
                                </button>
                            </li>
                        ))}
                        {filtradas.length === 0 && <li className="pdco-searchable-vazio">Nada encontrado.</li>}
                    </ul>
                </div>
            )}
        </div>
    )
}
