import { createClient } from "@supabase/supabase-js";

interface DemoLoginRequest {
  method?: string;
  body?: unknown;
}

interface DemoLoginResponse {
  status: (code: number) => { json: (payload: unknown) => void };
}

const DEMO_EMAILS = new Set([
  "admin.demo@costasur.com",
  "owner.demo@costasur.com",
  "architect.demo@costasur.com",
  "contractor.demo@costasur.com",
  "review.demo@costasur.com",
  "control.demo@costasur.com",
  "legal.demo@costasur.com",
  "electrica.demo@costasur.com",
  "hidrosanitaria.demo@costasur.com",
  "paisajismo.demo@costasur.com",
  "mensura.demo@costasur.com",
  "seguridad.demo@costasur.com",
]);

export default async function handler(request: DemoLoginRequest, response: DemoLoginResponse) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Método no permitido." });
  }

  const body = request.body && typeof request.body === "object" ? request.body as { email?: unknown } : {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = process.env.DEMO_LOGIN_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

  if (!DEMO_EMAILS.has(email)) {
    return response.status(400).json({ error: "Perfil demo no válido." });
  }

  if (!password || !supabaseUrl || !supabaseAnonKey) {
    return response.status(503).json({ error: "El acceso demo no está configurado en este entorno." });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return response.status(401).json({ error: error?.message ?? "No fue posible iniciar la sesión demo." });
  }

  return response.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_in: data.session.expires_in,
    expires_at: data.session.expires_at,
    token_type: data.session.token_type,
    user: data.user,
  });
}
