const currentHebergement =
    JSON.parse(localStorage.getItem("currentHebergement"));

const hebergementTitle =
    document.getElementById("hebergementTitle");

const counterContainer =
    document.getElementById("counterContainer");

const saveButton =
    document.getElementById("saveHebergement");

const hebergementsData =
    JSON.parse(localStorage.getItem("hebergementsData")) || {};

const savedData =
    hebergementsData[currentHebergement.numero];

if (currentHebergement && hebergementTitle) {
    hebergementTitle.textContent =
        (savedData && savedData.nom) || ("Hébergement " + currentHebergement.numero);
}

PhotoManager.initPage("hebergement", currentHebergement.numero);

const counters = [
    { id: "nbEtages", label: "Nombre d’étages", value: 0 },
    { id: "nbHebergements", label: "Nombre d’hébergements", value: 0 },
    { id: "nbChambres", label: "Nombre de pièces", value: 0 },
    { id: "capacite", label: "Capacité d’accueil (nombre de personnes)", value: 0 }
];

counters.forEach(function (counter) {

    let value =
        savedData && savedData[counter.id] !== undefined
            ? savedData[counter.id]
            : counter.value;

    const block =
        document.createElement("div");

    block.className =
        "counter-block";

    block.innerHTML = `
        <label>${counter.label}</label>

        <div class="counter">

            <button type="button"
                    class="counter-button"
                    id="minus-${counter.id}">
                -
            </button>

            <span id="${counter.id}">
                ${value}
            </span>

            <button type="button"
                    class="counter-button"
                    id="plus-${counter.id}">
                +
            </button>

        </div>
    `;

    counterContainer.appendChild(block);

    const display =
        document.getElementById(counter.id);

    document.getElementById(`plus-${counter.id}`)
        .addEventListener("click", function () {
            value++;
            display.textContent = value;
        });

    document.getElementById(`minus-${counter.id}`)
        .addEventListener("click", function () {
            if (value > 0) {
                value--;
                display.textContent = value;
            }
        });

});

/* =========================
   BLOC 2 — PAROIS MULTICOUCHES
========================= */

const materiauxDefaults = [
    { nom: "Béton",          epaisseur: 20 },
    { nom: "Parpaing",       epaisseur: 20 },
    { nom: "Brique",         epaisseur: 15 },
    { nom: "Tôle",           epaisseur: 1 },
    { nom: "Laine de verre", epaisseur: 10 },
    { nom: "Laine de roche", epaisseur: 10 },
    { nom: "Polystyrène",    epaisseur: 8 },
    { nom: "BA13",           epaisseur: 1.3 },
    { nom: "Bois",           epaisseur: 5 },
    { nom: "Autre",          epaisseur: 0 }
];

const paroisList =
    document.getElementById("paroisList");

const addParoiButton =
    document.getElementById("addParoiButton");

let parois =
    savedData && Array.isArray(savedData.parois)
        ? savedData.parois.slice()
        : [];

function renderParois() {

    paroisList.innerHTML = "";

    parois.forEach(function (paroi, index) {

        const row =
            document.createElement("div");

        row.className =
            "parois-row";

        const optionsHTML =
            materiauxDefaults
                .map(function (mat) {
                    const selected =
                        mat.nom === paroi.materiau
                            ? "selected"
                            : "";
                    return `<option value="${mat.nom}" ${selected}>${mat.nom}</option>`;
                })
                .join("");

        row.innerHTML = `
            <div class="parois-cell parois-materiau">
                <label>Matériau</label>
                <select data-index="${index}"
                        class="parois-select">
                    ${optionsHTML}
                </select>
            </div>

            <div class="parois-cell parois-epaisseur">
                <label>Épaisseur (cm)</label>
                <input type="number"
                       step="0.1"
                       min="0"
                       data-index="${index}"
                       class="parois-input"
                       value="${paroi.epaisseur}">
            </div>

            <button type="button"
                    class="parois-delete-btn"
                    data-index="${index}"
                    aria-label="Supprimer la couche">
                ✕
            </button>
        `;

        paroisList.appendChild(row);

    });

    if (parois.length === 0) {

        const empty =
            document.createElement("p");

        empty.className =
            "parois-empty";

        empty.textContent =
            "Aucune couche pour l’instant. Cliquez sur « + Ajouter matériau ».";

        paroisList.appendChild(empty);

    }

    document
        .querySelectorAll(".parois-select")
        .forEach(function (select) {

            select.addEventListener("change", function () {

                const idx = parseInt(select.dataset.index);
                const chosen = select.value;

                const def =
                    materiauxDefaults.find(function (m) {
                        return m.nom === chosen;
                    });

                parois[idx].materiau = chosen;

                if (def && chosen !== "Autre") {
                    parois[idx].epaisseur = def.epaisseur;
                }

                renderParois();

            });

        });

    document
        .querySelectorAll(".parois-input")
        .forEach(function (input) {

            input.addEventListener("input", function () {

                const idx = parseInt(input.dataset.index);
                const v = parseFloat(input.value);

                parois[idx].epaisseur =
                    isNaN(v) ? 0 : v;

            });

        });

    document
        .querySelectorAll(".parois-delete-btn")
        .forEach(function (btn) {

            btn.addEventListener("click", function () {

                const idx = parseInt(btn.dataset.index);
                parois.splice(idx, 1);
                renderParois();

            });

        });

}

