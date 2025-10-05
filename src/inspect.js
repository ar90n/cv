#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Parse command-line arguments
function parseArgs() {
  const args = {
    url: 'http://localhost:8080/index.html',
    out: 'dist/inspect.png'
  };

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--url=')) {
      args.url = arg.substring(6);
    } else if (arg.startsWith('--out=')) {
      args.out = arg.substring(6);
    }
  });

  return args;
}

async function main() {
  const args = parseArgs();

  let browser;
  try {
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });

    // Navigate to URL
    try {
      await page.goto(args.url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    } catch (err) {
      // If network idle fails, try with just load
      await page.goto(args.url, {
        waitUntil: 'load',
        timeout: 30000
      });
    }

    // Wait for rendering
    await new Promise(r => setTimeout(r, 2000));

    // Ensure output directory exists
    const outDir = path.dirname(args.out);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('Taking screenshot...');

    // Take screenshot
    await page.screenshot({
      path: args.out,
      fullPage: true
    });

    console.log(`Screenshot saved: ${args.out} from ${args.url}`);

    await browser.close();
    process.exit(0);
  } catch (err) {
    if (browser) {
      await browser.close();
    }

    console.error('Full error:', err);

    if (err.message.includes('Failed to launch')) {
      console.error('Error: Failed to launch browser:', err.message);
      process.exit(1);
    } else if (err.message.includes('Navigation') || err.message.includes('load')) {
      console.error(`Error: Failed to load URL: ${args.url}`);
      process.exit(1);
    } else if (err.code === 'EACCES' || err.code === 'ENOENT') {
      console.error(`Error: Cannot write screenshot file: ${args.out}`);
      process.exit(1);
    } else {
      console.error('Error: Screenshot generation failed:', err.message);
      process.exit(1);
    }
  }
}

main();
