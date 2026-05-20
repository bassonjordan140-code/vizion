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
   EXPORT GITHUB
========================= */

var exportSection = document.getElementById("exportSection");
var tokenSetup = document.getElementById("tokenSetup");
var exportReady = document.getElementById("exportReady");
var saveTokenBtn = document.getElementById("saveTokenBtn");
var githubTokenInput = document.getElementById("githubTokenInput");
var exportBtn = document.getElementById("exportBtn");
var exportStatus = document.getElementById("exportStatus");
var exportLink = document.getElementById("exportLink");

// Toujours afficher la section export (même si pas 100%)
if (selectedModules.length > 0) {
    exportSection.classList.remove("hidden");
}

// Si token déjà configuré, afficher le bouton export
if (ExportGitHub.hasToken()) {
    tokenSetup.classList.add("hidden");
    exportReady.classList.remove("hidden");
}

saveTokenBtn.addEventListener("click", function () {
    var token = githubTokenInput.value.trim();
    if (token === "") {
        alert("Veuillez entrer un token GitHub valide.");
        return;
    }
    ExportGitHub.setToken(token);
    tokenSetup.classList.add("hidden");
    exportReady.classList.remove("hidden");
});

exportBtn.addEventListener("click", function () {

    if (!allComplete) {
        if (!confirm("Certains modules ne sont pas à 100%. Voulez-vous quand même exporter ?")) {
            return;
        }
    }

    exportBtn.disabled = true;
    exportBtn.textContent = "⏳ Export en cours...";
    exportStatus.textContent = "";
    exportLink.classList.add("hidden");

    ExportGitHub.exportToGitHub(function (msg) {
        exportStatus.textContent = msg;
    }).then(function (result) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📤 Valider & Exporter l'audit";
        exportStatus.textContent = "✅ Export réussi ! " + result.nbFiles + " fichier(s) envoyé(s).";
        exportLink.href = result.url;
        exportLink.classList.remove("hidden");
    }).catch(function (err) {
        exportBtn.disabled = false;
        exportBtn.textContent = "📤 Valider & Exporter l'audit";
        exportStatus.textContent = "❌ Erreur : " + err.message;
        console.error("Export error:", err);
    });
});
