var currentReunion =
    JSON.parse(localStorage.getItem("currentReunion"));

var reunionTitle = document.getElementById("reunionTitle");
var saveButton = document.getElementById("saveReunion");

if (currentReunion) {
    reunionTitle.textContent = "Salle de réunion " + currentReunion.numero;
}

var reunionData =
    JSON.parse(localStorage.getItem("reunionData")) || {};

var savedData =
    reunionData[currentReunion.numero];

PhotoManager.initPage("reunion", currentReunion.numero);

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

var nomReunion = document.getElementById("nomReunion");
var surfaceReunion = document.getElementById("surfaceReunion");
var placesAssises = document.getElementById("placesAssises");
var frequence = document.getElementById("frequence");

if (savedData) {
    nomReunion.value = savedData.nom || "";
    surfaceReunion.value = savedData.surface || "";
    placesAssises.value = savedData.placesAssises || "";
    frequence.value = savedData.frequence || "Quotidienne";
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

climEtat.addEventListener("change", function () { climatisation.etat = climEtat.value; });
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
   AUDIOVISUEL (cases à cocher)
========================= */

var audiovisuelDef = [
    { id: "videoprojecteur",  label: "Vidéoprojecteur",          fields: ["nombre"] },
    { id: "ecranPlat",        label: "Écran plat / TV",          fields: ["nombre"] },
    { id: "visioconference",  label: "Système de visioconférence", fields: [] },
    { id: "sonorisation",     label: "Sonorisation / micro",     fields: [] },
    { id: "tableauInteractif", label: "Tableau interactif / écran tactile", fields: [] }
];

var savedAudiovisuel = savedData && savedData.audiovisuel ? savedData.audiovisuel : {};
var audiovisuelList = document.getElementById("audiovisuelList");

function buildFieldHTML(eqId, fieldName, savedEq) {
    var val = savedEq ? savedEq[fieldName] || "" : "";
    if (fieldName === "nombre") {
        return '<div class="field-group"><label>Nombre</label>' +
            '<input type="number" min="1" step="1" inputmode="numeric" ' +
            'id="eq-' + eqId + '-nombre" placeholder="Ex : 1" value="' + val + '"></div>';
    }
    return "";
}

audiovisuelDef.forEach(function (eq) {

    var savedEq = savedAudiovisuel[eq.id];
    var isChecked = !!savedEq;

    var wrapper = document.createElement("div");
    wrapper.className = "equipement-item";

    var headerHTML =
        '<label class="equipement-check-label">' +
            '<input type="checkbox" id="eqCheck-' + eq.id + '"' + (isChecked ? ' checked' : '') + '> ' +
            '<span>' + eq.label + '</span>' +
        '</label>';

    var fieldsHTML = '';
    if (eq.fields.length > 0) {
        fieldsHTML = '<div class="equipement-fields' + (isChecked ? '' : ' hidden') + '" id="eqFields-' + eq.id + '">';
        eq.fields.forEach(function (f) {
            fieldsHTML += buildFieldHTML(eq.id, f, savedEq);
        });
        fieldsHTML += '</div>';
    }

    wrapper.innerHTML = headerHTML + fieldsHTML;
    audiovisuelList.appendChild(wrapper);

    if (eq.fields.length > 0) {
        var checkbox = document.getElementById("eqCheck-" + eq.id);
        var fieldsDiv = document.getElementById("eqFields-" + eq.id);
        checkbox.addEventListener("change", function () {
            if (checkbox.checked) { fieldsDiv.classList.remove("hidden"); }
            else { fieldsDiv.classList.add("hidden"); }
        });
    }
});

/* =========================
   ÉCLAIRAGE
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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("reunion_" + currentReunion.numero + "_eclairage_" + index) + '</div>';

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

    var reunionData = JSON.parse(localStorage.getItem("reunionData")) || {};

    var finalNom = nomReunion.value.trim();
    if (finalNom === "") { finalNom = "Salle de réunion " + currentReunion.numero; }

    /* Collecter audiovisuel coché */
    var audiovisuel = {};
    audiovisuelDef.forEach(function (eq) {
        var cb = document.getElementById("eqCheck-" + eq.id);
        if (!cb.checked) return;
        var obj = {};
        eq.fields.forEach(function (f) {
            var el = document.getElementById("eq-" + eq.id + "-" + f);
            if (!el) return;
            obj[f] = parseFloat(el.value) || 0;
        });
        audiovisuel[eq.id] = obj;
    });

    reunionData[currentReunion.numero] = {
        nom: finalNom,
        surface: parseFloat(surfaceReunion.value) || 0,
        placesAssises: parseInt(placesAssises.value) || 0,
        frequence: frequence.value,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        audiovisuel: audiovisuel,
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("reunionData", JSON.stringify(reunionData));
    window.location.href = "module-detail.html";
});
