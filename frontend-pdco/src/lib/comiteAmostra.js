// Amostra ilustrativa do Comitê da Cultura — dados FICTÍCIOS, só para mostrar
// como a seção fica neste ambiente público (Cloudflare). Os registros reais
// (considerações e checklist de cada encontro com a consultoria) existem só
// no app corporativo, com login de administrador e banco próprio
// (dbo.pdco_comite) — nunca são exportados pro snapshot público.
export const COMITE_AMOSTRA = [
    {
        cd_comite: 'amostra-1',
        data: '2026-08-18',
        ocorreu: true,
        consideracoes:
            'Texto de exemplo: a área apresentou o andamento das ações do mês, discutiu prioridades para o próximo ciclo e definiu responsáveis pelas próximas entregas.',
        checklist: { lider: 'atendeu', equipe: 'atendeu', participacao: 'parcial', entregas: 'atendeu', evidencias: 'atendeu' },
    },
    {
        cd_comite: 'amostra-2',
        data: '2026-07-21',
        ocorreu: false,
        motivo_nao_ocorreu: 'Texto de exemplo: comitê remarcado por indisponibilidade de agenda dos participantes.',
    },
    {
        cd_comite: 'amostra-3',
        data: '2026-06-16',
        ocorreu: true,
        consideracoes: 'Texto de exemplo: revisão do plano de ação, alinhamento de prazos e combinados para o próximo encontro.',
        checklist: { lider: 'atendeu', equipe: 'nao_atendeu', participacao: 'atendeu', entregas: 'parcial', evidencias: 'parcial' },
    },
]
