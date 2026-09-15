// Painel "Registro qualitativo": pontos críticos, fatores de sucesso e itens
// fora do escopo. Sempre somente-leitura nesta versão — o deploy estático
// não tem backend próprio para persistir gravações (ver backend-pdco).
export function RegistroQualitativoForm({ registro }) {
    return (
        <section className="pdco-panel">
            <div className="pdco-panel-header">
                <p className="pdco-kicker">Registro qualitativo</p>
                <h2 className="pdco-panel-title">Acompanhamento qualitativo</h2>
            </div>

            <div className="pdco-registro">
                <div className="pdco-registro-campo">
                    <label>Pontos críticos</label>
                    <textarea value={registro.pontos_criticos || ''} disabled rows={3} />
                </div>

                <div className="pdco-registro-campo">
                    <label>Fatores de sucesso</label>
                    <textarea value={registro.fatores_sucesso || ''} disabled rows={3} />
                </div>

                <div className="pdco-registro-campo">
                    <label>Itens fora do escopo</label>
                    <textarea value={registro.itens_fora_escopo || ''} disabled rows={3} />
                </div>

                <p className="pdco-registro-somente-leitura">
                    Somente leitura nesta versão — o deploy é estático, sem backend para persistir gravações.
                </p>
            </div>
        </section>
    )
}
