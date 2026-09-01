import { NextResponse } from 'next/server'

/**
 * Diagnóstico do caminho exato que o layout raiz percorre.
 *
 * O /api/health prova que o banco responde, mas usa o client simples. O layout
 * usa outro caminho: createServerClient do @supabase/ssr sobre cookies(), mais
 * next/font e a montagem do metadata. Quando as páginas caem em 500 e o health
 * passa, a diferença está em algum desses passos — este endpoint executa cada
 * um em separado e devolve QUAL falhou, com a mensagem.
 *
 * Temporário: remover depois que a implantação estabilizar.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function tenta(nome: string, fn: () => Promise<unknown>) {
  try {
    const valor = await fn()
    return { passo: nome, ok: true, detalhe: typeof valor === 'string' ? valor : 'ok' }
  } catch (erro) {
    return {
      passo: nome,
      ok: false,
      erro: erro instanceof Error ? erro.message : String(erro),
      tipo: erro instanceof Error ? erro.constructor.name : typeof erro,
      stack: erro instanceof Error ? erro.stack?.split('\n').slice(0, 4).join(' | ') : undefined,
    }
  }
}

export async function GET() {
  const passos = []

  passos.push(
    await tenta('cookies()', async () => {
      const { cookies } = await import('next/headers')
      const store = await cookies()
      return `${store.getAll().length} cookies`
    })
  )

  passos.push(
    await tenta('createServerClient (@supabase/ssr)', async () => {
      const { createClient } = await import('@/lib/supabase/server')
      await createClient()
      return 'client criado'
    })
  )

  passos.push(
    await tenta('getStoreSettings()', async () => {
      const { getStoreSettings } = await import('@/lib/queries/settings')
      const s = await getStoreSettings()
      return `loja: ${s.store_name}`
    })
  )

  passos.push(
    await tenta('buildMetadata / SITE_URL', async () => {
      const { buildMetadata, SITE_URL } = await import('@/lib/seo')
      buildMetadata({ title: 'teste', description: 'teste', path: '/' })
      return `SITE_URL=${SITE_URL}`
    })
  )

  passos.push(
    await tenta('getCategories()', async () => {
      const { getCategories } = await import('@/lib/queries/catalog')
      const c = await getCategories()
      return `${c.length} categorias`
    })
  )

  passos.push(
    await tenta('getSessionUser()', async () => {
      const { getSessionUser } = await import('@/lib/auth')
      const u = await getSessionUser()
      return u ? 'usuario logado' : 'visitante'
    })
  )

  const falhou = passos.find((p) => !p.ok)

  return NextResponse.json(
    { ok: !falhou, primeiro_erro: falhou?.passo ?? null, passos },
    { status: falhou ? 503 : 200 }
  )
}
