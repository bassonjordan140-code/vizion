var currentSpa =
    JSON.parse(localStorage.getItem("currentSpa"));

var spaTitle = document.getElementById("spaTitle");
var saveButton = document.getElementById("saveSpa");

if (currentSpa) {
    spaTitle.textContent = "Spa " + currentSpa.numero;
}

var spaData =
    JSON.parse(localStorage.getItem("spaData")) || {};

var savedData =
    spaData[currentSpa.numero];

PhotoManager.initPage("spa", currentSpa.numero);

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

var nomSpa = document.getElementById("nomSpa");
var ouvertureDebut = document.getElementById("ouvertureDebut");
var ouvertureFin = document.getElementById("ouvertureFin");

if (savedData) {
    nomSpa.value = savedData.nom || "";
    ouvertureDebut.value = savedData.ouvertureDebut || "10:00";
    ouvertureFin.value = savedData.ouvertureFin || "20:00";
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
   CHAUFFAGE GLOBAL
========================= */

var typeChauffeGlobal = document.getElementById("typeChauffeGlobal");
var chauffeGlobalPuissance = document.getElementById("chauffeGlobalPuissance");
if (savedData) {
    typeChauffeGlobal.value = savedData.typeChauffeGlobal || "Électrique";
    chauffeGlobalPuissance.value = savedData.chauffeGlobalPuissance || "";
}

/* =========================
   ECS
========================= */

var ecsDistribution = document.getElementById("ecsDistribution");
var nbDouches = document.getElementById("nbDouches");
var ecsPuissance = document.getElementById("ecsPuissance");
var ecsDedieePhoto = document.getElementById("ecsDedieePhoto");

function updateEcsPhotoVisibility() {
    if (ecsDistribution.value === "Dédiée") {
        ecsDedieePhoto.classList.remove("hidden");
    } else {
        ecsDedieePhoto.classList.add("hidden");
    }
}

ecsDistribution.addEventListener("change", updateEcsPhotoVisibility);

if (savedData) {
    ecsDistribution.value = savedData.ecsDistribution || "Dédiée";
    nbDouches.value = savedData.nbDouches || "";
    ecsPuissance.value = savedData.ecsPuissance || "";
}

updateEcsPhotoVisibility();

/* =========================
   BAINS À REMOUS
========================= */

var bainsList = document.getElementById("bainsList");
var addBainButton = document.getElementById("addBainButton");

var bainsRemous =
    savedData && Array.isArray(savedData.bainsRemous)
        ? JSON.parse(JSON.stringify(savedData.bainsRemous))
        : [];

function renderBains() {

    bainsList.innerHTML = "";

    bainsRemous.forEach(function (bain, index) {

        var section = document.createElement("div");
        section.className = "bain-section";

        var bacheActive = bain.bache === "oui";

        var pompesHTML = "";
        if (Array.isArray(bain.pompes)) {
            bain.pompes.forEach(function (pompe, pIdx) {
                pompesHTML += '<div class="pompe-row">' +
                    '<div class="parois-cell"><label>Puissance (kW)</label>' +
                    '<input type="number" min="0" step="0.01" inputmode="numeric" class="bain-pompe-puissance" data-bain="' + index + '" data-pompe="' + pIdx + '" value="' + pompe.puissance + '"></div>' +
                    '<div class="parois-cell"><label>Durée (h/jour)</label>' +
                    '<input type="number" min="0" step="0.5" inputmode="numeric" class="bain-pompe-duree" data-bain="' + index + '" data-pompe="' + pIdx + '" value="' + pompe.duree + '"></div>' +
                    '<button type="button" class="parois-delete-btn bain-pompe-delete" data-bain="' + index + '" data-pompe="' + pIdx + '" aria-label="Supprimer cette pompe">✕</button>' +
                    '<div class="row-photo-group">' + PhotoManager.createPhotoWidget("spa_" + currentSpa.numero + "_bain_" + index + "_pompe_" + pIdx) + '</div>' +
                    '</div>';
            });
        }

        section.innerHTML =
            '<div class="bain-header"><span class="ouvrants-section-title">Bain ' + (index + 1) + '</span>' +
            '<button type="button" class="parois-delete-btn bain-delete-btn" data-index="' + index + '" aria-label="Supprimer ce bain">✕</button></div>' +
            '<div class="field-group"><label>Volume (m³)</label><input type="number" min="0" step="0.1" inputmode="numeric" class="bain-volume" data-index="' + index + '" value="' + bain.volume + '"></div>' +
            '<div class="field-group"><label>Température consigne (°C)</label><input type="number" min="0" step="0.5" inputmode="numeric" class="bain-temperature" data-index="' + index + '" value="' + bain.temperatureConsigne + '"></div>' +
            '<div class="toggle-group"><label>Bâche ?</label><div class="toggle-buttons bain-bache-toggle" data-index="' + index + '">' +
            '<button type="button" class="toggle-btn ' + (bacheActive ? '' : 'active') + '" data-value="non">Non</button>' +
            '<button type="button" class="toggle-btn ' + (bacheActive ? 'active' : '') + '" data-value="oui">Oui</button></div></div>' +
            '<p class="section-hint" style="margin-top:8px; margin-bottom:8px;">Pompes de filtration</p>' +
            '<div class="pompes-list bain-pompes-list">' + pompesHTML + '</div>' +
            '<button type="button" class="add-row-button bain-add-pompe" data-index="' + index + '">+ Ajouter pompe</button>' +
            '<div class="field-group" style="margin-top:16px;"><label>Photo bain ' + (index + 1) + '</label>' + PhotoManager.createPhotoWidget("spa_" + currentSpa.numero + "_bain_" + index) + '</div>';

        bainsList.appendChild(section);
    });

    if (bainsRemous.length === 0) {
        var empty = document.createElement("p");
        empty.className = "parois-empty";
        empty.textContent = "Aucun bain à remous. Cliquez sur « + Ajouter bain à remous ».";
        bainsList.appendChild(empty);
    }

    document.querySelectorAll(".bain-volume").forEach(function (input) {
        input.addEventListener("input", function () {
            bainsRemous[parseInt(input.dataset.index)].volume = parseFloat(input.value) || 0;
        });
    });
    document.querySelectorAll(".bain-temperature").forEach(function (input) {
        input.addEventListener("input", function () {
            bainsRemous[parseInt(input.dataset.index)].temperatureConsigne = parseFloat(input.value) || 0;
        });
    });
    document.querySelectorAll(".bain-bache-toggle").forEach(function (toggle) {
        var idx = parseInt(toggle.dataset.index);
        toggle.querySelectorAll(".toggle-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                bainsRemous[idx].bache = btn.dataset.value === "oui" ? "oui" : "non";
                renderBains();
            });
        });
    });
    document.querySelectorAll(".bain-pompe-puissance").forEach(function (input) {
        input.addEventListener("input", function () {
            bainsRemous[parseInt(input.dataset.bain)].pompes[parseInt(input.dataset.pompe)].puissance = parseFloat(input.value) || 0;
        });
    });
    document.querySelectorAll(".bain-pompe-duree").forEach(function (input) {
        input.addEventListener("input", function () {
            bainsRemous[parseInt(input.dataset.bain)].pompes[parseInt(input.dataset.pompe)].duree = parseFloat(input.value) || 0;
        });
    });
    document.querySelectorAll(".bain-pompe-delete").forEach(function (btn) {
        btn.addEventListener("click", function () {
            bainsRemous[parseInt(btn.dataset.bain)].pompes.splice(parseInt(btn.dataset.pompe), 1);
            renderBains();
        });
    });
    document.querySelectorAll(".bain-add-pompe").forEach(function (btn) {
        btn.addEventListener("click", function () {
            bainsRemous[parseInt(btn.dataset.index)].pompes.push({ puissance: 0.75, duree: 8 });
            renderBains();
        });
    });
    document.querySelectorAll(".bain-delete-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            bainsRemous.splice(parseInt(btn.dataset.index), 1);
            renderBains();
        });
    });

    PhotoManager.bindAll(bainsList);
}

