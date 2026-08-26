// `npx cap sync` régénère parfois android/app/src/main/assets/public/cordova.js
// en fichier vide (0 octet) — probablement une interaction entre OneDrive
// (le projet est dans un dossier synchronisé) et l'écriture du fichier par
// Capacitor. Un fichier de 0 octet fait échouer Gradle 8.14+ avec
// "Cannot snapshot ... not a regular file" (mergeDebugAssets). On force un
// contenu non-vide après chaque sync pour éviter le problème.
const fs = require("fs");
const path = require("path");

const target = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "src",
    "main",
    "assets",
    "public",
    "cordova.js"
);

if (fs.existsSync(target) && fs.statSync(target).size === 0) {
    fs.writeFileSync(target, "// cordova.js placeholder (no Cordova plugins in use)\n");
    console.log("cordova.js était vide, contenu restauré.");
} else {
    console.log("cordova.js OK.");
}
