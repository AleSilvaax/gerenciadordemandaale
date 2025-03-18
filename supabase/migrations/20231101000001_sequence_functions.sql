
-- Create a function to get the next value from a sequence
CREATE OR REPLACE FUNCTION public.nextval(seq_name text)
RETURNS BIGINT
LANGUAGE SQL
AS $$
  SELECT nextval(seq_name::regclass)
$$;
