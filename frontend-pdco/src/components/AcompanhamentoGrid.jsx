import { formatarData } from '../lib/pdcoCalc'

/**
 * Lista (mais recente primeiro) dos acompanhamentos do dw — plano + ações,
 * já juntados em `acompanhamento` (ver domain/pdco.rules.ts#montarJanelaAcompanhamento).
 * Cada item mostra o texto, o mês do ciclo (8 meses a partir do início do
 * plano) e o responsável — usado na aba "Acompanhamentos do plano".
 */
export function AcompanhamentoGrid({ quadrantes, plano }) {
    const registros = quadrantes
        .flatMap((q) => q.registros.map((r) => ({ ...r, mes: q.mes })))
        .sort((a, b) => (b.data || '').localeCompare(a.data || ''))

    if (registros.length === 0) {
        return <p className="pdco-vazio">Nenhum acompanhamento registrado para este plano.</p>
    }

    return (
        <div className="pdco-acomp-list">
            {registros.map((registro, indice) => (
                <div className="pdco-acomp-item" key={indice}>
                    <p>{registro.texto}</p>
                    <p className="pdco-acomp-item-data">
                        Mês {registro.mes} · {plano.responsavel || '—'} · {formatarData(registro.data)}
                    </p>
                </div>
            ))}
        </div>
    )
}
