// Filtros que sobrevivem à navegação. Cada página monta e desmonta quando o usuário troca de tela
// (abre um plano, volta, muda de aba do menu), e o estado local (useState) se perdia junto. Aqui o valor
// fica num armazém em memória do módulo: vale enquanto a página do navegador estiver aberta (a
// navegação do app não recarrega a página) e é limpo ao recarregar — sem storage, sem valor "grudado"
// que apareça de repente numa visita futura.
//
// Uso: const [area, setArea] = useFiltroPersistente('area', '') — igual a um useState, mas com chave.
// Chaves iguais em páginas diferentes COMPARTILHAM o valor (é assim que a área escolhida numa tela
// continua valendo nas outras). O valor padrão deve ser primitivo/constante (ex.: '', null, 'lista').

import { useCallback, useSyncExternalStore } from 'react'

const valores = new Map()
const ouvintes = new Set()

const assinar = (ouvinte) => {
    ouvintes.add(ouvinte)
    return () => ouvintes.delete(ouvinte)
}

export function useFiltroPersistente(chave, padrao) {
    const valor = useSyncExternalStore(assinar, () => (valores.has(chave) ? valores.get(chave) : padrao))

    const definir = useCallback(
        (novo) => {
            const atual = valores.has(chave) ? valores.get(chave) : padrao
            const proximo = typeof novo === 'function' ? novo(atual) : novo
            if (Object.is(proximo, atual)) return
            valores.set(chave, proximo)
            ouvintes.forEach((ouvinte) => ouvinte())
        },
        [chave, padrao],
    )

    return [valor, definir]
}
