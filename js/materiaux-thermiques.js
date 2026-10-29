/* ============================================================
   ViZion — Bibliothèque de matériaux et calcul thermique
   À partir du seul couple matériau / épaisseur déjà relevé sur la fiche
   hébergement, donne pour chaque couche la conductivité thermique (λ), la
   masse volumique et la chaleur spécifique, puis calcule pour la paroi :
   la résistance thermique Rth, le coefficient de transmission U et le
   facteur solaire S des parois opaques (S = 0,04 × α × U).

   Les valeurs sont des valeurs conventionnelles courantes (type EN ISO 10456),
   utiles pour pré-remplir le rapport : elles ne remplacent pas une fiche
   produit. "Autre" et les matériaux inconnus restent sans valeur : le calcul
   le dit (complet = false) au lieu d'inventer un résultat.
   Aucune exigence ni conformité PERENE n'est calculée ici.
============================================================ */

window.MateriauxThermiques = (function () {

    // lambda en W/(m·K), masseVolumique en kg/m³, chaleurSpecifique en J/(kg·K).
    var MATERIAUX = [
        { nom: "Béton",           lambda: 2.0,   masseVolumique: 2400, chaleurSpecifique: 1000 },
        { nom: "Parpaing",        lambda: 1.0,   masseVolumique: 1200, chaleurSpecifique: 1000 },
        { nom: "Brique",          lambda: 0.5,   masseVolumique: 1000, chaleurSpecifique: 1000 },
        { nom: "Tôle",            lambda: 50,    masseVolumique: 7800, chaleurSpecifique: 450 },
        { nom: "Laine de verre",  lambda: 0.040, masseVolumique: 20,   chaleurSpecifique: 1030 },
        { nom: "Laine de roche",  lambda: 0.040, masseVolumique: 40,   chaleurSpecifique: 1030 },
        { nom: "Polystyrène",     lambda: 0.038, masseVolumique: 20,   chaleurSpecifique: 1450 },
        { nom: "BA13",            lambda: 0.25,  masseVolumique: 900,  chaleurSpecifique: 1000 },
        { nom: "Bois",            lambda: 0.13,  masseVolumique: 500,  chaleurSpecifique: 1600 },
        // Toitures
        { nom: "Bardeau",         lambda: 0.13,  masseVolumique: 500,  chaleurSpecifique: 1600 },
        { nom: "Tuile",           lambda: 1.0,   masseVolumique: 2000, chaleurSpecifique: 800 },
        { nom: "Dalle béton",     lambda: 2.0,   masseVolumique: 2400, chaleurSpecifique: 1000 },
        // Panneau sandwich : λ équivalent sur toute l'épaisseur (âme isolante).
        { nom: "Tôle isolée",     lambda: 0.030, masseVolumique: 40,   chaleurSpecifique: 1400 }
    ];

    // Coefficient d'absorption du rayonnement solaire selon la couleur extérieure.
    var COULEURS = [
        { nom: "Blanc / très clair", absorption: 0.3 },
        { nom: "Clair",              absorption: 0.4 },
        { nom: "Moyen",              absorption: 0.6 },
        { nom: "Foncé",              absorption: 0.8 },
        { nom: "Noir / très foncé",  absorption: 0.9 }
    ];

    // Résistances superficielles intérieure + extérieure (m²·K/W) selon le sens du flux.
    var RESISTANCES_SUPERFICIELLES = {
        verticale: 0.13 + 0.04,
        toiture: 0.10 + 0.04,       // flux ascendant
        planchersHaut: 0.10 + 0.04,
        planchersBas: 0.17 + 0.04   // flux descendant
    };

    function normaliser(texte) {
        return String(texte || "").toLowerCase()
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, " ").trim();
    }

    function trouverMateriau(nom) {
        var voulu = normaliser(nom);
        if (!voulu) return null;
        for (var i = 0; i < MATERIAUX.length; i++) {
            if (normaliser(MATERIAUX[i].nom) === voulu) return MATERIAUX[i];
        }
        return null;
    }

    function trouverCouleur(nom) {
        for (var i = 0; i < COULEURS.length; i++) {
            if (COULEURS[i].nom === nom) return COULEURS[i];
        }
        return null;
    }

    function arrondir(valeur, decimales) {
        var f = Math.pow(10, decimales);
        return Math.round(valeur * f) / f;
    }

    // couches = [{ materiau, epaisseur (cm) }] de l'extérieur vers l'intérieur ou
    // l'inverse : l'ordre n'a pas d'effet sur Rth ni U.
    // type = "verticale" | "toiture" | "plancher haut" | "plancher bas".
    function calculerParoi(couches, type, couleurNom) {
        var rs = RESISTANCES_SUPERFICIELLES.verticale;
        if (type === "toiture" || type === "plancher haut") rs = RESISTANCES_SUPERFICIELLES.toiture;
        if (type === "plancher bas") rs = RESISTANCES_SUPERFICIELLES.planchersBas;

        var complet = couches.length > 0;
        var rth = 0;
        var detail = couches.map(function (couche) {
            var materiau = trouverMateriau(couche.materiau);
            var epaisseurCm = parseFloat(couche.epaisseur);
            var valide = !!materiau && !isNaN(epaisseurCm) && epaisseurCm > 0;
            if (valide) {
                rth += (epaisseurCm / 100) / materiau.lambda;
            } else {
                complet = false;
            }
            return {
                materiau: couche.materiau,
                epaisseurCm: isNaN(epaisseurCm) ? null : epaisseurCm,
                lambda: materiau ? materiau.lambda : null,
                masseVolumique: materiau ? materiau.masseVolumique : null,
                chaleurSpecifique: materiau ? materiau.chaleurSpecifique : null,
                dansLaBibliotheque: !!materiau
            };
        });

        var couleur = trouverCouleur(couleurNom);
        var resultat = {
            type: type,
            couches: detail,
            couleurExterieure: couleurNom || null,
            absorption: couleur ? couleur.absorption : null,
            rth: null,
            u: null,
            facteurSolaire: null,
            complet: complet
        };
        if (complet) {
            resultat.rth = arrondir(rth, 3);
            resultat.u = arrondir(1 / (rth + rs), 3);
            if (couleur) resultat.facteurSolaire = arrondir(0.04 * couleur.absorption * resultat.u, 4);
        }
        return resultat;
    }

    return {
        MATERIAUX: MATERIAUX,
        COULEURS: COULEURS,
        trouverMateriau: trouverMateriau,
        calculerParoi: calculerParoi
    };

})();
