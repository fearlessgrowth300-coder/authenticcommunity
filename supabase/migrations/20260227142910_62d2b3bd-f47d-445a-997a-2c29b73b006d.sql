-- Enable pgcrypto extension for gen_salt and crypt functions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;