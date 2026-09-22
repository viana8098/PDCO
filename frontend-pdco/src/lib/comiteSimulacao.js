// Registros de comitê "simulados" no standalone: existem só na memória da
// aba, nunca são enviados a nenhum servidor. Servem pra o visitante testar o
// passo a passo do formulário (Data → Ocorreu? → campos condicionais →
// Salvar) sem comprometer nenhum dado real. Somem ao recarregar a página —
// mesmo padrão de lib/filtrosPersistentes.js (useSyncExternalStore, sem
// storage nenhum).
import { useSyncExternalStore } from 'react'

const registrosPorArea = new Map()
const ouvintes = new Set()
// Referência estável pra área sem nenhum registro ainda — devolver `[]` novo a cada
// chamada faria o useSyncExternalStore achar que o snapshot mudou toda hora (loop infinito).
const VAZIO = []

const assinar = (ouvinte) => {
    ouvintes.add(ouvinte)
    return () => ouvintes.delete(ouvinte)
}

/** Adiciona um registro simulado no topo do histórico daquela área (mais recente primeiro). */
export function adicionarComiteSimulado(area, registro) {
    const lista = registrosPorArea.get(area) ?? []
    registrosPorArea.set(area, [registro, ...lista])
    ouvintes.forEach((ouvinte) => ouvinte())
}

/** Registros simulados de uma área (vazio se ninguém "salvou" nada ainda nesta sessão). */
export function useComitesSimulados(area) {
    return useSyncExternalStore(assinar, () => registrosPorArea.get(area) ?? VAZIO)
}
