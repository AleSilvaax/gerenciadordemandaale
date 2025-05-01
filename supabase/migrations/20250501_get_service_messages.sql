
-- Create function to get service messages
CREATE OR REPLACE FUNCTION public.get_service_messages()
RETURNS SETOF service_messages
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.service_messages;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_service_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_service_messages() TO anon;
GRANT EXECUTE ON FUNCTION public.get_service_messages() TO service_role;
