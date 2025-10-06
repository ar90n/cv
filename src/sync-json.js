#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// JSON file operations
function loadJSON(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  const content = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(content);
}

function saveJSON(filePath, data) {
  const absolutePath = path.resolve(filePath);
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(absolutePath, content, 'utf8');
  console.log(`Saved: ${absolutePath}`);
}

// Path tracking for deep comparison
class PathTracker {
  constructor() {
    this.segments = [];
  }
  push(segment) { this.segments.push(segment); }
  pop() { return this.segments.pop(); }
  toString() { return this.segments.join('.'); }
}

// Deep comparison algorithm
function deepCompare(source, target, path = new PathTracker()) {
  const differences = [];

  // Handle null/undefined cases
  if (source === null || source === undefined || target === null || target === undefined) {
    if (source !== target) {
      differences.push({
        path: path.toString() || 'root',
        type: 'value_mismatch',
        sourceValue: source,
        targetValue: target
      });
    }
    return differences;
  }

  // Handle non-object types (strings, numbers, booleans)
  if (typeof source !== 'object' || typeof target !== 'object') {
    if (source !== target) {
      differences.push({
        path: path.toString() || 'root',
        type: 'value_mismatch',
        sourceValue: source,
        targetValue: target
      });
    }
    return differences;
  }

  // Compare all keys in source
  for (const key in source) {
    path.push(key);

    if (!(key in target)) {
      differences.push({
        path: path.toString(),
        type: 'missing',
        sourceValue: source[key]
      });
    } else if (typeof source[key] !== typeof target[key]) {
      differences.push({
        path: path.toString(),
        type: 'type_mismatch',
        sourceValue: source[key],
        targetValue: target[key]
      });
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      if (Array.isArray(source[key])) {
        // Handle arrays
        if (!Array.isArray(target[key])) {
          differences.push({
            path: path.toString(),
            type: 'type_mismatch',
            sourceValue: source[key],
            targetValue: target[key]
          });
        } else {
          if (source[key].length !== target[key].length) {
            differences.push({
              path: path.toString(),
              type: 'array_length_mismatch',
              sourceLength: source[key].length,
              targetLength: target[key].length
            });
          }
          // Recurse into array items
          for (let i = 0; i < source[key].length; i++) {
            path.push(`[${i}]`);
            if (i < target[key].length) {
              if (typeof source[key][i] === 'object' && source[key][i] !== null) {
                differences.push(...deepCompare(source[key][i], target[key][i], path));
              } else if (source[key][i] !== target[key][i]) {
                differences.push({
                  path: path.toString(),
                  type: 'value_mismatch',
                  sourceValue: source[key][i],
                  targetValue: target[key][i]
                });
              }
            }
            path.pop();
          }
        }
      } else {
        // Recurse into objects
        differences.push(...deepCompare(source[key], target[key], path));
      }
    } else if (source[key] !== target[key]) {
      // Primitive values that don't match
      differences.push({
        path: path.toString(),
        type: 'value_mismatch',
        sourceValue: source[key],
        targetValue: target[key]
      });
    }

    path.pop();
  }

  // Find extra keys in target
  for (const key in target) {
    if (!(key in source)) {
      path.push(key);
      differences.push({
        path: path.toString(),
        type: 'extra',
        targetValue: target[key]
      });
      path.pop();
    }
  }

  return differences;
}

// Check if string contains Japanese characters
function containsJapanese(str) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);
}

// Structure synchronization
function syncStructure(source, target) {
  // Deep clone source structure
  const synchronized = JSON.parse(JSON.stringify(source));

  // Preserve translated content from target where it exists
  function preserveTranslations(src, tgt, sync) {
    for (const key in src) {
      if (key in tgt) {
        if (typeof src[key] === 'object' && src[key] !== null) {
          if (Array.isArray(src[key])) {
            // For arrays, preserve existing translations
            for (let i = 0; i < src[key].length && i < tgt[key].length; i++) {
              if (typeof src[key][i] === 'object') {
                preserveTranslations(src[key][i], tgt[key][i], sync[key][i]);
              } else if (typeof tgt[key][i] === 'string' && !containsJapanese(tgt[key][i])) {
                sync[key][i] = tgt[key][i]; // Keep existing English
              }
            }
          } else {
            preserveTranslations(src[key], tgt[key], sync[key]);
          }
        } else if (typeof tgt[key] === 'string' && !containsJapanese(tgt[key])) {
          // Keep existing English translations
          sync[key] = tgt[key];
        }
      }
    }
  }

  preserveTranslations(source, target, synchronized);
  return synchronized;
}

// Apply translation mappings to known fields
function applyTranslations(obj, path = '') {
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;

    if (key === 'company' && typeof obj[key] === 'string') {
      obj[key] = translateCompany(obj[key]);
    } else if (key === 'title' && typeof obj[key] === 'string') {
      obj[key] = translateTitle(obj[key]);
    } else if (currentPath.includes('certifications') && key === 'name' && typeof obj[key] === 'string') {
      obj[key] = translateCertification(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item, i) => {
          if (typeof item === 'object') {
            applyTranslations(item, `${currentPath}[${i}]`);
          }
        });
      } else {
        applyTranslations(obj[key], currentPath);
      }
    }
  }
}

