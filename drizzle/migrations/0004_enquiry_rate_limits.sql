CREATE TABLE public.enquiry_rate_limits (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), visitor_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.enquiry_rate_limits TO service_role;
ALTER TABLE public.enquiry_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX enquiry_rate_limits_visitor_idx ON public.enquiry_rate_limits (visitor_hash, created_at DESC);