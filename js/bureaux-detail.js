var currentBureaux =
    JSON.parse(localStorage.getItem("currentBureaux"));

var bureauxTitle = document.getElementById("bureauxTitle");
var saveButton = document.getElementById("saveBureaux");

if (currentBureaux) {
    bureauxTitle.textContent = "Bureaux " + currentBureaux.numero;
}

var bureauxData =
    JSON.parse(localStorage.getItem("bureauxData")) || {};

var savedData =
    bureauxData[currentBureaux.numero];

PhotoManager.initPage("bureaux", currentBureaux.numero);

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

var nomBureaux = document.getElementById("nomBureaux");
var amenagement = document.getElementById("amenagement");
var surfaceBureaux = document.getElementById("surfaceBureaux");
var nbPostes = document.getElementById("nbPostes");
var horDebut = document.getElementById("horDebut");
var horFin = document.getElementById("horFin");

if (savedData) {
    nomBureaux.value = savedData.nom || "";
    amenagement.value = savedData.amenagement || "Open space";
    surfaceBureaux.value = savedData.surface || "";
    nbPostes.value = savedData.nbPostes || "";
    horDebut.value = savedData.horDebut || "";
    horFin.value = savedData.horFin || "";
}

/* =========================
   CLIMATISATION
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
        : { present: false, nombre: 1, etat: "Bon", plaque: false };

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
    climatisation.nombre = isNaN(v) || v < 1 ? 1 : v;
});

if (savedData && savedData.climatisation) {
    climEtat.value = climatisation.etat;
    climNombre.value = climatisation.nombre || 1;
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
        ? { present: savedData.brasseurAir.present === "oui", nombre: savedData.brasseurAir.nombre || 1 }
        : { present: false, nombre: 1 };

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
    brasseurAir.nombre = isNaN(v) || v < 1 ? 1 : v;
});

updateBrasseurToggle();

/* =========================
   POSTES DE TRAVAIL
========================= */

var typeOrdinateurs = document.getElementById("typeOrdinateurs");
var nbEcrans = document.getElementById("nbEcrans");
var nbImprimantes = document.getElementById("nbImprimantes");

if (savedData) {
    typeOrdinateurs.value = savedData.typeOrdinateurs || "Fixes (tours)";
    nbEcrans.value = savedData.nbEcrans || "";
    nbImprimantes.value = savedData.nbImprimantes || "";
}

/* =========================
   ÉQUIPEMENTS PARTAGÉS (cases à cocher)
========================= */

var equipPartagesDef = [
    { id: "photocopieur",   label: "Photocopieur / multifonction", fields: ["nombre"] },
    { id: "distributeur",   label: "Distributeur de boissons",     fields: ["nombre"] },
    { id: "fontaineEau",    label: "Fontaine à eau",               fields: ["nombre"] },
    { id: "machineCafe",    label: "Machine à café",               fields: ["nombre"] },
    { id: "microOndes",     label: "Micro-ondes",                  fields: ["nombre"] },
    { id: "refrigerateur",  label: "Réfrigérateur",                fields: ["nombre"] }
];

var savedEquipPartages = savedData && savedData.equipPartages ? savedData.equipPartages : {};

var equipPartagesList = document.getElementById("equipPartagesList");

function buildFieldHTML(eqId, fieldName, savedEq) {
    var val = savedEq ? savedEq[fieldName] || "" : "";

    if (fieldName === "nombre") {
        return '<div class="field-group"><label>Nombre</label>' +
            '<input type="number" min="1" step="1" inputmode="numeric" ' +
            'id="eq-' + eqId + '-nombre" placeholder="Ex : 2" value="' + val + '"></div>';
    }
    return "";
}

equipPartagesDef.forEach(function (eq) {

    var savedEq = savedEquipPartages[eq.id];
    var isChecked = !!savedEq;

    var wrapper = document.createElement("div");
    wrapper.className = "equipement-item";

    var headerHTML =
        '<label class="equipement-check-label">' +
            '<input type="checkbox" id="eqCheck-' + eq.id + '"' + (isChecked ? ' checked' : '') + '> ' +
            '<span>' + eq.label + '</span>' +
        '</label>';

    var fieldsHTML = '<div class="equipement-fields' + (isChecked ? '' : ' hidden') + '" id="eqFields-' + eq.id + '">';
    eq.fields.forEach(function (f) {
        fieldsHTML += buildFieldHTML(eq.id, f, savedEq);
    });
    fieldsHTML += '<div class="field-group">' + PhotoManager.createPhotoWidget("bureaux_" + currentBureaux.numero + "_eq_" + eq.id) + '</div>';
    fieldsHTML += '</div>';

    wrapper.innerHTML = headerHTML + fieldsHTML;
    equipPartagesList.appendChild(wrapper);

    var checkbox = document.getElementById("eqCheck-" + eq.id);
    var fieldsDiv = document.getElementById("eqFields-" + eq.id);

    checkbox.addEventListener("change", function () {
        if (checkbox.checked) { fieldsDiv.classList.remove("hidden"); }
        else { fieldsDiv.classList.add("hidden"); }
    });
});

