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
    return JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[currentSecteur.id])) || {};
}

function saveSecteurData(data) {
    localStorage.setItem(SECTEUR_DATA_KEYS[currentSecteur.id], JSON.stringify(data));
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

        var card = document.createElement("button");
        card.className = "dashboard-card";

        card.innerHTML =
            '<div class="dashboard-header">' +
                '<strong>' + (saved.nom || (currentSecteur.label + " " + numero)) + '</strong>' +
                '<span>' + progress + '% ' + (progress === 100 ? "✅" : "") + '</span>' +
            '</div>' +
            '<div class="progress-bar">' +
                '<div class="progress-fill" style="width: ' + progress + '%"></div>' +
            '</div>';

        card.addEventListener("click", function () {

            localStorage.setItem(
                SECTEUR_CURRENT_KEYS[currentSecteur.id],
                JSON.stringify({ moduleId: currentSecteur.id, numero: numero })
            );

            window.location.href = SECTEUR_DETAIL_PAGES[currentSecteur.id];

        });

        moduleContent.appendChild(card);

    });

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
            SECTEUR_CURRENT_KEYS[currentSecteur.id],
            JSON.stringify({ moduleId: currentSecteur.id, numero: nextNumero })
        );

        window.location.href = SECTEUR_DETAIL_PAGES[currentSecteur.id];

    });

}
