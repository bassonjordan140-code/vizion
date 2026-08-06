var currentCuisine =
    JSON.parse(localStorage.getItem("currentCuisine"));

var cuisineTitle = document.getElementById("cuisineTitle");
var saveButton = document.getElementById("saveCuisine");

if (currentCuisine) {
    cuisineTitle.textContent = "Cuisine " + currentCuisine.numero;
}

var cuisineData =
    JSON.parse(localStorage.getItem("cuisineData")) || {};

var savedData =
    cuisineData[currentCuisine.numero];

PhotoManager.initPage("cuisine", currentCuisine.numero);

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

var nomCuisine = document.getElementById("nomCuisine");
var surfaceCuisine = document.getElementById("surfaceCuisine");
var couvertsJour = document.getElementById("couvertsJour");

if (savedData) {
    nomCuisine.value = savedData.nom || "";
    surfaceCuisine.value = savedData.surface || "";
    couvertsJour.value = savedData.couvertsJour || "";
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
   ÉQUIPEMENTS (cases à cocher)
========================= */

// puissanceDefaut (W) : estimations typiques pour pré-remplir le champ, à
// ajuster par l'utilisateur selon le matériel réellement présent.
var equipementsDef = [
    { id: "pianoGaz",         label: "Piano de cuisson gaz",     fields: ["nombre", "puissance"], puissanceDefaut: 0 },
    { id: "pianoElec",        label: "Piano de cuisson électrique", fields: ["nombre", "puissance"], puissanceDefaut: 10000 },
    { id: "pianoInduction",   label: "Piano de cuisson induction", fields: ["nombre", "puissance"], puissanceDefaut: 10000 },
    { id: "plaqueVitro",      label: "Plaque vitrocéramique",     fields: ["nombre", "puissance"], puissanceDefaut: 3000 },
    { id: "wok",              label: "Wok",                       fields: ["nombre", "puissance"], puissanceDefaut: 5000 },
    { id: "grillPlancha",     label: "Grill / Plancha",           fields: ["nombre", "puissance"], puissanceDefaut: 6000 },
    { id: "sauteuseBasc",     label: "Sauteuse basculante",       fields: ["nombre", "puissance"], puissanceDefaut: 12000 },
    { id: "marmite",          label: "Marmite",                   fields: ["nombre", "puissance"], puissanceDefaut: 15000 },
    { id: "fourMixte",        label: "Four mixte (convection + vapeur)", fields: ["nombre", "puissance"], puissanceDefaut: 10000 },
    { id: "fourConvection",   label: "Four à convection",         fields: ["nombre", "puissance"], puissanceDefaut: 6000 },
    { id: "fourPizza",        label: "Four à pizza",              fields: ["nombre", "puissance"], puissanceDefaut: 8000 },
    { id: "microOndes",       label: "Micro-ondes professionnel", fields: ["nombre", "puissance"], puissanceDefaut: 1200 },
    { id: "friteuse",         label: "Friteuse",                  fields: ["nombre", "energie", "puissance"], puissanceDefaut: 7000 },
    { id: "laveVaisselle",    label: "Lave-vaisselle",            fields: ["nombre", "typeLV", "ecs", "puissance"], puissanceDefaut: 6000 },
    { id: "cfPositive",       label: "Chambre froide positive",   fields: ["nombre", "volume", "puissance"], puissanceDefaut: 500 },
    { id: "cfNegative",       label: "Chambre froide négative",   fields: ["nombre", "volume", "puissance"], puissanceDefaut: 1000 },
    { id: "armoireRefrig",    label: "Armoire réfrigérée",        fields: ["nombre", "puissance"], puissanceDefaut: 300 }
];

var savedEquipements = savedData && savedData.equipements ? savedData.equipements : {};

var equipementsList = document.getElementById("equipementsList");

/* Génère le HTML de chaque champ d'un équipement */
function buildFieldHTML(eqId, fieldName, savedEq, puissanceDefaut) {
    var val = savedEq ? savedEq[fieldName] || "" : "";

    if (fieldName === "nombre") {
        return '<div class="field-group"><label>Nombre</label>' +
            '<input type="number" min="1" step="1" inputmode="numeric" ' +
            'id="eq-' + eqId + '-nombre" placeholder="Ex : 2" value="' + val + '"></div>';
    }
    if (fieldName === "puissance") {
        if (val === "" && puissanceDefaut !== undefined) { val = puissanceDefaut; }
        return '<div class="field-group"><label>Puissance unitaire (W)</label>' +
            '<input type="number" min="0" step="1" inputmode="numeric" ' +
            'id="eq-' + eqId + '-puissance" placeholder="Ex : 8000" value="' + val + '"></div>';
    }
    if (fieldName === "energie") {
        var selElec = val === "Gaz" ? "" : " selected";
        var selGaz  = val === "Gaz" ? " selected" : "";
        return '<div class="field-group"><label>Énergie</label>' +
            '<select id="eq-' + eqId + '-energie">' +
            '<option value="Électrique"' + selElec + '>Électrique</option>' +
            '<option value="Gaz"' + selGaz + '>Gaz</option></select></div>';
    }
    if (fieldName === "typeLV") {
        var opts = ["À capot", "À avancement", "Frontal", "Tunnel", "Autre"];
        var optsHTML = opts.map(function (o) {
            return '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>';
        }).join("");
        return '<div class="field-group"><label>Type de lave-vaisselle</label>' +
            '<select id="eq-' + eqId + '-typeLV">' + optsHTML + '</select></div>';
    }
    if (fieldName === "ecs") {
        var ecsOpts = ["Raccordée à l'ECS hôtel", "Propre", "Aucune"];
        var ecsHTML = ecsOpts.map(function (o) {
            return '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>';
        }).join("");
        return '<div class="field-group"><label>ECS associée</label>' +
            '<select id="eq-' + eqId + '-ecs">' + ecsHTML + '</select></div>';
    }
    if (fieldName === "volume") {
        return '<div class="field-group"><label>Volume (m³)</label>' +
            '<input type="number" min="0" step="0.1" inputmode="numeric" ' +
            'id="eq-' + eqId + '-volume" placeholder="Ex : 6" value="' + val + '"></div>';
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

    var fieldsHTML = '<div class="equipement-fields' + (isChecked ? '' : ' hidden') + '" id="eqFields-' + eq.id + '">';
    eq.fields.forEach(function (f) {
        fieldsHTML += buildFieldHTML(eq.id, f, savedEq, eq.puissanceDefaut);
    });
    fieldsHTML += '<div class="field-group">' + PhotoManager.createPhotoWidget("cuisine_" + currentCuisine.numero + "_eq_" + eq.id) + '</div>';
    fieldsHTML += '</div>';

    wrapper.innerHTML = headerHTML + fieldsHTML;
    equipementsList.appendChild(wrapper);

    var checkbox = document.getElementById("eqCheck-" + eq.id);
    var fieldsDiv = document.getElementById("eqFields-" + eq.id);

    checkbox.addEventListener("change", function () {
        if (checkbox.checked) {
            fieldsDiv.classList.remove("hidden");
        } else {
            fieldsDiv.classList.add("hidden");
        }
    });
});

PhotoManager.bindAll(equipementsList);

/* =========================
   ÉQUIPEMENTS AJOUTÉS LIBREMENT (hors liste fixe)
========================= */

var customEquipements =
    savedData && Array.isArray(savedData.equipementsPersonnalises)
        ? JSON.parse(JSON.stringify(savedData.equipementsPersonnalises))
        : [];

var customEquipementsList = document.getElementById("customEquipementsList");
var nouvelEquipementInput = document.getElementById("nouvelEquipementInput");
var addEquipementButton = document.getElementById("addEquipementButton");

function renderCustomEquipements() {

    customEquipementsList.innerHTML = "";

    customEquipements.forEach(function (equip, idx) {

        var item = document.createElement("div");
        item.className = "custom-equip-card";

        item.innerHTML =
            '<button type="button" class="custom-equip-delete" data-idx="' + idx + '" aria-label="Supprimer cet équipement">✕</button>' +
            '<div class="custom-equip-name">' + equip.nom + '</div>' +
            '<div class="custom-equip-fields">' +
                '<div class="field-group"><label>Nombre</label>' +
                '<input type="number" min="1" step="1" inputmode="numeric" class="custom-equip-nombre" data-idx="' + idx + '" value="' + (equip.nombre || 1) + '"></div>' +
                '<div class="field-group"><label>Puissance unitaire (W)</label>' +
                '<input type="number" min="0" step="1" inputmode="numeric" class="custom-equip-puissance" data-idx="' + idx + '" value="' + (equip.puissance !== undefined ? equip.puissance : "") + '" placeholder="Ex : 1500"></div>' +
                '<div class="field-group">' + PhotoManager.createPhotoWidget("cuisine_" + currentCuisine.numero + "_customeq_" + equip.nom) + '</div>' +
            '</div>';

        customEquipementsList.appendChild(item);

    });

    customEquipementsList.querySelectorAll(".custom-equip-delete").forEach(function (btn) {
        btn.addEventListener("click", function () {
            customEquipements.splice(parseInt(btn.dataset.idx), 1);
            renderCustomEquipements();
        });
    });

    customEquipementsList.querySelectorAll(".custom-equip-nombre").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.idx);
            var v = parseInt(input.value);
            customEquipements[idx].nombre = isNaN(v) || v < 1 ? 1 : v;
        });
    });

    customEquipementsList.querySelectorAll(".custom-equip-puissance").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.idx);
            var v = parseFloat(input.value);
            customEquipements[idx].puissance = isNaN(v) || v < 0 ? 0 : v;
        });
    });

    PhotoManager.bindAll(customEquipementsList);

}

