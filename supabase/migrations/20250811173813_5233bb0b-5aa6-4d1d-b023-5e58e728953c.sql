-- Create table for storing per-user, per-tenant Perplexity settings
CREATE TABLE IF NOT EXISTS public.perplexity_settings (
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  recency text NOT NULL DEFAULT 'week',
  scope text NOT NULL DEFAULT 'amplo',
  max_articles integer NOT NULL DEFAULT 0, -- 0 = sem limite
  deduplicate boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT perplexity_settings_pkey PRIMARY KEY (user_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.perplexity_settings ENABLE ROW LEVEL SECURITY;

-- Policies: allow users to manage their own settings within their tenant
CREATE POLICY "Users can view their own Perplexity settings"
ON public.perplexity_settings
FOR SELECT
USING (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

CREATE POLICY "Users can insert their own Perplexity settings"
ON public.perplexity_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

CREATE POLICY "Users can update their own Perplexity settings"
ON public.perplexity_settings
FOR UPDATE
USING (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_perplexity_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_perplexity_settings_updated_at
    BEFORE UPDATE ON public.perplexity_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Helpful index
CREATE INDEX IF NOT EXISTS idx_perplexity_settings_tenant ON public.perplexity_settings (tenant_id);