addParoiButton.addEventListener("click", function () {

    const def = materiauxDefaults[0];

    parois.push({
        materiau: def.nom,
        epaisseur: def.epaisseur
    });

    renderParois();

});

renderParois();

/* =========================
   BLOC 3 — OUVRANTS / FAÇADES
========================= */

const orientations = [
    { id: "nord",        label: "Nord" },
    { id: "nord-est",    label: "Nord-Est" },
    { id: "est",         label: "Est" },
    { id: "sud-est",     label: "Sud-Est" },
    { id: "sud",         label: "Sud" },
    { id: "sud-ouest",   label: "Sud-Ouest" },
    { id: "ouest",       label: "Ouest" },
    { id: "nord-ouest",  label: "Nord-Ouest" }
];

const ouvrantTypes = [
    "Porte",
    "Simple vantail",
    "Double vantaux",
    "Triple vantaux",
    "Baie vitrée",
    "Coulissant",
    "À la française",
    "Jalousie",
    "Fixe",
    "Autre"
];

const ouvrantsContainer =
    document.getElementById("ouvrantsContainer");

let ouvrants =
    savedData && savedData.ouvrants
        ? Object.assign({}, savedData.ouvrants)
        : {};

orientations.forEach(function (o) {
    if (!Array.isArray(ouvrants[o.id])) {
        ouvrants[o.id] = [];
    }
});

function renderOuvrants() {

    ouvrantsContainer.innerHTML = "";

    orientations.forEach(function (orientation) {

        const section =
            document.createElement("div");

        section.className =
            "ouvrants-section";

        const total =
            ouvrants[orientation.id]
                .reduce(function (acc, o) {
                    return acc + (parseInt(o.nombre) || 0);
                }, 0);

        const countLabel =
            ouvrants[orientation.id].length === 0
                ? "Aucun ouvrant"
                : total + " ouvrant" + (total > 1 ? "s" : "");

        const rowsHTML =
            ouvrants[orientation.id]
                .map(function (ouvrant, index) {

                    const typesHTML =
                        ouvrantTypes
                            .map(function (t) {
                                const selected =
                                    t === ouvrant.type
                                        ? "selected"
                                        : "";
                                return `<option value="${t}" ${selected}>${t}</option>`;
                            })
                            .join("");

                    return `
                        <div class="ouvrant-row ouvrant-row-with-photo">
                            <div class="parois-cell">
                                <label>Type</label>
                                <select class="ouvrant-type-select"
                                        data-orientation="${orientation.id}"
                                        data-index="${index}">
                                    ${typesHTML}
                                </select>
                            </div>

                            <div class="parois-cell">
                                <label>Nombre</label>
                                <input type="number"
                                       min="1"
                                       step="1"
                                       class="ouvrant-nombre-input"
                                       data-orientation="${orientation.id}"
                                       data-index="${index}"
                                       value="${ouvrant.nombre}">
                            </div>

                            <button type="button"
                                    class="parois-delete-btn ouvrant-delete-btn"
                                    data-orientation="${orientation.id}"
                                    data-index="${index}"
                                    aria-label="Supprimer cet ouvrant">
                                ✕
                            </button>

                            <div class="row-photo-group">
                                ${PhotoManager.createPhotoWidget("hebergement_" + currentHebergement.numero + "_ouvrant_" + orientation.id + "_" + index)}
                            </div>
                        </div>
                    `;

                })
                .join("");

        section.innerHTML = `
            <div class="ouvrants-section-header">
                <span class="ouvrants-section-title">${orientation.label}</span>
                <span class="ouvrants-section-count">${countLabel}</span>
            </div>

            <div class="ouvrants-section-list">
                ${rowsHTML}
            </div>

            <button type="button"
                    class="add-row-button ouvrant-add-btn"
                    data-orientation="${orientation.id}">
                + Ajouter ouvrant
            </button>
        `;

        ouvrantsContainer.appendChild(section);

    });

    document
        .querySelectorAll(".ouvrant-add-btn")
        .forEach(function (btn) {

            btn.addEventListener("click", function () {

                const orientation = btn.dataset.orientation;

                ouvrants[orientation].push({
                    type: "Porte",
                    nombre: 1
                });

                renderOuvrants();

            });

        });

    document
        .querySelectorAll(".ouvrant-type-select")
        .forEach(function (select) {

            select.addEventListener("change", function () {

                const orientation = select.dataset.orientation;
                const idx = parseInt(select.dataset.index);

                ouvrants[orientation][idx].type = select.value;

            });

        });

    document
        .querySelectorAll(".ouvrant-nombre-input")
        .forEach(function (input) {

            input.addEventListener("input", function () {

                const orientation = input.dataset.orientation;
                const idx = parseInt(input.dataset.index);
                const v = parseInt(input.value);

                ouvrants[orientation][idx].nombre =
                    isNaN(v) || v < 1 ? 1 : v;

            });

            input.addEventListener("blur", function () {
                renderOuvrants();
            });

        });

    document
        .querySelectorAll(".ouvrant-delete-btn")
        .forEach(function (btn) {

            btn.addEventListener("click", function () {

                const orientation = btn.dataset.orientation;
                const idx = parseInt(btn.dataset.index);

                ouvrants[orientation].splice(idx, 1);

                renderOuvrants();

            });

        });

    PhotoManager.bindAll(ouvrantsContainer);

}

