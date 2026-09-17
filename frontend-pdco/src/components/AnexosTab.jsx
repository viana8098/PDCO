import { useState } from 'react'

const MESES = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * Aba "Anexos de evidência" — visual fiel à referência (seletor de mês +
 * botão de anexar), mas sem persistência: esta versão é um deploy estático
 * no Cloudflare Pages, sem backend para guardar arquivo nenhum. Mesmo
 * padrão do admin do PRESIDENTE (escrita desabilitada com aviso, ver
 * frontend-presidente/functions/api/admin/[[path]].ts).
 */
export function AnexosTab() {
    const [mes, setMes] = useState(1)
    const [aviso, setAviso] = useState(false)

    return (
        <div className="pdco-anexos-tab">
            <div className="pdco-anexos-topo">
                <p className="pdco-vazio" style={{ padding: 0 }}>
                    Nenhum anexo. As evidências são inseridas apenas no plano (não nas ações).
                </p>
                <div className="pdco-anexos-controles">
                    <label className="pdco-anexos-mes-label">
                        Mês
                        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                            {MESES.map((m) => (
                                <option key={m} value={m}>
                                    Mês {m}
                                </option>
                            ))}
                        </select>
                    </label>
                    <button type="button" className="pdco-save-button" onClick={() => setAviso(true)}>
                        Anexar evidência
                    </button>
                </div>
            </div>

            {aviso && (
                <p className="pdco-anexos-aviso">
                    Recurso não disponível nesta versão estática — o deploy não tem backend para persistir arquivos.
                </p>
            )}
        </div>
    )
}
