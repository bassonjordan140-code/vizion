/* ============================================================
   ViZion — Tableau de bord des secteurs (audit.html)
   N'affiche que les secteurs "actifs" pour ce bâtiment (liste
   propre à chaque bâtiment, cf. building-manager.js), avec leur
   progression. Un clic ouvre directement l'écran "Localisation"
   du secteur. On peut ajouter un secteur non encore présent, ou
   retirer un secteur existant (efface aussi ses localisations).
============================================================ */

var secteurDashboard = document.getElementById("secteurDashboard");
var backToHomeButton = document.getElementById("backToHomeButton");
var noSecteursHint = document.getElementById("noSecteursHint");
var addSecteurSelect = document.getElementById("addSecteurSelect");
var addSecteurBtn = document.getElementById("addSecteurBtn");
var addSecteurCard = document.getElementById("addSecteurCard");

function getActiveSecteurs() {
    return JSON.parse(localStorage.getItem("activeSecteurs")) || [];
}

function setActiveSecteurs(ids) {
    localStorage.setItem("activeSecteurs", JSON.stringify(ids));
}

function deleteSecteurData(secteur) {

    if (!confirm('Supprimer toutes les localisations de "' + secteur.label + '" ? Cette action est irréversible.')) {
        return;
    }

    localStorage.removeItem(SECTEUR_DATA_KEYS[secteur.id]);
    localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteur.id]);

    setActiveSecteurs(getActiveSecteurs().filter(function (id) { return id !== secteur.id; }));

    // Rafraîchit tout de suite ; le nettoyage des photos se fait en tâche de fond.
    renderSecteurs();
    PhotoManager.deletePhotosByPrefix(secteur.id);

}

function renderAddPicker(activeIds) {

    var remaining = SECTEURS.filter(function (s) { return activeIds.indexOf(s.id) === -1; });

    addSecteurCard.classList.toggle("hidden", remaining.length === 0);
    if (!remaining.length) return;

    addSecteurSelect.innerHTML = "";
    remaining.forEach(function (secteur) {
        var option = document.createElement("option");
        option.value = secteur.id;
        option.textContent = secteur.label;
        addSecteurSelect.appendChild(option);
    });

}

function renderSecteurs() {

    var activeIds = getActiveSecteurs();

    secteurDashboard.innerHTML = "";
    noSecteursHint.classList.toggle("hidden", activeIds.length > 0);

    SECTEURS
        .filter(function (secteur) { return activeIds.indexOf(secteur.id) !== -1; })
        .forEach(function (secteur) {

            var data = JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[secteur.id])) || {};
            var count = Object.keys(data).length;
            var progress = calcModuleProgress(secteur.id);

            var card = document.createElement("div");
            card.className = "dashboard-card";
            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");

            card.innerHTML =
                '<div class="dashboard-header">' +
                    '<strong>' + secteur.label + '</strong>' +
                    '<span>' + progress + '% ' + (progress === 100 && count ? "✅" : "") + '</span>' +
                '</div>' +
                '<div class="progress-bar">' +
                    '<div class="progress-fill" style="width: ' + progress + '%"></div>' +
                '</div>' +
                '<small>' +
                    (count ? count + " localisation(s)" : "Aucune localisation — cliquez pour en ajouter") +
                '</small>' +
                '<button type="button" class="card-delete-btn" aria-label="Retirer ce secteur">✕</button>';

            card.addEventListener("click", function () {

                localStorage.setItem(
                    "currentSecteur",
                    JSON.stringify({ id: secteur.id, label: secteur.label })
                );

                window.location.href = "module-detail.html";

            });

            card.querySelector(".card-delete-btn").addEventListener("click", function (e) {
                e.stopPropagation();
                deleteSecteurData(secteur);
            });

            secteurDashboard.appendChild(card);

        });

    renderAddPicker(activeIds);

}

renderSecteurs();

addSecteurBtn.addEventListener("click", function () {
    var id = addSecteurSelect.value;
    if (!id) return;

    var activeIds = getActiveSecteurs();
    if (activeIds.indexOf(id) === -1) {
        activeIds.push(id);
        setActiveSecteurs(activeIds);
    }

    renderSecteurs();
});

backToHomeButton.addEventListener("click", function () {

    // Retour au hub des bâtiments : on sauvegarde le bâtiment en cours,
    // rien n'est perdu.
    BuildingManager.saveCurrentBuildingSnapshot().then(function () {
        window.location.href = "buildings.html";
    });

});