renderCustomEquipements();

addEquipementButton.addEventListener("click", function () {

    var nom = nouvelEquipementInput.value.trim();
    if (nom === "") {
        alert("Veuillez entrer un nom d'équipement.");
        return;
    }

    var exists = customEquipements.some(function (e) {
        return e.nom.toLowerCase() === nom.toLowerCase();
    });
    if (exists) {
        alert("Cet équipement est déjà dans la liste.");
        return;
    }

    customEquipements.push({ nom: nom, nombre: 1, puissance: "" });
    nouvelEquipementInput.value = "";
    renderCustomEquipements();

});

/* =========================
   VENTILATION
========================= */

var nbHottes = document.getElementById("nbHottes");
var typeVentilation = document.getElementById("typeVentilation");

if (savedData) {
    nbHottes.value = savedData.nbHottes || "";
    typeVentilation.value = savedData.typeVentilation || "Extraction mécanique";
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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("cuisine_" + currentCuisine.numero + "_eclairage_" + index) + '</div>';

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

    var cuisineData = JSON.parse(localStorage.getItem("cuisineData")) || {};

    var finalNom = nomCuisine.value.trim();
    if (finalNom === "") { finalNom = "Cuisine " + currentCuisine.numero; }

    /* Collecter les équipements cochés */
    var equipements = {};

    equipementsDef.forEach(function (eq) {
        var cb = document.getElementById("eqCheck-" + eq.id);
        if (!cb.checked) return;

        var obj = {};
        eq.fields.forEach(function (f) {
            var el = document.getElementById("eq-" + eq.id + "-" + f);
            if (!el) return;
            if (el.tagName === "SELECT") {
                obj[f] = el.value;
            } else {
                obj[f] = parseFloat(el.value) || 0;
            }
        });
        equipements[eq.id] = obj;
    });

    cuisineData[currentCuisine.numero] = {
        nom: finalNom,
        surface: parseFloat(surfaceCuisine.value) || 0,
        couvertsJour: parseInt(couvertsJour.value) || 0,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        equipements: equipements,
        equipementsPersonnalises: customEquipements,
        nbHottes: parseInt(nbHottes.value) || 0,
        typeVentilation: typeVentilation.value,
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("cuisineData", JSON.stringify(cuisineData));
    window.location.href = "module-detail.html";
});
