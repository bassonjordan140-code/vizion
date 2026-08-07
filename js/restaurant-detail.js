var currentRestaurant =
    JSON.parse(localStorage.getItem("currentRestaurant"));

var restaurantTitle = document.getElementById("restaurantTitle");
var saveButton = document.getElementById("saveRestaurant");

if (currentRestaurant) {
    restaurantTitle.textContent = "Restaurant " + currentRestaurant.numero;
}

var restaurantData =
    JSON.parse(localStorage.getItem("restaurantData")) || {};

var savedData =
    restaurantData[currentRestaurant.numero];

PhotoManager.initPage("restaurant", currentRestaurant.numero);

/* ==============================
   UTILITAIRE TOGGLE
============================== */

function updateToggleUI(container, isActive) {
    container.querySelectorAll(".toggle-btn").forEach(function (btn) {
        var match =
            (btn.dataset.value === "oui" && isActive) ||
            (btn.dataset.value === "non" && !isActive);
        if (match) { btn.classList.add("active"); }
        else { btn.classList.remove("active"); }
    });
}

function setupToggle(container, callback) {
    container.querySelectorAll(".toggle-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            callback(btn.dataset.value === "oui");
        });
    });
}

/* =========================
   BLOC 1 — IDENTIFICATION
========================= */

var typeRestaurant = document.getElementById("typeRestaurant");
var autreTypeContainer = document.getElementById("autreTypeContainer");
var autreTypeInput = document.getElementById("autreTypeInput");
var nomRestaurant = document.getElementById("nomRestaurant");
var placesAssises = document.getElementById("placesAssises");

if (savedData) {
    typeRestaurant.value = savedData.typeSelect || "Restaurant principal";
    if (savedData.typeSelect === "Autre") {
        autreTypeContainer.classList.remove("hidden");
        autreTypeInput.value = savedData.type || "";
    }
    nomRestaurant.value = savedData.nom || "";
    placesAssises.value = savedData.placesAssises || "";
}

typeRestaurant.addEventListener("change", function () {
    if (typeRestaurant.value === "Autre") {
        autreTypeContainer.classList.remove("hidden");
    } else {
        autreTypeContainer.classList.add("hidden");
        autreTypeInput.value = "";
    }
});

/* =========================
   CLIMATISATION (pattern hébergement)
========================= */

var climToggle = document.getElementById("climToggle");
var climContent = document.getElementById("climContent");
var climEtat = document.getElementById("climEtat");
var plaqueToggle = document.getElementById("plaqueToggle");
var plaquePhotoContainer = document.getElementById("plaquePhotoContainer");

var climNombre = document.getElementById("climNombre");
var climPuissance = document.getElementById("climPuissance");

var climatisation =
    savedData && savedData.climatisation
        ? JSON.parse(JSON.stringify(savedData.climatisation))
        : { present: false, nombre: 0, puissance: 0, etat: "Bon", plaque: false };

function updateClimToggle() {
    updateToggleUI(climToggle, climatisation.present);
    if (climatisation.present) { climContent.classList.remove("hidden"); }
    else { climContent.classList.add("hidden"); }
}

function updatePlaqueToggle() {
    updateToggleUI(plaqueToggle, climatisation.plaque);
    if (climatisation.plaque) { plaquePhotoContainer.classList.remove("hidden"); }
    else { plaquePhotoContainer.classList.add("hidden"); }
}

setupToggle(climToggle, function (val) {
    climatisation.present = val;
    if (val && !climatisation.nombre) {
        climatisation.nombre = 1;
        climNombre.value = 1;
    }
    updateClimToggle();
});

setupToggle(plaqueToggle, function (val) {
    climatisation.plaque = val;
    updatePlaqueToggle();
});

climEtat.addEventListener("change", function () {
    climatisation.etat = climEtat.value;
});

climNombre.addEventListener("input", function () {
    var v = parseInt(climNombre.value);
    climatisation.nombre = isNaN(v) || v < 0 ? 0 : v;
});

