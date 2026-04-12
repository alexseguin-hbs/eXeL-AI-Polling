#!/usr/bin/env node
/**
 * Inject all missing translations using a reliable line-by-line approach.
 * Finds each language's closing "  }," line and inserts before it.
 */
const fs = require('fs');
const path = require('path');

const TRANSLATIONS_FILE = path.join(__dirname, '..', 'frontend', 'lib', 'lexicon-translations.ts');

// Load all batch data
const batches = [
  require('./inject-translations.js.data'),
  require('./inject-translations-b2.js.data'),
  require('./inject-translations-b3.js.data'),
  require('./inject-translations-b4.js.data'),
  require('./inject-translations-b5.js.data'),
  require('./inject-translations-b6.js.data'),
];

// This won't work since the scripts aren't modules. Let me inline the approach.