// Field classification for translation handling
const FieldClassification = {
  TRANSLATE: ['summary', 'title', 'responsibilities', 'description', 'notes'],
  PRESERVE: ['start_date', 'end_date', 'date', 'email', 'phone', 'location', 'url', 'gpa', 'tech'],
  SPECIAL: {
    'company': 'use_english_name',
    'name': 'already_handled',
    'name_en': 'already_handled',
    'certifications.name': 'official_english'
  }
};

function classifyField(fieldName, value) {
  if (FieldClassification.TRANSLATE.includes(fieldName)) {
    return 'translate';
  }
  if (FieldClassification.PRESERVE.includes(fieldName)) {
    return 'preserve';
  }
  if (fieldName in FieldClassification.SPECIAL) {
    return FieldClassification.SPECIAL[fieldName];
  }
  // Default: check if contains Japanese
  if (typeof value === 'string' && containsJapanese(value)) {
    return 'translate';
  }
  return 'preserve';
}

// Translation mappings
const CompanyTranslations = {
  '株式会社LexxPluss': 'LexxPluss, Inc.',
  '株式会社Hacobu': 'Hacobu, Inc.',
  '株式会社キャディ': 'CADDi Inc.',
  '株式会社CIS': 'CIS Inc.',
  'フリーランス': 'Freelance'
};

function translateCompany(japaneseName) {
  return CompanyTranslations[japaneseName] || japaneseName;
}

const CertificationTranslations = {
  '第一級陸上無線技術士': 'First-Class Radio Communications Engineer',
  '基本情報技術者': 'Fundamental Information Technology Engineer',
  '応用情報技術者': 'Applied Information Technology Engineer'
};

function translateCertification(japaneseName) {
  return CertificationTranslations[japaneseName] || japaneseName;
}

const TitleTranslations = {
  'エンジニア': 'Engineer',
  'リードエンジニア': 'Lead Engineer',
  'シニアエンジニア': 'Senior Engineer',
  'フルスタックエンジニア': 'Full Stack Engineer',
  'ソフトウェアエンジニア': 'Software Engineer',
  'AIエンジニア': 'AI Engineer',
  'MLエンジニア': 'ML Engineer'
};

function translateTitle(japaneseTitle) {
  // Try exact match first
  if (TitleTranslations[japaneseTitle]) {
    return TitleTranslations[japaneseTitle];
  }
  // Try partial matches
  for (const [ja, en] of Object.entries(TitleTranslations)) {
    if (japaneseTitle.includes(ja)) {
      return japaneseTitle.replace(ja, en);
    }
  }
  return japaneseTitle;
}

// Main sync function
async function syncJSON() {
  try {
    console.log('Loading source: data/master.json');
    const source = loadJSON('data/master.json');

    console.log('Loading target: data/master_en.json');
    const target = loadJSON('data/master_en.json');

    console.log('Analyzing differences...');
    const differences = deepCompare(source, target);
    console.log(`Found ${differences.length} structural differences`);

    if (differences.length > 0) {
      console.log('\nStructural differences found:');
      differences.slice(0, 10).forEach(diff => {
        console.log(`  - ${diff.type}: ${diff.path}`);
      });
      if (differences.length > 10) {
        console.log(`  ... and ${differences.length - 10} more`);
      }
    }

    console.log('\nApplying structural synchronization...');
    const synchronized = syncStructure(source, target);

    // Apply automatic translations
    console.log('Applying automatic translations...');
    applyTranslations(synchronized);

    // Check for dry-run mode
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
      console.log('DRY RUN: Not saving changes');
      console.log('\nWould update data/master_en.json');
    } else {
      console.log('Saving synchronized data...');
      saveJSON('data/master_en.json', synchronized);
      console.log('\nSynchronization complete!');
      console.log('Next step: Review and translate Japanese content in data/master_en.json');
    }

    // Count fields needing translation
    let translationCount = 0;
    function countTranslations(obj, fieldName = '') {
      for (const key in obj) {
        const currentField = fieldName ? `${fieldName}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (Array.isArray(obj[key])) {
            obj[key].forEach((item, i) => {
              if (typeof item === 'object') {
                countTranslations(item, `${currentField}[${i}]`);
              } else if (typeof item === 'string' && containsJapanese(item)) {
                translationCount++;
              }
            });
          } else {
            countTranslations(obj[key], currentField);
          }
        } else if (typeof obj[key] === 'string' && containsJapanese(obj[key])) {
          translationCount++;
        }
      }
    }
    countTranslations(synchronized);
    console.log(`\nFields requiring translation: ${translationCount}`);

  } catch (error) {
    console.error('Sync failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncJSON().catch(console.error);
}