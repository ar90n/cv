#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Parse command-line arguments
function parseArgs() {
  const args = {
    in: 'dist/index.html',
    out: 'dist/resume.pdf'
  };

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--in=')) {
      args.in = arg.substring(5);
    } else if (arg.startsWith('--out=')) {
      args.out = arg.substring(6);
    }
  });

  return args;
}

async function main() {
  const args = parseArgs();

  // Check if input HTML file exists
  if (!fs.existsSync(args.in)) {
    console.error(`Error: HTML file not found: ${args.in}`);
    process.exit(1);
  }

  // Resolve to absolute path for file:// URL
  const absoluteHtmlPath = path.resolve(args.in);
  const fileUrl = `file://${absoluteHtmlPath}`;

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

    // Navigate to HTML file
    try {
      await page.goto(fileUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
    } catch (err) {
      // If network idle fails, try with just load
      await page.goto(fileUrl, {
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

    console.log('Generating PDF...');

    // Generate PDF with A4 format and 10mm margins
    await page.pdf({
      path: args.out,
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true,
      preferCSSPageSize: false,
      timeout: 60000
    });

    console.log(`PDF generated: ${args.out} from ${args.in}`);

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
    } else if (err.message.includes('Navigation') || err.message.includes('load HTML')) {
      console.error(`Error: Failed to load HTML: ${args.in}`);
      process.exit(1);
    } else if (err.code === 'EACCES' || err.code === 'ENOENT') {
      console.error(`Error: Cannot write PDF file: ${args.out}`);
      process.exit(1);
    } else {
      console.error('Error: PDF generation failed:', err.message);
      process.exit(1);
    }
  }
}

main();
