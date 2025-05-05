-- Add attachment_url column to transactions table
ALTER TABLE transactions
ADD COLUMN attachment_url TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN transactions.attachment_url IS 'URL of the attachment file in Supabase Storage';