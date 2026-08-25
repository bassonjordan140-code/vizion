/* ============================================================
   ViZion — Hub des bâtiments
   Liste les bâtiments de l'audit en cours, permet d'en ajouter,
   d'en reprendre un déjà commencé, et héberge l'envoi du
   rapport unifié (tous bâtiments confondus).
============================================================ */

/* =========================
   RETOUR AU HUB DES HÔTELS
========================= */

document.getElementById("backToHotelsButton").addEventListener("click", function () {
    // Retour au hub des hôtels : on sauvegarde l'hôtel en cours (siteInfo,
    // bâtiments, bâtiment actif), rien n'est perdu ni supprimé.
    HotelManager.saveCurrentHotelSnapshot().then(function () {
        window.location.href = "select-hotel.html";
    });
});

/* =========================
   INFORMATIONS DU SITE
========================= */

var siteNomInput = document.getElementById("siteNomInput");
var siteTypeInput = document.getElementById("siteTypeInput");
var siteAdresseInput = document.getElementById("siteAdresseInput");
var centralePvToggle = document.getElementById("centralePvToggle");
var centralePvContent = document.getElementById("centralePvContent");
var centralePvPuissanceInput = document.getElementById("centralePvPuissanceInput");
var centralePvModeInput = document.getElementById("centralePvModeInput");
var etudeFaisabilitePvToggle = document.getElementById("etudeFaisabilitePvToggle");
var etudeFaisabiliteEcsToggle = document.getElementById("etudeFaisabiliteEcsToggle");

var siteInfo = ReportExport.getSiteInfo();
siteNomInput.value = siteInfo.nom || "";
siteTypeInput.value = siteInfo.typeConstruction || "";
siteAdresseInput.value = siteInfo.adresse || "";
centralePvPuissanceInput.value = siteInfo.centralePvPuissance || "";
centralePvModeInput.value = siteInfo.centralePvMode || "Autoconsommation sans revente";

var siteMetaHint = document.getElementById("siteMetaHint");
if (siteInfo.commune) {
    siteMetaHint.textContent = "Commune : " + siteInfo.commune;
    siteMetaHint.classList.remove("hidden");
}

function updateToggleUI(container, isActive) {
    container.querySelectorAll(".toggle-btn").forEach(function (btn) {
        var match =
            (btn.dataset.value === "oui" && isActive) ||
            (btn.dataset.value === "non" && !isActive);
        if (match) { btn.classList.add("active"); }
        else { btn.classList.remove("active"); }
    });
}

function setupToggle(container, callback) {
    container.querySelectorAll(".toggle-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            callback(btn.dataset.value === "oui");
        });
    });
}

var centralePvPresente = !!siteInfo.centralePvPresente;

function updateCentralePvToggle() {
    updateToggleUI(centralePvToggle, centralePvPresente);
    if (centralePvPresente) { centralePvContent.classList.remove("hidden"); }
    else { centralePvContent.classList.add("hidden"); }
}

setupToggle(centralePvToggle, function (val) {
    centralePvPresente = val;
    updateCentralePvToggle();
    saveSiteInfo();
});

updateCentralePvToggle();

var etudeFaisabilitePv = !!siteInfo.etudeFaisabilitePv;
var etudeFaisabiliteEcs = !!siteInfo.etudeFaisabiliteEcs;

setupToggle(etudeFaisabilitePvToggle, function (val) {
    etudeFaisabilitePv = val;
    updateToggleUI(etudeFaisabilitePvToggle, etudeFaisabilitePv);
    saveSiteInfo();
});

setupToggle(etudeFaisabiliteEcsToggle, function (val) {
    etudeFaisabiliteEcs = val;
    updateToggleUI(etudeFaisabiliteEcsToggle, etudeFaisabiliteEcs);
    saveSiteInfo();
});

updateToggleUI(etudeFaisabilitePvToggle, etudeFaisabilitePv);
updateToggleUI(etudeFaisabiliteEcsToggle, etudeFaisabiliteEcs);

function saveSiteInfo() {
    var current = ReportExport.getSiteInfo();
    ReportExport.setSiteInfo(Object.assign({}, current, {
        nom: siteNomInput.value.trim(),
        typeConstruction: siteTypeInput.value.trim(),
        adresse: siteAdresseInput.value.trim(),
        centralePvPresente: centralePvPresente,
        centralePvPuissance: parseFloat(centralePvPuissanceInput.value) || 0,
        centralePvMode: centralePvModeInput.value,
        etudeFaisabilitePv: etudeFaisabilitePv,
        etudeFaisabiliteEcs: etudeFaisabiliteEcs
    }));
}

[siteNomInput, siteTypeInput, siteAdresseInput, centralePvPuissanceInput, centralePvModeInput].forEach(function (input) {
    input.addEventListener("change", saveSiteInfo);
});

/* =========================
   PERSONNES PRÉSENTES
   Contacts saisis pour cet audit (siteInfo.contacts), pré-remplis
   depuis l'annuaire HOTEL_CONTACTS (js/contacts-data.js) selon
   l'hôtel choisi. Deux rôles par défaut (Responsable du site /
   Responsable maintenance) sont toujours présents, complétables.
========================= */

