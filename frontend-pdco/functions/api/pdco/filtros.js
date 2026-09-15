// Responde /api/pdco/filtros lendo o snapshot estático em public/_data/pdco/filtros.json.
export async function onRequestGet({ request, env }) {
  const assetUrl = new URL('/_data/pdco/filtros.json', request.url)
  const resp = await env.ASSETS.fetch(new Request(assetUrl, request))
  if (!resp.ok) {
    return new Response(JSON.stringify({ detail: 'snapshot não encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(await resp.text(), { headers: { 'Content-Type': 'application/json' } })
}
