const fs = require('fs');
const path = require('path');

// Check if sharp is available, otherwise provide instructions
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp module not found. Installing...');
  console.log('Run: npm install sharp --save-dev');
  console.log('Then run this script again: node scripts/generate-icons.js');
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const svgPath = path.join(__dirname, '../public/icon.svg');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Apple touch icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(outputDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Maskable icon (512x512 with padding)
  const maskableSize = 512;
  const iconSize = Math.floor(maskableSize * 0.8); // 80% of total for safe zone
  const padding = Math.floor((maskableSize - iconSize) / 2);

  await sharp(svgBuffer)
    .resize(iconSize, iconSize)
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 99, g: 102, b: 241, alpha: 1 } // Indigo color
    })
    .png()
    .toFile(path.join(outputDir, 'icon-512-maskable.png'));
  console.log('Generated icon-512-maskable.png');

  // Favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(outputDir, 'favicon.png'));
  console.log('Generated favicon.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
