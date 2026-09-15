// Responde /api/pdco/<cdPlanoAcao> lendo o snapshot estático em
// public/_data/pdco/planos/<cdPlanoAcao>.json (um arquivo por plano).
export async function onRequestGet({ params, request, env }) {
  const cd = params.cdPlanoAcao
  const assetUrl = new URL(`/_data/pdco/planos/${encodeURIComponent(cd)}.json`, request.url)
  const resp = await env.ASSETS.fetch(new Request(assetUrl, request))
  if (!resp.ok) {
    return new Response(JSON.stringify({ detail: 'Plano não encontrado.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(await resp.text(), { headers: { 'Content-Type': 'application/json' } })
}
