// Painel de texto simples (Resultados esperados): título + parágrafo.
export function TextoPanel({ titulo, texto }) {
    return (
        <section className="pdco-panel pdco-text-panel">
            <h2 className="pdco-panel-title" style={{ marginBottom: 10 }}>
                {titulo}
            </h2>
            <p>{texto || 'Não informado.'}</p>
        </section>
    )
}