climPuissance.addEventListener("input", function () {
    var v = parseFloat(climPuissance.value);
    climatisation.puissance = isNaN(v) || v < 0 ? 0 : v;
});

if (savedData && savedData.climatisation) {
    climEtat.value = climatisation.etat;
    climNombre.value = climatisation.nombre || 0;
    climPuissance.value = climatisation.puissance || "";
}

updateClimToggle();
updatePlaqueToggle();

/* =========================
   BRASSEUR D'AIR
========================= */

var brasseurToggle = document.getElementById("brasseurToggle");
var brasseurContent = document.getElementById("brasseurContent");
var brasseurNombre = document.getElementById("brasseurNombre");

var brasseurAir =
    savedData && savedData.brasseurAir
        ? { present: savedData.brasseurAir.present === "oui", nombre: savedData.brasseurAir.nombre || 0 }
        : { present: false, nombre: 0 };

if (brasseurAir.present) { brasseurNombre.value = brasseurAir.nombre; }

function updateBrasseurToggle() {
    updateToggleUI(brasseurToggle, brasseurAir.present);
    if (brasseurAir.present) { brasseurContent.classList.remove("hidden"); }
    else { brasseurContent.classList.add("hidden"); }
}

setupToggle(brasseurToggle, function (val) {
    brasseurAir.present = val;
    updateBrasseurToggle();
});

brasseurNombre.addEventListener("input", function () {
    var v = parseInt(brasseurNombre.value);
    brasseurAir.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateBrasseurToggle();

/* =========================
   ÉQUIPEMENTS (100% libres)
========================= */

var equipements =
    savedData && Array.isArray(savedData.equipements)
        ? JSON.parse(JSON.stringify(savedData.equipements))
        : [];

var customEquipementsList = document.getElementById("customEquipementsList");
var nouvelEquipementInput = document.getElementById("nouvelEquipementInput");
var addEquipementButton = document.getElementById("addEquipementButton");

function renderEquipements() {

    customEquipementsList.innerHTML = "";

    equipements.forEach(function (equip, idx) {

        var item = document.createElement("div");
        item.className = "custom-equip-card";

        item.innerHTML =
            '<button type="button" class="custom-equip-delete" data-idx="' + idx + '" aria-label="Supprimer cet équipement">✕</button>' +
            '<div class="custom-equip-name">' + equip.nom + '</div>' +
            '<div class="custom-equip-fields">' +
                '<div class="field-group"><label>Nombre</label>' +
                '<input type="number" min="1" step="1" inputmode="numeric" class="custom-equip-nombre" data-idx="' + idx + '" value="' + (equip.nombre || 1) + '"></div>' +
                '<div class="field-group"><label>Puissance unitaire (W)</label>' +
                '<input type="number" min="0" step="1" inputmode="numeric" class="custom-equip-puissance" data-idx="' + idx + '" value="' + (equip.puissance !== undefined ? equip.puissance : "") + '" placeholder="Ex : 500"></div>' +
                '<div class="field-group">' + PhotoManager.createPhotoWidget("restaurant_" + currentRestaurant.numero + "_customeq_" + equip.nom) + '</div>' +
            '</div>';

        customEquipementsList.appendChild(item);

    });

    customEquipementsList.querySelectorAll(".custom-equip-delete").forEach(function (btn) {
        btn.addEventListener("click", function () {
            equipements.splice(parseInt(btn.dataset.idx), 1);
            renderEquipements();
        });
    });

    customEquipementsList.querySelectorAll(".custom-equip-nombre").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.idx);
            var v = parseInt(input.value);
            equipements[idx].nombre = isNaN(v) || v < 1 ? 1 : v;
        });
    });

    customEquipementsList.querySelectorAll(".custom-equip-puissance").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.idx);
            var v = parseFloat(input.value);
            equipements[idx].puissance = isNaN(v) || v < 0 ? 0 : v;
        });
    });

    PhotoManager.bindAll(customEquipementsList);

}

renderEquipements();