addBainButton.addEventListener("click", function () {
    bainsRemous.push({ volume: 1.5, temperatureConsigne: 36, bache: "non", pompes: [{ puissance: 0.75, duree: 8 }] });
    renderBains();
});
renderBains();

/* =========================
   HAMMAMS
========================= */

var hammamsList = document.getElementById("hammamsList");
var addHammamButton = document.getElementById("addHammamButton");
var hammams = savedData && Array.isArray(savedData.hammams) ? savedData.hammams.slice() : [];

function renderHammams() {
    hammamsList.innerHTML = "";
    hammams.forEach(function (hammam, index) {
        var row = document.createElement("div");
        row.className = "pompe-row spa-thermal-row";
        var opts = ["Électrique", "Gaz", "Autre"].map(function (t) {
            return '<option value="' + t + '"' + (t === hammam.typeGenerateur ? ' selected' : '') + '>' + t + '</option>';
        }).join("");
        row.innerHTML =
            '<div class="parois-cell"><label>Température (°C)</label><input type="number" min="0" step="1" inputmode="numeric" class="hammam-temp" data-index="' + index + '" value="' + hammam.temperatureConsigne + '"></div>' +
            '<div class="parois-cell"><label>Générateur vapeur</label><select class="hammam-type" data-index="' + index + '">' + opts + '</select></div>' +
            '<div class="parois-cell"><label>Puissance (W)</label><input type="number" min="0" step="1" inputmode="numeric" class="hammam-puissance" data-index="' + index + '" value="' + (hammam.puissance || 0) + '"></div>' +
            '<button type="button" class="parois-delete-btn hammam-delete" data-index="' + index + '" aria-label="Supprimer">✕</button>' +
            '<div class="row-photo-group">' + PhotoManager.createPhotoWidget("spa_" + currentSpa.numero + "_hammam_" + index) + '</div>';
        hammamsList.appendChild(row);
    });
    if (hammams.length === 0) {
        var empty = document.createElement("p");
        empty.className = "parois-empty";
        empty.textContent = "Aucun hammam. Cliquez sur « + Ajouter hammam ».";
        hammamsList.appendChild(empty);
    }
    document.querySelectorAll(".hammam-temp").forEach(function (input) {
        input.addEventListener("input", function () { hammams[parseInt(input.dataset.index)].temperatureConsigne = parseFloat(input.value) || 0; });
    });
    document.querySelectorAll(".hammam-type").forEach(function (select) {
        select.addEventListener("change", function () { hammams[parseInt(select.dataset.index)].typeGenerateur = select.value; });
    });
    document.querySelectorAll(".hammam-puissance").forEach(function (input) {
        input.addEventListener("input", function () { hammams[parseInt(input.dataset.index)].puissance = parseFloat(input.value) || 0; });
    });
    document.querySelectorAll(".hammam-delete").forEach(function (btn) {
        btn.addEventListener("click", function () { hammams.splice(parseInt(btn.dataset.index), 1); renderHammams(); });
    });

    PhotoManager.bindAll(hammamsList);
}
addHammamButton.addEventListener("click", function () {
    hammams.push({ temperatureConsigne: 45, typeGenerateur: "Électrique", puissance: 6000 });
    renderHammams();
});
renderHammams();

