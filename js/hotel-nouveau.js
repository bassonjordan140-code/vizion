/* ============================================================
   ViZion — Nouvel état des lieux
   Choix d'un hôtel parmi ceux pas encore commencés (liste fixe des
   24 hôtels), pour démarrer un nouvel audit.
============================================================ */

var hotelSelect = document.getElementById("hotelSelect");
var hotelPreview = document.getElementById("hotelPreview");
var continueButton = document.getElementById("continueButton");

function renderHotelOptions() {
    var started = HotelManager.listStartedHotelIndexes();

    hotelSelect.innerHTML = '<option value="">— Sélectionner un hôtel —</option>';

    HOTELS.forEach(function (hotel, index) {
        if (started.indexOf(String(index)) !== -1) return;
        var option = document.createElement("option");
        option.value = index;
        option.textContent = hotel.nom + " — " + hotel.commune;
        hotelSelect.appendChild(option);
    });

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

renderHotelOptions();
