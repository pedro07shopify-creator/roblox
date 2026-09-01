import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface StoreSettings {
  store_name: string
  store_tagline: string
  store_description: string
  logo_url: string
  favicon_url: string
  primary_color: string
  contact_email: string
  whatsapp_url: string
  instagram_url: string
  discord_url: string
  youtube_url: string
  tiktok_url: string
  seo_title: string
  seo_description: string
  seo_og_image: string
  checkout_terms_url: string
  show_social_proof: boolean
  show_reviews_home: boolean
  payment_pix_enabled: boolean
}

const FALLBACK: StoreSettings = {
  store_name: 'Roblox Store',
  store_tagline: 'Produtos digitais de Roblox com entrega imediata',
  store_description: '',
  logo_url: '/placeholders/logo.svg',
  favicon_url: '/favicon.ico',
  primary_color: '258 90% 62%',
  contact_email: '',
  whatsapp_url: '',
  instagram_url: '',
  discord_url: '',
  youtube_url: '',
  tiktok_url: '',
  seo_title: 'Roblox Store',
  seo_description: '',
  seo_og_image: '',
  checkout_terms_url: '/pagina/termos',
  show_social_proof: true,
  show_reviews_home: true,
  payment_pix_enabled: true,
}

/**
 * Configurações públicas da loja.
 *
 * Usa o client com chave anon de propósito: o RLS só devolve linhas com
 * is_public = true. Assim, mesmo que alguém marque uma chave sensível por
 * engano, ela não chega ao browser por este caminho.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('settings').select('key, value').eq('is_public', true)

  if (error || !data) return FALLBACK

  const map = Object.fromEntries(data.map((row) => [row.key, row.value]))

  return {
    ...FALLBACK,
    ...Object.fromEntries(
      Object.keys(FALLBACK).map((key) => {
        const value = map[key]
        return [key, value === undefined || value === null || value === '' ? FALLBACK[key as keyof StoreSettings] : value]
      })
    ),
  } as StoreSettings
})
