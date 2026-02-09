import { supabase } from '../services/supabase'

export async function getAuthenticatedUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
  }
  return user
}
