import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MembresiastClient from './MembresiastClient'

export default async function MembresiasPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: userPackages } = await supabase
    .from('user_packages')
    .select('*, packages(title, class_type, classes_count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <MembresiastClient profile={profile} userPackages={userPackages ?? []} />
}