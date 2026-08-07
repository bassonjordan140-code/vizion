/* ============================================================
   ViZion — Récapitulatif des équipements incomplets avant export
   Repère, dans tous les bâtiments d'un hôtel, les équipements (listes
   libres + checklist fixe de la cuisine) auxquels il manque le nombre
   et/ou la puissance unitaire, pour les signaler avant de générer le
   rapport plutôt que de les laisser passer silencieusement.
   Dépend de js/secteur-config.js, js/building-manager.js,
   js/lot-mapping.js (pour les libellés des équipements fixes cuisine).
============================================================ */

window.EquipmentCheck = (function () {

    // Secteurs (fixes) portant une liste libre "equipements" (nom/nombre/puissance).
    var ARRAY_EQUIP_SECTEURS = [
        "hebergements", "restaurant", "buanderie", "jeux", "reunion", "sport", "bureaux", "parking"
    ];

    function pushIssue(list, ctx, equipNom, nombre, puissance) {
        var missingNombre = !(nombre > 0);
        var missingPuissance = !(puissance > 0);
        if (!missingNombre && !missingPuissance) return;
        list.push({
            buildingId: ctx.buildingId,
            buildingNom: ctx.buildingNom,
            secteurId: ctx.secteurId,
            secteurLabel: ctx.secteurLabel,
            isCustom: ctx.isCustom,
            numero: ctx.numero,
            localisationNom: ctx.localisationNom,
            equipNom: equipNom || "(équipement sans nom)",
            missingNombre: missingNombre,
            missingPuissance: missingPuissance
        });
    }

    function scanArrayEquipements(list, ctx, equipements) {
        (equipements || []).forEach(function (eq) {
            pushIssue(list, ctx, eq.nom, eq.nombre, eq.puissance);
        });
    }

    function scanCuisine(list, ctx, fiche) {
        var equipements = fiche.equipements || {};
        Object.keys(equipements).forEach(function (id) {
            var eq = equipements[id];
            if (!eq) return;
            var nom = (typeof LotMapping !== "undefined" && LotMapping.cuisineEquipLabel)
                ? LotMapping.cuisineEquipLabel(id)
                : id;
            pushIssue(list, ctx, nom, eq.nombre, eq.puissance);
        });
        scanArrayEquipements(list, ctx, fiche.equipementsPersonnalises);
    }

    // buildingsAuditData : sortie de BuildingManager.collectAllBuildingsAuditData()
    // -> [{ id, nom, donnees: { secteurId: { numero: fiche } }, customLabels }, ...]
    function findIncompleteEquipment(buildingsAuditData) {
        var issues = [];

        (buildingsAuditData || []).forEach(function (building) {
            var donnees = building.donnees || {};

            Object.keys(donnees).forEach(function (secteurId) {
                var isCustom = isCustomSecteurId(secteurId);
                if (!isCustom && ARRAY_EQUIP_SECTEURS.indexOf(secteurId) === -1 && secteurId !== "cuisine") return;

                var secteurLabel = isCustom
                    ? ((building.customLabels && building.customLabels[secteurId]) || "Secteur personnalisé")
                    : ((SECTEURS.find(function (s) { return s.id === secteurId; }) || {}).label || secteurId);

                var fichesParNumero = donnees[secteurId] || {};
                Object.keys(fichesParNumero).forEach(function (numero) {
                    var fiche = fichesParNumero[numero];
                    if (!fiche) return;

                    var ctx = {
                        buildingId: building.id,
                        buildingNom: building.nom,
                        secteurId: secteurId,
                        secteurLabel: secteurLabel,
                        isCustom: isCustom,
                        numero: numero,
                        localisationNom: fiche.nom || (secteurLabel + " " + numero)
                    };

                    if (secteurId === "cuisine") {
                        scanCuisine(issues, ctx, fiche);
                    } else {
                        scanArrayEquipements(issues, ctx, fiche.equipements);
                    }
                });
            });
        });

        return issues;
    }

    // Bascule sur le bâtiment concerné (si nécessaire) puis ouvre directement la
    // fiche de la localisation, pour corriger sans avoir à chercher dans l'arborescence.
    function gotoIssue(issue) {
        var currentId = BuildingManager.getCurrentBuildingId();
        var chain = (currentId === issue.buildingId) ? Promise.resolve() : BuildingManager.switchToBuilding(issue.buildingId);

        return chain.then(function () {
            var keyName = issue.isCustom ? CUSTOM_SECTEUR_CURRENT_KEY : SECTEUR_CURRENT_KEYS[issue.secteurId];
            var page = issue.isCustom ? CUSTOM_SECTEUR_DETAIL_PAGE : SECTEUR_DETAIL_PAGES[issue.secteurId];
            localStorage.setItem(keyName, JSON.stringify({
                moduleId: issue.secteurId,
                secteurId: issue.secteurId,
                label: issue.secteurLabel,
                numero: issue.numero
            }));
            window.location.href = page;
        });
    }

    return {
        findIncompleteEquipment: findIncompleteEquipment,
        gotoIssue: gotoIssue
    };

})();
