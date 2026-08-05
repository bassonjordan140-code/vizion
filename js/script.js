/* ============================================================
   ViZion — Tableau de bord des secteurs (audit.html)
   Liste les 12 secteurs avec leur progression. Un clic ouvre
   directement l'écran "Localisation" du secteur (module-detail.js) ;
   plus de case à cocher ni de quantité fixe. Chaque secteur peut
   être vidé (toutes ses localisations supprimées) via le bouton ✕.
============================================================ */

var secteurDashboard = document.getElementById("secteurDashboard");
var backToHomeButton = document.getElementById("backToHomeButton");

function deleteSecteurData(secteur) {

    if (!confirm('Supprimer toutes les localisations de "' + secteur.label + '" ? Cette action est irréversible.')) {
        return;
    }

    localStorage.removeItem(SECTEUR_DATA_KEYS[secteur.id]);
    localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteur.id]);

    PhotoManager.deletePhotosByPrefix(secteur.id).then(function () {
        renderSecteurs();
    });

}

function renderSecteurs() {

    secteurDashboard.innerHTML = "";

    SECTEURS.forEach(function (secteur) {

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
            (count ? '<button type="button" class="card-delete-btn" aria-label="Supprimer ce secteur">✕</button>' : "");

        card.addEventListener("click", function () {

            localStorage.setItem(
                "currentSecteur",
                JSON.stringify({ id: secteur.id, label: secteur.label })
            );

            window.location.href = "module-detail.html";

        });

        var deleteBtn = card.querySelector(".card-delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", function (e) {
                e.stopPropagation();
                deleteSecteurData(secteur);
            });
        }

        secteurDashboard.appendChild(card);

    });

}

renderSecteurs();

backToHomeButton.addEventListener("click", function () {

    // Retour au hub des bâtiments : on sauvegarde le bâtiment en cours,
    // rien n'est perdu.
    BuildingManager.saveCurrentBuildingSnapshot().then(function () {
        window.location.href = "buildings.html";
    });

});
