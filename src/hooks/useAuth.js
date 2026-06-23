import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(undefined)   // undefined = cargando
  const [rol, setRol]   = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setUser(null); return }
      setUser(session.user)
      const { data } = await supabase
        .from('clientes').select('rol')
        .eq('id_cliente', session.user.id).single()
      setRol(data?.rol ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) { setUser(null); setRol(null); return }
        setUser(session.user)
        const { data } = await supabase
          .from('clientes').select('rol')
          .eq('id_cliente', session.user.id).single()
        setRol(data?.rol ?? null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  return { user, rol, cargando: user === undefined }
}
