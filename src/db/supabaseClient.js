import { createClient } from '@supabase/supabase-js'

// Aquí Vite lee mágicamente las llaves secretas que guardamos en el archivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ ¡Faltan las credenciales de Supabase en .env.local!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)