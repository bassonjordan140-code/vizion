var currentPiscine =
    JSON.parse(localStorage.getItem("currentPiscine"));

var piscineTitle = document.getElementById("piscineTitle");
var saveButton = document.getElementById("savePiscine");

if (currentPiscine) {
    piscineTitle.textContent = "Piscine " + currentPiscine.numero;
}

var piscinesData =
    JSON.parse(localStorage.getItem("piscinesData")) || {};

var savedData =
    piscinesData[currentPiscine.numero];

PhotoManager.initPage("piscine", currentPiscine.numero);
renderLocationContext("Piscine");
UnsavedGuard.watch(saveButton);

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

var typePiscine = document.getElementById("typePiscine");
var autreTypeContainer = document.getElementById("autreTypeContainer");
var autreTypeInput = document.getElementById("autreTypeInput");
var nomPiscine = document.getElementById("nomPiscine");
var couverteToggle = document.getElementById("couverteToggle");

var couverte = savedData ? savedData.couverte === "oui" : false;

if (savedData) {
    typePiscine.value = savedData.typeSelect || "Lagon";
    if (savedData.typeSelect === "Autre") {
        autreTypeContainer.classList.remove("hidden");
        autreTypeInput.value = savedData.type || "";
    }
    nomPiscine.value = savedData.nom || "";
}

typePiscine.addEventListener("change", function () {
    if (typePiscine.value === "Autre") {
        autreTypeContainer.classList.remove("hidden");
    } else {
        autreTypeContainer.classList.add("hidden");
        autreTypeInput.value = "";
    }
});

setupToggle(couverteToggle, function (val) {
    couverte = val;
    updateToggleUI(couverteToggle, couverte);
});
updateToggleUI(couverteToggle, couverte);

/* =========================
   BLOC 2 — DIMENSIONS
========================= */

var volumeTotal = document.getElementById("volumeTotal");

if (savedData) {
    volumeTotal.value = savedData.volumeTotal || "";
}

/* =========================
   BLOC 3 — FILTRATION
========================= */

var pompesList = document.getElementById("pompesList");
var addPompeButton = document.getElementById("addPompeButton");
var typeFiltration = document.getElementById("typeFiltration");
var traitementEau = document.getElementById("traitementEau");

var pompes =
    savedData && Array.isArray(savedData.pompes)
        ? savedData.pompes.slice()
        : [];

if (savedData) {
    typeFiltration.value = savedData.typeFiltration || "Sable";
    traitementEau.value = savedData.traitementEau || "Chlore";
}

function renderPompes() {

    pompesList.innerHTML = "";

    pompes.forEach(function (pompe, index) {

        var row = document.createElement("div");
        row.className = "pompe-row";

        row.innerHTML =
            '<div class="parois-cell">' +
                '<label>Puissance (kW)</label>' +
                '<input type="number" min="0" step="0.01" inputmode="numeric" ' +
                'class="pompe-puissance-input" data-index="' + index + '" value="' + pompe.puissance + '">' +
            '</div>' +
            '<div class="parois-cell">' +
                '<label>Durée (h/jour)</label>' +
                '<input type="number" min="0" step="0.5" inputmode="numeric" ' +
                'class="pompe-duree-input" data-index="' + index + '" value="' + pompe.duree + '">' +
            '</div>' +
            '<button type="button" class="parois-delete-btn pompe-delete-btn" ' +
                'data-index="' + index + '" aria-label="Supprimer cette pompe">✕</button>' +
            '<div class="row-photo-group row-photo-fullwidth">' +
                PhotoManager.createPhotoWidget("piscine_" + currentPiscine.numero + "_pompe_" + index) +
            '</div>' +
            '<div class="row-photo-group row-photo-fullwidth pompe-plaque-toggle-group">' +
                '<div class="toggle-group">' +
                    '<label>Plaque signalétique visible ?</label>' +
                    '<div class="toggle-buttons pompe-plaque-toggle" data-index="' + index + '">' +
                        '<button type="button" class="toggle-btn" data-value="non">Non</button>' +
                        '<button type="button" class="toggle-btn" data-value="oui">Oui</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="row-photo-group row-photo-fullwidth pompe-plaque-photo ' + (pompe.plaque ? '' : 'hidden') + '" data-index="' + index + '">' +
                PhotoManager.createPhotoWidget("piscine_" + currentPiscine.numero + "_pompe_plaque_" + index) +
            '</div>';

        pompesList.appendChild(row);
    });

    if (pompes.length === 0) {
        var empty = document.createElement("p");
        empty.className = "parois-empty";
        empty.textContent = "Aucune pompe. Cliquez sur « + Ajouter pompe ».";
        pompesList.appendChild(empty);
    }

    /* --- Puissance inputs --- */
    document.querySelectorAll("#pompesList .pompe-puissance-input").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.index);
            var v = parseFloat(input.value);
            pompes[idx].puissance = isNaN(v) ? 0 : v;
        });
    });

    /* --- Durée inputs --- */
    document.querySelectorAll("#pompesList .pompe-duree-input").forEach(function (input) {
        input.addEventListener("input", function () {
            var idx = parseInt(input.dataset.index);
            var v = parseFloat(input.value);
            pompes[idx].duree = isNaN(v) ? 0 : v;
        });
    });

    /* --- Delete buttons --- */
    document.querySelectorAll("#pompesList .pompe-delete-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            pompes.splice(parseInt(btn.dataset.index), 1);
            renderPompes();
        });
    });

    /* --- Plaque toggles --- */
    document.querySelectorAll("#pompesList .pompe-plaque-toggle").forEach(function (toggle) {
        var idx = parseInt(toggle.dataset.index);
        updateToggleUI(toggle, !!pompes[idx].plaque);
        setupToggle(toggle, function (val) {
            pompes[idx].plaque = val;
            var photoDiv = document.querySelector('.pompe-plaque-photo[data-index="' + idx + '"]');
            if (val) { photoDiv.classList.remove("hidden"); }
            else { photoDiv.classList.add("hidden"); }
            updateToggleUI(toggle, val);
        });
    });

    PhotoManager.bindAll(pompesList);
}

