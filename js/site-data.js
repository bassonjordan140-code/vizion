var selectedSecteurs =
    JSON.parse(localStorage.getItem("selectedSecteurs")) || [];

var moduleDashboard =
    document.getElementById("moduleDashboard");

var buildingSubtitle = document.getElementById("buildingSubtitle");
var currentBuildingId = BuildingManager.getCurrentBuildingId();
var currentBuilding = BuildingManager.listBuildings().find(function (b) {
    return b.id === currentBuildingId;
});
if (currentBuilding) {
    buildingSubtitle.textContent = "Bâtiment : " + currentBuilding.nom + " — sélectionnez le secteur à auditer.";
}

selectedSecteurs.forEach(function (secteur) {

    var progress = calcModuleProgress(secteur.id, secteur.quantity);

    var card =
        document.createElement("button");

    card.className =
        "dashboard-card";

    card.innerHTML =
        '<div class="dashboard-header">' +
            '<strong>' + secteur.label + '</strong>' +
            '<span>' + progress + '% ' + (progress === 100 ? "✅" : "") + '</span>' +
        '</div>' +
        '<div class="progress-bar">' +
            '<div class="progress-fill" style="width: ' + progress + '%"></div>' +
        '</div>' +
        '<small>' +
            (progress === 100 ? "Terminé — modifier ou supprimer" : secteur.quantity + " fiche(s) — à compléter") +
        '</small>';

    card.addEventListener("click", function () {

        localStorage.setItem(
            "currentSecteur",
            JSON.stringify(secteur)
        );

        window.location.href =
            "module-detail.html";

    });

    moduleDashboard.appendChild(card);

});
