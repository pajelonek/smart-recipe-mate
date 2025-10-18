
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
   'f47ac10b-58cc-4372-a567-0e02b2c3d479',
   'test@example.com',
   crypt('password123', gen_salt('bf')),
   now(),
   now(),
   now()
 );