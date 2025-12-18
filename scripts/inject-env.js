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
const envPath = join(rootDir, '.env');

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
try {
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envVars = parseEnv(envContent);
    console.log('✓ Loaded environment variables from .env file');
  } else {
    console.warn('⚠️ .env file not found, using process.env');
    // Fall back to process.env for variables that start with VITE_
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        envVars[key] = process.env[key];
      }
    });
  }
} catch (error) {
  console.warn('⚠️ Could not read .env file, using process.env:', error.message);
  // Fall back to process.env
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('VITE_')) {
      envVars[key] = process.env[key];
    }
  });
}

// Filter to only include VITE_ prefixed variables
const viteEnvVars = {};
Object.keys(envVars).forEach(key => {
  if (key.startsWith('VITE_')) {
    viteEnvVars[key] = envVars[key];
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