var contactsList = document.getElementById("contactsList");
var contactSuggestions = document.getElementById("contactSuggestions");
var addContactBtn = document.getElementById("addContactBtn");

function getContacts() {
    return ReportExport.getSiteInfo().contacts || [];
}

function saveContacts(contacts) {
    var current = ReportExport.getSiteInfo();
    ReportExport.setSiteInfo(Object.assign({}, current, { contacts: contacts }));
}

// ABR = les trois premières lettres du nom de l'hôtel (espaces/ponctuation ignorés).
function hotelAbr() {
    var lettersOnly = siteNomInput.value.trim().replace(/[^\p{L}]/gu, "");
    return lettersOnly.slice(0, 3).toUpperCase();
}

function hotelEntreprise() {
    return siteNomInput.value.trim();
}

function combinePhones(telFixe, telPortable) {
    return [telFixe, telPortable]
        .filter(function (t) { return t && t.trim(); })
        .join(" / ");
}

function renderContactSuggestions() {

    contactSuggestions.innerHTML = "";

    var hotelNom = siteNomInput.value.trim();
    var contacts = getContacts();

    var suggestions = (window.HOTEL_CONTACTS || []).filter(function (c) {
        return c.hotels.indexOf(hotelNom) !== -1;
    }).filter(function (c) {
        var key = c.email || (c.nom + "_" + c.prenom);
        return !contacts.some(function (existing) { return existing._sourceKey === key; });
    });

    contactSuggestions.classList.toggle("hidden", suggestions.length === 0);

    suggestions.forEach(function (c) {

        var nomComplet = (c.prenom + " " + c.nom).trim();

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "contact-suggestion-chip";
        btn.innerHTML = "+ " + nomComplet + (c.fonction ? "<small>" + c.fonction + "</small>" : "");

        btn.addEventListener("click", function () {
            var updated = getContacts();
            updated.push({
                role: c.fonction || "",
                nom: nomComplet,
                telephone: combinePhones(c.telFixe, c.telPortable),
                abr: hotelAbr(),
                email: c.email || "",
                adresse: "",
                entreprise: hotelEntreprise(),
                _sourceKey: c.email || (c.nom + "_" + c.prenom)
            });
            saveContacts(updated);
            renderContacts();
            renderContactSuggestions();
        });

        contactSuggestions.appendChild(btn);
    });
}

function renderContacts() {

    contactsList.innerHTML = "";
    var contacts = getContacts();

    contacts.forEach(function (contact, idx) {

        var card = document.createElement("div");
        card.className = "contact-card";
        card.innerHTML =
            '<button type="button" class="contact-card-delete" aria-label="Supprimer cette personne">✕</button>' +
            '<div class="contact-fields-grid">' +
                '<div class="field-group"><label>Rôle</label><input type="text" class="contact-role" placeholder="Ex : Responsable du site"></div>' +
                '<div class="field-group"><label>Nom</label><input type="text" class="contact-nom" placeholder="Ex : Jean Dupont"></div>' +
                '<div class="field-group"><label>Téléphone</label><input type="tel" class="contact-telephone"></div>' +
                '<div class="field-group"><label>Email</label><input type="email" class="contact-email"></div>' +
                '<div class="field-group"><label>Entreprise</label><input type="text" class="contact-entreprise"></div>' +
                '<div class="field-group"><label>ABR</label><input type="text" class="contact-abr"></div>' +
                '<div class="field-group full-width"><label>Adresse</label><input type="text" class="contact-adresse"></div>' +
            '</div>';

        card.querySelector(".contact-role").value = contact.role || "";
        card.querySelector(".contact-nom").value = contact.nom || "";
        card.querySelector(".contact-telephone").value = contact.telephone || "";
        card.querySelector(".contact-email").value = contact.email || "";
        card.querySelector(".contact-entreprise").value = contact.entreprise || "";
        card.querySelector(".contact-abr").value = contact.abr || "";
        card.querySelector(".contact-adresse").value = contact.adresse || "";

        function bindField(field, selector) {
            card.querySelector(selector).addEventListener("change", function (e) {
                var updated = getContacts();
                if (!updated[idx]) return;
                updated[idx][field] = e.target.value.trim();
                saveContacts(updated);
            });
        }
        bindField("role", ".contact-role");
        bindField("nom", ".contact-nom");
        bindField("telephone", ".contact-telephone");
        bindField("email", ".contact-email");
        bindField("entreprise", ".contact-entreprise");
        bindField("abr", ".contact-abr");
        bindField("adresse", ".contact-adresse");

        card.querySelector(".contact-card-delete").addEventListener("click", function () {
            var updated = getContacts();
            updated.splice(idx, 1);
            saveContacts(updated);
            renderContacts();
            renderContactSuggestions();
        });

        contactsList.appendChild(card);
    });
}

renderContacts();
renderContactSuggestions();

addContactBtn.addEventListener("click", function () {
    var updated = getContacts();
    updated.push({ role: "", nom: "", telephone: "", abr: hotelAbr(), email: "", adresse: "", entreprise: hotelEntreprise() });
    saveContacts(updated);
    renderContacts();
});

siteNomInput.addEventListener("change", renderContactSuggestions);

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

    saveSiteInfo();

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