renderOuvrants();

/* =========================
   BLOC 4 — PROTECTIONS SOLAIRES
========================= */

const protectionTypes = [
    "Brise-soleil",
    "Casquette",
    "Végétation",
    "Autre"
];

const facadeOptions = [
    { id: "nord",        label: "Nord" },
    { id: "nord-est",    label: "Nord-Est" },
    { id: "est",         label: "Est" },
    { id: "sud-est",     label: "Sud-Est" },
    { id: "sud",         label: "Sud" },
    { id: "sud-ouest",   label: "Sud-Ouest" },
    { id: "ouest",       label: "Ouest" },
    { id: "nord-ouest",  label: "Nord-Ouest" }
];

const protectionToggle =
    document.getElementById("protectionToggle");

const protectionsContent =
    document.getElementById("protectionsContent");

const protectionsList =
    document.getElementById("protectionsList");

const addProtectionButton =
    document.getElementById("addProtectionButton");

let protectionsSolaires =
    savedData && savedData.protectionsSolaires
        ? JSON.parse(JSON.stringify(savedData.protectionsSolaires))
        : { present: false, items: [] };

function updateProtectionToggle() {

    protectionToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {

            const isActive =
                (btn.dataset.value === "oui" && protectionsSolaires.present) ||
                (btn.dataset.value === "non" && !protectionsSolaires.present);

            if (isActive) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }

        });

    if (protectionsSolaires.present) {
        protectionsContent.classList.remove("hidden");
    } else {
        protectionsContent.classList.add("hidden");
    }

}

protectionToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {

        btn.addEventListener("click", function () {

            protectionsSolaires.present =
                btn.dataset.value === "oui";

            if (protectionsSolaires.present && protectionsSolaires.items.length === 0) {
                protectionsSolaires.items.push({
                    type: protectionTypes[0],
                    facade: facadeOptions[0].id
                });
            }

            updateProtectionToggle();
            renderProtections();

        });

    });

function renderProtections() {

    protectionsList.innerHTML = "";

    protectionsSolaires.items.forEach(function (item, index) {

        const row =
            document.createElement("div");

        row.className =
            "protection-row";

        const typesHTML =
            protectionTypes
                .map(function (t) {
                    var selected = t === item.type ? "selected" : "";
                    return '<option value="' + t + '" ' + selected + '>' + t + '</option>';
                })
                .join("");

        const facadesHTML =
            facadeOptions
                .map(function (f) {
                    var selected = f.id === item.facade ? "selected" : "";
                    return '<option value="' + f.id + '" ' + selected + '>' + f.label + '</option>';
                })
                .join("");

        row.innerHTML = `
            <div class="parois-cell">
                <label>Type</label>
                <select class="protection-type-select"
                        data-index="${index}">
                    ${typesHTML}
                </select>
            </div>

            <div class="parois-cell">
                <label>Façade</label>
                <select class="protection-facade-select"
                        data-index="${index}">
                    ${facadesHTML}
                </select>
            </div>

            <div class="parois-cell protection-photo-cell">
                <label>Photo</label>
                ${PhotoManager.createPhotoWidget("hebergement_" + currentHebergement.numero + "_protection_" + index)}
            </div>

            <button type="button"
                    class="parois-delete-btn protection-delete-btn"
                    data-index="${index}"
                    aria-label="Supprimer cette protection">
                ✕
            </button>
        `;

        protectionsList.appendChild(row);

    });

    if (protectionsSolaires.items.length === 0) {

        const empty =
            document.createElement("p");

        empty.className =
            "parois-empty";

        empty.textContent =
            "Aucune protection. Cliquez sur « + Ajouter protection ».";

        protectionsList.appendChild(empty);

    }

    document
        .querySelectorAll(".protection-type-select")
        .forEach(function (select) {

            select.addEventListener("change", function () {

                var idx = parseInt(select.dataset.index);
                protectionsSolaires.items[idx].type = select.value;

            });

        });

    document
        .querySelectorAll(".protection-facade-select")
        .forEach(function (select) {

            select.addEventListener("change", function () {

                var idx = parseInt(select.dataset.index);
                protectionsSolaires.items[idx].facade = select.value;

            });

        });

    document
        .querySelectorAll(".protection-delete-btn")
        .forEach(function (btn) {

            btn.addEventListener("click", function () {

                var idx = parseInt(btn.dataset.index);
                protectionsSolaires.items.splice(idx, 1);
                renderProtections();

            });

        });

    PhotoManager.bindAll(protectionsList);

}

