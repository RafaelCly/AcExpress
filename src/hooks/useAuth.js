import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

async function fetchRol(userId) {
  const { data } = await supabase
    .from('clientes').select('rol')
    .eq('id_cliente', userId).single()
  return data?.rol ?? null
}

export function useAuth() {
  const [user, setUser]       = useState(undefined)  // undefined = cargando
  const [rol, setRol]         = useState(undefined)  // undefined = cargando

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setUser(null); setRol(null); return }
      setUser(session.user)
      setRol(await fetchRol(session.user.id))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { setUser(null); setRol(null); return }
        setUser(session.user)
        setRol(await fetchRol(session.user.id))
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // cargando mientras user O rol sigan siendo undefined
  const cargando = user === undefined || rol === undefined

  return { user, rol, cargando }
}
