var currentJeux =
    JSON.parse(localStorage.getItem("currentJeux"));

var jeuxTitle = document.getElementById("jeuxTitle");
var saveButton = document.getElementById("saveJeux");

if (currentJeux) {
    jeuxTitle.textContent = "Salle de jeux " + currentJeux.numero;
}

var jeuxData =
    JSON.parse(localStorage.getItem("jeuxData")) || {};

var savedData =
    jeuxData[currentJeux.numero];

PhotoManager.initPage("jeux", currentJeux.numero);

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

var nomJeux = document.getElementById("nomJeux");
var surfaceJeux = document.getElementById("surfaceJeux");
var horDebut = document.getElementById("horDebut");
var horFin = document.getElementById("horFin");

if (savedData) {
    nomJeux.value = savedData.nom || "";
    surfaceJeux.value = savedData.surface || "";
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

climEtat.addEventListener("change", function () { climatisation.etat = climEtat.value; });
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
   ÉQUIPEMENTS (cases à cocher)
========================= */

var equipementsDef = [
    { id: "billard",      label: "Billard",                fields: ["nombre"] },
    { id: "babyFoot",     label: "Baby-foot",              fields: ["nombre"] },
    { id: "pingPong",     label: "Table de ping-pong",     fields: ["nombre"] },
    { id: "flipper",      label: "Flipper",                fields: ["nombre"] },
    { id: "arcades",      label: "Bornes d'arcade",        fields: ["nombre"] },
    { id: "flechettes",   label: "Fléchettes",             fields: ["nombre"] },
    { id: "consoleJeux",  label: "Console de jeux vidéo",  fields: ["nombre"] },
    { id: "simulateur",   label: "Simulateur (VR, racing…)", fields: ["nombre"] },
    { id: "airHockey",    label: "Air hockey",             fields: ["nombre"] },
    { id: "jeuxSociete",  label: "Espace jeux de société", fields: [] },
    { id: "autre",        label: "Autre",                  fields: ["nombre"] }
];

var savedEquipements = savedData && savedData.equipements ? savedData.equipements : {};
var equipementsList = document.getElementById("equipementsList");

function buildFieldHTML(eqId, fieldName, savedEq) {
    var val = savedEq ? savedEq[fieldName] || "" : "";
    if (fieldName === "nombre") {
        return '<div class="field-group"><label>Nombre</label>' +
            '<input type="number" min="1" step="1" inputmode="numeric" ' +
            'id="eq-' + eqId + '-nombre" placeholder="Ex : 2" value="' + val + '"></div>';
    }
    return "";
}

equipementsDef.forEach(function (eq) {

    var savedEq = savedEquipements[eq.id];
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
    equipementsList.appendChild(wrapper);

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

function updateEcransPermanentsToggle() {
    updateToggleUI(ecransPermanentsToggle, ecrans.permanents);
}

setupToggle(ecransToggle, function (val) {
    ecrans.present = val;
    updateEcransToggle();
});

setupToggle(ecransPermanentsToggle, function (val) {
    ecrans.permanents = val;
    updateEcransPermanentsToggle();
});

ecransNombre.addEventListener("input", function () {
    ecrans.nombre = parseInt(ecransNombre.value) || 0;
});

if (savedData && savedData.ecrans && savedData.ecrans.present) {
    ecransNombre.value = savedData.ecrans.nombre || "";
}

updateEcransToggle();
updateEcransPermanentsToggle();

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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("jeux_" + currentJeux.numero + "_eclairage_" + index) + '</div>';

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

    var jeuxData = JSON.parse(localStorage.getItem("jeuxData")) || {};

    var finalNom = nomJeux.value.trim();
    if (finalNom === "") { finalNom = "Salle de jeux " + currentJeux.numero; }

    /* Collecter équipements cochés */
    var equipements = {};
    equipementsDef.forEach(function (eq) {
        var cb = document.getElementById("eqCheck-" + eq.id);
        if (!cb.checked) return;
        var obj = {};
        eq.fields.forEach(function (f) {
            var el = document.getElementById("eq-" + eq.id + "-" + f);
            if (!el) return;
            obj[f] = parseFloat(el.value) || 0;
        });
        equipements[eq.id] = obj;
    });

    jeuxData[currentJeux.numero] = {
        nom: finalNom,
        surface: parseFloat(surfaceJeux.value) || 0,
        horDebut: horDebut.value,
        horFin: horFin.value,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        equipements: equipements,
        ecrans: {
            present: ecrans.present,
            nombre: parseInt(ecransNombre.value) || 0,
            permanents: ecrans.permanents
        },
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("jeuxData", JSON.stringify(jeuxData));
    window.location.href = "module-detail.html";
});
