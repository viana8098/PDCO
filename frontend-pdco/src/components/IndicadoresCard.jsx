// Painel "Indicadores / KR" — best-effort (ver escopo funcional): só
// aparece quando a API devolve indicadores vinculados ao plano.
export function IndicadoresCard({ indicadores }) {
    return (
        <section className="pdco-panel">
            <div className="pdco-panel-header">
                <p className="pdco-kicker">Acompanhamento estratégico</p>
                <h2 className="pdco-panel-title">Indicadores / KR</h2>
            </div>

            <div className="pdco-indicator-grid">
                {indicadores.map((indicador, indice) => (
                    <div className="pdco-indicator-card" key={indicador.cd_codigo ?? indice}>
                        <p className="pdco-kicker">KR-{String(indice + 1).padStart(2, '0')}</p>
                        <p className="pdco-indicator-nome">{indicador.nome}</p>
                        <div className="pdco-indicator-valor">{indicador.realizado ?? '-'}</div>
                        <div className="pdco-indicator-meta">de {indicador.meta ?? '-'}</div>
                    </div>
                ))}
            </div>
        </section>
    )
}
