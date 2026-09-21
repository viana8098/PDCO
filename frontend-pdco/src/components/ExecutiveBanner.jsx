import { ContadorAnimado } from './Animados'
import { CultureGauge } from './CultureGauge'
import { InfoConclusao } from './InfoConclusao'

/**
 * Banner de topo das páginas de listagem — título do contexto + medidor(es)
 * de conclusão. `metricas.empresa` é opcional: quando ausente (gestor comum,
 * que só enxerga os próprios planos — não há como calcular um "% empresa"
 * legítimo sem acesso aos planos de outras áreas), mostra só um medidor.
 */
export function ExecutiveBanner({ titulo, totalPlanos, metricas }) {
    return (
        <section className="pdco-panel pdco-banner">
            <div className="pdco-banner-text">
                <h1 className="pdco-banner-title">{titulo}</h1>
                <p className="pdco-banner-sub">
                    Acompanhamento dos planos de desenvolvimento da cultura organizacional — <ContadorAnimado valor={totalPlanos} atraso={260} duracao={800} /> plano(s) em
                    andamento.
                </p>
            </div>
            <div className="pdco-banner-gauges">
                <p className="pdco-kicker pdco-kicker-info">
                    Conclusão de ações
                    <InfoConclusao comEmpresa={metricas.empresa != null} />
                </p>
                <div className="pdco-banner-gauges-row">
                    <CultureGauge score={metricas.area} label={metricas.empresa == null ? 'Meus planos' : 'Esta área'} suffix="%" />
                    {metricas.empresa != null && (
                        <>
                            <span className="pdco-banner-divider" />
                            <CultureGauge score={metricas.empresa} label="Empresa" suffix="%" />
                        </>
                    )}
                </div>
            </div>
        </section>
    )
}
