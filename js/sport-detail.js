var currentSport =
    JSON.parse(localStorage.getItem("currentSport"));

var sportTitle = document.getElementById("sportTitle");
var saveButton = document.getElementById("saveSport");

if (currentSport) {
    sportTitle.textContent = "Salle de sport " + currentSport.numero;
}

var sportData =
    JSON.parse(localStorage.getItem("sportData")) || {};

var savedData =
    sportData[currentSport.numero];

PhotoManager.initPage("sport", currentSport.numero);

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

var nomSport = document.getElementById("nomSport");
var horDebut = document.getElementById("horDebut");
var horFin = document.getElementById("horFin");

if (savedData) {
    nomSport.value = savedData.nom || "";
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

climEtat.addEventListener("change", function () { climatisation.etat = climEtat.value; });
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
            '<div class="custom-equip-name">' + equip.nom +
            '<button type="button" class="custom-equip-rename-btn" data-idx="' + idx + '" aria-label="Renommer cet équipement">✎</button>' +
            '</div>' +
            '<div class="custom-equip-fields">' +
                '<div class="field-group"><label>Nombre</label>' +
                '<input type="number" min="1" step="1" inputmode="numeric" class="custom-equip-nombre" data-idx="' + idx + '" value="' + (equip.nombre || 1) + '"></div>' +
                '<div class="field-group"><label>Puissance unitaire (W)</label>' +
                '<input type="number" min="0" step="1" inputmode="numeric" class="custom-equip-puissance" data-idx="' + idx + '" value="' + (equip.puissance !== undefined ? equip.puissance : "") + '" placeholder="Ex : 1500"></div>' +
                '<div class="field-group">' + PhotoManager.createPhotoWidget("sport_" + currentSport.numero + "_customeq_" + equip.nom) + '</div>' +
            '</div>';

        customEquipementsList.appendChild(item);

    });

    customEquipementsList.querySelectorAll(".custom-equip-delete").forEach(function (btn) {
        btn.addEventListener("click", function () {
            equipements.splice(parseInt(btn.dataset.idx), 1);
            renderEquipements();
        });
    });

    customEquipementsList.querySelectorAll(".custom-equip-rename-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            var idx = parseInt(btn.dataset.idx);
            var ancienNom = equipements[idx].nom;
            var nouveauNom = prompt("Nouveau nom pour cet équipement :", ancienNom);
            if (nouveauNom === null) return;
            nouveauNom = nouveauNom.trim();
            if (nouveauNom === "" || nouveauNom === ancienNom) return;
            var oldKey = "sport_" + currentSport.numero + "_customeq_" + ancienNom;
            var newKey = "sport_" + currentSport.numero + "_customeq_" + nouveauNom;
            equipements[idx].nom = nouveauNom;
            PhotoManager.renamePhotoKey(oldKey, newKey).then(renderEquipements);
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
   VESTIAIRES
========================= */

var vestiairesToggle = document.getElementById("vestiairesToggle");
var vestiairesContent = document.getElementById("vestiairesContent");
var nbDouches = document.getElementById("nbDouches");

var vestiaires =
    savedData && savedData.vestiaires
        ? JSON.parse(JSON.stringify(savedData.vestiaires))
        : { present: false, nbDouches: 0 };

function updateVestiairesToggle() {
    updateToggleUI(vestiairesToggle, vestiaires.present);
    if (vestiaires.present) { vestiairesContent.classList.remove("hidden"); }
    else { vestiairesContent.classList.add("hidden"); }
}

setupToggle(vestiairesToggle, function (val) {
    vestiaires.present = val;
    updateVestiairesToggle();
});

if (savedData && savedData.vestiaires && savedData.vestiaires.present) {
    nbDouches.value = savedData.vestiaires.nbDouches || "";
}

nbDouches.addEventListener("input", function () {
    vestiaires.nbDouches = parseInt(nbDouches.value) || 0;
});

updateVestiairesToggle();

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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("sport_" + currentSport.numero + "_eclairage_" + index) + '</div>';

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

    var sportData = JSON.parse(localStorage.getItem("sportData")) || {};

    var finalNom = nomSport.value.trim();
    if (finalNom === "") { finalNom = "Salle de sport " + currentSport.numero; }

    sportData[currentSport.numero] = {
        nom: finalNom,
        horDebut: horDebut.value,
        horFin: horFin.value,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        equipements: equipements,
        vestiaires: {
            present: vestiaires.present,
            nbDouches: parseInt(nbDouches.value) || 0
        },
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("sportData", JSON.stringify(sportData));
    window.location.href = "module-detail.html";
});
