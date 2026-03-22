CREATE TABLE IF NOT EXISTS wine_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  normalized_name TEXT UNIQUE NOT NULL,
  original_name TEXT,
  price_range TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
