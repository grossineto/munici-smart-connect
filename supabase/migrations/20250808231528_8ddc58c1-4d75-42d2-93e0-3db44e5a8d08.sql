-- Create table for saving Perplexity user settings per tenant
CREATE TABLE IF NOT EXISTS public.perplexity_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  recency text NOT NULL DEFAULT 'week',
  scope text NOT NULL DEFAULT 'amplo',
  max_articles integer NOT NULL DEFAULT 3,
  deduplicate boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add constraints idempotently
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.perplexity_settings'::regclass
      AND conname = 'perplexity_settings_recency_check'
  ) THEN
    ALTER TABLE public.perplexity_settings
    ADD CONSTRAINT perplexity_settings_recency_check CHECK (recency IN ('day','week','month'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.perplexity_settings'::regclass
      AND conname = 'perplexity_settings_scope_check'
  ) THEN
    ALTER TABLE public.perplexity_settings
    ADD CONSTRAINT perplexity_settings_scope_check CHECK (scope IN ('amplo','local','restrito'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.perplexity_settings'::regclass
      AND conname = 'perplexity_settings_max_articles_check'
  ) THEN
    ALTER TABLE public.perplexity_settings
    ADD CONSTRAINT perplexity_settings_max_articles_check CHECK (max_articles BETWEEN 1 AND 10);
  END IF;
END $$;

-- Ensure single row per user+tenant
CREATE UNIQUE INDEX IF NOT EXISTS ux_perplexity_settings_user_tenant
  ON public.perplexity_settings (user_id, tenant_id);

-- Enable Row Level Security
ALTER TABLE public.perplexity_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can view their perplexity settings"
ON public.perplexity_settings
FOR SELECT
USING (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

CREATE POLICY IF NOT EXISTS "Users can insert their perplexity settings"
ON public.perplexity_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

CREATE POLICY IF NOT EXISTS "Users can update their perplexity settings"
ON public.perplexity_settings
FOR UPDATE
USING (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

CREATE POLICY IF NOT EXISTS "Users can delete their perplexity settings"
ON public.perplexity_settings
FOR DELETE
USING (auth.uid() = user_id AND public.user_has_tenant(tenant_id));

-- Trigger to keep updated_at fresh (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_perplexity_settings_updated_at'
  ) THEN
    CREATE TRIGGER trg_perplexity_settings_updated_at
    BEFORE UPDATE ON public.perplexity_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;