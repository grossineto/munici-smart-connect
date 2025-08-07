import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the current user's tenant_id (first membership), or null if not found.
 * Caches the value in memory per session to avoid repeated queries.
 */
let cachedTenantId: string | null | undefined;
export async function getCurrentTenantId(): Promise<string | null> {
  if (cachedTenantId !== undefined) return cachedTenantId ?? null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    cachedTenantId = null;
    return null;
  }
  const { data, error } = await supabase
    .from("user_tenants")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1);
  if (error) {
    console.error("getCurrentTenantId error", error);
    cachedTenantId = null;
    return null;
  }
  cachedTenantId = data?.[0]?.tenant_id ?? null;
  return cachedTenantId;
}
