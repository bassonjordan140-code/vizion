/* ============================================================
   ViZion — Lots de travaux & mapping vers le format Rapport.xlsx
   Nomenclature fixe (onglet "Lots de travaux") + une fonction
   d'extraction par module qui transforme une fiche en lignes
   pour l'onglet "Observations".

   Certains mappings sont approximatifs faute de sous-type
   collecté par ViZion (ex: climatisation générique -> 1-2 par
   défaut). Ils sont marqués "// TODO lot à confirmer" — à
   affiner avec Jordan colonne par colonne (Phase 2).
============================================================ */

window.LotMapping = (function () {

    /* =========================
       NOMENCLATURE FIXE
       (identique à l'onglet "Lots de travaux" du fichier type)
    ========================= */

    var LOTS = [
        { code: "1-1",  nom: "Climatisation GEG" },
        { code: "1-2",  nom: "Climatisation split system" },
        { code: "1-3",  nom: "Climatisation VRV" },
        { code: "1-4",  nom: "Climatisation VC" },
        { code: "1-5",  nom: "Climatisation pompe" },
        { code: "1-6",  nom: "Climatisation air neuf" },
        { code: "2-1",  nom: "ECS électrique" },
        { code: "2-2",  nom: "ECS fuel" },
        { code: "2-3",  nom: "ECS gaz" },
        { code: "2-4",  nom: "ECS solaire" },
        { code: "2-5",  nom: "ECS pompe" },
        { code: "3-1",  nom: "Cuisine cuisson électrique" },
        { code: "3-2",  nom: "Cuisine cuisson gaz" },
        { code: "3-3",  nom: "Cuisine lavage" },
        { code: "3-4",  nom: "Cuisine chambre froide" },
        { code: "3-5",  nom: "Cuisine froid" },
        { code: "3-6",  nom: "Cuisine extraction" },
        { code: "3-7",  nom: "Cuisine électrique" },
        { code: "4-1",  nom: "Pompe" },
        { code: "5-1",  nom: "Ventilateur" },
        { code: "5-2",  nom: "Brasseur d'air" },
        { code: "5-3",  nom: "VMC" },
        { code: "6-1",  nom: "Eclairage LED" },
        { code: "6-2",  nom: "Eclairage fluorescent" },
        { code: "6-3",  nom: "Eclairage fluocompact" },
        { code: "6-4",  nom: "Eclairage halogène" },
        { code: "6-5",  nom: "Eclairage incandescent" },
        { code: "6-6",  nom: "Eclairage SHP" },
        { code: "7-1",  nom: "Forces motrices" },
        { code: "8-1",  nom: "Prises de courant" },
        { code: "8-2",  nom: "Prises de courant permanentes" },
        { code: "9-1",  nom: "Autres" },
        { code: "10-1", nom: "Chauffage split réversible" },
        { code: "10-2", nom: "Chauffage DRV" },
        { code: "10-3", nom: "Radiateur électrique" },
        { code: "10-4", nom: "Plancher chauffant" },
        { code: "10-5", nom: "Pompe à chaleur" },
        { code: "11-1", nom: "Photovoltaïque" },
        { code: "12-1", nom: "Thermique toiture" },
        { code: "12-2", nom: "Thermique paroi" },
        { code: "12-3", nom: "Thermique baie" },
        { code: "13",   nom: "Ventilation" }
    ];

    function lotNom(code) {
        for (var i = 0; i < LOTS.length; i++) {
            if (LOTS[i].code === code) return LOTS[i].nom;
        }
        return "";
    }

    /* =========================
       HELPERS DE LIGNE
    ========================= */

    function makeRow(opts) {
        return {
            localisation: opts.localisation || "",
            secteur: opts.secteur || "",
            puissance: (opts.puissance === undefined || opts.puissance === null || opts.puissance === "") ? null : opts.puissance,
            nombre: (opts.nombre === undefined || opts.nombre === null || opts.nombre === "") ? null : opts.nombre,
            description: opts.description || "",
            lot: opts.lot || "",
            lotNom: opts.lot ? lotNom(opts.lot) : "",
            formulaireOrigine: opts.formulaireOrigine || "",
            nomFormulaire: opts.nomFormulaire || ""
        };
    }

    // Éclairage : type d'ampoule -> code lot
    var ECLAIRAGE_LOT = {
        "LED": "6-1",
        "Tube fluorescent": "6-2",
        "Fluocompacte": "6-3",
        "Halogène": "6-4",
        "Incandescence": "6-5",
        "Sodium haute pression": "6-6"
        // "Iodure métallique" (parking uniquement) -> pas d'équivalent, défaut 9-1
    };

    function addEclairageRows(rows, eclairages, ctx) {
        if (!eclairages || !eclairages.length) return;
        eclairages.forEach(function (e) {
            var code = ECLAIRAGE_LOT[e.type] || "9-1"; // TODO lot à confirmer pour types hors liste (ex: Iodure métallique)
            rows.push(makeRow({
                localisation: ctx.localisation,
                secteur: ctx.secteur,
                puissance: e.puissance,
                nombre: e.quantite,
                description: "Éclairage " + (e.type || ""),
                lot: code,
                formulaireOrigine: ctx.formulaireOrigine,
                nomFormulaire: ctx.nomFormulaire
            }));
        });
    }

    // Climatisation générique ViZion (present/nombre/etat/plaque) : pas de
    // sous-type GEG/split/VRV/VC/pompe/air neuf collecté -> défaut split system.
    function addClimatisationRow(rows, clim, ctx) {
        if (!clim) return;
        var present = clim.present === true || clim.present === "oui";
        if (!present) return;
        rows.push(makeRow({
            localisation: ctx.localisation,
            secteur: ctx.secteur,
            nombre: clim.nombre,
            description: "Climatisation" + (clim.etat ? " (état : " + clim.etat + ")" : ""),
            lot: "1-2", // TODO lot à confirmer — sous-type de climatisation non collecté par ViZion
            formulaireOrigine: ctx.formulaireOrigine,
            nomFormulaire: ctx.nomFormulaire
        }));
    }

    function addBrasseurRow(rows, brasseur, ctx) {
        if (!brasseur) return;
        var present = brasseur.present === "oui" || brasseur.present === true;
        if (!present) return;
        rows.push(makeRow({
            localisation: ctx.localisation,
            secteur: ctx.secteur,
            nombre: brasseur.nombre,
            description: "Brasseur d'air",
            lot: "5-2",
            formulaireOrigine: ctx.formulaireOrigine,
            nomFormulaire: ctx.nomFormulaire
        }));
    }

    // Équipements ajoutés librement par l'utilisateur hors liste fixe d'un secteur
    // (cuisine, salle de jeux, salle de sport, bureaux) — pas de sous-type connu.
    function addCustomEquipementsRows(rows, equipementsPersonnalises, ctx) {
        (equipementsPersonnalises || []).forEach(function (eq) {
            rows.push(makeRow({
                localisation: ctx.localisation, secteur: ctx.secteur,
                nombre: eq.nombre, description: eq.nom, lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });
    }

    function addObservationRow(rows, texte, ctx) {
        if (!texte || !texte.trim()) return;
        rows.push(makeRow({
            localisation: ctx.localisation,
            secteur: ctx.secteur,
            description: "Observation : " + texte.trim(),
            lot: "",
            formulaireOrigine: ctx.formulaireOrigine,
            nomFormulaire: ctx.nomFormulaire
        }));
    }

    function makeCtx(localisation, secteur, moduleId, numero) {
        return {
            localisation: localisation,
            secteur: secteur,
            formulaireOrigine: moduleId,
            nomFormulaire: secteur + " #" + numero
        };
    }

    /* =========================
       1. HÉBERGEMENT
    ========================= */

    var ORIENTATION_LABELS = {
        "nord": "Nord", "nord-est": "Nord-Est", "est": "Est", "sud-est": "Sud-Est",
        "sud": "Sud", "sud-ouest": "Sud-Ouest", "ouest": "Ouest", "nord-ouest": "Nord-Ouest"
    };

    // Équipements de la fiche hébergement (checklist bloc 7) -> lot.
    var HEBERGEMENT_EQUIP_LOT = {
        "Télé": "9-1",
        "Minibar": "9-1",
        "Frigo": "9-1",
        "Machine café": "9-1",
        "Sèche-cheveux": "9-1",
        "Téléphone": "9-1",
        "Cave vin": "9-1",
        "Machine glaçons": "9-1",
        "Bain remous": "9-1",
        "Brasseur air": "5-2",
        "Bouilloire": "9-1",
        "Plaques cuisson": "3-1",
        "Micro-ondes": "3-7"
    };

    function extractHebergementRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || (fiche.type ? fiche.type + " " + numero : "Hébergement " + numero);
        var ctx = makeCtx(localisation, "Hébergements", "hebergements", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);

        if (fiche.ecs && fiche.ecs.present) {
            var ecsLot = { "Électrique": "2-1", "Solaire": "2-4", "Thermodynamique": "2-5", "Gaz": "2-3" }[fiche.ecs.energie] || "9-1";
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                description: "ECS " + (fiche.ecs.distribution || "") + (fiche.ecs.energie ? " (" + fiche.ecs.energie + ")" : ""),
                lot: ecsLot, formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        (fiche.equipements || []).forEach(function (eq) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                nombre: eq.nombre,
                description: eq.nom,
                lot: HEBERGEMENT_EQUIP_LOT[eq.nom] || "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        if (fiche.piscinePrivee && fiche.piscinePrivee.present && fiche.piscinePrivee.eclairage) {
            var pLot = { "LED": "6-1", "Halogène": "6-4" }[fiche.piscinePrivee.eclairageType] || "9-1";
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                nombre: fiche.piscinePrivee.eclairageNombre,
                description: "Éclairage piscine privée (" + (fiche.piscinePrivee.eclairageType || "") + ")",
                lot: pLot, formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);

        (fiche.parois || []).forEach(function (p) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                nombre: p.epaisseur, // épaisseur en cm (pas une quantité, colonne réutilisée)
                description: "Paroi " + p.materiau + " — épaisseur " + p.epaisseur + " cm",
                lot: "12-2", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        Object.keys(fiche.ouvrants || {}).forEach(function (orientation) {
            (fiche.ouvrants[orientation] || []).forEach(function (o) {
                rows.push(makeRow({
                    localisation: localisation, secteur: ctx.secteur,
                    nombre: o.nombre,
                    description: o.type + " (façade " + (ORIENTATION_LABELS[orientation] || orientation) + ")",
                    lot: "12-3", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
                }));
            });
        });

        if (fiche.protectionsSolaires && fiche.protectionsSolaires.present) {
            (fiche.protectionsSolaires.items || []).forEach(function (p) {
                rows.push(makeRow({
                    localisation: localisation, secteur: ctx.secteur,
                    description: p.type + " (façade " + (ORIENTATION_LABELS[p.facade] || p.facade) + ")",
                    lot: "9-1", // TODO lot à confirmer — pas de code "protection solaire" dédié
                    formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
                }));
            });
        }

        addObservationRow(rows, fiche.commentaire, ctx);

        return rows;
    }

    /* =========================
       2. PISCINE
    ========================= */

    var PISCINE_CHAUFFE_LOT = {
        "Pompe à chaleur": "10-5",
        "Échangeur chaudière": "9-1", // TODO lot à confirmer (fuel/gaz selon chaudière)
        "Solaire thermique": "2-4",
        "Électrique direct": "10-3",
        "Récupération de chaleur": "9-1"
    };

    function extractPiscineRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Piscine " + numero;
        var ctx = makeCtx(localisation, "Piscines", "piscines", numero);

        (fiche.pompes || []).forEach(function (p) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: p.puissance, nombre: 1,
                description: "Pompe de filtration (" + (p.duree || "?") + " h/jour)",
                lot: "4-1", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        if (fiche.chauffee === "oui" && fiche.typeChauffe) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Chauffage piscine (" + fiche.typeChauffe + ", consigne " + (fiche.temperatureConsigne || "?") + "°C)",
                lot: PISCINE_CHAUFFE_LOT[fiche.typeChauffe] || "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       3. RESTAURANT
    ========================= */

    function extractRestaurantRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Restaurant " + numero;
        var ctx = makeCtx(localisation, "Restaurant", "restaurant", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);
        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       4. BAR
    ========================= */

    function extractBarRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Bar " + numero;
        var ctx = makeCtx(localisation, "Bar", "bar", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);

        function ouiNon(obj) { return obj && (obj.presente === "oui" || obj.presente === true); }

        if (ouiNon(fiche.vitrinesRefrigerees)) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.vitrinesRefrigerees.nombre,
                description: "Vitrine réfrigérée", lot: "3-5",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.tireuse && (fiche.tireuse.presente === "oui" || fiche.tireuse.presente === true)) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Pompe à bière / tireuse", lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (ouiNon(fiche.machineGlacons)) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.machineGlacons.nombre,
                description: "Machine à glaçons", lot: "3-5",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (ouiNon(fiche.caveVin)) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.caveVin.nombre,
                description: "Cave à vin / cellier", lot: "3-5",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (ouiNon(fiche.machineCafe)) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.machineCafe.nombre,
                description: "Machine à café pro", lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);

        if (fiche.ecrans && (fiche.ecrans.present === "oui" || fiche.ecrans.present === true)) {
            var permanents = fiche.ecrans.permanents === "oui" || fiche.ecrans.permanents === true;
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.ecrans.nombre,
                description: "Écrans / TV" + (permanents ? " (allumés en permanence)" : ""),
                lot: permanents ? "8-2" : "8-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       5. SPA
    ========================= */

    var SPA_CHAUFFE_GLOBAL_LOT = {
        "Électrique": "10-3", "Gaz": "2-3", "Thermodynamique": "10-5",
        "Récupération hôtel": "9-1"
    };
    var SPA_HAMMAM_LOT = { "Électrique": "2-1", "Gaz": "2-3" };
    var SPA_SAUNA_LOT = { "Électrique": "10-3" };

    function extractSpaRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Spa " + numero;
        var ctx = makeCtx(localisation, "Spa", "spa", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);

        if (fiche.ecsDistribution === "Dédiée au spa") {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.nbDouches,
                description: "ECS dédiée spa", lot: "9-1", // TODO lot à confirmer — énergie ECS spa non collectée
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        if (fiche.typeChauffeGlobal) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Chauffage global spa (" + fiche.typeChauffeGlobal + ")",
                lot: SPA_CHAUFFE_GLOBAL_LOT[fiche.typeChauffeGlobal] || "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        (fiche.bainsRemous || []).forEach(function (b) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Bain à remous (" + (b.volume || "?") + " m³, consigne " + (b.temperatureConsigne || "?") + "°C)",
                lot: "9-1", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
            (b.pompes || []).forEach(function (p) {
                rows.push(makeRow({
                    localisation: localisation, secteur: ctx.secteur,
                    puissance: p.puissance, nombre: 1,
                    description: "Pompe bain à remous (" + (p.duree || "?") + " h/jour)",
                    lot: "4-1", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
                }));
            });
        });

        (fiche.hammams || []).forEach(function (h) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Hammam (consigne " + (h.temperatureConsigne || "?") + "°C, " + (h.typeGenerateur || "?") + ")",
                lot: SPA_HAMMAM_LOT[h.typeGenerateur] || "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        (fiche.saunas || []).forEach(function (s) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Sauna (consigne " + (s.temperatureConsigne || "?") + "°C, " + (s.type || "?") + ")",
                lot: SPA_SAUNA_LOT[s.type] || "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        if (fiche.nbSallesMassage) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.nbSallesMassage,
                description: "Salles de massage", lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       6. BUANDERIE
    ========================= */

    var SECHE_LINGE_LOT = {
        "Résistance électrique": "3-1", "Pompe à chaleur": "10-5", "Gaz": "3-2"
    };

    function extractBuanderieRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Buanderie " + numero;
        var ctx = makeCtx(localisation, "Buanderie", "buanderie", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);

        if (fiche.laveLinge && fiche.laveLinge.nombre) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.laveLinge.nombre,
                description: "Lave-linge (" + (fiche.laveLinge.capaciteKg || "?") + " kg)",
                lot: "3-3", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.secheLinge && fiche.secheLinge.nombre) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.secheLinge.nombre,
                description: "Sèche-linge (" + (fiche.secheLinge.capaciteKg || "?") + " kg, " + (fiche.secheLinge.typeEnergie || "?") + ")",
                lot: SECHE_LINGE_LOT[fiche.secheLinge.typeEnergie] || "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.calandre && (fiche.calandre.presente === "oui" || fiche.calandre.presente === true)) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: fiche.calandre.puissance, nombre: 1,
                description: "Calandre / repasseuse", lot: "7-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       7. CUISINE
    ========================= */

    // id équipement -> { label, lot (ou fonction(eq)->lot) }
    var CUISINE_EQUIP = {
        pianoGaz:        { label: "Piano de cuisson gaz", lot: "3-2" },
        pianoElec:       { label: "Piano de cuisson électrique", lot: "3-1" },
        pianoInduction:  { label: "Piano de cuisson induction", lot: "3-1" },
        plaqueVitro:     { label: "Plaque vitrocéramique", lot: "3-1" },
        wok:             { label: "Wok", lot: "3-1" }, // TODO lot à confirmer (gaz ou élec non précisé)
        grillPlancha:    { label: "Grill / Plancha", lot: "3-1" }, // TODO lot à confirmer
        sauteuseBasc:    { label: "Sauteuse basculante", lot: "3-1" }, // TODO lot à confirmer
        marmite:         { label: "Marmite", lot: "3-1" }, // TODO lot à confirmer
        fourMixte:       { label: "Four mixte (convection + vapeur)", lot: "3-1" }, // TODO lot à confirmer
        fourConvection:  { label: "Four à convection", lot: "3-1" }, // TODO lot à confirmer
        fourPizza:       { label: "Four à pizza", lot: "3-1" }, // TODO lot à confirmer (souvent gaz)
        microOndes:      { label: "Micro-ondes professionnel", lot: "3-7" },
        cfPositive:      { label: "Chambre froide positive", lot: "3-4" },
        cfNegative:      { label: "Chambre froide négative", lot: "3-4" },
        armoireRefrig:   { label: "Armoire réfrigérée", lot: "3-5" }
    };

    function extractCuisineRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Cuisine " + numero;
        var ctx = makeCtx(localisation, "Cuisine", "cuisine", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);
        addCustomEquipementsRows(rows, fiche.equipementsPersonnalises, ctx);

        var equipements = fiche.equipements || {};

        Object.keys(CUISINE_EQUIP).forEach(function (id) {
            var eq = equipements[id];
            if (!eq || !eq.nombre) return;
            var def = CUISINE_EQUIP[id];
            var desc = def.label;
            if (eq.volume) desc += " (" + eq.volume + " m³)";
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: eq.puissance, nombre: eq.nombre,
                description: desc, lot: def.lot,
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        if (equipements.friteuse && equipements.friteuse.nombre) {
            var friteuseLot = { "Électrique": "3-1", "Gaz": "3-2" }[equipements.friteuse.energie] || "3-1";
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: equipements.friteuse.puissance, nombre: equipements.friteuse.nombre,
                description: "Friteuse (" + (equipements.friteuse.energie || "?") + ")",
                lot: friteuseLot, formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        if (equipements.laveVaisselle && equipements.laveVaisselle.nombre) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: equipements.laveVaisselle.nombre,
                description: "Lave-vaisselle (" + (equipements.laveVaisselle.typeLV || "?") + ")",
                lot: "3-3", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        if (fiche.nbHottes) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.nbHottes,
                description: "Hottes d'extraction (" + (fiche.typeVentilation || "?") + ")",
                lot: "3-6", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       8. SALLE DE JEUX
    ========================= */

    var JEUX_EQUIP_LABELS = {
        billard: "Billard", babyFoot: "Baby-foot", pingPong: "Table de ping-pong",
        flipper: "Flipper", arcades: "Bornes d'arcade", flechettes: "Fléchettes",
        consoleJeux: "Console de jeux vidéo", simulateur: "Simulateur (VR, racing…)",
        airHockey: "Air hockey", autre: "Autre équipement"
    };

    function extractJeuxRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Salle de jeux " + numero;
        var ctx = makeCtx(localisation, "Salle de jeux", "jeux", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);
        addCustomEquipementsRows(rows, fiche.equipementsPersonnalises, ctx);

        var equipements = fiche.equipements || {};
        Object.keys(JEUX_EQUIP_LABELS).forEach(function (id) {
            var eq = equipements[id];
            if (!eq || !eq.nombre) return;
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: eq.nombre,
                description: JEUX_EQUIP_LABELS[id], lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        var ecrans = fiche.ecrans;
        if (ecrans && (ecrans.present === true || ecrans.present === "oui")) {
            var permanents = ecrans.permanents === true || ecrans.permanents === "oui";
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: ecrans.nombre,
                description: "Écrans" + (permanents ? " (allumés en permanence)" : ""),
                lot: permanents ? "8-2" : "8-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       9. SALLE DE RÉUNION
    ========================= */

    function extractReunionRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Salle de réunion " + numero;
        var ctx = makeCtx(localisation, "Salle de réunion", "reunion", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);

        var av = fiche.audiovisuel || {};
        [
            { id: "videoprojecteur", label: "Vidéoprojecteur", lot: "8-1" },
            { id: "ecranPlat", label: "Écran plat / TV", lot: "8-1" }
        ].forEach(function (def) {
            var eq = av[def.id];
            if (!eq || !eq.nombre) return;
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: eq.nombre,
                description: def.label, lot: def.lot,
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });
        [
            { id: "visioconference", label: "Système de visioconférence" },
            { id: "sonorisation", label: "Sonorisation / micro" },
            { id: "tableauInteractif", label: "Tableau interactif / écran tactile" }
        ].forEach(function (def) {
            var eq = av[def.id];
            if (!eq) return;
            var present = eq === true || eq.present === true || eq.present === "oui";
            if (!present) return;
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: def.label, lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       10. SALLE DE SPORT
    ========================= */

    var SPORT_EQUIP = {
        tapisDesCourse: { label: "Tapis de course", lot: "7-1" },
        veloElliptique: { label: "Vélo elliptique", lot: "9-1" },
        veloStatique:   { label: "Vélo stationnaire", lot: "9-1" },
        rameur:         { label: "Rameur", lot: "9-1" },
        stepper:        { label: "Stepper / Escalier", lot: "9-1" },
        musculation:    { label: "Machines de musculation", lot: "9-1" },
        sauna:          { label: "Sauna", lot: "10-3" },
        hammam:         { label: "Hammam", lot: "2-1" },
        jacuzzi:        { label: "Jacuzzi", lot: "4-1" }
    };

    function extractSportRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Salle de sport " + numero;
        var ctx = makeCtx(localisation, "Salle de sport", "sport", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);
        addCustomEquipementsRows(rows, fiche.equipementsPersonnalises, ctx);

        var equipements = fiche.equipements || {};
        Object.keys(SPORT_EQUIP).forEach(function (id) {
            var eq = equipements[id];
            if (!eq || !eq.nombre) return;
            var def = SPORT_EQUIP[id];
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: eq.nombre,
                description: def.label, lot: def.lot,
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        var ecrans = fiche.ecrans;
        if (ecrans && (ecrans.present === true || ecrans.present === "oui")) {
            var permanents = ecrans.permanents === true || ecrans.permanents === "oui";
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: ecrans.nombre,
                description: "Écrans" + (permanents ? " (allumés en permanence)" : ""),
                lot: permanents ? "8-2" : "8-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.sono === true || fiche.sono === "oui") {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: 1,
                description: "Sonorisation", lot: "9-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.vestiaires && fiche.vestiaires.present && fiche.vestiaires.nbDouches) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.vestiaires.nbDouches,
                description: "Vestiaires — douches", lot: "9-1", // TODO lot à confirmer (ECS douches, énergie non collectée)
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       11. BUREAUX
    ========================= */

    var BUREAUX_EQUIP = {
        photocopieur:  { label: "Photocopieur / multifonction", lot: "8-1" },
        distributeur:  { label: "Distributeur de boissons", lot: "9-1" },
        fontaineEau:   { label: "Fontaine à eau", lot: "9-1" },
        machineCafe:   { label: "Machine à café", lot: "9-1" },
        microOndes:    { label: "Micro-ondes", lot: "3-7" },
        refrigerateur: { label: "Réfrigérateur", lot: "3-5" }
    };

    function extractBureauxRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Bureaux " + numero;
        var ctx = makeCtx(localisation, "Bureaux", "bureaux", numero);

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);
        addCustomEquipementsRows(rows, fiche.equipementsPersonnalises, ctx);

        if (fiche.nbEcrans) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.nbEcrans,
                description: "Écrans postes de travail", lot: "8-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.nbImprimantes) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: fiche.nbImprimantes,
                description: "Imprimantes", lot: "8-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        var equipPartages = fiche.equipPartages || {};
        Object.keys(BUREAUX_EQUIP).forEach(function (id) {
            var eq = equipPartages[id];
            if (!eq || !eq.nombre) return;
            var def = BUREAUX_EQUIP[id];
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur, nombre: eq.nombre,
                description: def.label, lot: def.lot,
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        });

        if (fiche.salleServeur && fiche.salleServeur.presente) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: fiche.salleServeur.puissance, nombre: 1,
                description: "Salle serveur (" + (fiche.salleServeur.surface || "?") + " m²)",
                lot: "7-1", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       12. PARKING
    ========================= */

    function extractParkingRows(fiche, numero) {
        var rows = [];
        var localisation = fiche.nom || "Parking " + numero;
        var ctx = makeCtx(localisation, "Parking", "parking", numero);

        addEclairageRows(rows, fiche.eclairages, ctx);

        if (fiche.ventilation && fiche.ventilation.presente) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: fiche.ventilation.puissance, nombre: 1,
                description: "Ventilation parking (" + (fiche.ventilation.mode || "?") + ")",
                lot: "13", formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }
        if (fiche.bornesVE && fiche.bornesVE.presentes) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                puissance: fiche.bornesVE.puissance, nombre: fiche.bornesVE.nombre,
                description: "Bornes de recharge VE", lot: "7-1",
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        addObservationRow(rows, fiche.observations, ctx);
        return rows;
    }

    /* =========================
       13. SECTEUR PERSONNALISÉ
       Fiche générique (nom + observation + photo) — pas de sous-type
       collecté, une seule ligne d'observation par localisation.
    ========================= */

    function extractCustomRows(fiche, numero, secteurLabel) {
        var localisation = fiche.nom || (secteurLabel + " " + numero);
        var ctx = makeCtx(localisation, secteurLabel, "custom", numero);
        var rows = [];

        addClimatisationRow(rows, fiche.climatisation, ctx);
        addBrasseurRow(rows, fiche.brasseurAir, ctx);
        addCustomEquipementsRows(rows, fiche.equipements, ctx);
        addEclairageRows(rows, fiche.eclairages, ctx);
        addObservationRow(rows, fiche.observation, ctx);

        // Garantit qu'une localisation sans aucune donnée apparaisse quand même
        // dans le rapport (au moins son nom), plutôt que de disparaître.
        if (!rows.length) {
            rows.push(makeRow({
                localisation: localisation, secteur: ctx.secteur,
                formulaireOrigine: ctx.formulaireOrigine, nomFormulaire: ctx.nomFormulaire
            }));
        }

        return rows;
    }

    /* =========================
       DISPATCH PAR MODULE
    ========================= */

    var EXTRACTORS = {
        hebergements: extractHebergementRows,
        piscines: extractPiscineRows,
        restaurant: extractRestaurantRows,
        bar: extractBarRows,
        spa: extractSpaRows,
        buanderie: extractBuanderieRows,
        cuisine: extractCuisineRows,
        jeux: extractJeuxRows,
        reunion: extractReunionRows,
        sport: extractSportRows,
        bureaux: extractBureauxRows,
        parking: extractParkingRows
    };

    // donnees = { moduleId: { "1": fiche, "2": fiche, ... }, ... } (auditData.donnees)
    // customLabels = { customSecteurId: "Nom donné par l'utilisateur", ... }
    function buildAllRows(donnees, customLabels) {
        var rows = [];
        Object.keys(donnees || {}).forEach(function (moduleId) {
            var extractor = EXTRACTORS[moduleId];
            var isCustom = !extractor && typeof isCustomSecteurId === "function" && isCustomSecteurId(moduleId);
            if (!extractor && !isCustom) return;
            var moduleData = donnees[moduleId] || {};
            Object.keys(moduleData).forEach(function (numero) {
                var fiche = moduleData[numero];
                if (!fiche) return;
                if (extractor) {
                    rows = rows.concat(extractor(fiche, numero));
                } else {
                    var label = (customLabels && customLabels[moduleId]) || "Secteur personnalisé";
                    rows = rows.concat(extractCustomRows(fiche, numero, label));
                }
            });
        });
        return rows;
    }

    /* =========================
       API PUBLIQUE
    ========================= */

    return {
        LOTS: LOTS,
        lotNom: lotNom,
        buildAllRows: buildAllRows
    };

})();
