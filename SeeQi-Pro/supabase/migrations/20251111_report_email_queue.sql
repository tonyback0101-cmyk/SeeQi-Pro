-- Report email queue table for pending report emails
CREATE TABLE IF NOT EXISTS public.report_email_queue (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_to text NOT NULL,
  locale text NOT NULL DEFAULT 'zh',
  report_id text NOT NULL,
  share_link text NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending | processing | sent | failed
  attempts smallint NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_report_email_queue_status ON public.report_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_report_email_queue_user ON public.report_email_queue(user_id);

