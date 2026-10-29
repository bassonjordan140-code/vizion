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
        { nom: "Lave-linge", lot: "7-1", puissance: 2000 },
        { nom: "Sèche-linge", lot: "7-1", puissance: 2500 },
        { nom: "Calandre", lot: "7-1", puissance: 7500 },
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
        { nom: "Pompe", lot: "4-1", puissance: 1100 },
        { nom: "Micro-ondes", lot: "3-7", puissance: 1200 },
        { nom: "Minibar", lot: "8-1", puissance: 100 },
        { nom: "Machine à café", lot: "8-1", puissance: 1200 }
    ];

    // Minuscules, sans accents ni ponctuation : "Micro-ondes", "micro ondes" et
    // "MICRO ONDES" donnent la même clé.
    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    // Nombre de modifications (ajout, retrait, remplacement ou inversion de deux
    // lettres) pour passer de a à b : sert à reconnaître "Mirco onde" comme "Micro-ondes".
    function distance(a, b) {
        var rows = [];
        for (var i = 0; i <= a.length; i++) {
            rows[i] = [i];
            for (var j = 1; j <= b.length; j++) {
                if (i === 0) { rows[i][j] = j; continue; }
                rows[i][j] = Math.min(
                    rows[i - 1][j] + 1,
                    rows[i][j - 1] + 1,
                    rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
                if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                    rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
                }
            }
        }
        return rows[a.length][b.length];
    }

    // Même mot, une fois les pluriels et lettres inversées ou oubliées tolérés.
    function sameWords(a, b) {
        if (a === b) return true;
        var squashedA = a.replace(/ /g, ""), squashedB = b.replace(/ /g, "");
        if (squashedA === squashedB) return true;
        if (squashedA + "s" === squashedB || squashedB + "s" === squashedA) return true;
        var tolerance = Math.min(squashedA.length, squashedB.length) >= 8 ? 2 : 1;
        if (Math.min(squashedA.length, squashedB.length) < 6) return false;
        return distance(squashedA, squashedB) <= tolerance;
    }

    // Entrée connue qui correspond à ce nom (faute de frappe, accent, pluriel,
    // espace à la place du tiret), ou null si aucune ne ressemble assez.
    function findMatch(nom) {
        var wanted = normalize(nom);
        if (!wanted) return null;
        for (var i = 0; i < ENTRIES.length; i++) {
            if (sameWords(wanted, normalize(ENTRIES[i].nom))) return ENTRIES[i];
        }
        return null;
    }

    // Nom à retenir pour l'export : celui de la base si le nom saisi n'en est
    // qu'une variante, sinon le nom saisi tel quel. Évite de lire "Mirco onde"
    // et "Micro-ondes" comme deux appareils.
    function canonicalName(nom) {
        var match = findMatch(nom);
        return match ? match.nom : String(nom || "").trim();
    }

    // Renvoie jusqu'à 6 entrées dont le nom contient la requête (sans tenir
    // compte de la casse ni des accents), ou qui ressemblent à une faute de frappe près.
    function search(query) {
        var q = normalize(query);
        if (q.length < 2) return [];
        var contained = ENTRIES.filter(function (e) {
            return normalize(e.nom).indexOf(q) !== -1;
        });
        var close = ENTRIES.filter(function (e) {
            return contained.indexOf(e) === -1 && sameWords(q, normalize(e.nom));
        });
        return contained.concat(close).slice(0, 6);
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

        // Quand on quitte le champ avec un nom qui n'est qu'une variante d'un
        // nom connu ("Mirco onde"), il est remplacé par le nom connu avant
        // l'ajout : l'équipement est enregistré sous son vrai nom.
        inputEl.addEventListener("blur", function () {
            var typed = inputEl.value.trim();
            if (typed) inputEl.value = canonicalName(typed);
        });

    }

    return {
        ENTRIES: ENTRIES,
        findMatch: findMatch,
        canonicalName: canonicalName,
        search: search,
        wireAutocomplete: wireAutocomplete
    };

})();
