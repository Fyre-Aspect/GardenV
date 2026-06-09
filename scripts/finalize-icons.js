const fs = require('fs');
const path = require('path');

const pub = path.join(__dirname, '../public');

// Create multi-size ICO with embedded PNGs (supported by all modern browsers)
function createIco(entries) {
  const count = entries.length;
  const headerSize = 6;
  const directorySize = headerSize + count * 16;

  let dataOffset = directorySize;
  const resolved = entries.map(({ size, buffer }) => {
    const entry = { size, buffer, offset: dataOffset };
    dataOffset += buffer.length;
    return entry;
  });

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(count * 16);
  resolved.forEach(({ size, buffer, offset }, i) => {
    const b = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, b);
    dir.writeUInt8(size >= 256 ? 0 : size, b + 1);
    dir.writeUInt8(0, b + 2);
    dir.writeUInt8(0, b + 3);
    dir.writeUInt16LE(1, b + 4);
    dir.writeUInt16LE(32, b + 6);
    dir.writeUInt32LE(buffer.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
  });

  return Buffer.concat([header, dir, ...resolved.map(e => e.buffer)]);
}

const icoEntries = [16, 32, 64].map(size => ({
  size,
  buffer: fs.readFileSync(path.join(pub, `icon-${size}.png`)),
}));

fs.writeFileSync(path.join(pub, 'favicon.ico'), createIco(icoEntries));
console.log('✓ favicon.ico');

fs.copyFileSync(path.join(pub, 'icon-192.png'), path.join(pub, 'logo192.png'));
console.log('✓ logo192.png');

fs.copyFileSync(path.join(pub, 'icon-512.png'), path.join(pub, 'logo512.png'));
console.log('✓ logo512.png');

// Clean up temp files
[16, 32, 64, 192, 512].forEach(size => {
  const f = path.join(pub, `icon-${size}.png`);
  if (fs.existsSync(f)) fs.unlinkSync(f);
});
console.log('✓ cleaned temp files');
