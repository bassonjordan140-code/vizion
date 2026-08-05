/* ============================================================
   ViZion — Tableau de bord des secteurs (audit.html)
   Liste les 12 secteurs avec leur progression. Un clic ouvre
   directement l'écran "Localisation" du secteur (module-detail.js) ;
   plus de case à cocher ni de quantité fixe.
============================================================ */

var secteurDashboard = document.getElementById("secteurDashboard");
var backToHomeButton = document.getElementById("backToHomeButton");

function renderSecteurs() {

    secteurDashboard.innerHTML = "";

    SECTEURS.forEach(function (secteur) {

        var data = JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[secteur.id])) || {};
        var count = Object.keys(data).length;
        var progress = calcModuleProgress(secteur.id);

        var card = document.createElement("button");
        card.className = "dashboard-card";

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
            '</small>';

        card.addEventListener("click", function () {

            localStorage.setItem(
                "currentSecteur",
                JSON.stringify({ id: secteur.id, label: secteur.label })
            );

            window.location.href = "module-detail.html";

        });

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