addEquipementButton.addEventListener("click", function () {

    var nom = nouvelEquipementInput.value.trim();
    if (nom === "") {
        alert("Veuillez entrer un nom d'équipement.");
        return;
    }

    equipements.unshift({ nom: nom, nombre: 1, puissance: "" });
    nouvelEquipementInput.value = "";
    renderEquipements();

});

/* =========================
   ÉCLAIRAGE (pattern hébergement)
========================= */

var ampouleTypes = [
    { nom: "LED",              puissance: 9 },
    { nom: "Fluocompacte",     puissance: 18 },
    { nom: "Tube fluorescent", puissance: 36 },
    { nom: "Halogène",         puissance: 50 },
    { nom: "Incandescence",    puissance: 60 }
];

var eclairageList = document.getElementById("eclairageList");
var addEclairageButton = document.getElementById("addEclairageButton");
var eclairages = savedData && Array.isArray(savedData.eclairages) ? savedData.eclairages.slice() : [];

function renderEclairages() {

    eclairageList.innerHTML = "";

    eclairages.forEach(function (item, index) {

        var row = document.createElement("div");
        row.className = "eclairage-row";

        var typesHTML = ampouleTypes.map(function (t) {
            return '<option value="' + t.nom + '"' + (t.nom === item.type ? ' selected' : '') + '>' + t.nom + '</option>';
        }).join("");

        var total = item.puissance * item.quantite;

        row.innerHTML =
            '<div class="parois-cell"><label>Type</label><select class="eclairage-type-select" data-index="' + index + '">' + typesHTML + '</select></div>' +
            '<div class="parois-cell eclairage-puissance-cell"><label>W unitaire</label><input type="number" min="1" step="1" inputmode="numeric" pattern="[0-9]*" class="eclairage-puissance-input" data-index="' + index + '" value="' + item.puissance + '"></div>' +
            '<div class="parois-cell"><label>Quantité</label><input type="number" min="1" step="1" inputmode="numeric" pattern="[0-9]*" class="eclairage-quantite-input" data-index="' + index + '" value="' + item.quantite + '"></div>' +
            '<div class="parois-cell eclairage-total-cell"><label>Total</label><span class="eclairage-total-value">' + total + ' W</span></div>' +
            '<button type="button" class="parois-delete-btn eclairage-delete-btn" data-index="' + index + '" aria-label="Supprimer">✕</button>' +
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("restaurant_" + currentRestaurant.numero + "_eclairage_" + index) + '</div>';

        eclairageList.appendChild(row);
    });

    if (eclairages.length === 0) {
        var empty = document.createElement("p");
        empty.className = "parois-empty";
        empty.textContent = "Aucun éclairage. Cliquez sur « + Ajouter type d'éclairage ».";
        eclairageList.appendChild(empty);
    }

    document.querySelectorAll("#eclairageList .eclairage-type-select").forEach(function (select) {
        select.addEventListener("change", function () {
            var idx = parseInt(select.dataset.index);
            var def = ampouleTypes.find(function (t) { return t.nom === select.value; });
            eclairages[idx].type = select.value;
            eclairages[idx].puissance = def.puissance;
            renderEclairages();
        });
    });

    document.querySelectorAll("#eclairageList .eclairage-puissance-input").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.index);
            eclairages[idx].puissance = parseInt(input.value) || 0;
            var totalSpan = input.closest(".eclairage-row").querySelector(".eclairage-total-value");
            totalSpan.textContent = eclairages[idx].puissance * eclairages[idx].quantite + " W";
        });
    });

    document.querySelectorAll("#eclairageList .eclairage-quantite-input").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.index);
            eclairages[idx].quantite = parseInt(input.value) || 0;
            var totalSpan = input.closest(".eclairage-row").querySelector(".eclairage-total-value");
            totalSpan.textContent = eclairages[idx].puissance * eclairages[idx].quantite + " W";
        });
    });

    document.querySelectorAll("#eclairageList .eclairage-delete-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            eclairages.splice(parseInt(btn.dataset.index), 1);
            renderEclairages();
        });
    });

    PhotoManager.bindAll(eclairageList);
}

