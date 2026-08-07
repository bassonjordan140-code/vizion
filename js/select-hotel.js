/* ============================================================
   ViZion — Hub des hôtels
   Liste les hôtels dont l'audit a déjà commencé (persistants tant
   qu'on ne les supprime pas), permet d'en ouvrir un pour continuer,
   ou d'en ajouter un nouveau depuis la liste fixe des 24 hôtels.
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
                window.location.href = "buildings.html";
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
            renderHotelOptions();
        });

        hotelsDashboard.appendChild(card);
    });
}

/* =========================
   AJOUTER UN HÔTEL
========================= */

var hotelSelect = document.getElementById("hotelSelect");
var hotelPreview = document.getElementById("hotelPreview");
var continueButton = document.getElementById("continueButton");

function renderHotelOptions() {
    var started = HotelManager.listStartedHotelIndexes();
    var previousValue = hotelSelect.value;

    hotelSelect.innerHTML = '<option value="">— Sélectionner un hôtel —</option>';

    HOTELS.forEach(function (hotel, index) {
        if (started.indexOf(String(index)) !== -1) return;
        var option = document.createElement("option");
        option.value = index;
        option.textContent = hotel.nom + " — " + hotel.commune;
        hotelSelect.appendChild(option);
    });

    hotelSelect.value = previousValue;
    if (hotelSelect.value !== previousValue) {
        // L'option précédemment sélectionnée a disparu (hôtel ajouté entre-temps).
        hotelSelect.value = "";
    }
    updatePreview();
}

function updatePreview() {
    if (hotelSelect.value === "") {
        hotelPreview.classList.add("hidden");
        continueButton.disabled = true;
        return;
    }
    var hotel = HOTELS[hotelSelect.value];
    hotelPreview.innerHTML =
        hotel.adresse + "<br>" +
        hotel.activite;
    hotelPreview.classList.remove("hidden");
    continueButton.disabled = false;
}

hotelSelect.addEventListener("change", updatePreview);

continueButton.addEventListener("click", function () {
    var hotel = HOTELS[hotelSelect.value];
    if (!hotel) return;

    var defaultSiteInfo = {
        nom: hotel.nom,
        typeConstruction: hotel.activite,
        adresse: hotel.adresse,
        commune: hotel.commune,
        zonePerene: hotel.zonePerene,
        stationMeteo: hotel.stationMeteo,
        activite: hotel.activite
    };

    HotelManager.switchToHotel(hotelSelect.value, defaultSiteInfo).then(function () {
        window.location.href = "buildings.html";
    });
});

renderHotels();
renderHotelOptions();

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
