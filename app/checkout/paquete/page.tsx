import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import CheckoutClient from './CheckoutClient'

export default async function CheckoutPaquetePage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (!searchParams.id) redirect('/paquetes')

  const { data: pkg } = await supabase
    .from('packages')
    .select('*')
    .eq('id', searchParams.id)
    .single()

  if (!pkg) redirect('/paquetes')

  return <CheckoutClient pkg={pkg} profile={profile} />
}