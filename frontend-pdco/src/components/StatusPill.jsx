import { classeStatus } from '../lib/pdcoCalc'

// Chip de status de uma ação/plano. A cor vem de pdco.css (pdco-status-<slug>,
// case-insensitive e sem acento); status que a EPA ainda não usou cai no
// visual neutro padrão (pdco-status-chip), sem quebrar.
export function StatusPill({ status }) {
    return <span className={`pdco-status-chip pdco-status-${classeStatus(status)}`}>{status || '—'}</span>
}
