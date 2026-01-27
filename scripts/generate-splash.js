const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp module not found. Installing...');
  console.log('Run: npm install sharp --save-dev');
  console.log('Then run this script again: node scripts/generate-splash.js');
  process.exit(1);
}

// iPhone splash screen sizes
const splashScreens = [
  // iPhone 14 Pro Max
  { width: 1290, height: 2796, name: 'splash-1290x2796.png' },
  // iPhone 14 Pro
  { width: 1179, height: 2556, name: 'splash-1179x2556.png' },
  // iPhone 14, 13, 13 Pro, 12, 12 Pro
  { width: 1170, height: 2532, name: 'splash-1170x2532.png' },
  // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
  { width: 1284, height: 2778, name: 'splash-1284x2778.png' },
  // iPhone 13 mini, 12 mini
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  // iPhone 11 Pro Max, Xs Max
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' },
  // iPhone 11, Xr
  { width: 828, height: 1792, name: 'splash-828x1792.png' },
  // iPhone 11 Pro, Xs, X
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  // iPhone 8 Plus
  { width: 1242, height: 2208, name: 'splash-1242x2208.png' },
  // iPhone 8, 7, 6s, 6
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
];

const outputDir = path.join(__dirname, '../public');
const svgPath = path.join(__dirname, '../public/icon.svg');

async function generateSplashScreens() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const screen of splashScreens) {
    const iconSize = Math.min(screen.width, screen.height) * 0.25;
    const icon = await sharp(svgBuffer)
      .resize(Math.floor(iconSize), Math.floor(iconSize))
      .toBuffer();

    // Create splash with centered icon on gradient background
    await sharp({
      create: {
        width: screen.width,
        height: screen.height,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // Dark background (#0f172a)
      }
    })
      .composite([{
        input: icon,
        gravity: 'center'
      }])
      .png()
      .toFile(path.join(outputDir, screen.name));

    console.log(`Generated ${screen.name}`);
  }

  console.log('\nAll splash screens generated successfully!');
}

generateSplashScreens().catch(console.error);
