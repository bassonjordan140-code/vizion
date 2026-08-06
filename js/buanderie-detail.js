var currentBuanderie =
    JSON.parse(localStorage.getItem("currentBuanderie"));

var buanderieTitle = document.getElementById("buanderieTitle");
var saveButton = document.getElementById("saveBuanderie");

if (currentBuanderie) {
    buanderieTitle.textContent = "Buanderie " + currentBuanderie.numero;
}

var buanderieData =
    JSON.parse(localStorage.getItem("buanderieData")) || {};

var savedData =
    buanderieData[currentBuanderie.numero];

PhotoManager.initPage("buanderie", currentBuanderie.numero);

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
   IDENTIFICATION
========================= */

var nomBuanderie = document.getElementById("nomBuanderie");

if (savedData) {
    nomBuanderie.value = savedData.nom || "";
}

/* =========================
   CLIMATISATION (pattern hébergement)
========================= */

var climToggle = document.getElementById("climToggle");
var climContent = document.getElementById("climContent");
var climEtat = document.getElementById("climEtat");
var plaqueToggle = document.getElementById("plaqueToggle");
var plaquePhotoContainer = document.getElementById("plaquePhotoContainer");
var climNombre = document.getElementById("climNombre");

var climatisation =
    savedData && savedData.climatisation
        ? JSON.parse(JSON.stringify(savedData.climatisation))
        : { present: false, nombre: 0, etat: "Bon", plaque: false };

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

