const modules = [
    { id: "hebergements", label: "Hébergements", hasCounter: true },
    { id: "piscines", label: "Piscines", hasCounter: true },
    { id: "restaurant", label: "Restaurant", hasCounter: true },
    { id: "bar", label: "Bar", hasCounter: true },
    { id: "spa", label: "Spa", hasCounter: true },
    { id: "buanderie", label: "Buanderie", hasCounter: true },
    { id: "cuisine", label: "Cuisine", hasCounter: true },
    { id: "jeux", label: "Salle de jeux", hasCounter: true },
    { id: "reunion", label: "Salle de réunion/séminaire", hasCounter: true },
    { id: "sport", label: "Salle de sport", hasCounter: true },
    { id: "bureaux", label: "Bureaux", hasCounter: true },
    { id: "parking", label: "Parking", hasCounter: true }
];

const moduleList = document.getElementById("moduleList");
const continueButton = document.getElementById("continueButton");
const backToHomeButton = document.getElementById("backToHomeButton");

const savedModules =
    JSON.parse(localStorage.getItem("selectedModules")) || [];

modules.forEach(function (module) {

    const card = document.createElement("label");
    card.className = "module-card";

    card.innerHTML = `
        <div class="module-content">

            <div class="module-header">
                <input type="checkbox" id="${module.id}Check">
                <span>${module.label}</span>
            </div>

            <div class="counter hidden" id="${module.id}Counter">

                <button type="button"
                        class="counter-button"
                        id="minus-${module.id}">
                    -
                </button>

                <span id="${module.id}Value">1</span>

                <button type="button"
                        class="counter-button"
                        id="plus-${module.id}">
                    +
                </button>

            </div>

        </div>
    `;

    moduleList.appendChild(card);

    let value = 1;

    const savedModule =
        savedModules.find(function (item) {
            return item.id === module.id;
        });

    if (savedModule) {
        value = savedModule.quantity;
    }

    const checkbox = document.getElementById(`${module.id}Check`);
    const counter = document.getElementById(`${module.id}Counter`);
    const display = document.getElementById(`${module.id}Value`);
    const plusButton = document.getElementById(`plus-${module.id}`);
    const minusButton = document.getElementById(`minus-${module.id}`);

    if (savedModule) {
        checkbox.checked = true;
        counter.classList.remove("hidden");
        display.textContent = value;
    }

    checkbox.addEventListener("change", function () {

        if (checkbox.checked) {
            value = 1;
            display.textContent = value;
            counter.classList.remove("hidden");
        } else {
            counter.classList.add("hidden");
        }

    });

    plusButton.addEventListener("click", function () {
        value++;
        display.textContent = value;
    });

    minusButton.addEventListener("click", function () {

        if (value > 1) {
            value--;
            display.textContent = value;
        }

    });

});

/* =========================
   NETTOYAGE DES DONNÉES
========================= */

// Liste des clés localStorage utilisées par chaque module.
// À enrichir au fur et à mesure qu'on ajoute des modules.
const moduleDataKeys = {
    hebergements: ["hebergementsData"],
    piscines:     ["piscinesData"],
    restaurant:   ["restaurantData"],
    bar:          ["barData"],
    spa:          ["spaData"],
    buanderie:    ["buanderieData"],
    cuisine:      ["cuisineData"],
    jeux:         ["jeuxData"],
    reunion:      ["reunionData"],
    sport:        ["sportData"],
    bureaux:      ["bureauxData"],
    parking:      ["parkingData"]
};

function clearModuleData(moduleId) {
    const keys = moduleDataKeys[moduleId] || [];
    keys.forEach(function (key) {
        localStorage.removeItem(key);
    });
}

function clearAllModuleData() {
    Object.keys(moduleDataKeys).forEach(function (moduleId) {
        clearModuleData(moduleId);
    });
    localStorage.removeItem("currentHebergement");
    localStorage.removeItem("currentPiscine");
    localStorage.removeItem("currentSpa");
    localStorage.removeItem("currentRestaurant");
    localStorage.removeItem("currentBar");
    localStorage.removeItem("currentBuanderie");
    localStorage.removeItem("currentCuisine");
    localStorage.removeItem("currentBureaux");
    localStorage.removeItem("currentParking");
    localStorage.removeItem("currentSport");
    localStorage.removeItem("currentReunion");
    localStorage.removeItem("currentJeux");
}

continueButton.addEventListener("click", function () {

    const selectedModules = [];
    const selectedIds = new Set();

    modules.forEach(function (module) {

        const checkbox =
            document.getElementById(`${module.id}Check`);

        if (checkbox.checked) {

            const quantity =
                parseInt(
                    document.getElementById(`${module.id}Value`).textContent
                );

            selectedModules.push({
                id: module.id,
                label: module.label,
                quantity: quantity
            });

            selectedIds.add(module.id);

        }

    });

    // Pour chaque module non coché, on efface ses fiches.
    modules.forEach(function (module) {
        if (!selectedIds.has(module.id)) {
            clearModuleData(module.id);
        }
    });

    localStorage.setItem(
        "selectedModules",
        JSON.stringify(selectedModules)
    );

    window.location.href = "site-data.html";

});

backToHomeButton.addEventListener("click", function () {

    // Retour à l'accueil = remise à zéro complète.
    localStorage.removeItem("selectedModules");
    localStorage.removeItem("moduleProgress");
    localStorage.removeItem("currentModule");

    clearAllModuleData();

    window.location.href = "../index.html";

});