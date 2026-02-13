#!/usr/bin/env node
/**
 * One-time setup: create electron/auth-config.json from project .env.local
 * so the Electron app can log in. Run from repo root: node electron/create-auth-config.js
 * Or from electron/: node create-auth-config.js (reads ../.env.local).
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');
const outPath = path.join(__dirname, 'auth-config.json');

function parseEnv(content) {
  const out = {};
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
  return out;
}

let url = '';
let anonKey = '';
try {
  const content = fs.readFileSync(envPath, 'utf8');
  const env = parseEnv(content);
  url = env.NEXT_PUBLIC_SUPABASE_URL || '';
  anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
} catch (e) {
  console.warn('No .env.local found or unreadable. Create electron/auth-config.json manually from auth-config.example.json');
  process.exit(1);
}

if (!url || !anonKey) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

fs.writeFileSync(outPath, JSON.stringify({ url, anonKey }, null, 2), 'utf8');
console.log('Wrote electron/auth-config.json from .env.local');
