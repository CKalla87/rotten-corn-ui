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
      console.log('   File size:', envContent.length, 'bytes');
      envVars = parseEnv(envContent);
      envPathUsed = envPath;
      console.log('✓ Loaded environment variables from file');
      console.log('   Total variables parsed:', Object.keys(envVars).length);
      // Log ALL keys found (for debugging)
      console.log('   All variable keys:', Object.keys(envVars).join(', '));
      // Log what was found (mask sensitive values)
      const foundKeys = Object.keys(envVars).filter(k => k.startsWith('VITE_'));
      if (foundKeys.length > 0) {
        console.log('📋 Found VITE_ variables:', foundKeys.join(', '));
        // Check specifically for VITE_CLOUD_NAME (case-insensitive check)
        const cloudNameKey = Object.keys(envVars).find(k => k.toUpperCase() === 'VITE_CLOUD_NAME');
        if (cloudNameKey) {
          console.log('   ℹ️  Found VITE_CLOUD_NAME with key name:', cloudNameKey, '(exact match:', cloudNameKey === 'VITE_CLOUD_NAME', ')');
        }
        if (envVars.VITE_CLOUD_NAME !== undefined) {
          const cloudNameValue = envVars.VITE_CLOUD_NAME;
          if (cloudNameValue && cloudNameValue !== 'your-cloudinary-cloud-name' && !cloudNameValue.includes('your-') && cloudNameValue.trim() !== '') {
            console.log('   ✓ VITE_CLOUD_NAME found with valid value:', cloudNameValue.substring(0, 15) + (cloudNameValue.length > 15 ? '...' : ''));
          } else {
            console.error('   ❌ VITE_CLOUD_NAME has placeholder or empty value:', cloudNameValue || '(empty)');
            console.error('   ❌ This value will be filtered out and NOT injected!');
            console.error('   ❌ Please update the .env file in S3 with your actual Cloudinary cloud name.');
          }
        } else {
          console.warn('   ⚠️ VITE_CLOUD_NAME not found in file');
          console.warn('   ⚠️ Please add VITE_CLOUD_NAME=your-actual-cloud-name to the .env file');
          // Show first few lines of file for debugging
          try {
            const fileLines = envContent.split('\n').slice(0, 10);
            console.log('   📄 First 10 lines of file:');
            fileLines.forEach((line, idx) => {
              if (line.trim() && !line.trim().startsWith('#')) {
                const maskedLine = line.includes('=') 
                  ? line.split('=')[0] + '=' + (line.split('=')[1] ? '***' : '')
                  : line;
                console.log(`      ${idx + 1}: ${maskedLine}`);
              }
            });
          } catch (e) {
            // Ignore errors in debug output
          }
        }
      } else {
        console.warn('   ⚠️ No VITE_ prefixed variables found in file');
        console.log('   All keys in file:', Object.keys(envVars).slice(0, 10).join(', '), Object.keys(envVars).length > 10 ? '...' : '');
      }
      break;
    } catch (error) {
      console.warn(`⚠️ Error reading ${envPath}:`, error.message);
      continue;
    }
  } else {
    console.log('   ⏭️  Skipping (not found):', envPath);
  }
}

// If VITE_CLOUD_NAME is missing and we read from an env-specific file, try .env as fallback
if (!envVars.VITE_CLOUD_NAME && envPathUsed && envPathUsed !== join(rootDir, '.env')) {
  const fallbackEnvPath = join(rootDir, '.env');
  if (existsSync(fallbackEnvPath)) {
    try {
      console.log('🔍 VITE_CLOUD_NAME missing from', envPathUsed.split('/').pop() + ', checking .env as fallback...');
      const fallbackContent = readFileSync(fallbackEnvPath, 'utf-8');
      const fallbackVars = parseEnv(fallbackContent);
      if (fallbackVars.VITE_CLOUD_NAME) {
        const cloudNameValue = fallbackVars.VITE_CLOUD_NAME;
        if (cloudNameValue && cloudNameValue !== 'your-cloudinary-cloud-name' && !cloudNameValue.includes('your-') && cloudNameValue.trim() !== '') {
          console.log('   ✓ Found VITE_CLOUD_NAME in .env, merging into env vars');
          envVars.VITE_CLOUD_NAME = cloudNameValue;
        } else {
          console.warn('   ⚠️ VITE_CLOUD_NAME in .env has placeholder value, skipping');
        }
      } else {
        console.warn('   ⚠️ VITE_CLOUD_NAME also not found in .env');
      }
    } catch (error) {
      console.warn(`⚠️ Error reading fallback .env:`, error.message);
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
const skippedVars = [];
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
      skippedVars.push(key);
      console.warn(`⚠️ Skipping ${key} - contains placeholder or empty value: "${value}"`);
    }
  }
});

console.log('📊 After filtering:');
console.log('   VITE_ variables to inject:', Object.keys(viteEnvVars).length);
console.log('   VITE_ variables skipped:', skippedVars.length > 0 ? skippedVars.join(', ') : 'none');
if (viteEnvVars.VITE_CLOUD_NAME) {
  console.log('   ✓ VITE_CLOUD_NAME will be injected');
} else {
  console.error('   ❌ VITE_CLOUD_NAME will NOT be injected!');
  if (envVars.VITE_CLOUD_NAME !== undefined) {
    console.error(`   ❌ Reason: VITE_CLOUD_NAME found in file but filtered out (value: "${envVars.VITE_CLOUD_NAME}")`);
    console.error('   ❌ This usually means the value is a placeholder like "your-cloudinary-cloud-name"');
    console.error('   ❌ Please update the .env file in S3 with your actual Cloudinary cloud name.');
  } else {
    console.error('   ❌ Reason: VITE_CLOUD_NAME not found in the .env file');
    console.error(`   ❌ File read from: ${envPathUsed || 'none'}`);
    console.error('   ❌ Please add VITE_CLOUD_NAME=your-actual-cloud-name to the .env file in S3.');
  }
  // In CI/CD, fail the build if VITE_CLOUD_NAME is missing
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.error('');
    console.error('❌ BUILD FAILED: VITE_CLOUD_NAME is required for image/video functionality');
    console.error('❌ This is a critical error. The build cannot proceed without VITE_CLOUD_NAME.');
    process.exit(1);
  } else {
    console.warn('');
    console.warn('⚠️ WARNING: VITE_CLOUD_NAME is missing. Image/video uploads will not work.');
    console.warn('⚠️ This is a critical warning. Please add VITE_CLOUD_NAME to your .env file.');
  }
}

