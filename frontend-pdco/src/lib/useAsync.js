import { useEffect, useState } from 'react'

/**
 * Carrega dados assíncronos com estados de carregamento e erro, recarregando
 * sempre que uma das dependências muda.
 */
export function useAsync(fn, deps, habilitado = true) {
    const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null })

    useEffect(() => {
        if (!habilitado) return

        let ativo = true
        setEstado((atual) => ({ ...atual, carregando: true, erro: null }))
        fn()
            .then((dados) => ativo && setEstado({ dados, carregando: false, erro: null }))
            .catch((e) => ativo && setEstado({ dados: null, carregando: false, erro: String(e?.message ?? e) }))

        return () => {
            ativo = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, habilitado])

    return estado
}