addPompeButton.addEventListener("click", function () {
    pompes.push({ puissance: 1.5, duree: 12, plaque: false });
    renderPompes();
});

renderPompes();

/* =========================
   BLOC 4 — CHAUFFAGE
========================= */

var chauffeeToggle = document.getElementById("chauffeeToggle");
var chauffageContent = document.getElementById("chauffageContent");
var typeChauffe = document.getElementById("typeChauffe");
var temperatureConsigne = document.getElementById("temperatureConsigne");
var chauffagePlaqueToggle = document.getElementById("chauffagePlaqueToggle");
var chauffagePlaquePhoto = document.getElementById("chauffagePlaquePhoto");
var bacheToggle = document.getElementById("bacheToggle");

var chauffee = savedData ? savedData.chauffee === "oui" : false;
var bache = savedData ? savedData.bache === "oui" : false;
var chauffagePlaque = savedData && savedData.chauffagePlaque === "oui" ? true : false;

if (savedData) {
    typeChauffe.value = savedData.typeChauffe || "Pompe à chaleur";
    temperatureConsigne.value = savedData.temperatureConsigne || "";
}

function updateChauffeeUI() {
    updateToggleUI(chauffeeToggle, chauffee);
    if (chauffee) { chauffageContent.classList.remove("hidden"); }
    else { chauffageContent.classList.add("hidden"); }
}

function updateChauffagePlaqueUI() {
    updateToggleUI(chauffagePlaqueToggle, chauffagePlaque);
    if (chauffagePlaque) { chauffagePlaquePhoto.classList.remove("hidden"); }
    else { chauffagePlaquePhoto.classList.add("hidden"); }
}

setupToggle(chauffeeToggle, function (val) {
    chauffee = val;
    updateChauffeeUI();
});
updateChauffeeUI();

setupToggle(chauffagePlaqueToggle, function (val) {
    chauffagePlaque = val;
    updateChauffagePlaqueUI();
});
updateChauffagePlaqueUI();

setupToggle(bacheToggle, function (val) {
    bache = val;
    updateToggleUI(bacheToggle, bache);
});
updateToggleUI(bacheToggle, bache);

/* =========================
   OBSERVATIONS
========================= */

var observations = document.getElementById("observations");

if (savedData && savedData.observations) {
    observations.value = savedData.observations;
}

/* =========================
   SAUVEGARDE
========================= */

saveButton.addEventListener("click", function () {

    var piscinesData =
        JSON.parse(localStorage.getItem("piscinesData")) || {};

    var finalType = typePiscine.value;
    if (typePiscine.value === "Autre") {
        finalType = autreTypeInput.value.trim();
    }
    if (finalType === "") {
        finalType = "Piscine " + currentPiscine.numero;
    }

    piscinesData[currentPiscine.numero] = {
        typeSelect: typePiscine.value,
        type: finalType,
        nom: nomPiscine.value,
        couverte: couverte ? "oui" : "non",
        volumeTotal: parseFloat(volumeTotal.value) || 0,
        pompes: pompes,
        typeFiltration: typeFiltration.value,
        traitementEau: traitementEau.value,
        chauffee: chauffee ? "oui" : "non",
        typeChauffe: typeChauffe.value,
        temperatureConsigne: parseFloat(temperatureConsigne.value) || 0,
        chauffagePlaque: chauffagePlaque ? "oui" : "non",
        bache: bache ? "oui" : "non",
        photos: {},
        observations: observations.value
    };

    localStorage.setItem("piscinesData", JSON.stringify(piscinesData));
    window.location.href = "module-detail.html";
});
