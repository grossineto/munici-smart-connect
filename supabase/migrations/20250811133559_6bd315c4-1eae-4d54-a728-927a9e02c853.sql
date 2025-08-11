-- Harden notifications INSERT permissions and guard privileged function
-- 1) Drop overly-permissive policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- 2) Add strict INSERT policies
-- Allow users to create notifications only for themselves
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins and moderators to insert for any user (used for backoffice tools if needed)
CREATE POLICY "Admins and moderators can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'moderator'::public.app_role)
);

-- 3) Guard the SECURITY DEFINER helper to prevent abuse via RPC
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'info',
  _action_url text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_id UUID;
  v_is_admin BOOLEAN := COALESCE(public.has_role(auth.uid(), 'admin'::public.app_role)
                           OR public.has_role(auth.uid(), 'moderator'::public.app_role), false);
BEGIN
  -- Allow when called by service role (no JWT => auth.uid() is null),
  -- or inside triggers (pg_trigger_depth>0),
  -- or by admins/moderators, or by the user for themselves
  IF auth.uid() IS NULL OR pg_trigger_depth() > 0 OR v_is_admin OR auth.uid() = _user_id THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
    VALUES (_user_id, _title, _message, _type, _action_url, _metadata)
    RETURNING id INTO notification_id;
    RETURN notification_id;
  ELSE
    RAISE EXCEPTION 'Not authorized to create notifications';
  END IF;
END;
$function$;