/* ============================================================
   ViZion — Calcul de progression par fiche et par module
   ============================================================
   Règle : ne comptent que les champs qui démarrent VIDES
   et nécessitent une saisie active de l'utilisateur.
   Les selects pré-remplis et les toggles Oui/Non ne comptent
   pas comme points autonomes.
   Les champs conditionnels (dans un toggle = oui) comptent
   uniquement quand le toggle est actif.
============================================================ */

function pct(filled, total) {
    if (total === 0) return 100;
    return Math.round((filled / total) * 100);
}

function has(val) {
    if (val === undefined || val === null || val === "") return false;
    if (typeof val === "number") return val > 0;
    if (typeof val === "string") return val.trim() !== "";
    return true;
}

/* ============================================================
   HÉBERGEMENT — Champs actifs :
   1. nom
   2. nbEtages > 0
   3. nbHebergements > 0
   4. nbChambres > 0
   5. capacite > 0
   6. au moins 1 paroi
   7. au moins 1 ouvrant
   8. au moins 1 protection solaire
   9. au moins 1 équipement coché
   10. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si ecs renseigné : nbDouches ou autre champ numérique
============================================================ */

function calcHebergementProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 10;

    if (has(d.nom)) filled++;
    if (d.nbEtages > 0) filled++;
    if (d.nbHebergements > 0) filled++;
    if (d.nbChambres > 0) filled++;
    if (d.capacite > 0) filled++;
    if (d.parois && d.parois.length > 0) filled++;
    if (d.ouvrants && d.ouvrants.length > 0) filled++;
    if (d.protectionsSolaires && d.protectionsSolaires.length > 0) filled++;
    if (d.equipements && d.equipements.length > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    // Conditionnels brasseur d'air
    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    // Conditionnels climatisation
    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   PISCINE — Champs actifs :
   1. nom
   2. volumeTotal > 0
   3. au moins 1 pompe
   + si chauffée=oui : temperatureConsigne > 0 (1)
============================================================ */

function calcPiscineProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 3;

    if (has(d.nom)) filled++;
    if (d.volumeTotal > 0) filled++;
    if (d.pompes && d.pompes.length > 0) filled++;

    // Conditionnels chauffage
    if (d.chauffee === "oui") {
        total += 1;
        if (d.temperatureConsigne > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   SPA — Champs actifs :
   1. nom
   2. surface > 0
   3. nbDouches > 0
   4. au moins 1 bain à remous
   5. au moins 1 hammam
   6. au moins 1 sauna
   7. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
============================================================ */

function calcSpaProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 7;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.nbDouches > 0) filled++;
    if (d.bainsRemous && d.bainsRemous.length > 0) filled++;
    if (d.hammams && d.hammams.length > 0) filled++;
    if (d.saunas && d.saunas.length > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   RESTAURANT — Champs actifs :
   1. nom
   2. surface > 0
   3. couverts > 0
   4. placesAssises > 0
   5. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si petit-déj=oui : début renseigné (1), fin renseignée (1)
   + si déjeuner=oui : début (1), fin (1)
   + si dîner=oui : début (1), fin (1)
============================================================ */

function calcRestaurantProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 5;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.couverts > 0) filled++;
    if (d.placesAssises > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    // Repas conditionnels
    if (d.repas) {
        if (d.repas.petitDejeuner && d.repas.petitDejeuner.servi === "oui") {
            total += 2;
            if (has(d.repas.petitDejeuner.debut)) filled++;
            if (has(d.repas.petitDejeuner.fin)) filled++;
        }
        if (d.repas.dejeuner && d.repas.dejeuner.servi === "oui") {
            total += 2;
            if (has(d.repas.dejeuner.debut)) filled++;
            if (has(d.repas.dejeuner.fin)) filled++;
        }
        if (d.repas.diner && d.repas.diner.servi === "oui") {
            total += 2;
            if (has(d.repas.diner.debut)) filled++;
            if (has(d.repas.diner.fin)) filled++;
        }
    }

    return pct(filled, total);
}

/* ============================================================
   BAR — Champs actifs :
   1. nom
   2. surface > 0
   3. placesAssises > 0
   4. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si vitrines=oui : nombre (1)
   + si glaçons=oui : nombre (1)
   + si cave=oui : nombre (1)
   + si café=oui : nombre (1)
   + si écrans=oui : nombre (1)
============================================================ */

function calcBarProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 4;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.placesAssises > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    if (d.vitrinesRefrigerees && d.vitrinesRefrigerees.presente === "oui") {
        total += 1;
        if (d.vitrinesRefrigerees.nombre > 0) filled++;
    }

    if (d.machineGlacons && d.machineGlacons.presente === "oui") {
        total += 1;
        if (d.machineGlacons.nombre > 0) filled++;
    }

    if (d.caveVin && d.caveVin.presente === "oui") {
        total += 1;
        if (d.caveVin.nombre > 0) filled++;
    }

    if (d.machineCafe && d.machineCafe.presente === "oui") {
        total += 1;
        if (d.machineCafe.nombre > 0) filled++;
    }

    if (d.ecrans && d.ecrans.present === "oui") {
        total += 1;
        if (d.ecrans.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   BUANDERIE — Champs actifs :
   1. nom
   2. surface > 0
   3. laveLinge.nombre > 0
   4. laveLinge.capaciteKg > 0
   5. secheLinge.nombre > 0
   6. secheLinge.capaciteKg > 0
   7. cyclesLaveLinge > 0
   8. cyclesSecheLinge > 0
   9. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si calandre=oui : puissance > 0 (1)
============================================================ */

function calcBuanderieProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 9;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.laveLinge && d.laveLinge.nombre > 0) filled++;
    if (d.laveLinge && d.laveLinge.capaciteKg > 0) filled++;
    if (d.secheLinge && d.secheLinge.nombre > 0) filled++;
    if (d.secheLinge && d.secheLinge.capaciteKg > 0) filled++;
    if (d.cyclesLaveLinge > 0) filled++;
    if (d.cyclesSecheLinge > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    if (d.calandre && d.calandre.presente === "oui") {
        total += 1;
        if (d.calandre.puissance > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   CUISINE — Champs actifs :
   1. nom
   2. surface > 0
   3. couvertsJour > 0
   4. au moins 1 équipement coché
   5. nbHottes > 0
   6. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
============================================================ */

function calcCuisineProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 6;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.couvertsJour > 0) filled++;
    if ((d.equipements && Object.keys(d.equipements).length > 0) || (d.equipementsPersonnalises && d.equipementsPersonnalises.length > 0)) filled++;
    if (d.nbHottes > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   BUREAUX — Champs actifs :
   1. nom
   2. surface > 0
   3. nbPostes > 0
   4. nbEcrans > 0
   5. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si salleServeur=oui : puissance > 0 (1)
============================================================ */

function calcBureauxProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 5;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.nbPostes > 0) filled++;
    if (d.nbEcrans > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    if (d.salleServeur && d.salleServeur.presente) {
        total += 1;
        if (d.salleServeur.puissance > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   PARKING — Champs actifs :
   1. nom
   2. surface > 0
   3. nbPlaces > 0
   4. au moins 1 éclairage
   + si ventilation=oui : puissance > 0 (1)
   + si bornesVE=oui : nombre > 0 (1)
============================================================ */

function calcParkingProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 4;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.nbPlaces > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.ventilation && d.ventilation.presente) {
        total += 1;
        if (d.ventilation.puissance > 0) filled++;
    }

    if (d.bornesVE && d.bornesVE.presentes) {
        total += 1;
        if (d.bornesVE.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   SALLE DE SPORT — Champs actifs :
   1. nom
   2. surface > 0
   3. au moins 1 équipement coché
   4. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si écrans=oui : nombre (1)
   + si vestiaires=oui : nbDouches (1)
============================================================ */

function calcSportProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 4;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if ((d.equipements && Object.keys(d.equipements).length > 0) || (d.equipementsPersonnalises && d.equipementsPersonnalises.length > 0)) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    if (d.ecrans && d.ecrans.present) {
        total += 1;
        if (d.ecrans.nombre > 0) filled++;
    }

    if (d.vestiaires && d.vestiaires.present) {
        total += 1;
        if (d.vestiaires.nbDouches > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   SALLE DE RÉUNION — Champs actifs :
   1. nom
   2. surface > 0
   3. placesAssises > 0
   4. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
============================================================ */

/* ============================================================
   SALLE DE JEUX — Champs actifs :
   1. nom
   2. surface > 0
   3. au moins 1 équipement coché
   4. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
   + si écrans=oui : nombre (1)
============================================================ */

function calcJeuxProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 4;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if ((d.equipements && Object.keys(d.equipements).length > 0) || (d.equipementsPersonnalises && d.equipementsPersonnalises.length > 0)) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    if (d.ecrans && d.ecrans.present) {
        total += 1;
        if (d.ecrans.nombre > 0) filled++;
    }

    return pct(filled, total);
}

function calcReunionProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 4;

    if (has(d.nom)) filled++;
    if (d.surface > 0) filled++;
    if (d.placesAssises > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   SECTEUR PERSONNALISÉ — Champs actifs :
   1. nom
   2. observation
   3. au moins 1 équipement
   4. au moins 1 éclairage
   + si brasseur=oui : nombre (1)
   + si clim=oui : nombre (1)
============================================================ */

function calcCustomProgress(d) {
    if (!d) return 0;
    var filled = 0;
    var total = 4;

    if (has(d.nom)) filled++;
    if (has(d.observation)) filled++;
    if (d.equipements && d.equipements.length > 0) filled++;
    if (d.eclairages && d.eclairages.length > 0) filled++;

    if (d.brasseurAir && d.brasseurAir.present === "oui") {
        total += 1;
        if (d.brasseurAir.nombre > 0) filled++;
    }

    if (d.climatisation && d.climatisation.present) {
        total += 1;
        if (d.climatisation.nombre > 0) filled++;
    }

    return pct(filled, total);
}

/* ============================================================
   CALCUL PAR MODULE (moyenne de toutes les fiches)
============================================================ */

var progressCalculators = {
    hebergements: { key: SECTEUR_DATA_KEYS.hebergements, calc: calcHebergementProgress },
    piscines:     { key: SECTEUR_DATA_KEYS.piscines,     calc: calcPiscineProgress },
    spa:          { key: SECTEUR_DATA_KEYS.spa,          calc: calcSpaProgress },
    restaurant:   { key: SECTEUR_DATA_KEYS.restaurant,   calc: calcRestaurantProgress },
    bar:          { key: SECTEUR_DATA_KEYS.bar,          calc: calcBarProgress },
    buanderie:    { key: SECTEUR_DATA_KEYS.buanderie,    calc: calcBuanderieProgress },
    cuisine:      { key: SECTEUR_DATA_KEYS.cuisine,      calc: calcCuisineProgress },
    bureaux:      { key: SECTEUR_DATA_KEYS.bureaux,      calc: calcBureauxProgress },
    parking:      { key: SECTEUR_DATA_KEYS.parking,      calc: calcParkingProgress },
    sport:        { key: SECTEUR_DATA_KEYS.sport,        calc: calcSportProgress },
    reunion:      { key: SECTEUR_DATA_KEYS.reunion,      calc: calcReunionProgress },
    jeux:         { key: SECTEUR_DATA_KEYS.jeux,         calc: calcJeuxProgress }
};

// Moyenne de progression sur toutes les localisations existantes d'un secteur
// (plus de quantité fixe : chaque localisation est ajoutée librement par l'utilisateur).
function calcModuleProgress(moduleId) {

    if (isCustomSecteurId(moduleId)) {
        var allCustom = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
        var customData = allCustom[moduleId] || {};
        var customNumeros = Object.keys(customData);
        if (!customNumeros.length) return 0;
        var customTotalPct = 0;
        customNumeros.forEach(function (numero) {
            customTotalPct += calcCustomProgress(customData[numero]);
        });
        return Math.round(customTotalPct / customNumeros.length);
    }

    var config = progressCalculators[moduleId];
    if (!config) return 0;

    var data = JSON.parse(localStorage.getItem(config.key)) || {};
    var numeros = Object.keys(data);
    if (!numeros.length) return 0;

    var totalPct = 0;
    numeros.forEach(function (numero) {
        totalPct += config.calc(data[numero]);
    });

    return Math.round(totalPct / numeros.length);
}

function calcItemProgress(moduleId, itemData) {
    if (isCustomSecteurId(moduleId)) return calcCustomProgress(itemData);
    var config = progressCalculators[moduleId];
    if (!config) return 0;
    return config.calc(itemData);
}
