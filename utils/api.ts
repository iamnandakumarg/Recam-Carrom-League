// utils/api.ts
import { createClient } from '@supabase/supabase-js';

// It's best practice to store these in environment variables
const supabaseUrl = 'https://ssmwbfmlxgebdffbkrnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbXdiZm1seGdlYmRmZmJrcm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MjQ5MjYsImV4cCI6MjA3MzEwMDkyNn0.ZGeJHk-P8tLDgWHlDtkg49eBbKhZkK-w8ULgJGXDcTM';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and anon key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);