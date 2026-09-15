// Responde /api/pdco?plano=&acao=&area= lendo o snapshot estático em
// public/_data/pdco/planos.json (lista completa) e filtrando aqui — o
// universo de planos do PDCO é pequeno, não precisa de arquivo por combinação.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const plano = url.searchParams.get('plano')
  const acao = url.searchParams.get('acao')
  const area = url.searchParams.get('area')

  const assetUrl = new URL('/_data/pdco/planos.json', request.url)
  const resp = await env.ASSETS.fetch(new Request(assetUrl, request))
  if (!resp.ok) {
    return new Response(JSON.stringify({ detail: 'snapshot não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let planos = await resp.json()
  if (plano) planos = planos.filter((p) => p.cd_planoacao === plano)
  if (area) planos = planos.filter((p) => p.area_nome === area)
  if (acao) planos = planos.filter((p) => (p.acoes_nomes || []).includes(acao))

  return new Response(JSON.stringify(planos), { headers: { 'Content-Type': 'application/json' } })
}
