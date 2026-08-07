/* ============================================================
   ViZion — Base d'équipements connus
   Associe un nom d'équipement à un lot de travaux et une puissance
   unitaire par défaut, pour proposer une autocomplétion à la saisie
   libre d'équipements (tous secteurs). Alimentée au fil des exports
   réels — à mettre à jour régulièrement, pas à modifier à la légère.
   Dépend de js/lot-mapping.js (pour les libellés de lot).
============================================================ */

window.EquipmentDatabase = (function () {

    var ENTRIES = [
        { nom: "Télé", lot: "8-1", puissance: 200 },
        { nom: "Sèche-cheveux", lot: "8-1", puissance: 1400 },
        { nom: "Sèche-serviette", lot: "10-3", puissance: 750 },
        { nom: "Théière", lot: "8-1", puissance: 850 },
        { nom: "Bouilloire", lot: "8-1", puissance: 800 },
        { nom: "Cafetière", lot: "8-1", puissance: 1200 },
        { nom: "Ascenseur", lot: "9-1", puissance: 7500 },
        { nom: "Équipement de sport", lot: "9-1", puissance: 1300 },
        { nom: "Lave-linge", lot: "8-1", puissance: 2000 },
        { nom: "Sèche-linge", lot: "8-1", puissance: 2500 },
        { nom: "Repasseuse", lot: "9-1", puissance: 7500 },
        { nom: "Calandre", lot: "9-1", puissance: 7500 },
        { nom: "Jacuzzi", lot: "9-1", puissance: 7500 },
        { nom: "Sauna", lot: "9-1", puissance: 9000 },
        { nom: "Brasseur d'air", lot: "5-2", puissance: 1100 },
        { nom: "Frigo", lot: "3-5", puissance: 650 },
        { nom: "Congélateur", lot: "3-5", puissance: 650 },
        { nom: "Cellule de refroidissement", lot: "3-5", puissance: 2500 },
        { nom: "Four", lot: "3-7", puissance: 11000 },
        { nom: "Grille-pain", lot: "3-7", puissance: 3000 },
        { nom: "Hotte", lot: "3-6", puissance: 1500 },
        { nom: "Friteuse", lot: "3-7", puissance: 3500 },
        { nom: "Machine à glaçons", lot: "3-5", puissance: 750 },
        { nom: "Lave-verre", lot: "3-3", puissance: 3500 },
        { nom: "Imprimante", lot: "8-1", puissance: 500 },
        { nom: "Ordinateur", lot: "8-1", puissance: 200 },
        { nom: "Équipement musique", lot: "8-1", puissance: 300 },
        { nom: "Baie informatique", lot: "8-2", puissance: 200 },
        { nom: "Pompe à chaleur", lot: "10-5", puissance: 11000 },
        { nom: "Pompe", lot: "4-1", puissance: 1100 }
    ];

    // Renvoie jusqu'à 6 entrées dont le nom contient la requête (insensible à
    // la casse/aux accents ne sont pas gérés, correspondance simple par sous-chaîne).
    function search(query) {
        var q = (query || "").trim().toLowerCase();
        if (q.length < 2) return [];
        return ENTRIES.filter(function (e) {
            return e.nom.toLowerCase().indexOf(q) !== -1;
        }).slice(0, 6);
    }

    // Branche l'autocomplétion sur un champ de saisie libre : affiche une liste
    // de suggestions sous le champ pendant la frappe ; cliquer une suggestion
    // appelle onPick(entry) avec l'équipement complet (nom/lot/puissance) et
    // vide le champ — à charge de l'appelant de créer la carte équipement.
    function wireAutocomplete(inputEl, dropdownEl, onPick) {

        inputEl.addEventListener("input", function () {
            var matches = search(inputEl.value);

            dropdownEl.innerHTML = "";

            if (!matches.length) {
                dropdownEl.classList.add("hidden");
                return;
            }

            matches.forEach(function (entry) {
                var item = document.createElement("button");
                item.type = "button";
                item.className = "equip-suggestion-item";
                item.textContent = entry.nom + " — " + LotMapping.lotNom(entry.lot) + " (" + entry.puissance + " W)";
                item.addEventListener("click", function () {
                    dropdownEl.classList.add("hidden");
                    dropdownEl.innerHTML = "";
                    inputEl.value = "";
                    onPick(entry);
                });
                dropdownEl.appendChild(item);
            });

            dropdownEl.classList.remove("hidden");
        });

        document.addEventListener("click", function (e) {
            if (e.target !== inputEl && !dropdownEl.contains(e.target)) {
                dropdownEl.classList.add("hidden");
            }
        });

    }

    return {
        ENTRIES: ENTRIES,
        search: search,
        wireAutocomplete: wireAutocomplete
    };

})();