// Read index.html
if (!existsSync(indexPath)) {
  console.error('❌ index.html not found in dist directory');
  process.exit(1);
}

let html = readFileSync(indexPath, 'utf-8');

// Create the environment injection script
// This script MUST run before React loads, so it's placed in <head>
const envScript = `
    <script>
      // Runtime environment variables injected at build time
      // This script runs immediately when the page loads, before React
      (function() {
        if (typeof window !== 'undefined') {
          window.__ENV__ = window.__ENV__ || {};
          ${Object.keys(viteEnvVars).map(key => {
            const value = viteEnvVars[key];
            // Escape the value for JavaScript
            const escapedValue = JSON.stringify(value);
            return `window.__ENV__['${key}'] = ${escapedValue};`;
          }).join('\n          ')}
          // Debug: Log what was injected (only in development)
          if (window.location.hostname.includes('dev.') || window.location.hostname.includes('localhost')) {
            console.log('🔧 Injected environment variables:', Object.keys(window.__ENV__));
            if (window.__ENV__.VITE_CLOUD_NAME) {
              console.log('✓ VITE_CLOUD_NAME:', window.__ENV__.VITE_CLOUD_NAME.substring(0, 10) + '...');
            } else {
              console.warn('⚠️ VITE_CLOUD_NAME not found in window.__ENV__');
            }
          }
        }
      })();
    </script>`;

// Find the existing __ENV__ initialization script and replace it
// Match the script tag that initializes window.__ENV__
let replaced = false;

// Try multiple patterns to find and replace the existing script
const patterns = [
  /<script>\s*\/\/.*Runtime environment variables.*?window\.__ENV__.*?<\/script>/s,
  /<script>[\s\S]*?window\.__ENV__[\s\S]*?<\/script>/,
  /<script>\s*if \(typeof window !== 'undefined'\) \{[\s\S]*?window\.__ENV__[\s\S]*?\}[\s\S]*?<\/script>/
];

for (const pattern of patterns) {
  if (pattern.test(html)) {
    html = html.replace(pattern, envScript.trim());
    console.log('✓ Replaced existing environment variable script (pattern matched)');
    replaced = true;
    break;
  }
}

if (!replaced) {
  // If no existing script found, inject before the closing </head> tag
  if (html.includes('</head>')) {
    html = html.replace('</head>', `  ${envScript}\n  </head>`);
    console.log('✓ Injected environment variable script before </head>');
  } else {
    // Fallback: inject before </body> or at the end of <head>
    if (html.includes('</body>')) {
      html = html.replace('</body>', `  ${envScript}\n  </body>`);
      console.log('✓ Injected environment variable script before </body>');
    } else {
      // Last resort: append to the end
      html += envScript;
      console.log('✓ Appended environment variable script to HTML');
    }
  }
}

// Write the modified HTML
writeFileSync(indexPath, html, 'utf-8');
console.log('✓ Wrote modified index.html to:', indexPath);

// Verify injection by reading back the file
const verifyHtml = readFileSync(indexPath, 'utf-8');
const hasEnvScript = verifyHtml.includes('window.__ENV__') && verifyHtml.includes('VITE_');
if (hasEnvScript) {
  console.log('✓ Verified: Environment script found in index.html');
  // Check if VITE_CLOUD_NAME is in the injected script
  if (viteEnvVars.VITE_CLOUD_NAME && verifyHtml.includes('VITE_CLOUD_NAME')) {
    console.log('✓ Verified: VITE_CLOUD_NAME found in injected script');
  } else if (viteEnvVars.VITE_CLOUD_NAME) {
    console.error('❌ ERROR: VITE_CLOUD_NAME was supposed to be injected but not found in HTML!');
  }
} else {
  console.error('❌ ERROR: Environment script not found in index.html after injection!');
}

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
  console.warn('⚠️ This could mean:');
  console.warn('   1. The .env file doesn\'t contain VITE_CLOUD_NAME');
  console.warn('   2. VITE_CLOUD_NAME has a placeholder value');
  console.warn('   3. The .env file wasn\'t found or couldn\'t be read');
}

// Final check: If we're in a CI environment and VITE_CLOUD_NAME is missing, warn but don't fail
// (The build should still succeed, but images won't work)
if (process.env.CI && !viteEnvVars.VITE_CLOUD_NAME) {
  console.error('');
  console.error('❌ CRITICAL WARNING: VITE_CLOUD_NAME is not set in CI build!');
  console.error('   Images and videos will not work in the deployed application.');
  console.error('   Please ensure .env.develop (or .env.staging/.env.production) contains:');
  console.error('   VITE_CLOUD_NAME=your-actual-cloudinary-cloud-name');
  console.error('   (Replace "your-actual-cloudinary-cloud-name" with your real Cloudinary cloud name)');
  console.error('');
  // Don't exit with error - let the build complete so we can see other issues
  // But log it prominently
}

console.log('✓ Environment variable injection complete');



