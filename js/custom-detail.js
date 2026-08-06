/* ============================================================
   ViZion — Fiche générique "Secteur personnalisé"
   Une seule fiche minimale (photo + observation) partagée par
   tous les secteurs ajoutés librement par l'utilisateur (audit.html),
   quel que soit leur nom. Les données de tous les secteurs
   personnalisés sont rangées dans customSecteurData, sous-clé
   égale à l'id du secteur.
============================================================ */

var currentCustom =
    JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_CURRENT_KEY));

var customTitle = document.getElementById("customTitle");
var customSubtitle = document.getElementById("customSubtitle");
var observationInput = document.getElementById("observation");
var saveButton = document.getElementById("saveCustom");

var allCustomData =
    JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};

var secteurData = allCustomData[currentCustom.secteurId] || {};
var savedData = secteurData[currentCustom.numero];

if (customTitle) {
    customTitle.textContent =
        (savedData && savedData.nom) || ("Localisation " + currentCustom.numero);
}

if (customSubtitle) {
    customSubtitle.textContent = "Secteur : " + (currentCustom.label || "personnalisé");
}

if (savedData && observationInput) {
    observationInput.value = savedData.observation || "";
}

PhotoManager.initPage(currentCustom.secteurId, currentCustom.numero);

saveButton.addEventListener("click", function () {

    var allData = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
    var data = allData[currentCustom.secteurId] || {};

    data[currentCustom.numero] = {
        nom: savedData ? savedData.nom : "",
        observation: observationInput.value.trim()
    };

    allData[currentCustom.secteurId] = data;
    localStorage.setItem(CUSTOM_SECTEUR_DATA_KEY, JSON.stringify(allData));

    window.location.href = "module-detail.html";

});
