-- Product-page questions are genuine customer leads and should appear in the existing admin enquiry inbox.
ALTER TABLE public.service_enquiries DROP CONSTRAINT IF EXISTS service_enquiries_kind_check;
ALTER TABLE public.service_enquiries ADD CONSTRAINT service_enquiries_kind_check CHECK (kind IN ('repair','digital','product'));