addProtectionButton.addEventListener("click", function () {

    protectionsSolaires.items.push({
        type: protectionTypes[0],
        facade: facadeOptions[0].id
    });

    renderProtections();

});

updateProtectionToggle();
renderProtections();

/* =========================
   BRASSEUR D'AIR
========================= */

const brasseurToggle =
    document.getElementById("brasseurToggle");

const brasseurContent =
    document.getElementById("brasseurContent");

const brasseurNombre =
    document.getElementById("brasseurNombre");

let brasseurAir =
    savedData && savedData.brasseurAir
        ? { present: savedData.brasseurAir.present === "oui", nombre: savedData.brasseurAir.nombre || 0 }
        : { present: false, nombre: 0 };

if (brasseurAir.present) {
    brasseurNombre.value = brasseurAir.nombre;
}

function updateBrasseurToggle() {

    brasseurToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {
            var isActive =
                (btn.dataset.value === "oui" && brasseurAir.present) ||
                (btn.dataset.value === "non" && !brasseurAir.present);
            if (isActive) { btn.classList.add("active"); }
            else { btn.classList.remove("active"); }
        });

    if (brasseurAir.present) {
        brasseurContent.classList.remove("hidden");
    } else {
        brasseurContent.classList.add("hidden");
    }

}

brasseurToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {
        btn.addEventListener("click", function () {
            brasseurAir.present = btn.dataset.value === "oui";
            updateBrasseurToggle();
        });
    });

brasseurNombre.addEventListener("input", function () {
    var v = parseInt(brasseurNombre.value);
    brasseurAir.nombre = isNaN(v) || v < 0 ? 0 : v;
});

updateBrasseurToggle();

/* =========================
   BLOC 5 — CLIMATISATION
========================= */

const climToggle =
    document.getElementById("climToggle");

const climContent =
    document.getElementById("climContent");

const climEtat =
    document.getElementById("climEtat");

const plaqueToggle =
    document.getElementById("plaqueToggle");

const plaquePhotoContainer =
    document.getElementById("plaquePhotoContainer");

const climNombre =
    document.getElementById("climNombre");

const climPuissance =
    document.getElementById("climPuissance");

let climatisation =
    savedData && savedData.climatisation
        ? JSON.parse(JSON.stringify(savedData.climatisation))
        : { present: false, nombre: 0, puissance: 0, etat: "Bon", plaque: false };

function updateClimToggle() {

    climToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {

            var isActive =
                (btn.dataset.value === "oui" && climatisation.present) ||
                (btn.dataset.value === "non" && !climatisation.present);

            if (isActive) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }

        });

    if (climatisation.present) {
        climContent.classList.remove("hidden");
    } else {
        climContent.classList.add("hidden");
    }

}

function updatePlaqueToggle() {

    plaqueToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {

            var isActive =
                (btn.dataset.value === "oui" && climatisation.plaque) ||
                (btn.dataset.value === "non" && !climatisation.plaque);

            if (isActive) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }

        });

    if (climatisation.plaque) {
        plaquePhotoContainer.classList.remove("hidden");
    } else {
        plaquePhotoContainer.classList.add("hidden");
    }

}

climToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {

        btn.addEventListener("click", function () {

            climatisation.present =
                btn.dataset.value === "oui";

            if (climatisation.present && !climatisation.nombre) {
                climatisation.nombre = 1;
                climNombre.value = 1;
            }

            updateClimToggle();

        });

    });

plaqueToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {

        btn.addEventListener("click", function () {

            climatisation.plaque =
                btn.dataset.value === "oui";

            updatePlaqueToggle();

        });

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
   BLOC 6 — EAU CHAUDE SANITAIRE
========================= */

const ecsToggle =
    document.getElementById("ecsToggle");

const ecsContent =
    document.getElementById("ecsContent");

const ecsDistribution =
    document.getElementById("ecsDistribution");

const ecsEnergie =
    document.getElementById("ecsEnergie");

const ecsPuissance =
    document.getElementById("ecsPuissance");

let ecs =
    savedData && savedData.ecs
        ? JSON.parse(JSON.stringify(savedData.ecs))
        : { present: false, distribution: "Centralisée", energie: "Électrique", puissance: 0 };

function updateEcsToggle() {

    ecsToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {

            var isActive =
                (btn.dataset.value === "oui" && ecs.present) ||
                (btn.dataset.value === "non" && !ecs.present);

            if (isActive) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }

        });

    if (ecs.present) {
        ecsContent.classList.remove("hidden");
    } else {
        ecsContent.classList.add("hidden");
    }

}

ecsToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {

        btn.addEventListener("click", function () {

            ecs.present =
                btn.dataset.value === "oui";

            updateEcsToggle();

        });

    });

