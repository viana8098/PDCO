import { InfoTooltip } from './InfoTooltip'

// Mesmo limite da API (TAMANHO_MAXIMO_BYTES e TIPOS_PERMITIDOS em pdco.anexo.service.ts) — aqui é só o
// aviso; quem barra o arquivo é a API.
const TAMANHO_MAXIMO_MB = 10

/** "i" sutil ao lado do botão "Anexar evidência": formatos aceitos e tamanho máximo, em tooltip. */
export function InfoAnexos() {
    return (
        <InfoTooltip rotulo="Formatos aceitos e tamanho máximo dos anexos" estreito>
            <p className="pdco-info-titulo">Anexos de evidência</p>
            <p>
                <strong>Formatos aceitos:</strong> PDF, Excel (.xls, .xlsx), Word (.doc, .docx) e imagem (.png, .jpg, .jpeg).
            </p>
            <p>
                <strong>Tamanho máximo:</strong> {TAMANHO_MAXIMO_MB} MB por arquivo.
            </p>
        </InfoTooltip>
    )
}
