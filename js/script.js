// Secteurs auditables (id, label, hasCounter) — voir js/secteur-config.js

const secteurList = document.getElementById("moduleList");
const continueButton = document.getElementById("continueButton");
const backToHomeButton = document.getElementById("backToHomeButton");

const savedSecteurs =
    JSON.parse(localStorage.getItem("selectedSecteurs")) || [];

SECTEURS.forEach(function (secteur) {

    const card = document.createElement("label");
    card.className = "module-card";

    card.innerHTML = `
        <div class="module-content">

            <div class="module-header">
                <input type="checkbox" id="${secteur.id}Check">
                <span>${secteur.label}</span>
            </div>

            <div class="counter hidden" id="${secteur.id}Counter">

                <button type="button"
                        class="counter-button"
                        id="minus-${secteur.id}">
                    -
                </button>

                <span id="${secteur.id}Value">1</span>

                <button type="button"
                        class="counter-button"
                        id="plus-${secteur.id}">
                    +
                </button>

            </div>

        </div>
    `;

    secteurList.appendChild(card);

    let value = 1;

    const savedSecteur =
        savedSecteurs.find(function (item) {
            return item.id === secteur.id;
        });

    if (savedSecteur) {
        value = savedSecteur.quantity;
    }

    const checkbox = document.getElementById(`${secteur.id}Check`);
    const counter = document.getElementById(`${secteur.id}Counter`);
    const display = document.getElementById(`${secteur.id}Value`);
    const plusButton = document.getElementById(`plus-${secteur.id}`);
    const minusButton = document.getElementById(`minus-${secteur.id}`);

    if (savedSecteur) {
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

function clearSecteurData(secteurId) {
    const key = SECTEUR_DATA_KEYS[secteurId];
    if (key) localStorage.removeItem(key);
}

function clearAllSecteurData() {
    Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
        clearSecteurData(secteurId);
    });
    Object.keys(SECTEUR_CURRENT_KEYS).forEach(function (secteurId) {
        localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteurId]);
    });
}

continueButton.addEventListener("click", function () {

    const selectedSecteurs = [];
    const selectedIds = new Set();

    SECTEURS.forEach(function (secteur) {

        const checkbox =
            document.getElementById(`${secteur.id}Check`);

        if (checkbox.checked) {

            const quantity =
                parseInt(
                    document.getElementById(`${secteur.id}Value`).textContent
                );

            selectedSecteurs.push({
                id: secteur.id,
                label: secteur.label,
                quantity: quantity
            });

            selectedIds.add(secteur.id);

        }

    });

    // Pour chaque secteur non coché, on efface ses fiches.
    SECTEURS.forEach(function (secteur) {
        if (!selectedIds.has(secteur.id)) {
            clearSecteurData(secteur.id);
        }
    });

    localStorage.setItem(
        "selectedSecteurs",
        JSON.stringify(selectedSecteurs)
    );

    window.location.href = "site-data.html";

});

backToHomeButton.addEventListener("click", function () {

    // Retour au hub des bâtiments : on sauvegarde le bâtiment en cours,
    // rien n'est perdu (contrairement à l'ancien reset complet ici).
    BuildingManager.saveCurrentBuildingSnapshot().then(function () {
        window.location.href = "buildings.html";
    });

});