ecsDistribution.addEventListener("change", function () {
    ecs.distribution = ecsDistribution.value;
});

ecsEnergie.addEventListener("change", function () {
    ecs.energie = ecsEnergie.value;
});

ecsPuissance.addEventListener("input", function () {
    var v = parseFloat(ecsPuissance.value);
    ecs.puissance = isNaN(v) || v < 0 ? 0 : v;
});

if (savedData && savedData.ecs) {
    ecsDistribution.value = ecs.distribution;
    ecsEnergie.value = ecs.energie;
    ecsPuissance.value = ecs.puissance || "";
}

updateEcsToggle();

/* =========================
   BLOC 7 — ÉQUIPEMENTS
========================= */

const equipementsList = [
    "Télé",
    "Minibar",
    "Frigo",
    "Machine café",
    "Sèche-cheveux",
    "Téléphone",
    "Cave vin",
    "Machine glaçons",
    "Bain remous",
    "Brasseur air",
    "Bouilloire",
    "Plaques cuisson",
    "Micro-ondes"
];

// Puissance unitaire estimée (W) — valeurs typiques constructeur, à ajuster
// par l'utilisateur selon le matériel réellement présent.
const equipementsPuissanceDefaut = {
    "Télé": 100,
    "Minibar": 70,
    "Frigo": 150,
    "Machine café": 1000,
    "Sèche-cheveux": 1800,
    "Téléphone": 5,
    "Cave vin": 120,
    "Machine glaçons": 150,
    "Bain remous": 1500,
    "Brasseur air": 75,
    "Bouilloire": 2000,
    "Plaques cuisson": 2000,
    "Micro-ondes": 1000
};

const equipementsGrid =
    document.getElementById("equipementsGrid");

const customEquipementsList =
    document.getElementById("customEquipementsList");

let equipements =
    savedData && Array.isArray(savedData.equipements)
        ? JSON.parse(JSON.stringify(savedData.equipements))
        : [];

function findEquip(nom) {
    return equipements.find(function (e) { return e.nom === nom; });
}

function renderEquipements() {

    equipementsGrid.innerHTML = "";

    equipementsList.forEach(function (nom) {

        var equip = findEquip(nom);
        var checked = !!equip;

        var item = document.createElement("div");
        item.className = "equipement-item" + (checked ? " checked" : "");

        var puissanceVal = equip && equip.puissance !== undefined && equip.puissance !== ""
            ? equip.puissance
            : (equipementsPuissanceDefaut[nom] !== undefined ? equipementsPuissanceDefaut[nom] : "");

        var detailHTML = checked
            ? '<div class="equipement-detail-group">' +
              '<div class="equipement-nombre-group">' +
              '<label class="equipement-nombre-label">Nombre</label>' +
              '<input type="number" min="1" step="1" inputmode="numeric" class="equipement-nombre-input" data-equip="' + nom + '" value="' + (equip.nombre || 1) + '">' +
              '</div>' +
              '<div class="equipement-nombre-group">' +
              '<label class="equipement-nombre-label">Puissance unitaire (W)</label>' +
              '<input type="number" min="0" step="1" inputmode="numeric" class="equipement-puissance-input" data-equip="' + nom + '" value="' + puissanceVal + '">' +
              '</div>' +
              PhotoManager.createPhotoWidget("hebergement_" + currentHebergement.numero + "_equip_" + nom) +
              '</div>'
            : '';

        item.innerHTML =
            '<div class="equipement-header-row">' +
            '<input type="checkbox"' + (checked ? " checked" : "") + ' data-equip="' + nom + '">' +
            '<span>' + nom + '</span>' +
            '</div>' +
            detailHTML;

        equipementsGrid.appendChild(item);

    });

    equipementsGrid
        .querySelectorAll("input[type='checkbox']")
        .forEach(function (cb) {

            cb.addEventListener("change", function () {

                var nom = cb.dataset.equip;

                if (cb.checked) {
                    if (!findEquip(nom)) {
                        equipements.push({
                            nom: nom,
                            nombre: 1,
                            puissance: equipementsPuissanceDefaut[nom] !== undefined ? equipementsPuissanceDefaut[nom] : ""
                        });
                    }
                } else {
                    var idx = equipements.findIndex(function (e) { return e.nom === nom; });
                    if (idx !== -1) { equipements.splice(idx, 1); }
                }

                renderEquipements();

            });

        });

    equipementsGrid
        .querySelectorAll(".equipement-nombre-input")
        .forEach(function (input) {

            input.addEventListener("input", function () {
                var nom = input.dataset.equip;
                var equip = findEquip(nom);
                if (equip) {
                    var v = parseInt(input.value);
                    equip.nombre = isNaN(v) || v < 1 ? 1 : v;
                }
            });

            input.addEventListener("click", function (e) {
                e.stopPropagation();
            });

        });

    equipementsGrid
        .querySelectorAll(".equipement-puissance-input")
        .forEach(function (input) {

            input.addEventListener("input", function () {
                var nom = input.dataset.equip;
                var equip = findEquip(nom);
                if (equip) {
                    var v = parseFloat(input.value);
                    equip.puissance = isNaN(v) || v < 0 ? 0 : v;
                }
            });

            input.addEventListener("click", function (e) {
                e.stopPropagation();
            });

        });

    PhotoManager.bindAll(equipementsGrid);

}

