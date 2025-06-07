const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [16, 48, 128];
const sourceLogo = path.join(__dirname, '../public/logo.png');
const outputDir = __dirname;

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(sourceLogo)
        .resize(size, size)
        .toFile(path.join(outputDir, `icon${size}.png`));
    }
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons(); 