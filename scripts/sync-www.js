// Copie les fichiers web réels (servis tels quels par GitHub Pages depuis la
// racine du repo) vers www/, le dossier que Capacitor empaquette dans l'APK.
// Aucun bundler : www/ est un simple miroir, régénéré à chaque exécution.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const wwwDir = path.join(root, "www");

const itemsToCopy = ["index.html", "css", "js", "images", "pages"];

fs.rmSync(wwwDir, { recursive: true, force: true });
fs.mkdirSync(wwwDir, { recursive: true });

for (const item of itemsToCopy) {
    const src = path.join(root, item);
    const dest = path.join(wwwDir, item);
    if (fs.existsSync(src)) {
        fs.cpSync(src, dest, { recursive: true });
        console.log("Copié : " + item);
    } else {
        console.warn("Introuvable (ignoré) : " + item);
    }
}

console.log("www/ synchronisé.");
