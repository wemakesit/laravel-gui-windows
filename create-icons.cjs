// Simple Node.js script to create basic PWA icons
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#2563eb"/>
    <rect x="${size * 0.2}" y="${size * 0.2}" width="${size * 0.6}" height="${size * 0.6}" fill="white"/>
    <rect x="${size * 0.3}" y="${size * 0.3}" width="${size * 0.18}" height="${size * 0.18}" fill="#2563eb"/>
    <rect x="${size * 0.52}" y="${size * 0.3}" width="${size * 0.18}" height="${size * 0.18}" fill="#2563eb"/>
    <rect x="${size * 0.3}" y="${size * 0.52}" width="${size * 0.18}" height="${size * 0.18}" fill="#2563eb"/>
    <rect x="${size * 0.52}" y="${size * 0.52}" width="${size * 0.18}" height="${size * 0.18}" fill="#2563eb"/>
  </svg>`;
};

// Icon sizes needed for PWA
const sizes = [16, 32, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 384, 512];

// Create icons directory
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (these can be converted to PNG later)
sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Created ${filename}`);
});

console.log('Icons created! You can convert these SVGs to PNGs using an online converter or image editing software.');
console.log('For now, let\'s update the manifest to use SVG icons temporarily.');
