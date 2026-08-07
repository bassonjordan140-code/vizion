var currentBar =
    JSON.parse(localStorage.getItem("currentBar"));

var barTitle = document.getElementById("barTitle");
var saveButton = document.getElementById("saveBar");

if (currentBar) {
    barTitle.textContent = "Bar " + currentBar.numero;
}

var barData =
    JSON.parse(localStorage.getItem("barData")) || {};

var savedData =
    barData[currentBar.numero];

PhotoManager.initPage("bar", currentBar.numero);

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

var nomBar = document.getElementById("nomBar");
var placesAssises = document.getElementById("placesAssises");
var ouvertureDebut = document.getElementById("ouvertureDebut");
var ouvertureFin = document.getElementById("ouvertureFin");

if (savedData) {
    nomBar.value = savedData.nom || "";
    placesAssises.value = savedData.placesAssises || "";
    ouvertureDebut.value = savedData.ouvertureDebut || "17:00";
    ouvertureFin.value = savedData.ouvertureFin || "01:00";
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
var climPuissance = document.getElementById("climPuissance");
var climCentraliseeToggle = document.getElementById("climCentraliseeToggle");
var climSplitsContent = document.getElementById("climSplitsContent");

var climatisation =
    savedData && savedData.climatisation
        ? JSON.parse(JSON.stringify(savedData.climatisation))
        : { present: false, centralisee: false, nombre: 0, puissance: 0, etat: "Bon", plaque: false };

function updateClimToggle() {
    updateToggleUI(climToggle, climatisation.present);
    if (climatisation.present) { climContent.classList.remove("hidden"); }
    else { climContent.classList.add("hidden"); }
}

function updateClimCentraliseeToggle() {
    updateToggleUI(climCentraliseeToggle, climatisation.centralisee);
    if (climatisation.centralisee) { climSplitsContent.classList.add("hidden"); }
    else { climSplitsContent.classList.remove("hidden"); }
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

setupToggle(climCentraliseeToggle, function (val) {
    climatisation.centralisee = val;
    updateClimCentraliseeToggle();
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
updateClimCentraliseeToggle();

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
   ÉQUIPEMENTS FRIGORIFIQUES
========================= */

/* --- Vitrines réfrigérées --- */

var vitrineToggle = document.getElementById("vitrineToggle");
var vitrineContent = document.getElementById("vitrineContent");
var vitrineNombre = document.getElementById("vitrineNombre");

var vitrines =
    savedData && savedData.vitrinesRefrigerees
        ? JSON.parse(JSON.stringify(savedData.vitrinesRefrigerees))
        : { presente: false, nombre: 0 };

function updateVitrineToggle() {
    updateToggleUI(vitrineToggle, vitrines.presente);
    if (vitrines.presente) { vitrineContent.classList.remove("hidden"); }
    else { vitrineContent.classList.add("hidden"); }
}

setupToggle(vitrineToggle, function (val) {
    vitrines.presente = val;
    updateVitrineToggle();
});

if (savedData && savedData.vitrinesRefrigerees) {
    vitrineNombre.value = vitrines.nombre || 0;
}

vitrineNombre.addEventListener("input", function () {
    var v = parseInt(vitrineNombre.value);
    vitrines.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateVitrineToggle();

/* --- Tireuse à bière --- */

var tireuseToggle = document.getElementById("tireuseToggle");
var tireuseContent = document.getElementById("tireuseContent");

var tireuse =
    savedData && savedData.tireuse
        ? JSON.parse(JSON.stringify(savedData.tireuse))
        : { presente: false };

function updateTireuseToggle() {
    updateToggleUI(tireuseToggle, tireuse.presente);
    if (tireuse.presente) { tireuseContent.classList.remove("hidden"); }
    else { tireuseContent.classList.add("hidden"); }
}

setupToggle(tireuseToggle, function (val) {
    tireuse.presente = val;
    updateTireuseToggle();
});

updateTireuseToggle();

/* --- Machine à glaçons --- */

var glaconsToggle = document.getElementById("glaconsToggle");
var glaconsContent = document.getElementById("glaconsContent");
var glaconsNombre = document.getElementById("glaconsNombre");

var machineGlacons =
    savedData && savedData.machineGlacons
        ? JSON.parse(JSON.stringify(savedData.machineGlacons))
        : { presente: false, nombre: 0 };

function updateGlaconsToggle() {
    updateToggleUI(glaconsToggle, machineGlacons.presente);
    if (machineGlacons.presente) { glaconsContent.classList.remove("hidden"); }
    else { glaconsContent.classList.add("hidden"); }
}

setupToggle(glaconsToggle, function (val) {
    machineGlacons.presente = val;
    updateGlaconsToggle();
});

if (savedData && savedData.machineGlacons) {
    glaconsNombre.value = savedData.machineGlacons.nombre || 0;
}

glaconsNombre.addEventListener("input", function () {
    var v = parseInt(glaconsNombre.value);
    machineGlacons.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateGlaconsToggle();

/* --- Cave à vin --- */

var caveToggle = document.getElementById("caveToggle");
var caveContent = document.getElementById("caveContent");
var caveNombre = document.getElementById("caveNombre");

var caveVin =
    savedData && savedData.caveVin
        ? JSON.parse(JSON.stringify(savedData.caveVin))
        : { presente: false, nombre: 0 };

function updateCaveToggle() {
    updateToggleUI(caveToggle, caveVin.presente);
    if (caveVin.presente) { caveContent.classList.remove("hidden"); }
    else { caveContent.classList.add("hidden"); }
}

setupToggle(caveToggle, function (val) {
    caveVin.presente = val;
    updateCaveToggle();
});

if (savedData && savedData.caveVin) {
    caveNombre.value = savedData.caveVin.nombre || 0;
}

caveNombre.addEventListener("input", function () {
    var v = parseInt(caveNombre.value);
    caveVin.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateCaveToggle();

/* =========================
   PRÉPARATION BOISSONS CHAUDES
========================= */

var cafeToggle = document.getElementById("cafeToggle");
var cafeContent = document.getElementById("cafeContent");
var cafeNombre = document.getElementById("cafeNombre");

var machineCafe =
    savedData && savedData.machineCafe
        ? JSON.parse(JSON.stringify(savedData.machineCafe))
        : { presente: false, nombre: 0 };

function updateCafeToggle() {
    updateToggleUI(cafeToggle, machineCafe.presente);
    if (machineCafe.presente) { cafeContent.classList.remove("hidden"); }
    else { cafeContent.classList.add("hidden"); }
}

setupToggle(cafeToggle, function (val) {
    machineCafe.presente = val;
    updateCafeToggle();
});

if (savedData && savedData.machineCafe) {
    cafeNombre.value = machineCafe.nombre || 0;
}

cafeNombre.addEventListener("input", function () {
    var v = parseInt(cafeNombre.value);
    machineCafe.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateCafeToggle();

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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("bar_" + currentBar.numero + "_eclairage_" + index) + '</div>';

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
   ÉCRANS
========================= */

var ecransToggle = document.getElementById("ecransToggle");
var ecransContent = document.getElementById("ecransContent");
var ecransNombre = document.getElementById("ecransNombre");
var ecransPermanentsToggle = document.getElementById("ecransPermanentsToggle");

var ecrans =
    savedData && savedData.ecrans
        ? JSON.parse(JSON.stringify(savedData.ecrans))
        : { present: false, nombre: 0, permanents: false };

function updateEcransToggle() {
    updateToggleUI(ecransToggle, ecrans.present);
    if (ecrans.present) { ecransContent.classList.remove("hidden"); }
    else { ecransContent.classList.add("hidden"); }
}

setupToggle(ecransToggle, function (val) {
    ecrans.present = val;
    updateEcransToggle();
});

setupToggle(ecransPermanentsToggle, function (val) {
    ecrans.permanents = val;
    updateToggleUI(ecransPermanentsToggle, ecrans.permanents);
});

if (savedData && savedData.ecrans) {
    ecransNombre.value = ecrans.nombre || 0;
}

ecransNombre.addEventListener("input", function () {
    var v = parseInt(ecransNombre.value);
    ecrans.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateEcransToggle();
updateToggleUI(ecransPermanentsToggle, ecrans.permanents);

/* =========================
   OBSERVATIONS
========================= */

var observations = document.getElementById("observations");
if (savedData && savedData.observations) { observations.value = savedData.observations; }

/* =========================
   SAUVEGARDE
========================= */

saveButton.addEventListener("click", function () {

    var barData = JSON.parse(localStorage.getItem("barData")) || {};

    var finalType = nomBar.value.trim();
    if (finalType === "") { finalType = "Bar " + currentBar.numero; }

    barData[currentBar.numero] = {
        type: finalType,
        nom: nomBar.value,
        placesAssises: parseInt(placesAssises.value) || 0,
        ouvertureDebut: ouvertureDebut.value,
        ouvertureFin: ouvertureFin.value,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        vitrinesRefrigerees: {
            presente: vitrines.presente ? "oui" : "non",
            nombre: vitrines.nombre
        },
        tireuse: {
            presente: tireuse.presente ? "oui" : "non"
        },
        machineGlacons: {
            presente: machineGlacons.presente ? "oui" : "non",
            nombre: machineGlacons.nombre
        },
        caveVin: {
            presente: caveVin.presente ? "oui" : "non",
            nombre: caveVin.nombre
        },
        machineCafe: {
            presente: machineCafe.presente ? "oui" : "non",
            nombre: machineCafe.nombre
        },
        eclairages: eclairages,
        ecrans: {
            present: ecrans.present ? "oui" : "non",
            nombre: ecrans.nombre,
            permanents: ecrans.permanents ? "oui" : "non"
        },
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("barData", JSON.stringify(barData));
    window.location.href = "module-detail.html";
});
