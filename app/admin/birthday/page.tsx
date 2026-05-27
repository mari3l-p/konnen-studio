import { createSupabaseServerClient } from '@/lib/supabase-server'
import BirthdayClient from './BirthdayClient'

export default async function BirthdayPage() {
  const supabase = await createSupabaseServerClient()

  // Traemos de la tabla perfiles solo a los que NO tienen el cumpleaños vacío
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, birthday')
    .not('birthday', 'is', null)

  return (
    <div className="p-6">
      <BirthdayClient profiles={profiles || []} />
    </div>
  )
}