/* =========================
   SAUNAS
========================= */

var saunasList = document.getElementById("saunasList");
var addSaunaButton = document.getElementById("addSaunaButton");
var saunas = savedData && Array.isArray(savedData.saunas) ? savedData.saunas.slice() : [];

function renderSaunas() {
    saunasList.innerHTML = "";
    saunas.forEach(function (sauna, index) {
        var row = document.createElement("div");
        row.className = "pompe-row spa-thermal-row";
        var opts = ["Électrique", "Bois", "Infrarouge", "Autre"].map(function (t) {
            return '<option value="' + t + '"' + (t === sauna.type ? ' selected' : '') + '>' + t + '</option>';
        }).join("");
        row.innerHTML =
            '<div class="parois-cell"><label>Température (°C)</label><input type="number" min="0" step="1" inputmode="numeric" class="sauna-temp" data-index="' + index + '" value="' + sauna.temperatureConsigne + '"></div>' +
            '<div class="parois-cell"><label>Type</label><select class="sauna-type" data-index="' + index + '">' + opts + '</select></div>' +
            '<div class="parois-cell"><label>Puissance (W)</label><input type="number" min="0" step="1" inputmode="numeric" class="sauna-puissance" data-index="' + index + '" value="' + (sauna.puissance || 0) + '"></div>' +
            '<button type="button" class="parois-delete-btn sauna-delete" data-index="' + index + '" aria-label="Supprimer">✕</button>' +
            '<div class="row-photo-group">' + PhotoManager.createPhotoWidget("spa_" + currentSpa.numero + "_sauna_" + index) + '</div>';
        saunasList.appendChild(row);
    });
    if (saunas.length === 0) {
        var empty = document.createElement("p");
        empty.className = "parois-empty";
        empty.textContent = "Aucun sauna. Cliquez sur « + Ajouter sauna ».";
        saunasList.appendChild(empty);
    }
    document.querySelectorAll(".sauna-temp").forEach(function (input) {
        input.addEventListener("input", function () { saunas[parseInt(input.dataset.index)].temperatureConsigne = parseFloat(input.value) || 0; });
    });
    document.querySelectorAll(".sauna-type").forEach(function (select) {
        select.addEventListener("change", function () { saunas[parseInt(select.dataset.index)].type = select.value; });
    });
    document.querySelectorAll(".sauna-puissance").forEach(function (input) {
        input.addEventListener("input", function () { saunas[parseInt(input.dataset.index)].puissance = parseFloat(input.value) || 0; });
    });
    document.querySelectorAll(".sauna-delete").forEach(function (btn) {
        btn.addEventListener("click", function () { saunas.splice(parseInt(btn.dataset.index), 1); renderSaunas(); });
    });

    PhotoManager.bindAll(saunasList);
}
addSaunaButton.addEventListener("click", function () {
    saunas.push({ temperatureConsigne: 90, type: "Électrique", puissance: 6000 });
    renderSaunas();
});
renderSaunas();

