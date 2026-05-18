var selectedModules =
    JSON.parse(localStorage.getItem("selectedModules")) || [];

var moduleDashboard =
    document.getElementById("moduleDashboard");

selectedModules.forEach(function (module) {

    var progress = calcModuleProgress(module.id, module.quantity);

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
