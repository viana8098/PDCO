// Registros de comitê "simulados" no standalone: existem só na memória da
// aba, nunca são enviados a nenhum servidor. Servem pra o visitante testar o
// passo a passo do formulário (Data → Ocorreu? → campos condicionais →
// Salvar) e também a edição de um comitê já registrado, sem comprometer nenhum
// dado real. Somem ao recarregar a página — mesmo padrão de
// lib/filtrosPersistentes.js (useSyncExternalStore, sem storage nenhum).
import { useSyncExternalStore } from 'react'

let registrosPorArea = new Map()
// Edições por `cd_comite` — vale pros registros simulados E pros de amostra (que são constantes e não
// podem ser mexidos): o histórico troca o original pela versão editada na hora de montar a lista.
let edicoes = new Map()
// `cd_comite` dos comitês "excluídos" nesta sessão — também vale pros de amostra, que são constantes: o histórico
// só deixa de mostrá-los. Um Set novo a cada exclusão (mesmo motivo do Map acima).
let exclusoes = new Set()
const ouvintes = new Set()
// Referência estável pra área sem nenhum registro ainda — devolver `[]` novo a cada
// chamada faria o useSyncExternalStore achar que o snapshot mudou toda hora (loop infinito).
const VAZIO = []

const assinar = (ouvinte) => {
    ouvintes.add(ouvinte)
    return () => ouvintes.delete(ouvinte)
}
const avisar = () => ouvintes.forEach((ouvinte) => ouvinte())

/** Adiciona um registro simulado no topo do histórico daquela área (mais recente primeiro). */
export function adicionarComiteSimulado(area, registro) {
    const lista = registrosPorArea.get(area) ?? []
    registrosPorArea = new Map(registrosPorArea).set(area, [registro, ...lista])
    avisar()
}

/** Guarda a versão editada de um comitê (simulado ou de amostra). Um Map novo a cada edição, pro React notar. */
export function editarComiteSimulado(cdComite, registro) {
    edicoes = new Map(edicoes).set(cdComite, registro)
    avisar()
}

/** "Exclui" um comitê (simulado ou de amostra) só nesta aba: some do histórico até recarregar a página. */
export function excluirComiteSimulado(cdComite) {
    exclusoes = new Set(exclusoes).add(cdComite)
    avisar()
}

/** Registros simulados de uma área (vazio se ninguém "salvou" nada ainda nesta sessão). */
export function useComitesSimulados(area) {
    return useSyncExternalStore(assinar, () => registrosPorArea.get(area) ?? VAZIO)
}

/** Edições feitas nesta sessão, por `cd_comite`. */
export function useEdicoesSimuladas() {
    return useSyncExternalStore(assinar, () => edicoes)
}

/** `cd_comite` dos comitês excluídos nesta sessão. */
export function useExclusoesSimuladas() {
    return useSyncExternalStore(assinar, () => exclusoes)
}
