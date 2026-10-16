/*
  # Remove unique constraint from clients email

  1. Changes
    - Remove unique constraint from clients.email column
    - Allow multiple clients with same email/phone
    - Update error handling in application

  2. Security
    - Maintain RLS policies
    - Keep data integrity for other fields
*/

-- Remove the unique constraint on email
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_key;

-- Add index for performance (non-unique)
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);