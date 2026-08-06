var hotelSelect = document.getElementById("hotelSelect");
var hotelPreview = document.getElementById("hotelPreview");
var continueButton = document.getElementById("continueButton");
var backToHomeButton = document.getElementById("backToHomeButton");

var existingSiteInfo = JSON.parse(localStorage.getItem("siteInfo")) || {};

backToHomeButton.addEventListener("click", function () {
    // Retour à l'accueil = remise à zéro complète de l'audit (bâtiments, fiches, photos).
    BuildingManager.wipeEverything().then(function () {
        window.location.href = "../index.html";
    });
});

HOTELS.forEach(function (hotel, index) {
    var option = document.createElement("option");
    option.value = index;
    option.textContent = hotel.nom + " — " + hotel.commune;
    hotelSelect.appendChild(option);
});

var preselectIndex = HOTELS.findIndex(function (hotel) {
    return hotel.nom === existingSiteInfo.nom;
});
if (preselectIndex >= 0) {
    hotelSelect.value = preselectIndex;
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
updatePreview();

continueButton.addEventListener("click", function () {
    var hotel = HOTELS[hotelSelect.value];
    if (!hotel) return;

    // Si on reconfirme le même hôtel (retour arrière puis re-validation), on garde
    // les contacts déjà saisis ; sinon nouvel hôtel = liste de contacts repartant à zéro.
    var keepContacts = existingSiteInfo.nom === hotel.nom ? existingSiteInfo.contacts : undefined;

    localStorage.setItem("siteInfo", JSON.stringify({
        nom: hotel.nom,
        typeConstruction: hotel.activite,
        adresse: hotel.adresse,
        commune: hotel.commune,
        zonePerene: hotel.zonePerene,
        stationMeteo: hotel.stationMeteo,
        activite: hotel.activite,
        contacts: keepContacts
    }));

    window.location.href = "buildings.html";
});
