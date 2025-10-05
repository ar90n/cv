#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command-line arguments
function parseArgs() {
  const args = {
    data: 'data/master.json',
    out: 'dist/index.html',
    title: null
  };

  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--data=')) {
      args.data = arg.substring(7);
    } else if (arg.startsWith('--out=')) {
      args.out = arg.substring(6);
    } else if (arg.startsWith('--title=')) {
      args.title = arg.substring(8);
    }
  });

  return args;
}

function main() {
  const args = parseArgs();

  // Read JSON data
  let data;
  try {
    const jsonContent = fs.readFileSync(args.data, 'utf8');
    data = JSON.parse(jsonContent);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error(`Error: JSON file not found: ${args.data}`);
      process.exit(1);
    } else if (err instanceof SyntaxError) {
      console.error(`Error: Invalid JSON in ${args.data}: ${err.message}`);
      process.exit(1);
    } else {
      console.error(`Error: Cannot read JSON file: ${args.data}`);
      process.exit(1);
    }
  }

  // Read HTML template
  const templatePath = path.join(__dirname, 'template.html');
  let template;
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    console.error(`Error: Template not found: ${templatePath}`);
    process.exit(1);
  }

  // Find and replace placeholder
  const placeholder = 'window.MASTER_DATA = /* JSON here */;';
  if (!template.includes(placeholder)) {
    console.error('Error: Template missing MASTER_DATA placeholder');
    process.exit(1);
  }

  const embeddedData = `window.MASTER_DATA = ${JSON.stringify(data)};`;
  const html = template.replace(placeholder, embeddedData);

  // Update title if provided
  let finalHtml = html;
  if (args.title) {
    finalHtml = html.replace('<title>Resume</title>', `<title>${args.title}</title>`);
  }

  // Ensure output directory exists
  const outDir = path.dirname(args.out);
  try {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  } catch (err) {
    console.error(`Error: Cannot create output directory: ${outDir}`);
    process.exit(1);
  }

  // Write output HTML
  try {
    fs.writeFileSync(args.out, finalHtml, 'utf8');
    console.log(`Built: ${args.out} from ${args.data}`);
    process.exit(0);
  } catch (err) {
    console.error(`Error: Cannot write HTML file: ${args.out}`);
    process.exit(1);
  }
}

main();
