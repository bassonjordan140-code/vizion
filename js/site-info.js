/* ============================================================
   ViZion — Informations du site
   Premier écran d'un hôtel (nouveau ou repris tant que non validé) :
   coordonnées du site + contacts, avant de passer à l'ajout des
   bâtiments (pages/buildings.html). "Valider et continuer" marque
   siteInfo.confirmed pour que js/select-hotel.js saute directement
   à buildings.html la prochaine fois qu'on rouvre cet hôtel.
============================================================ */

/* =========================
   RETOUR AU HUB DES HÔTELS
========================= */

document.getElementById("backToHotelsButton").addEventListener("click", function () {
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
   VALIDATION
========================= */

document.getElementById("validateSiteInfoBtn").addEventListener("click", function () {
    saveSiteInfo();
    var current = ReportExport.getSiteInfo();
    ReportExport.setSiteInfo(Object.assign({}, current, { confirmed: true }));
    window.location.href = "buildings.html";
});

/* =========================
   SAUVEGARDE
   Le téléchargement se fait ici (l'import reste sur select-hotel.js) pour
   ne pas dupliquer l'action à deux endroits.
========================= */

var exportBackupBtn = document.getElementById("exportBackupBtn");
var backupStatus = document.getElementById("backupStatus");

exportBackupBtn.addEventListener("click", function () {
    exportBackupBtn.disabled = true;
    backupStatus.textContent = "Préparation de la sauvegarde…";
    BackupManager.exportBackup()
        .then(function () {
            backupStatus.textContent = "Sauvegarde téléchargée.";
        })
        .catch(function (err) {
            console.error(err);
            backupStatus.textContent = "Échec de la sauvegarde : " + err.message;
        })
        .finally(function () {
            exportBackupBtn.disabled = false;
        });
});
