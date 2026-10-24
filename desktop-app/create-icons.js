const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIcoPkg = require('png-to-ico');
const pngToIco = pngToIcoPkg.default || pngToIcoPkg;

async function buildIcons() {
  const svgPath = path.join(__dirname, '..', 'web-portal', 'public', 'favicon.svg');
  const buildDir = path.join(__dirname, 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  console.log('Generating PNG icons from SVG...');
  const png512 = path.join(buildDir, 'icon-512.png');
  const png256 = path.join(buildDir, 'icon.png');
  const appPng = path.join(__dirname, 'icon.png');

  await sharp(svgPath)
    .resize(512, 512)
    .png()
    .toFile(png512);

  await sharp(svgPath)
    .resize(256, 256)
    .png()
    .toFile(png256);

  fs.copyFileSync(png256, appPng);

  console.log('Generating Windows .ICO with multi-resolutions...');
  const icoBuf = await pngToIco([png256]);
  const icoPath = path.join(buildDir, 'icon.ico');
  fs.writeFileSync(icoPath, icoBuf);

  console.log('Icons generated successfully:');
  console.log(' - ' + icoPath);
  console.log(' - ' + png256);
  console.log(' - ' + appPng);
}

buildIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
