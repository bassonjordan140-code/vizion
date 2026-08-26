/* ============================================================
   ViZion — Ouvrir un audit
   Liste les hôtels dont l'audit a déjà commencé (persistants tant
   qu'on ne les supprime pas) et permet d'en ouvrir un pour continuer.
   Démarrer un NOUVEL audit se fait depuis hotel-nouveau.html.
============================================================ */

var hotelsDashboard = document.getElementById("hotelsDashboard");
var noHotelsHint = document.getElementById("noHotelsHint");

function hotelDisplayName(hotelIndex) {
    var siteInfo = HotelManager.getSiteInfoFor(hotelIndex);
    if (siteInfo.nom) return siteInfo.nom;
    var hotel = HOTELS[hotelIndex];
    return hotel ? hotel.nom : "Hôtel";
}

function hotelDisplayCommune(hotelIndex) {
    var siteInfo = HotelManager.getSiteInfoFor(hotelIndex);
    if (siteInfo.commune) return siteInfo.commune;
    var hotel = HOTELS[hotelIndex];
    return hotel ? hotel.commune : "";
}

function renderHotels() {

    hotelsDashboard.innerHTML = "";
    var started = HotelManager.listStartedHotelIndexes();

    noHotelsHint.classList.toggle("hidden", started.length > 0);

    started.forEach(function (hotelIndex) {

        var nbBatiments = HotelManager.getBuildingsFor(hotelIndex).length;

        var card = document.createElement("div");
        card.className = "dashboard-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.innerHTML =
            '<div class="dashboard-header">' +
                '<strong>' + hotelDisplayName(hotelIndex) + '</strong>' +
                '<span>' + (nbBatiments > 0 ? "✅" : "à configurer") + '</span>' +
            '</div>' +
            '<small>' + hotelDisplayCommune(hotelIndex) +
                (nbBatiments > 0 ? " — " + nbBatiments + " bâtiment" + (nbBatiments > 1 ? "s" : "") : "") +
            '</small>' +
            '<button type="button" class="card-delete-btn" aria-label="Supprimer cet hôtel">✕</button>';

        card.addEventListener("click", function () {
            HotelManager.switchToHotel(hotelIndex).then(function () {
                // Si les informations du site n'ont encore jamais été validées
                // (hôtel quitté avant ce clic sur site-info.html), on les
                // remontre plutôt que de sauter directement à la liste des
                // bâtiments.
                var confirmed = !!ReportExport.getSiteInfo().confirmed;
                window.location.href = confirmed ? "buildings.html" : "site-info.html";
            });
        });

        card.querySelector(".card-delete-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            if (!confirm('Supprimer l\'hôtel "' + hotelDisplayName(hotelIndex) + '" et toutes ses données (bâtiments, secteurs, localisations, photos) ? Cette action est irréversible.')) {
                return;
            }
            // La suppression de la liste est synchrone (le nettoyage des photos, lui,
            // se termine en tâche de fond) : on l'appelle avant le rendu pour que la
            // carte disparaisse immédiatement, sans attendre un rafraîchissement.
            HotelManager.deleteHotel(hotelIndex);
            renderHotels();
        });

        hotelsDashboard.appendChild(card);
    });
}

renderHotels();

/* =========================
   SAUVEGARDE / RESTAURATION
========================= */

var exportBackupBtn = document.getElementById("exportBackupBtn");
var importBackupInput = document.getElementById("importBackupInput");
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

importBackupInput.addEventListener("change", function () {
    var file = importBackupInput.files[0];
    if (!file) return;

    if (!confirm("Importer cette sauvegarde va remplacer TOUTES les données actuelles (tous les hôtels, bâtiments, fiches et photos) par celles du fichier. Cette action est irréversible. Continuer ?")) {
        importBackupInput.value = "";
        return;
    }

    backupStatus.textContent = "Import en cours…";
    BackupManager.importBackup(file)
        .then(function () {
            backupStatus.textContent = "Sauvegarde importée. Rechargement…";
            window.location.reload();
        })
        .catch(function (err) {
            console.error(err);
            backupStatus.textContent = "Échec de l'import : " + err.message;
            importBackupInput.value = "";
        });
});
