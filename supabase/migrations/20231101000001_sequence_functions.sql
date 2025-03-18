
CREATE OR REPLACE FUNCTION public.nextval_for_service(seq_name text)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_val bigint;
BEGIN
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO new_val;
  RETURN new_val;
END;
$function$;
