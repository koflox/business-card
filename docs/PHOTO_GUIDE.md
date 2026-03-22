# Photo Guide

## Adding Photos

1. Place `.webp` files in `public/photos/` with numeric names (e.g. `01.webp`, `02.webp`)
2. That's it — photos are auto-discovered at build time

Numbering gaps are fine. If you delete `03.webp`, you don't need to rename `04.webp` → `03.webp`. The slider picks up whatever files exist and sorts them numerically.

## Converting from JPG

The project includes `sharp` as a dev dependency. Convert all JPGs at once:

```bash
node -e "
const sharp = require('sharp'), fs = require('fs'), path = require('path');
const dir = 'public/photos';
(async () => {
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jpg'))) {
    const num = String(parseInt(f)).padStart(2, '0');
    await sharp(path.join(dir, f)).rotate().resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(dir, num + '.webp'));
    console.log(f + ' -> ' + num + '.webp');
  }
})();
"
```

The `.rotate()` call applies EXIF orientation so photos display correctly.

## Specs

- **Format:** WebP
- **Width:** 1200px (auto-resized during conversion)
- **Quality:** 80
- **Target size:** ~100–400KB per photo
- **Aspect ratio:** any — `object-fit: cover` fills the column and crops as needed