// Équipements ajoutés librement par l'utilisateur (hors liste fixe ci-dessus) —
// affichés séparément, juste sous le bouton "Ajouter cet équipement", le plus
// récent en premier.
function renderCustomEquipements() {

    customEquipementsList.innerHTML = "";

    var customs = equipements.filter(function (e) { return equipementsList.indexOf(e.nom) === -1; });

    customs.forEach(function (equip) {

        var item = document.createElement("div");
        item.className = "custom-equip-card";

        item.innerHTML =
            '<button type="button" class="custom-equip-delete" data-custom-equip="' + equip.nom + '" aria-label="Supprimer cet équipement">✕</button>' +
            '<div class="custom-equip-name">' + equip.nom + '</div>' +
            '<div class="custom-equip-fields">' +
            '<div class="equipement-nombre-group">' +
            '<label class="equipement-nombre-label">Nombre</label>' +
            '<input type="number" min="1" step="1" inputmode="numeric" class="equipement-nombre-input" data-equip="' + equip.nom + '" value="' + (equip.nombre || 1) + '">' +
            '</div>' +
            '<div class="equipement-nombre-group">' +
            '<label class="equipement-nombre-label">Puissance unitaire (W)</label>' +
            '<input type="number" min="0" step="1" inputmode="numeric" class="equipement-puissance-input" data-equip="' + equip.nom + '" value="' + (equip.puissance !== undefined ? equip.puissance : "") + '" placeholder="Ex : 500">' +
            '</div>' +
            PhotoManager.createPhotoWidget("hebergement_" + currentHebergement.numero + "_equip_" + equip.nom) +
            '</div>';

        customEquipementsList.appendChild(item);

    });

    customEquipementsList
        .querySelectorAll("[data-custom-equip]")
        .forEach(function (btn) {

            btn.addEventListener("click", function () {
                var nom = btn.dataset.customEquip;
                var idx = equipements.findIndex(function (eq) { return eq.nom === nom; });
                if (idx !== -1) { equipements.splice(idx, 1); }
                renderCustomEquipements();
            });

        });

    customEquipementsList
        .querySelectorAll(".equipement-nombre-input")
        .forEach(function (input) {
            input.addEventListener("input", function () {
                var nom = input.dataset.equip;
                var equip = findEquip(nom);
                if (equip) {
                    var v = parseInt(input.value);
                    equip.nombre = isNaN(v) || v < 1 ? 1 : v;
                }
            });
        });

    customEquipementsList
        .querySelectorAll(".equipement-puissance-input")
        .forEach(function (input) {
            input.addEventListener("input", function () {
                var nom = input.dataset.equip;
                var equip = findEquip(nom);
                if (equip) {
                    var v = parseFloat(input.value);
                    equip.puissance = isNaN(v) || v < 0 ? 0 : v;
                }
            });
        });

    PhotoManager.bindAll(customEquipementsList);

}

renderEquipements();
renderCustomEquipements();

const nouvelEquipementInput =
    document.getElementById("nouvelEquipementInput");

const addEquipementButton =
    document.getElementById("addEquipementButton");

addEquipementButton.addEventListener("click", function () {

    var nom = nouvelEquipementInput.value.trim();
    if (nom === "") {
        alert("Veuillez entrer un nom d'équipement.");
        return;
    }

    equipements.unshift({ nom: nom, nombre: 1, puissance: "" });
    nouvelEquipementInput.value = "";
    renderCustomEquipements();

});

/* =========================
   BLOC 8 — PISCINE PRIVÉE
========================= */

const piscineToggle =
    document.getElementById("piscineToggle");

const piscineContent =
    document.getElementById("piscineContent");

const piscineChauffeToggle =
    document.getElementById("piscineChauffeToggle");

const piscineChauffeContent =
    document.getElementById("piscineChauffeContent");

const piscineChauffeType =
    document.getElementById("piscineChauffeType");

const piscineChauffePuissance =
    document.getElementById("piscineChauffePuissance");

const piscineVolume =
    document.getElementById("piscineVolume");

const piscineEclairageToggle =
    document.getElementById("piscineEclairageToggle");

const piscineEclairageContent =
    document.getElementById("piscineEclairageContent");

const piscineEclairageNombre =
    document.getElementById("piscineEclairageNombre");

const piscineEclairageType =
    document.getElementById("piscineEclairageType");

let piscinePrivee =
    savedData && savedData.piscinePrivee
        ? JSON.parse(JSON.stringify(savedData.piscinePrivee))
        : {
            present: false,
            chauffee: false,
            chauffeType: "Pompe à chaleur",
            chauffePuissance: 0,
            volume: 0,
            eclairage: false,
            eclairageNombre: 0,
            eclairageType: "LED"
        };

