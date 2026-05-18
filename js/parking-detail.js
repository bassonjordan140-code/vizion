var currentParking =
    JSON.parse(localStorage.getItem("currentParking"));

var parkingTitle = document.getElementById("parkingTitle");
var saveButton = document.getElementById("saveParking");

if (currentParking) {
    parkingTitle.textContent = "Parking " + currentParking.numero;
}

var parkingData =
    JSON.parse(localStorage.getItem("parkingData")) || {};

var savedData =
    parkingData[currentParking.numero];

PhotoManager.initPage("parking", currentParking.numero);

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

var nomParking = document.getElementById("nomParking");
var typeParking = document.getElementById("typeParking");
var surfaceParking = document.getElementById("surfaceParking");
var nbPlaces = document.getElementById("nbPlaces");

if (savedData) {
    nomParking.value = savedData.nom || "";
    typeParking.value = savedData.type || "Extérieur ouvert";
    surfaceParking.value = savedData.surface || "";
    nbPlaces.value = savedData.nbPlaces || "";
}

/* =========================
   ÉCLAIRAGE
========================= */

var pilotageEclairage = document.getElementById("pilotageEclairage");

if (savedData) {
    pilotageEclairage.value = savedData.pilotageEclairage || "Manuel";
}

var ampouleTypes = [
    { nom: "LED",              puissance: 9 },
    { nom: "Fluocompacte",     puissance: 18 },
    { nom: "Tube fluorescent", puissance: 36 },
    { nom: "Halogène",         puissance: 50 },
    { nom: "Sodium haute pression", puissance: 150 },
    { nom: "Iodure métallique", puissance: 250 },
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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("parking_" + currentParking.numero + "_eclairage_" + index) + '</div>';

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
   VENTILATION
========================= */

var ventilationToggle = document.getElementById("ventilationToggle");
var ventilationContent = document.getElementById("ventilationContent");
var ventilationPuissance = document.getElementById("ventilationPuissance");
var ventilationMode = document.getElementById("ventilationMode");

var ventilation =
    savedData && savedData.ventilation
        ? JSON.parse(JSON.stringify(savedData.ventilation))
        : { presente: false, puissance: 0, mode: "Permanent" };

function updateVentilationToggle() {
    updateToggleUI(ventilationToggle, ventilation.presente);
    if (ventilation.presente) { ventilationContent.classList.remove("hidden"); }
    else { ventilationContent.classList.add("hidden"); }
}

setupToggle(ventilationToggle, function (val) {
    ventilation.presente = val;
    updateVentilationToggle();
});

if (savedData && savedData.ventilation && savedData.ventilation.presente) {
    ventilationPuissance.value = savedData.ventilation.puissance || "";
    ventilationMode.value = savedData.ventilation.mode || "Permanent";
}

ventilationPuissance.addEventListener("input", function () {
    ventilation.puissance = parseFloat(ventilationPuissance.value) || 0;
});

ventilationMode.addEventListener("change", function () {
    ventilation.mode = ventilationMode.value;
});

updateVentilationToggle();

/* =========================
   BORNES VE
========================= */

var bornesToggle = document.getElementById("bornesToggle");
var bornesContent = document.getElementById("bornesContent");
var bornesNombre = document.getElementById("bornesNombre");
var bornesPuissance = document.getElementById("bornesPuissance");

var bornesVE =
    savedData && savedData.bornesVE
        ? JSON.parse(JSON.stringify(savedData.bornesVE))
        : { presentes: false, nombre: 0, puissance: 0 };

function updateBornesToggle() {
    updateToggleUI(bornesToggle, bornesVE.presentes);
    if (bornesVE.presentes) { bornesContent.classList.remove("hidden"); }
    else { bornesContent.classList.add("hidden"); }
}

setupToggle(bornesToggle, function (val) {
    bornesVE.presentes = val;
    updateBornesToggle();
});

if (savedData && savedData.bornesVE && savedData.bornesVE.presentes) {
    bornesNombre.value = savedData.bornesVE.nombre || "";
    bornesPuissance.value = savedData.bornesVE.puissance || "";
}

bornesNombre.addEventListener("input", function () {
    bornesVE.nombre = parseInt(bornesNombre.value) || 0;
});

bornesPuissance.addEventListener("input", function () {
    bornesVE.puissance = parseFloat(bornesPuissance.value) || 0;
});

updateBornesToggle();

/* =========================
   OBSERVATIONS
========================= */

var observations = document.getElementById("observations");
if (savedData && savedData.observations) { observations.value = savedData.observations; }

/* =========================
   SAUVEGARDE
========================= */

saveButton.addEventListener("click", function () {

    var parkingData = JSON.parse(localStorage.getItem("parkingData")) || {};

    var finalNom = nomParking.value.trim();
    if (finalNom === "") { finalNom = "Parking " + currentParking.numero; }

    parkingData[currentParking.numero] = {
        nom: finalNom,
        type: typeParking.value,
        surface: parseFloat(surfaceParking.value) || 0,
        nbPlaces: parseInt(nbPlaces.value) || 0,
        pilotageEclairage: pilotageEclairage.value,
        eclairages: eclairages,
        ventilation: {
            presente: ventilation.presente,
            puissance: parseFloat(ventilationPuissance.value) || 0,
            mode: ventilationMode.value
        },
        bornesVE: {
            presentes: bornesVE.presentes,
            nombre: parseInt(bornesNombre.value) || 0,
            puissance: parseFloat(bornesPuissance.value) || 0
        },
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("parkingData", JSON.stringify(parkingData));
    window.location.href = "module-detail.html";
});
