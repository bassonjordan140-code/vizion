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
var destinataireEmailInput = document.getElementById("destinataireEmailInput");

var siteInfo = ReportExport.getSiteInfo();
siteNomInput.value = siteInfo.nom || "";
siteTypeInput.value = siteInfo.typeConstruction || "";
siteAdresseInput.value = siteInfo.adresse || "";
destinataireEmailInput.value = siteInfo.email || "";

var siteMetaHint = document.getElementById("siteMetaHint");
if (siteInfo.commune || siteInfo.zonePerene || siteInfo.stationMeteo) {
    siteMetaHint.textContent =
        "Commune : " + (siteInfo.commune || "?") +
        " — Zone PERENE : " + (siteInfo.zonePerene || "?") +
        " — Station météo : " + (siteInfo.stationMeteo || "?");
    siteMetaHint.classList.remove("hidden");
}

function saveSiteInfo() {
    var current = ReportExport.getSiteInfo();
    ReportExport.setSiteInfo(Object.assign({}, current, {
        nom: siteNomInput.value.trim(),
        typeConstruction: siteTypeInput.value.trim(),
        adresse: siteAdresseInput.value.trim(),
        email: destinataireEmailInput.value.trim()
    }));
}

[siteNomInput, siteTypeInput, siteAdresseInput, destinataireEmailInput].forEach(function (input) {
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

        var card = document.createElement("button");
        card.className = "dashboard-card";
        card.innerHTML =
            '<div class="dashboard-header">' +
                '<strong>' + building.nom + '</strong>' +
                '<span>' + (configured ? "✅" : "à configurer") + '</span>' +
            '</div>' +
            '<small>' + (configured ? "Modifier les secteurs / fiches" : "Choisir les secteurs présents") + '</small>';

        card.addEventListener("click", function () {
            BuildingManager.switchToBuilding(building.id).then(function () {
                var target = BuildingManager.hasSecteursConfigured(building.id) ? "site-data.html" : "audit.html";
                window.location.href = target;
            });
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
   CONFIGURATION EMAILJS
========================= */

var emailjsServiceInput = document.getElementById("emailjsServiceInput");
var emailjsTemplateInput = document.getElementById("emailjsTemplateInput");
var emailjsPublicKeyInput = document.getElementById("emailjsPublicKeyInput");
var saveEmailConfigBtn = document.getElementById("saveEmailConfigBtn");

var emailConfig = ReportExport.getEmailConfig();
emailjsServiceInput.value = emailConfig.serviceId;
emailjsTemplateInput.value = emailConfig.templateId;
emailjsPublicKeyInput.value = emailConfig.publicKey;

saveEmailConfigBtn.addEventListener("click", function () {
    ReportExport.setEmailConfig({
        serviceId: emailjsServiceInput.value,
        templateId: emailjsTemplateInput.value,
        publicKey: emailjsPublicKeyInput.value
    });
    alert("Configuration email enregistrée.");
});

/* =========================
   CONFIGURATION GITHUB (repli)
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

    var email = destinataireEmailInput.value.trim();

    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ Envoi en cours...";
    exportStatus.textContent = "";
    exportLink.classList.add("hidden");

    ReportExport.sendReport(email, function (msg) {
        exportStatus.textContent = msg;
    }).then(function (result) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📤 Valider & Envoyer le rapport";
        exportStatus.textContent = (result.channel === "local" ? "⚠️ " : "✅ ") + result.detail;
        if (result.url) {
            exportLink.href = result.url;
            exportLink.classList.remove("hidden");
        }
        renderBuildings();
    }).catch(function (err) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📤 Valider & Envoyer le rapport";
        exportStatus.textContent = "❌ Erreur : " + err.message;
        console.error("Export error:", err);
    });
});