/* =========================
   SALLES DE MASSAGE
========================= */

var massageCounterContainer = document.getElementById("massageCounterContainer");
var nbSallesMassage = savedData && savedData.nbSallesMassage !== undefined ? savedData.nbSallesMassage : 0;

(function () {
    var block = document.createElement("div");
    block.className = "counter-block";
    block.innerHTML = '<label>Nombre de salles de massage</label><div class="counter">' +
        '<button type="button" class="counter-button" id="minus-massage">-</button>' +
        '<span id="massageValue">' + nbSallesMassage + '</span>' +
        '<button type="button" class="counter-button" id="plus-massage">+</button></div>';
    massageCounterContainer.appendChild(block);
    var display = document.getElementById("massageValue");
    var massagePhotoContainer = document.getElementById("massagePhotoContainer");

    function updateMassagePhoto() {
        if (nbSallesMassage > 0) { massagePhotoContainer.classList.remove("hidden"); }
        else { massagePhotoContainer.classList.add("hidden"); }
    }

    document.getElementById("plus-massage").addEventListener("click", function () { nbSallesMassage++; display.textContent = nbSallesMassage; updateMassagePhoto(); });
    document.getElementById("minus-massage").addEventListener("click", function () { if (nbSallesMassage > 0) { nbSallesMassage--; display.textContent = nbSallesMassage; updateMassagePhoto(); } });
    updateMassagePhoto();
})();

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
            '<div class="row-photo-group row-photo-fullwidth">' + PhotoManager.createPhotoWidget("spa_" + currentSpa.numero + "_eclairage_" + index) + '</div>';

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

    var spaData = JSON.parse(localStorage.getItem("spaData")) || {};

    spaData[currentSpa.numero] = {
        nom: nomSpa.value,
        ouvertureDebut: ouvertureDebut.value,
        ouvertureFin: ouvertureFin.value,
        climatisation: climatisation,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        typeChauffeGlobal: typeChauffeGlobal.value,
        chauffeGlobalPuissance: parseFloat(chauffeGlobalPuissance.value) || 0,
        ecsDistribution: ecsDistribution.value,
        nbDouches: parseInt(nbDouches.value) || 0,
        ecsPuissance: parseFloat(ecsPuissance.value) || 0,
        bainsRemous: bainsRemous,
        hammams: hammams,
        saunas: saunas,
        nbSallesMassage: nbSallesMassage,
        eclairages: eclairages,
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("spaData", JSON.stringify(spaData));
    window.location.href = "module-detail.html";
});