PhotoManager.bindAll(equipPartagesList);

/* =========================
   SALLE SERVEUR
========================= */

var serveurToggle = document.getElementById("serveurToggle");
var serveurContent = document.getElementById("serveurContent");
var serveurSurface = document.getElementById("serveurSurface");
var serveurClimToggle = document.getElementById("serveurClimToggle");
var serveurPuissance = document.getElementById("serveurPuissance");

var salleServeur =
    savedData && savedData.salleServeur
        ? JSON.parse(JSON.stringify(savedData.salleServeur))
        : { presente: false, surface: 0, climDediee: false, puissance: 0 };

function updateServeurToggle() {
    updateToggleUI(serveurToggle, salleServeur.presente);
    if (salleServeur.presente) { serveurContent.classList.remove("hidden"); }
    else { serveurContent.classList.add("hidden"); }
}

function updateServeurClimToggle() {
    updateToggleUI(serveurClimToggle, salleServeur.climDediee);
}

setupToggle(serveurToggle, function (val) {
    salleServeur.presente = val;
    updateServeurToggle();
});

setupToggle(serveurClimToggle, function (val) {
    salleServeur.climDediee = val;
    updateServeurClimToggle();
});

if (savedData && savedData.salleServeur && savedData.salleServeur.presente) {
    serveurSurface.value = savedData.salleServeur.surface || "";
    serveurPuissance.value = savedData.salleServeur.puissance || "";
}

serveurSurface.addEventListener("input", function () {
    salleServeur.surface = parseFloat(serveurSurface.value) || 0;
});

serveurPuissance.addEventListener("input", function () {
    salleServeur.puissance = parseFloat(serveurPuissance.value) || 0;
});

updateServeurToggle();
updateServeurClimToggle();

/* =========================
   ÉCLAIRAGE
========================= */

var detectionToggle = document.getElementById("detectionToggle");
var detectionPresence = savedData ? !!savedData.detectionPresence : false;

updateToggleUI(detectionToggle, detectionPresence);

setupToggle(detectionToggle, function (val) {
    detectionPresence = val;
    updateToggleUI(detectionToggle, detectionPresence);
});

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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("bureaux_" + currentBureaux.numero + "_eclairage_" + index) + '</div>';

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

    var bureauxData = JSON.parse(localStorage.getItem("bureauxData")) || {};

    var finalNom = nomBureaux.value.trim();
    if (finalNom === "") { finalNom = "Bureaux " + currentBureaux.numero; }

    /* Collecter équipements partagés cochés */
    var equipPartages = {};
    equipPartagesDef.forEach(function (eq) {
        var cb = document.getElementById("eqCheck-" + eq.id);
        if (!cb.checked) return;
        var obj = {};
        eq.fields.forEach(function (f) {
            var el = document.getElementById("eq-" + eq.id + "-" + f);
            if (!el) return;
            obj[f] = parseFloat(el.value) || 0;
        });
        equipPartages[eq.id] = obj;
    });

    bureauxData[currentBureaux.numero] = {
        nom: finalNom,
        amenagement: amenagement.value,
        surface: parseFloat(surfaceBureaux.value) || 0,
        nbPostes: parseInt(nbPostes.value) || 0,
        horDebut: horDebut.value,
        horFin: horFin.value,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        typeOrdinateurs: typeOrdinateurs.value,
        nbEcrans: parseInt(nbEcrans.value) || 0,
        nbImprimantes: parseInt(nbImprimantes.value) || 0,
        equipPartages: equipPartages,
        salleServeur: {
            presente: salleServeur.presente,
            surface: parseFloat(serveurSurface.value) || 0,
            climDediee: salleServeur.climDediee,
            puissance: parseFloat(serveurPuissance.value) || 0
        },
        detectionPresence: detectionPresence,
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("bureauxData", JSON.stringify(bureauxData));
    window.location.href = "module-detail.html";
});
