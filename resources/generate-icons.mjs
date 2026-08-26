import sharp from "sharp";
import { mkdirSync } from "fs";

mkdirSync("resources", { recursive: true });

const SIZE = 1024;

// Fond radial sauge, cohérent avec la DA de l'app (css/style.css .container background).
const bgSvg = `
<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="35%" cy="20%" r="85%">
      <stop offset="0%" stop-color="#6B8261"/>
      <stop offset="55%" stop-color="#5D7052"/>
      <stop offset="100%" stop-color="#4E5F45"/>
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
</svg>`;

async function run() {
    // Fond (adaptive icon background layer + splash)
    await sharp(Buffer.from(bgSvg)).png().toFile("resources/icon-background.png");

    // Symbole (oeil + barres), redimensionné pour tenir dans la zone sûre
    // des icônes adaptatives Android (~66% du canevas, centré).
    const symbolWidth = Math.round(SIZE * 0.6);
    const symbol = await sharp("resources/eye-symbol.png")
        .resize({ width: symbolWidth })
        .toBuffer();
    const symbolMeta = await sharp(symbol).metadata();

    await sharp({
        create: {
            width: SIZE,
            height: SIZE,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
        .composite([{
            input: symbol,
            left: Math.round((SIZE - symbolMeta.width) / 2),
            top: Math.round((SIZE - symbolMeta.height) / 2)
        }])
        .png()
        .toFile("resources/icon-foreground.png");

    // Icône "legacy" à plat (fond + symbole), utilisée sur Android < 8 et
    // comme source Play Store (icône 512x512 sans alpha).
    await sharp(Buffer.from(bgSvg))
        .composite([{
            input: symbol,
            left: Math.round((SIZE - symbolMeta.width) / 2),
            top: Math.round((SIZE - symbolMeta.height) / 2)
        }])
        .png()
        .toFile("resources/icon.png");

    // Splash : même fond, logo complet (oeil + wordmark) centré, plus petit
    // pour laisser de l'air. On travaille sur un canevas carré 2732x2732
    // (taille recommandée par @capacitor/assets).
    const SPLASH = 2732;
    const splashBgSvg = bgSvg.replace(new RegExp(SIZE, "g"), SPLASH);
    const logoWidth = Math.round(SPLASH * 0.55);
    const logo = await sharp("images/logo-vizion-sauge.png")
        .resize({ width: logoWidth })
        .toBuffer();
    const logoMeta = await sharp(logo).metadata();

    await sharp(Buffer.from(splashBgSvg))
        .composite([{
            input: logo,
            left: Math.round((SPLASH - logoMeta.width) / 2),
            top: Math.round((SPLASH - logoMeta.height) / 2)
        }])
        .png()
        .toFile("resources/splash.png");

    console.log("OK: icon-background.png, icon-foreground.png, icon.png, splash.png générés dans resources/");
}

run().catch(e => { console.error(e); process.exit(1); });
