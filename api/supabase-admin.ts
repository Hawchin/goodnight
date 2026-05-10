import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://aktuauhkppmmqhjfuzrw.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHVhdWhrcHBtbXFoamZ1enJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODQxMzMxMCwiZXhwIjoyMDkzOTg5MzEwfQ.3KOmPZHl2WCCysuFWsMSXZTzZfMiSb_VZlKzGM_uZEw'

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function initializeDatabase() {
  const { error } = await supabase.rpc('exec', {
    sql: `
      CREATE TABLE IF NOT EXISTS submissions (
        id BIGSERIAL PRIMARY KEY,
        types TEXT NOT NULL,
        text_content TEXT,
        image_urls TEXT,
        audio_url TEXT,
        nickname TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
      CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

      CREATE TABLE IF NOT EXISTS sensitive_words (
        id BIGSERIAL PRIMARY KEY,
        word TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS admin_users (
        id BIGSERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL
      );
    `
  })

  if (error) {
    console.error('Database initialization error:', error)
  }

  return { error }
}
