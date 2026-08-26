/* ============================================================
   ViZion — Hub des bâtiments
   Liste les bâtiments de l'audit en cours, permet d'en ajouter,
   d'en reprendre un déjà commencé, et héberge l'envoi du
   rapport unifié (tous bâtiments confondus).
============================================================ */

/* =========================
   RETOUR AUX INFORMATIONS DU SITE
   Symétrique de la navigation "avant" (site-info.html -> validation ->
   buildings.html) : on reste sur le même hôtel, pas besoin de sauvegarder
   un instantané ni de rien échanger (voir js/hotel-manager.js).
========================= */

document.getElementById("backToHotelsButton").addEventListener("click", function () {
    window.location.href = "site-info.html";
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
            '<small>' + (configured ? "Modifier les secteurs / localisations" : "Ajouter des localisations") +
                (building.niveaux ? " — " + building.niveaux + " niveau" + (building.niveaux > 1 ? "x" : "") : "") + '</small>' +
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
            // La suppression de la liste des bâtiments est synchrone (le nettoyage des
            // photos, lui, se termine en tâche de fond) : on l'appelle avant le rendu
            // pour que la carte disparaisse immédiatement, sans attendre un rafraîchissement.
            BuildingManager.deleteBuilding(building.id);
            renderBuildings();
        });

        buildingsDashboard.appendChild(card);
    });
}

renderBuildings();

/* =========================
   AJOUTER UN BÂTIMENT
========================= */

var newBuildingInput = document.getElementById("newBuildingInput");
var newBuildingNiveauxInput = document.getElementById("newBuildingNiveauxInput");
var addBuildingBtn = document.getElementById("addBuildingBtn");

addBuildingBtn.addEventListener("click", function () {
    var nom = newBuildingInput.value.trim();
    if (nom === "") {
        alert("Veuillez entrer un nom de bâtiment.");
        return;
    }
    var niveaux = parseInt(newBuildingNiveauxInput.value) || 1;
    var id = BuildingManager.createBuilding(nom, niveaux);
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

var equipmentCheckPanel = document.getElementById("equipmentCheckPanel");
var equipmentIssuesList = document.getElementById("equipmentIssuesList");
var ignoreIssuesBtn = document.getElementById("ignoreIssuesBtn");

function renderEquipmentIssues(issues) {

    equipmentIssuesList.innerHTML = "";

    issues.forEach(function (issue) {

        var manque = [];
        if (issue.missingNombre) manque.push("nombre");
        if (issue.missingPuissance) manque.push("puissance unitaire");

        var row = document.createElement("div");
        row.className = "equipment-issue-row";
        row.innerHTML =
            '<div class="equipment-issue-info">' +
                '<strong>' + issue.equipNom + '</strong> — ' + manque.join(" et ") + ' manquant' + (manque.length > 1 ? "s" : "") +
                '<small>' + issue.buildingNom + ' · ' + issue.secteurLabel + ' · ' + issue.localisationNom + '</small>' +
            '</div>' +
            '<button type="button" class="equipment-issue-fix-btn">Corriger →</button>';

        row.querySelector(".equipment-issue-fix-btn").addEventListener("click", function () {
            EquipmentCheck.gotoIssue(issue);
        });

        equipmentIssuesList.appendChild(row);

    });

}

function runExport() {

    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ Sauvegarde en cours...";
    exportStatus.textContent = "";
    exportLink.classList.add("hidden");

    BackupManager.exportBackup().catch(function (err) {
        // La sauvegarde est un bonus : si elle échoue, ne bloque pas le rapport.
        console.error("Backup error:", err);
    }).then(function () {

        exportBtn.textContent = "⏳ Génération en cours...";

        return ReportExport.sendReport(function (msg) {
            exportStatus.textContent = msg;
        });

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

}

ignoreIssuesBtn.addEventListener("click", function () {
    equipmentCheckPanel.classList.add("hidden");
    runExport();
});

exportBtn.addEventListener("click", function () {

    equipmentCheckPanel.classList.add("hidden");
    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ Vérification...";
    exportStatus.textContent = "";
    exportLink.classList.add("hidden");

    BuildingManager.collectAllBuildingsAuditData().then(function (buildingsAuditData) {

        var issues = EquipmentCheck.findIncompleteEquipment(buildingsAuditData);

        exportBtn.disabled = false;
        exportBtn.textContent = "📥 Valider & Télécharger le rapport";

        if (issues.length > 0) {
            renderEquipmentIssues(issues);
            equipmentCheckPanel.classList.remove("hidden");
            equipmentCheckPanel.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }

        runExport();

    });

});