if (savedData && savedData.piscinePrivee) {
    piscineChauffeType.value = piscinePrivee.chauffeType || "Pompe à chaleur";
    piscineChauffePuissance.value = piscinePrivee.chauffePuissance || "";
}

piscineChauffeType.addEventListener("change", function () {
    piscinePrivee.chauffeType = piscineChauffeType.value;
});

piscineChauffePuissance.addEventListener("input", function () {
    var v = parseFloat(piscineChauffePuissance.value);
    piscinePrivee.chauffePuissance = isNaN(v) || v < 0 ? 0 : v;
});

function updatePiscineToggle() {

    piscineToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {
            var isActive =
                (btn.dataset.value === "oui" && piscinePrivee.present) ||
                (btn.dataset.value === "non" && !piscinePrivee.present);
            if (isActive) { btn.classList.add("active"); }
            else { btn.classList.remove("active"); }
        });

    if (piscinePrivee.present) {
        piscineContent.classList.remove("hidden");
    } else {
        piscineContent.classList.add("hidden");
    }

}

function updatePiscineChauffeToggle() {

    piscineChauffeToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {
            var isActive =
                (btn.dataset.value === "oui" && piscinePrivee.chauffee) ||
                (btn.dataset.value === "non" && !piscinePrivee.chauffee);
            if (isActive) { btn.classList.add("active"); }
            else { btn.classList.remove("active"); }
        });

    if (piscinePrivee.chauffee) {
        piscineChauffeContent.classList.remove("hidden");
    } else {
        piscineChauffeContent.classList.add("hidden");
    }

}

function updatePiscineEclairageToggle() {

    piscineEclairageToggle
        .querySelectorAll(".toggle-btn")
        .forEach(function (btn) {
            var isActive =
                (btn.dataset.value === "oui" && piscinePrivee.eclairage) ||
                (btn.dataset.value === "non" && !piscinePrivee.eclairage);
            if (isActive) { btn.classList.add("active"); }
            else { btn.classList.remove("active"); }
        });

    if (piscinePrivee.eclairage) {
        piscineEclairageContent.classList.remove("hidden");
    } else {
        piscineEclairageContent.classList.add("hidden");
    }

}

piscineToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {
        btn.addEventListener("click", function () {
            piscinePrivee.present = btn.dataset.value === "oui";
            updatePiscineToggle();
        });
    });

piscineChauffeToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {
        btn.addEventListener("click", function () {
            piscinePrivee.chauffee = btn.dataset.value === "oui";
            updatePiscineChauffeToggle();
        });
    });

piscineEclairageToggle
    .querySelectorAll(".toggle-btn")
    .forEach(function (btn) {
        btn.addEventListener("click", function () {
            piscinePrivee.eclairage = btn.dataset.value === "oui";
            updatePiscineEclairageToggle();
        });
    });

piscineVolume.addEventListener("input", function () {
    var v = parseFloat(piscineVolume.value);
    piscinePrivee.volume = isNaN(v) ? 0 : v;
});

piscineEclairageNombre.addEventListener("input", function () {
    var v = parseInt(piscineEclairageNombre.value);
    piscinePrivee.eclairageNombre = isNaN(v) || v < 0 ? 0 : v;
});

piscineEclairageType.addEventListener("change", function () {
    piscinePrivee.eclairageType = piscineEclairageType.value;
});

if (savedData && savedData.piscinePrivee) {
    piscineVolume.value = piscinePrivee.volume || "";
    piscineEclairageNombre.value = piscinePrivee.eclairageNombre;
    piscineEclairageType.value = piscinePrivee.eclairageType;
}

updatePiscineToggle();
updatePiscineChauffeToggle();
updatePiscineEclairageToggle();

/* =========================
   BLOC 9 — ÉCLAIRAGE
========================= */

const ampouleTypes = [
    { nom: "LED",              puissance: 9 },
    { nom: "Fluocompacte",     puissance: 18 },
    { nom: "Tube fluorescent", puissance: 36 },
    { nom: "Halogène",         puissance: 50 },
    { nom: "Incandescence",    puissance: 60 }
];

const eclairageList =
    document.getElementById("eclairageList");

const addEclairageButton =
    document.getElementById("addEclairageButton");

let eclairages =
    savedData && Array.isArray(savedData.eclairages)
        ? savedData.eclairages.slice()
        : [];

