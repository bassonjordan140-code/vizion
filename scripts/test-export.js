/* ============================================================
   Test de non-régression de l'export : charge les modules de l'app dans un
   contexte Node (sans navigateur), rejoue ReportExport.buildAuditJSON sur un
   audit de démonstration et vérifie les totaux et les lots.

   Usage : node scripts/test-export.js
   Un audit réel peut aussi servir : node scripts/test-export.js chemin/audit.json
   (v1 ou v2 : seules les clés siteInfo et batiments[].secteurs sont lues) ;
   le script affiche alors les totaux par secteur, sans contrôle.
============================================================ */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const APP = path.join(__dirname, "..");

// "window" doit être l'objet global lui-même : les modules font window.X = ...
// puis appellent X. sans préfixe, comme dans un navigateur.
const contexte = {
    console,
    navigator: { userAgent: "node" },
    Blob: class { constructor(parts) { this.parts = parts; } }
};
vm.createContext(contexte);
vm.runInContext("var window = globalThis;", contexte);

// equipment-database.js est indispensable : sans lui, la normalisation des noms et
// les lots déduits retombent silencieusement sur leur valeur de repli.
for (const f of ["hotels-data.js", "secteur-config.js", "equipment-database.js", "lot-mapping.js",
                 "materiaux-thermiques.js", "equipment-check.js", "report-export.js"]) {
    vm.runInContext(fs.readFileSync(path.join(APP, "js", f), "utf8"), contexte, { filename: f });
}
const w = contexte.window;

function exporter(siteInfo, batiments) {
    const texte = w.ReportExport.buildAuditJSON(siteInfo, batiments).parts.join("");
    return JSON.parse(texte);
}

function totauxParSecteur(lignes) {
    const totaux = {};
    lignes.forEach((l) => {
        if (l.puissanceUnitaireW === null) return;
        totaux[l.secteur] = (totaux[l.secteur] || 0) + l.puissanceUnitaireW * (l.nombre === null ? 1 : l.nombre);
    });
    return totaux;
}

// Audit fourni : on affiche les totaux, rien de plus.
if (process.argv[2]) {
    const entree = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
    const batiments = entree.batiments.map((b) => ({
        id: b.id, nom: b.nom, donnees: b.secteurs, customLabels: b.secteursPersonnalisesLabels || {}
    }));
    const audit = exporter(entree.siteInfo || {}, batiments);
    audit.batiments.forEach((b) => {
        console.log(b.nom);
        Object.entries(totauxParSecteur(b.lignes)).forEach(([s, v]) => console.log("  " + s + " : " + (v / 1000).toFixed(2) + " kW"));
    });
    process.exit(0);
}

// Audit de démonstration.
const batiments = [{
    id: "b1", nom: "Bâtiment A", customLabels: {},
    donnees: {
        hebergements: { 1: {
            nom: "Appartement", nbHebergements: 8, nbChambres: 0,
            ecs: { present: true, distribution: "Individuelle", energie: "Solaire", puissance: 3000 },
            equipements: [
                { nom: "Frigo", nombre: 1, puissance: 150 },
                { nom: "Cave vin", nombre: 1, puissance: 100 },
                { nom: "Machine glaçons", nombre: 1, puissance: 200 },
                { nom: "Mirco onde", nombre: 1, puissance: 1200 }
            ]
        } },
        piscines: { 1: { nom: "Piscine", chauffee: "oui", typeChauffe: "Pompe à chaleur", chauffagePuissance: 1500, periodeChauffage: "" } },
        buanderie: { 1: {
            nom: "Buanderie", cyclesLaveLinge: 0,
            laveLinge: { nombre: 2, capaciteKg: 10, puissance: 2000 },
            secheLinge: { nombre: 1, capaciteKg: 10, typeEnergie: "Gaz", puissance: 3000 }
        } }
    }
}];

const audit = exporter({ nom: "Villa Delisle" }, batiments);
const lignes = audit.batiments[0].lignes;
const ligne = (texte) => lignes.find((l) => l.description.indexOf(texte) !== -1);

let echecs = 0;
function verifier(nom, ok, detail) {
    if (!ok) echecs++;
    console.log((ok ? "OK    " : "ÉCHEC ") + nom + (ok ? "" : "  → " + detail));
}

const ecs = ligne("ECS");
verifier("ECS : une ligne par logement (nombre = 8)", ecs && ecs.nombre === 8, JSON.stringify(ecs));
verifier("ECS : 24 kW pour 8 logements à 3 kW", ecs && ecs.puissanceUnitaireW * ecs.nombre === 24000, JSON.stringify(ecs));

// "Machine glaçons" est reconnu comme "Machine à glaçons" de la base : on cherche le mot commun.
["Frigo", "Cave vin", "glaçons"].forEach((nom) => {
    verifier(nom + " : lot 3-5 (froid), pas « Autres »", ligne(nom) && ligne(nom).lot === "3-5", JSON.stringify(ligne(nom)));
});
verifier("« Mirco onde » normalisé en « Micro-ondes »", !!ligne("Micro-ondes") && !ligne("Mirco"), JSON.stringify(lignes.map((l) => l.description)));

const pac = ligne("Chauffage piscine");
verifier("Chauffage piscine saisi en kW : 1500 kW = 1 500 000 W", pac && pac.puissanceUnitaireW === 1500000, JSON.stringify(pac));

verifier("Lave-linge et sèche-linge : 7-1 Forces motrices",
    ligne("Lave-linge").lot === "7-1" && ligne("Sèche-linge").lot === "7-1", JSON.stringify([ligne("Lave-linge"), ligne("Sèche-linge")]));

const secteurs = audit.batiments[0].secteurs;
verifier("Non relevé : nbChambres, periodeChauffage, cycles → null",
    secteurs.hebergements[1].nbChambres === null && secteurs.piscines[1].periodeChauffage === null && secteurs.buanderie[1].cyclesLaveLinge === null,
    JSON.stringify(secteurs));

const problemes = w.EquipmentCheck.findIncompleteEquipment(batiments);
const suspecte = problemes.find((p) => p.puissanceSuspecte);
verifier("Récapitulatif : le chauffage de 1500 kW est signalé", !!suspecte && /1500 kW/.test(suspecte.puissanceSuspecte), JSON.stringify(problemes));
verifier("Récapitulatif : rien d'autre à signaler", problemes.length === 1, JSON.stringify(problemes));

console.log(echecs ? "\n" + echecs + " contrôle(s) en échec" : "\nTous les contrôles passent");
process.exit(echecs ? 1 : 0);
