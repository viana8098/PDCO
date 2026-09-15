import { createContext, useContext } from 'react'

const PdcoContext = createContext(null)

/**
 * Versão standalone: não tem iDigital, então não há "usuário" nem escopo por
 * gestor — a API já responde sempre com a visão consolidada
 * (`administrador: true`, ver backend-pdco/src/services/pdco.service.ts).
 * Mantém a mesma forma do contexto original só pra não precisar tocar nas
 * páginas/componentes que já chamam `usePdco()`.
 */
export function PdcoProvider({ children }) {
    const valor = { user: null, administrador: true, nome: '', carregando: false, erro: null, setErro: () => {} }
    return <PdcoContext.Provider value={valor}>{children}</PdcoContext.Provider>
}

export function usePdco() {
    const contexto = useContext(PdcoContext)
    if (!contexto) throw new Error('usePdco precisa estar dentro de <PdcoProvider>')
    return contexto
}
