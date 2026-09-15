// Painel de texto simples (Arquétipos culturais / Resultados esperados):
// eyebrow + título + parágrafo. Reaproveitado nas duas seções.
export function TextoPanel({ kicker, titulo, texto }) {
    return (
        <section className="pdco-panel pdco-text-panel">
            <p className="pdco-kicker">{kicker}</p>
            <h2 className="pdco-panel-title" style={{ marginBottom: 10 }}>
                {titulo}
            </h2>
            <p>{texto || 'Não informado.'}</p>
        </section>
    )
}