if (savedData && savedData.climatisation) {
    climEtat.value = climatisation.etat;
    climNombre.value = climatisation.nombre || 0;
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
   LAVE-LINGE
========================= */

var nbLaveLinge = document.getElementById("nbLaveLinge");
var capaciteLaveLinge = document.getElementById("capaciteLaveLinge");
var ecsLaveLinge = document.getElementById("ecsLaveLinge");
var ecsLaveLingePropreContent = document.getElementById("ecsLaveLingePropreContent");
var ecsLaveLingeBallons = document.getElementById("ecsLaveLingeBallons");
var ecsLaveLingeVolume = document.getElementById("ecsLaveLingeVolume");
var ecsLaveLingePuissance = document.getElementById("ecsLaveLingePuissance");
var plaqueLaveLingeToggle = document.getElementById("plaqueLaveLingeToggle");
var plaqueLaveLingePhoto = document.getElementById("plaqueLaveLingePhoto");

var plaqueLaveLinge = savedData && savedData.laveLinge ? savedData.laveLinge.plaque === "oui" : false;

if (savedData && savedData.laveLinge) {
    nbLaveLinge.value = savedData.laveLinge.nombre || "";
    capaciteLaveLinge.value = savedData.laveLinge.capaciteKg || "";
    ecsLaveLinge.value = savedData.laveLinge.ecsAssociee || "Raccordée à l'ECS hôtel";
    ecsLaveLingeBallons.value = savedData.laveLinge.ecsBallons || 0;
    ecsLaveLingeVolume.value = savedData.laveLinge.ecsVolume || "";
    ecsLaveLingePuissance.value = savedData.laveLinge.ecsPuissance || "";
}

function updateEcsLaveLingePropre() {
    if (ecsLaveLinge.value === "Propre") { ecsLaveLingePropreContent.classList.remove("hidden"); }
    else { ecsLaveLingePropreContent.classList.add("hidden"); }
}

ecsLaveLinge.addEventListener("change", updateEcsLaveLingePropre);
updateEcsLaveLingePropre();

function updatePlaqueLaveLingeToggle() {
    updateToggleUI(plaqueLaveLingeToggle, plaqueLaveLinge);
    if (plaqueLaveLinge) { plaqueLaveLingePhoto.classList.remove("hidden"); }
    else { plaqueLaveLingePhoto.classList.add("hidden"); }
}

setupToggle(plaqueLaveLingeToggle, function (val) {
    plaqueLaveLinge = val;
    updatePlaqueLaveLingeToggle();
});

updatePlaqueLaveLingeToggle();

/* =========================
   SÈCHE-LINGE
========================= */

var nbSecheLinge = document.getElementById("nbSecheLinge");
var capaciteSecheLinge = document.getElementById("capaciteSecheLinge");
var energieSecheLinge = document.getElementById("energieSecheLinge");
var puissanceSecheLinge = document.getElementById("puissanceSecheLinge");
var plaqueSechLingeToggle = document.getElementById("plaqueSechLingeToggle");
var plaqueSechLingePhoto = document.getElementById("plaqueSechLingePhoto");

var plaqueSecheLinge = savedData && savedData.secheLinge ? savedData.secheLinge.plaque === "oui" : false;

if (savedData && savedData.secheLinge) {
    nbSecheLinge.value = savedData.secheLinge.nombre || "";
    capaciteSecheLinge.value = savedData.secheLinge.capaciteKg || "";
    energieSecheLinge.value = savedData.secheLinge.typeEnergie || "Résistance électrique";
    puissanceSecheLinge.value = savedData.secheLinge.puissance || "";
}

function updatePlaqueSechLingeToggle() {
    updateToggleUI(plaqueSechLingeToggle, plaqueSecheLinge);
    if (plaqueSecheLinge) { plaqueSechLingePhoto.classList.remove("hidden"); }
    else { plaqueSechLingePhoto.classList.add("hidden"); }
}

setupToggle(plaqueSechLingeToggle, function (val) {
    plaqueSecheLinge = val;
    updatePlaqueSechLingeToggle();
});

updatePlaqueSechLingeToggle();

/* =========================
   CALANDRE / REPASSEUSE
========================= */

var calandreToggle = document.getElementById("calandreToggle");
var calandreContent = document.getElementById("calandreContent");
var calandrePuissance = document.getElementById("calandrePuissance");

var calandre =
    savedData && savedData.calandre
        ? JSON.parse(JSON.stringify(savedData.calandre))
        : { presente: false, puissance: 0 };

function updateCalandreToggle() {
    updateToggleUI(calandreToggle, calandre.presente);
    if (calandre.presente) { calandreContent.classList.remove("hidden"); }
    else { calandreContent.classList.add("hidden"); }
}

setupToggle(calandreToggle, function (val) {
    calandre.presente = val;
    updateCalandreToggle();
});

if (savedData && savedData.calandre) {
    calandrePuissance.value = savedData.calandre.puissance || "";
}

calandrePuissance.addEventListener("input", function () {
    calandre.puissance = parseFloat(calandrePuissance.value) || 0;
});

updateCalandreToggle();

/* =========================
   USAGE
========================= */

var cyclesLaveLinge = document.getElementById("cyclesLaveLinge");
var cyclesSecheLinge = document.getElementById("cyclesSecheLinge");

if (savedData) {
    cyclesLaveLinge.value = savedData.cyclesLaveLinge || "";
    cyclesSecheLinge.value = savedData.cyclesSecheLinge || "";
}

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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("buanderie_" + currentBuanderie.numero + "_eclairage_" + index) + '</div>';

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
   OBSERVATIONS
========================= */

var observations = document.getElementById("observations");
if (savedData && savedData.observations) { observations.value = savedData.observations; }

/* =========================
   SAUVEGARDE
========================= */

saveButton.addEventListener("click", function () {

    var buanderieData = JSON.parse(localStorage.getItem("buanderieData")) || {};

    var finalNom = nomBuanderie.value.trim();
    if (finalNom === "") { finalNom = "Buanderie " + currentBuanderie.numero; }

    buanderieData[currentBuanderie.numero] = {
        nom: finalNom,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        laveLinge: {
            nombre: parseInt(nbLaveLinge.value) || 0,
            capaciteKg: parseFloat(capaciteLaveLinge.value) || 0,
            ecsAssociee: ecsLaveLinge.value,
            ecsBallons: parseInt(ecsLaveLingeBallons.value) || 0,
            ecsVolume: parseFloat(ecsLaveLingeVolume.value) || 0,
            ecsPuissance: parseFloat(ecsLaveLingePuissance.value) || 0,
            plaque: plaqueLaveLinge ? "oui" : "non"
        },
        secheLinge: {
            nombre: parseInt(nbSecheLinge.value) || 0,
            capaciteKg: parseFloat(capaciteSecheLinge.value) || 0,
            typeEnergie: energieSecheLinge.value,
            puissance: parseFloat(puissanceSecheLinge.value) || 0,
            plaque: plaqueSecheLinge ? "oui" : "non"
        },
        calandre: {
            presente: calandre.presente ? "oui" : "non",
            puissance: calandre.puissance
        },
        cyclesLaveLinge: parseInt(cyclesLaveLinge.value) || 0,
        cyclesSecheLinge: parseInt(cyclesSecheLinge.value) || 0,
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("buanderieData", JSON.stringify(buanderieData));
    window.location.href = "module-detail.html";
});
