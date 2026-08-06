/* ============================================================
   ViZion — Hub des bâtiments
   Liste les bâtiments de l'audit en cours, permet d'en ajouter,
   d'en reprendre un déjà commencé, et héberge l'envoi du
   rapport unifié (tous bâtiments confondus).
============================================================ */

/* =========================
   INFORMATIONS DU SITE
========================= */

var siteNomInput = document.getElementById("siteNomInput");
var siteTypeInput = document.getElementById("siteTypeInput");
var siteAdresseInput = document.getElementById("siteAdresseInput");

var siteInfo = ReportExport.getSiteInfo();
siteNomInput.value = siteInfo.nom || "";
siteTypeInput.value = siteInfo.typeConstruction || "";
siteAdresseInput.value = siteInfo.adresse || "";

var siteMetaHint = document.getElementById("siteMetaHint");
if (siteInfo.commune) {
    siteMetaHint.textContent = "Commune : " + siteInfo.commune;
    siteMetaHint.classList.remove("hidden");
}

function saveSiteInfo() {
    var current = ReportExport.getSiteInfo();
    ReportExport.setSiteInfo(Object.assign({}, current, {
        nom: siteNomInput.value.trim(),
        typeConstruction: siteTypeInput.value.trim(),
        adresse: siteAdresseInput.value.trim()
    }));
}

[siteNomInput, siteTypeInput, siteAdresseInput].forEach(function (input) {
    input.addEventListener("change", saveSiteInfo);
});

/* =========================
   LISTE DES BÂTIMENTS
========================= */

var buildingsDashboard = document.getElementById("buildingsDashboard");
var noBuildingsHint = document.getElementById("noBuildingsHint");
var exportSection = document.getElementById("exportSection");

function renderBuildings() {

    buildingsDashboard.innerHTML = "";
    var buildings = BuildingManager.listBuildings();

    noBuildingsHint.classList.toggle("hidden", buildings.length > 0);
    exportSection.classList.toggle("hidden", buildings.length === 0);

    buildings.forEach(function (building) {

        var configured = BuildingManager.hasSecteursConfigured(building.id);

        var card = document.createElement("div");
        card.className = "dashboard-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.innerHTML =
            '<div class="dashboard-header">' +
                '<strong>' + building.nom + '</strong>' +
                '<span>' + (configured ? "✅" : "à configurer") + '</span>' +
            '</div>' +
            '<small>' + (configured ? "Modifier les secteurs / localisations" : "Ajouter des localisations") + '</small>' +
            '<button type="button" class="card-rename-btn" aria-label="Renommer ce bâtiment">✎</button>' +
            '<button type="button" class="card-delete-btn" aria-label="Supprimer ce bâtiment">✕</button>';

        card.addEventListener("click", function () {
            BuildingManager.switchToBuilding(building.id).then(function () {
                window.location.href = "audit.html";
            });
        });

        card.querySelector(".card-rename-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            var nouveauNom = prompt('Nouveau nom pour ce bâtiment :', building.nom);
            if (nouveauNom === null) return;
            nouveauNom = nouveauNom.trim();
            if (nouveauNom === "") return;
            BuildingManager.renameBuilding(building.id, nouveauNom);
            renderBuildings();
        });

        card.querySelector(".card-delete-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            if (!confirm('Supprimer le bâtiment "' + building.nom + '" et toutes ses données (secteurs, localisations, photos) ? Cette action est irréversible.')) {
                return;
            }
            renderBuildings();
            BuildingManager.deleteBuilding(building.id);
        });

        buildingsDashboard.appendChild(card);
    });
}

renderBuildings();

/* =========================
   AJOUTER UN BÂTIMENT
========================= */

var newBuildingInput = document.getElementById("newBuildingInput");
var addBuildingBtn = document.getElementById("addBuildingBtn");

addBuildingBtn.addEventListener("click", function () {
    var nom = newBuildingInput.value.trim();
    if (nom === "") {
        alert("Veuillez entrer un nom de bâtiment.");
        return;
    }
    var id = BuildingManager.createBuilding(nom);
    BuildingManager.switchToBuilding(id).then(function () {
        window.location.href = "audit.html";
    });
});

/* =========================
   CONFIGURATION GITHUB (repli optionnel)
========================= */

var saveTokenBtn = document.getElementById("saveTokenBtn");
var githubTokenInput = document.getElementById("githubTokenInput");

githubTokenInput.value = ExportGitHub.getToken();

saveTokenBtn.addEventListener("click", function () {
    var token = githubTokenInput.value.trim();
    if (token === "") {
        alert("Veuillez entrer un token GitHub valide.");
        return;
    }
    ExportGitHub.setToken(token);
    alert("Token GitHub enregistré.");
});

/* =========================
   ENVOI DU RAPPORT
========================= */

var exportBtn = document.getElementById("exportBtn");
var exportStatus = document.getElementById("exportStatus");
var exportLink = document.getElementById("exportLink");

exportBtn.addEventListener("click", function () {

    saveSiteInfo();

    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ Génération en cours...";
    exportStatus.textContent = "";
    exportLink.classList.add("hidden");

    ReportExport.sendReport(function (msg) {
        exportStatus.textContent = msg;
    }).then(function (result) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📥 Valider & Télécharger le rapport";
        exportStatus.textContent = "✅ " + result.detail;
        if (result.url) {
            exportLink.href = result.url;
            exportLink.classList.remove("hidden");
        }
        renderBuildings();
    }).catch(function (err) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📥 Valider & Télécharger le rapport";
        exportStatus.textContent = "❌ Erreur : " + err.message;
        console.error("Export error:", err);
    });
});
