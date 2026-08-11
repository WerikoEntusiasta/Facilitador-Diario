import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generateIcons() {
  const sourceIcon = path.join(process.cwd(), 'public', 'logo.png');
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon public/logo.png not found!');
    return;
  }

  const resDir = path.join(process.cwd(), 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(resDir)) {
    console.log('Android res directory not found yet. Skipping icon generation.');
    return;
  }

  const densities = [
    { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const density of densities) {
    const folder = path.join(resDir, density.name);
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // Generate square ic_launcher.png
    await sharp(sourceIcon)
      .resize(density.size, density.size)
      .toFile(path.join(folder, 'ic_launcher.png'));

    // Generate round ic_launcher_round.png
    await sharp(sourceIcon)
      .resize(density.size, density.size)
      .toFile(path.join(folder, 'ic_launcher_round.png'));

    // Generate foreground for adaptive icon ic_launcher_foreground.png
    await sharp(sourceIcon)
      .resize(density.fgSize, density.fgSize)
      .toFile(path.join(folder, 'ic_launcher_foreground.png'));
  }

  console.log('Android launcher icons successfully generated from public/logo.png!');
}

generateIcons().catch(console.error);
