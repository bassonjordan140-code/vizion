var selectedModules =
    JSON.parse(localStorage.getItem("selectedModules")) || [];

var moduleDashboard =
    document.getElementById("moduleDashboard");

var allComplete = true;

selectedModules.forEach(function (module) {

    var progress = calcModuleProgress(module.id, module.quantity);
    if (progress < 100) { allComplete = false; }

    var card =
        document.createElement("button");

    card.className =
        "dashboard-card";

    card.innerHTML =
        '<div class="dashboard-header">' +
            '<strong>' + module.label + '</strong>' +
            '<span>' + progress + '% ' + (progress === 100 ? "✅" : "") + '</span>' +
        '</div>' +
        '<div class="progress-bar">' +
            '<div class="progress-fill" style="width: ' + progress + '%"></div>' +
        '</div>' +
        '<small>' +
            (progress === 100 ? "Terminé — modifier ou supprimer" : module.quantity + " fiche(s) — à compléter") +
        '</small>';

    card.addEventListener("click", function () {

        localStorage.setItem(
            "currentModule",
            JSON.stringify(module)
        );

        window.location.href =
            "module-detail.html";

    });

    moduleDashboard.appendChild(card);

});

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

function saveSiteInfo() {
    ReportExport.setSiteInfo({
        nom: siteNomInput.value.trim(),
        typeConstruction: siteTypeInput.value.trim(),
        adresse: siteAdresseInput.value.trim(),
        email: destinataireEmailInput.value.trim()
    });
}

[siteNomInput, siteTypeInput, siteAdresseInput, destinataireEmailInput].forEach(function (input) {
    input.addEventListener("change", saveSiteInfo);
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

var exportSection = document.getElementById("exportSection");
var exportBtn = document.getElementById("exportBtn");
var exportStatus = document.getElementById("exportStatus");
var exportLink = document.getElementById("exportLink");

// Toujours afficher la section export (même si pas 100%)
if (selectedModules.length > 0) {
    exportSection.classList.remove("hidden");
}

exportBtn.addEventListener("click", function () {

    if (!allComplete) {
        if (!confirm("Certains modules ne sont pas à 100%. Voulez-vous quand même envoyer le rapport ?")) {
            return;
        }
    }

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
    }).catch(function (err) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📤 Valider & Envoyer le rapport";
        exportStatus.textContent = "❌ Erreur : " + err.message;
        console.error("Export error:", err);
    });
});
