/* ============================================================
   ViZion — Écran "Localisation" d'un secteur
   Liste les localisations déjà ajoutées (ex: "Chambre de luxe",
   "Bureau direction") pour le secteur en cours, avec leur
   progression, et permet d'en ajouter de nouvelles — nommées
   librement par l'utilisateur. Générique : piloté par
   js/secteur-config.js, pas de branche par secteur.
============================================================ */

var currentSecteur =
    JSON.parse(localStorage.getItem("currentSecteur"));

var moduleContent =
    document.getElementById("moduleContent");

var moduleTitle =
    document.getElementById("moduleTitle");

var moduleSubtitle =
    document.getElementById("moduleSubtitle");

var newLocalisationInput =
    document.getElementById("newLocalisationInput");

var addLocalisationBtn =
    document.getElementById("addLocalisationBtn");

if (currentSecteur && moduleTitle) {
    moduleTitle.textContent = currentSecteur.label;
}

function loadSecteurData() {
    if (currentSecteur.isCustom) {
        var allCustom = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
        return allCustom[currentSecteur.id] || {};
    }
    return JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[currentSecteur.id])) || {};
}

function saveSecteurData(data) {
    if (currentSecteur.isCustom) {
        var allCustom = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
        allCustom[currentSecteur.id] = data;
        localStorage.setItem(CUSTOM_SECTEUR_DATA_KEY, JSON.stringify(allCustom));
        return;
    }
    localStorage.setItem(SECTEUR_DATA_KEYS[currentSecteur.id], JSON.stringify(data));
}

// Secteurs fixes : une clé de navigation dédiée par secteur (SECTEUR_CURRENT_KEYS)
// et une page de fiche dédiée (SECTEUR_DETAIL_PAGES). Secteurs personnalisés :
// une seule clé et une seule page génériques, quel que soit le secteur.
function currentKeyName() {
    return currentSecteur.isCustom ? CUSTOM_SECTEUR_CURRENT_KEY : SECTEUR_CURRENT_KEYS[currentSecteur.id];
}

function detailPage() {
    return currentSecteur.isCustom ? CUSTOM_SECTEUR_DETAIL_PAGE : SECTEUR_DETAIL_PAGES[currentSecteur.id];
}

function renderList() {

    moduleContent.innerHTML = "";

    var data = loadSecteurData();
    var numeros = Object.keys(data)
        .map(Number)
        .sort(function (a, b) { return a - b; });

    if (moduleSubtitle) {
        moduleSubtitle.textContent = numeros.length
            ? "Sélectionnez la localisation à auditer, ou ajoutez-en une nouvelle."
            : (SECTEUR_HINTS[currentSecteur.id] || "Ajoutez une localisation pour commencer.");
    }

    numeros.forEach(function (numero) {

        var saved = data[numero];
        var progress = calcItemProgress(currentSecteur.id, saved);
        var nom = saved.nom || (currentSecteur.label + " " + numero);

        var card = document.createElement("div");
        card.className = "dashboard-card";
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");

        card.innerHTML =
            '<div class="dashboard-header">' +
                '<strong>' + nom + '</strong>' +
                '<span>' + progress + '% ' + (progress === 100 ? "✅" : "") + '</span>' +
            '</div>' +
            '<div class="progress-bar">' +
                '<div class="progress-fill" style="width: ' + progress + '%"></div>' +
            '</div>' +
            '<button type="button" class="card-rename-btn" aria-label="Renommer cette localisation">✎</button>' +
            '<button type="button" class="card-delete-btn" aria-label="Supprimer cette localisation">✕</button>';

        card.addEventListener("click", function () {

            localStorage.setItem(
                currentKeyName(),
                JSON.stringify({ moduleId: currentSecteur.id, secteurId: currentSecteur.id, label: currentSecteur.label, numero: numero })
            );

            window.location.href = detailPage();

        });

        card.querySelector(".card-rename-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            renameLocalisation(numero, nom);
        });

        card.querySelector(".card-delete-btn").addEventListener("click", function (e) {
            e.stopPropagation();
            deleteLocalisation(numero, nom);
        });

        moduleContent.appendChild(card);

    });

}

function renameLocalisation(numero, nomActuel) {

    var nouveauNom = prompt('Nouveau nom pour cette localisation :', nomActuel);
    if (nouveauNom === null) return;

    nouveauNom = nouveauNom.trim();
    if (nouveauNom === "") return;

    var data = loadSecteurData();
    if (!data[numero]) return;

    data[numero].nom = nouveauNom;
    saveSecteurData(data);
    renderList();

}

function deleteLocalisation(numero, nom) {

    if (!confirm('Supprimer la localisation "' + nom + '" ? Cette action est irréversible.')) {
        return;
    }

    var data = loadSecteurData();
    delete data[numero];
    saveSecteurData(data);

    var currentKeyRaw = localStorage.getItem(currentKeyName());
    if (currentKeyRaw) {
        var current = JSON.parse(currentKeyRaw);
        if (String(current.numero) === String(numero)) {
            localStorage.removeItem(currentKeyName());
        }
    }

    // Rafraîchit tout de suite ; le nettoyage des photos se fait en tâche de fond
    // (ne doit jamais retarder l'affichage).
    renderList();
    PhotoManager.deletePhotosByPrefix(currentSecteur.id + "_" + numero);

}

if (currentSecteur) {

    renderList();

    addLocalisationBtn.addEventListener("click", function () {

        var nom = newLocalisationInput.value.trim();
        if (nom === "") {
            alert("Veuillez entrer un nom de localisation.");
            return;
        }

        var data = loadSecteurData();
        var numeros = Object.keys(data).map(Number);
        var nextNumero = numeros.length ? Math.max.apply(null, numeros) + 1 : 1;

        data[nextNumero] = { nom: nom };
        saveSecteurData(data);

        localStorage.setItem(
            currentKeyName(),
            JSON.stringify({ moduleId: currentSecteur.id, secteurId: currentSecteur.id, label: currentSecteur.label, numero: nextNumero })
        );

        window.location.href = detailPage();

    });

}
