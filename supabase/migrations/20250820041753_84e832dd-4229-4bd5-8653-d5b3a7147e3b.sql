-- Enable leaked password protection in auth settings
-- This is a critical security feature that prevents users from using passwords that have been compromised in data breaches

-- Enable leaked password protection
ALTER SYSTEM SET auth.leaked_password_check = true;

-- Force reload of the configuration (this will take effect on next auth operation)
SELECT pg_reload_conf();