function renderEclairages() {

    eclairageList.innerHTML = "";

    eclairages.forEach(function (item, index) {

        var row =
            document.createElement("div");

        row.className =
            "eclairage-row";

        var typesHTML =
            ampouleTypes
                .map(function (t) {
                    var selected = t.nom === item.type ? "selected" : "";
                    return '<option value="' + t.nom + '" ' + selected + '>' + t.nom + '</option>';
                })
                .join("");

        var total = item.puissance * item.quantite;

        row.innerHTML = `
            <div class="parois-cell">
                <label>Type</label>
                <select class="eclairage-type-select"
                        data-index="${index}">
                    ${typesHTML}
                </select>
            </div>

            <div class="parois-cell eclairage-puissance-cell">
                <label>W unitaire</label>
                <input type="number"
                       min="1"
                       step="1"
                       inputmode="numeric"
                       pattern="[0-9]*"
                       class="eclairage-puissance-input"
                       data-index="${index}"
                       value="${item.puissance}">
            </div>

            <div class="parois-cell">
                <label>Quantité</label>
                <input type="number"
                       min="1"
                       step="1"
                       inputmode="numeric"
                       pattern="[0-9]*"
                       class="eclairage-quantite-input"
                       data-index="${index}"
                       value="${item.quantite}">
            </div>

            <div class="parois-cell eclairage-total-cell">
                <label>Total</label>
                <span class="eclairage-total-value">${total} W</span>
            </div>

            <button type="button"
                    class="parois-delete-btn eclairage-delete-btn"
                    data-index="${index}"
                    aria-label="Supprimer cet éclairage">
                ✕
            </button>

            <div class="row-photo-group row-photo-fullwidth">
                ${PhotoManager.createPhotoWidget("hebergement_" + currentHebergement.numero + "_eclairage_" + index)}
            </div>
        `;

        eclairageList.appendChild(row);

    });

    if (eclairages.length === 0) {

        var empty =
            document.createElement("p");

        empty.className =
            "parois-empty";

        empty.textContent =
            "Aucun éclairage. Cliquez sur « + Ajouter type d'éclairage ».";

        eclairageList.appendChild(empty);

    }

    document
        .querySelectorAll(".eclairage-type-select")
        .forEach(function (select) {

            select.addEventListener("change", function () {

                var idx = parseInt(select.dataset.index);
                var chosen = select.value;

                var def =
                    ampouleTypes.find(function (t) {
                        return t.nom === chosen;
                    });

                eclairages[idx].type = chosen;
                eclairages[idx].puissance = def.puissance;

                renderEclairages();

            });

        });

    document
        .querySelectorAll(".eclairage-puissance-input")
        .forEach(function (input) {

            input.addEventListener("input", function () {

                var idx = parseInt(input.dataset.index);
                var v = parseInt(input.value);

                eclairages[idx].puissance =
                    isNaN(v) ? 0 : v;

                var totalSpan =
                    input.closest(".eclairage-row")
                        .querySelector(".eclairage-total-value");

                totalSpan.textContent =
                    eclairages[idx].puissance * eclairages[idx].quantite + " W";

            });

        });

    document
        .querySelectorAll(".eclairage-quantite-input")
        .forEach(function (input) {

            input.addEventListener("input", function () {

                var idx = parseInt(input.dataset.index);
                var v = parseInt(input.value);

                eclairages[idx].quantite =
                    isNaN(v) ? 0 : v;

                var totalSpan =
                    input.closest(".eclairage-row")
                        .querySelector(".eclairage-total-value");

                totalSpan.textContent =
                    eclairages[idx].puissance * eclairages[idx].quantite + " W";

            });

        });

    document
        .querySelectorAll(".eclairage-delete-btn")
        .forEach(function (btn) {

            btn.addEventListener("click", function () {

                var idx = parseInt(btn.dataset.index);
                eclairages.splice(idx, 1);
                renderEclairages();

            });

        });

    PhotoManager.bindAll(eclairageList);

}

addEclairageButton.addEventListener("click", function () {

    var def = ampouleTypes[0];

    eclairages.push({
        type: def.nom,
        puissance: def.puissance,
        quantite: 1
    });

    renderEclairages();

});

renderEclairages();

/* =========================
   BLOC 11 — COMMENTAIRE LIBRE
========================= */

const commentaireLibre =
    document.getElementById("commentaireLibre");

if (savedData && savedData.commentaire) {
    commentaireLibre.value = savedData.commentaire;
}

/* =========================
   SAUVEGARDE
========================= */

saveButton.addEventListener("click", function () {

    const hebergementsData =
        JSON.parse(localStorage.getItem("hebergementsData")) || {};

    hebergementsData[currentHebergement.numero] = {
        nom: savedData ? savedData.nom : "",
        nbEtages: parseInt(document.getElementById("nbEtages").textContent),
        nbHebergements: parseInt(document.getElementById("nbHebergements").textContent),
        nbChambres: parseInt(document.getElementById("nbChambres").textContent),
        capacite: parseInt(document.getElementById("capacite").textContent),
        parois: parois,
        ouvrants: ouvrants,
        protectionsSolaires: protectionsSolaires,
        brasseurAir: {
            present: brasseurAir.present ? "oui" : "non",
            nombre: brasseurAir.nombre
        },
        climatisation: climatisation,
        ecs: ecs,
        equipements: equipements,
        piscinePrivee: piscinePrivee,
        eclairages: eclairages,
        commentaire: commentaireLibre.value
    };

    localStorage.setItem(
        "hebergementsData",
        JSON.stringify(hebergementsData)
    );

    window.location.href =
        "module-detail.html";

});