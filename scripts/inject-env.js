#!/usr/bin/env node

/**
 * Post-build script to inject environment variables into index.html
 * This allows runtime configuration of VITE_CLOUD_NAME and other env vars
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');
const indexPath = join(distDir, 'index.html');

// Determine which environment file to read based on what's available
// Priority: environment-specific files first, then generic .env (for local only)
// Check for environment-specific files first (these are for hosted environments)
const envSpecificFiles = [
  join(rootDir, '.env.develop'),
  join(rootDir, '.env.staging'),
  join(rootDir, '.env.production'),
  join(rootDir, '.env.development')
];

// Check which environment-specific files exist
const existingEnvFiles = envSpecificFiles.filter(path => existsSync(path));
console.log('🔍 Checking for environment files...');
console.log('   Environment-specific files found:', existingEnvFiles.length > 0 ? existingEnvFiles.map(p => p.split('/').pop()).join(', ') : 'none');
console.log('   Generic .env exists:', existsSync(join(rootDir, '.env')));

// Build list of possible paths - prioritize env-specific files if they exist
const possibleEnvPaths = existingEnvFiles.length > 0
  ? existingEnvFiles  // Only check env-specific files if they exist
  : [join(rootDir, '.env')]; // Fallback to .env only if no env-specific files found

console.log('📂 Will check files in order:', possibleEnvPaths.map(p => p.split('/').pop()).join(' → '));

// Simple .env parser (since we can't easily use dotenv in ESM)
function parseEnv(content) {
  const envVars = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        envVars[key] = value;
      }
    }
  }
  return envVars;
}

// Read environment variables
let envVars = {};
let envPathUsed = null;

// Try to find and read an .env file
for (const envPath of possibleEnvPaths) {
  if (existsSync(envPath)) {
    try {
      const envContent = readFileSync(envPath, 'utf-8');
      console.log('📄 Reading environment file from:', envPath);
      envVars = parseEnv(envContent);
      envPathUsed = envPath;
      console.log('✓ Loaded environment variables from file');
      // Log what was found (mask sensitive values)
      const foundKeys = Object.keys(envVars).filter(k => k.startsWith('VITE_'));
      if (foundKeys.length > 0) {
        console.log('📋 Found VITE_ variables:', foundKeys.join(', '));
      }
      break;
    } catch (error) {
      console.warn(`⚠️ Error reading ${envPath}:`, error.message);
      continue;
    }
  }
}

// If no .env file found, fall back to process.env
if (!envPathUsed) {
  console.warn('⚠️ No .env file found in any of the expected locations');
  console.warn('⚠️ Expected locations:', possibleEnvPaths.join(', '));
  console.warn('⚠️ Falling back to process.env');
  // Fall back to process.env for variables that start with VITE_
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      envVars[key] = process.env[key];
    }
  });
}

// Filter to only include VITE_ prefixed variables and filter out placeholder values
const viteEnvVars = {};
Object.keys(envVars).forEach(key => {
  if (key.startsWith('VITE_')) {
    const value = envVars[key];
    // Skip placeholder values
    if (value && 
        value !== 'your-cloudinary-cloud-name' && 
        value !== 'your-cloud-name' &&
        !value.includes('your-') &&
        value.trim() !== '') {
      viteEnvVars[key] = value;
    } else {
      console.warn(`⚠️ Skipping ${key} - contains placeholder value: ${value}`);
    }
  }
});

// Read index.html
if (!existsSync(indexPath)) {
  console.error('❌ index.html not found in dist directory');
  process.exit(1);
}

let html = readFileSync(indexPath, 'utf-8');

// Create the environment injection script
const envScript = `
    <script>
      // Runtime environment variables injected at build time
      (function() {
        if (typeof window !== 'undefined') {
          window.__ENV__ = window.__ENV__ || {};
          ${Object.keys(viteEnvVars).map(key => {
            const value = viteEnvVars[key];
            // Escape the value for JavaScript
            const escapedValue = JSON.stringify(value);
            return `window.__ENV__['${key}'] = ${escapedValue};`;
          }).join('\n          ')}
        }
      })();
    </script>`;

// Find the existing __ENV__ initialization script and replace it
// Match the script tag that initializes window.__ENV__
const envInitPattern = /<script>\s*\/\/.*Runtime environment variables.*?window\.__ENV__.*?<\/script>/s;
if (envInitPattern.test(html)) {
  html = html.replace(envInitPattern, envScript.trim());
  console.log('✓ Replaced existing environment variable script');
} else {
  // Try to find any script with __ENV__
  const anyEnvPattern = /<script>[\s\S]*?window\.__ENV__[\s\S]*?<\/script>/;
  if (anyEnvPattern.test(html)) {
    html = html.replace(anyEnvPattern, envScript.trim());
    console.log('✓ Replaced existing __ENV__ script');
  } else {
    // If no existing script, inject before the closing </head> tag
    html = html.replace('</head>', `  ${envScript}\n  </head>`);
    console.log('✓ Injected environment variable script');
  }
}

// Write the modified HTML
writeFileSync(indexPath, html, 'utf-8');

// Log what was injected
const injectedVars = Object.keys(viteEnvVars);
if (injectedVars.length > 0) {
  console.log('✓ Injected environment variables:');
  injectedVars.forEach(key => {
    const value = viteEnvVars[key];
    // Mask sensitive values
    const displayValue = key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')
      ? '***'
      : value;
    console.log(`  - ${key}: ${displayValue}`);
  });
} else {
  console.warn('⚠️ No VITE_ prefixed environment variables found to inject');
  console.warn('⚠️ Images may not work if VITE_CLOUD_NAME is not set');
}

console.log('✓ Environment variable injection complete');
