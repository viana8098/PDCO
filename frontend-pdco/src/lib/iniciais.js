// Duas iniciais a partir de um nome ("Mariana Costa" -> "MC"), para os avatares.
export function iniciaisDoNome(nome) {
    const partes = (nome || '').trim().split(/\s+/).filter(Boolean)
    if (partes.length === 0) return '?'
    if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}