addEclairageButton.addEventListener("click", function () {
    var def = ampouleTypes[0];
    eclairages.push({ type: def.nom, puissance: def.puissance, quantite: 1 });
    renderEclairages();
});
renderEclairages();

/* =========================
   REPAS SERVIS ET HORAIRES
========================= */

var pdejToggle = document.getElementById("pdejToggle");
var pdejHoraires = document.getElementById("pdejHoraires");
var pdejDebut = document.getElementById("pdejDebut");
var pdejFin = document.getElementById("pdejFin");

var dejToggle = document.getElementById("dejToggle");
var dejHoraires = document.getElementById("dejHoraires");
var dejDebut = document.getElementById("dejDebut");
var dejFin = document.getElementById("dejFin");

var dinerToggle = document.getElementById("dinerToggle");
var dinerHoraires = document.getElementById("dinerHoraires");
var dinerDebut = document.getElementById("dinerDebut");
var dinerFin = document.getElementById("dinerFin");

var pdejServi = savedData && savedData.repas ? savedData.repas.petitDejeuner.servi === "oui" : false;
var dejServi = savedData && savedData.repas ? savedData.repas.dejeuner.servi === "oui" : false;
var dinerServi = savedData && savedData.repas ? savedData.repas.diner.servi === "oui" : false;

if (savedData && savedData.repas) {
    if (savedData.repas.petitDejeuner.debut) pdejDebut.value = savedData.repas.petitDejeuner.debut;
    if (savedData.repas.petitDejeuner.fin) pdejFin.value = savedData.repas.petitDejeuner.fin;
    if (savedData.repas.dejeuner.debut) dejDebut.value = savedData.repas.dejeuner.debut;
    if (savedData.repas.dejeuner.fin) dejFin.value = savedData.repas.dejeuner.fin;
    if (savedData.repas.diner.debut) dinerDebut.value = savedData.repas.diner.debut;
    if (savedData.repas.diner.fin) dinerFin.value = savedData.repas.diner.fin;
}

function makeRepasToggle(toggle, horairesEl, getServi, setServi) {
    function update() {
        updateToggleUI(toggle, getServi());
        if (getServi()) { horairesEl.classList.remove("hidden"); }
        else { horairesEl.classList.add("hidden"); }
    }
    setupToggle(toggle, function (val) { setServi(val); update(); });
    update();
}

makeRepasToggle(pdejToggle, pdejHoraires,
    function () { return pdejServi; }, function (v) { pdejServi = v; });

makeRepasToggle(dejToggle, dejHoraires,
    function () { return dejServi; }, function (v) { dejServi = v; });

makeRepasToggle(dinerToggle, dinerHoraires,
    function () { return dinerServi; }, function (v) { dinerServi = v; });

/* =========================
   OBSERVATIONS
========================= */

var observations = document.getElementById("observations");
if (savedData && savedData.observations) { observations.value = savedData.observations; }

/* =========================
   SAUVEGARDE
========================= */

saveButton.addEventListener("click", function () {

    var restaurantData = JSON.parse(localStorage.getItem("restaurantData")) || {};

    var finalType = typeRestaurant.value;
    if (typeRestaurant.value === "Autre") { finalType = autreTypeInput.value.trim(); }
    if (finalType === "") { finalType = "Restaurant " + currentRestaurant.numero; }

    restaurantData[currentRestaurant.numero] = {
        typeSelect: typeRestaurant.value,
        type: finalType,
        nom: nomRestaurant.value,
        placesAssises: parseInt(placesAssises.value) || 0,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        equipements: equipements,
        eclairages: eclairages,
        repas: {
            petitDejeuner: { servi: pdejServi ? "oui" : "non", debut: pdejDebut.value, fin: pdejFin.value },
            dejeuner: { servi: dejServi ? "oui" : "non", debut: dejDebut.value, fin: dejFin.value },
            diner: { servi: dinerServi ? "oui" : "non", debut: dinerDebut.value, fin: dinerFin.value }
        },
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("restaurantData", JSON.stringify(restaurantData));
    window.location.href = "module-detail.html";
});
