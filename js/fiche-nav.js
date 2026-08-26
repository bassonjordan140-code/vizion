/* ============================================================
   ViZion — Navigation précédent/suivant entre localisations
   Permet, depuis la fiche d'une localisation (ex: "Chambre 3"),
   de passer directement à la localisation suivante/précédente du
   même secteur (ex: "Chambre 4") sans repasser par la liste.
   Réutilise UnsavedGuard pour ne jamais perdre une saisie en cours :
   si la fiche a des modifications non sauvegardées, l'utilisateur est
   invité à sauvegarder (ce qui redirige, comme d'habitude, vers
   module-detail.html) — un marqueur dans sessionStorage (lu par
   js/module-detail.js) termine alors la navigation vers la fiche
   voisine sans que l'utilisateur ait à recliquer dessus.
============================================================ */

window.FicheNav = (function () {

    function loadSecteurData(secteurId, isCustom) {
        if (isCustom) {
            var allCustom = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
            return allCustom[secteurId] || {};
        }
        return JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[secteurId])) || {};
    }

    // direction : -1 (précédent) ou 1 (suivant). Renvoie le numéro voisin,
    // ou null s'il n'y en a pas (première/dernière localisation).
    function getSiblingNumero(secteurId, isCustom, currentNumero, direction) {
        var data = loadSecteurData(secteurId, isCustom);
        var numeros = Object.keys(data)
            .map(Number)
            .sort(function (a, b) { return a - b; });

        var idx = numeros.indexOf(Number(currentNumero));
        if (idx === -1) return null;

        var siblingIdx = idx + direction;
        if (siblingIdx < 0 || siblingIdx >= numeros.length) return null;

        return numeros[siblingIdx];
    }

    // À appeler par les boutons ← / → d'une fiche. Le marqueur pending
    // (lu par js/module-detail.js) n'est posé QUE dans les branches où la
    // fiche va effectivement être quittée — jamais si l'utilisateur annule —
    // pour ne pas laisser un marqueur périmé détourner une navigation
    // ultérieure vers la liste.
    function goToSibling(secteurId, isCustom, currentNumero, direction) {
        var siblingNumero = getSiblingNumero(secteurId, isCustom, currentNumero, direction);
        if (siblingNumero === null) {
            alert(direction < 0 ? "C'est déjà la première localisation." : "C'est déjà la dernière localisation.");
            return;
        }

        function setPendingAndLeave() {
            sessionStorage.setItem("ficheNavPending", JSON.stringify({
                secteurId: secteurId,
                numero: siblingNumero
            }));
            window.location.href = "module-detail.html";
        }

        if (!UnsavedGuard.isDirty()) {
            setPendingAndLeave();
            return;
        }

        if (confirm("Vous avez des modifications non sauvegardées sur cette fiche. Voulez-vous les sauvegarder avant de continuer ?")) {
            sessionStorage.setItem("ficheNavPending", JSON.stringify({
                secteurId: secteurId,
                numero: siblingNumero
            }));
            UnsavedGuard.triggerSave();
        } else if (confirm("Continuer sans sauvegarder ces modifications ?")) {
            setPendingAndLeave();
        }
    }

    return {
        getSiblingNumero: getSiblingNumero,
        goToSibling: goToSibling
    };

})();
