const SUPABASE_URL = 'https://bfecoklkpodmkgpktqoe.supabase.co'; // REEMPLAZAR CON TU URL 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmZWNva2xrcG9kbWtncGt0cW9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjkyMTMsImV4cCI6MjA4MDgwNTIxM30.f_3GfbDHAnBZKulBdYCOK2KENrMLCkpFGIha7TZXdDA'; // REEMPLAZAR CON TU KEY

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabaseClient;
console.log('✅ Supabase configurado');


