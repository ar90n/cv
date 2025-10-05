#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');

async function inspect() {
  console.log('🔍 Starting visual inspection...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    // Capture console logs
    const logs = { ja: [], en: [] };
    page.on('console', msg => {
      const text = msg.text();
      if (text) {
        logs.current = logs.current || [];
        logs.current.push(text);
      }
    });

    // Inspect Japanese version
    console.log('📄 Inspecting Japanese version (index.html)...');
    logs.current = logs.ja;
    const jaPath = 'file://' + path.resolve(process.cwd(), 'dist/index.html');

    try {
      await page.goto(jaPath, { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (err) {
      await page.goto(jaPath, { waitUntil: 'load', timeout: 10000 });
    }

    await new Promise(r => setTimeout(r, 2000)); // Wait for Tailwind CDN

    await page.screenshot({
      path: 'dist/inspect_ja.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: dist/inspect_ja.png');

    // Inspect English version
    console.log('📄 Inspecting English version (index_en.html)...');
    logs.current = logs.en;
    const enPath = 'file://' + path.resolve(process.cwd(), 'dist/index_en.html');

    try {
      await page.goto(enPath, { waitUntil: 'networkidle2', timeout: 10000 });
    } catch (err) {
      await page.goto(enPath, { waitUntil: 'load', timeout: 10000 });
    }

    await new Promise(r => setTimeout(r, 2000));

    await page.screenshot({
      path: 'dist/inspect_en.png',
      fullPage: true
    });
    console.log('✅ Screenshot saved: dist/inspect_en.png');

    // Capture specific sections for detailed inspection
    console.log('\n🔎 Capturing specific sections...');

    // Try to capture interests section if it exists
    const interestsSelector = 'section:has(h2)';
    const sections = await page.$$(interestsSelector);

    if (sections.length > 0) {
      console.log(`   Found ${sections.length} sections`);
    }

    // Print console logs if any
    if (logs.ja.length > 0 || logs.en.length > 0) {
      console.log('\n📋 Console logs:');
      if (logs.ja.length > 0) {
        console.log('   JA:', logs.ja.join(', '));
      }
      if (logs.en.length > 0) {
        console.log('   EN:', logs.en.join(', '));
      }
    }

    console.log('\n✨ Inspection complete!');
    console.log('   View screenshots:');
    console.log('   - dist/inspect_ja.png (Japanese)');
    console.log('   - dist/inspect_en.png (English)');

  } catch (error) {
    console.error('❌ Error during inspection:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

inspect().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
