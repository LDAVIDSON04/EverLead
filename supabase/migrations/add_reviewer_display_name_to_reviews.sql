-- Store reviewer display name (e.g. "Sarah P.") on the review when submitted so it never changes if lead/appointment data is updated.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS reviewer_display_name TEXT;

COMMENT ON COLUMN public.reviews.reviewer_display_name IS 'Reviewer name as displayed (e.g. First L.); set when review is submitted so display is stable.';
