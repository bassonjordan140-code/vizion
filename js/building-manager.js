/* ============================================================
   ViZion — Gestion des bâtiments
   Un audit d'hôtel peut couvrir plusieurs bâtiments (Bâtiment A,
   Restaurant, ...), chacun avec ses propres localisations par
   secteur. À tout instant, les clés localStorage plates
   (hebergementsData, ...) et le store IndexedDB "photos"
   représentent le bâtiment ACTIF. Changer de bâtiment = échanger
   (swap) ce contenu avec une archive.
   Dépend de js/secteur-config.js et js/photo-manager.js.
============================================================ */

window.BuildingManager = (function () {

    var BUILDINGS_KEY = "buildings";
    var CURRENT_BUILDING_KEY = "currentBuildingId";

    /* =========================
       LISTE DES BÂTIMENTS
    ========================= */

    function listBuildings() {
        return JSON.parse(localStorage.getItem(BUILDINGS_KEY)) || [];
    }

    function saveBuildingsList(buildings) {
        localStorage.setItem(BUILDINGS_KEY, JSON.stringify(buildings));
    }

    function getCurrentBuildingId() {
        return localStorage.getItem(CURRENT_BUILDING_KEY) || "";
    }

    function createBuilding(nom) {
        var buildings = listBuildings();
        var id = "b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        buildings.push({ id: id, nom: nom });
        saveBuildingsList(buildings);
        return id;
    }

    /* =========================
       INSTANTANÉ (snapshot) D'UN BÂTIMENT
    ========================= */

    function snapshotKey(buildingId) {
        return "buildingData_" + buildingId;
    }

    // Lit les clés plates actives et les range dans l'instantané du bâtiment donné.
    function saveCurrentBuildingSnapshot() {
        var currentId = getCurrentBuildingId();
        if (!currentId) return Promise.resolve();

        var snapshot = {};
        Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
            var key = SECTEUR_DATA_KEYS[secteurId];
            var data = localStorage.getItem(key);
            if (data) snapshot[key] = JSON.parse(data);
        });

        localStorage.setItem(snapshotKey(currentId), JSON.stringify(snapshot));

        return PhotoManager.archivePhotosForBuilding(currentId);
    }

    // Écrit l'instantané du bâtiment ciblé dans les clés plates actives.
    function loadBuildingSnapshot(buildingId) {
        var raw = localStorage.getItem(snapshotKey(buildingId));
        var snapshot = raw ? JSON.parse(raw) : {};

        Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
            var key = SECTEUR_DATA_KEYS[secteurId];
            if (snapshot[key]) {
                localStorage.setItem(key, JSON.stringify(snapshot[key]));
            } else {
                localStorage.removeItem(key);
            }
        });

        // Navigation transitoire : jamais pertinente d'un bâtiment à l'autre.
        localStorage.removeItem("currentSecteur");
        Object.keys(SECTEUR_CURRENT_KEYS).forEach(function (secteurId) {
            localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteurId]);
        });

        localStorage.setItem(CURRENT_BUILDING_KEY, buildingId);

        return PhotoManager.restorePhotosForBuilding(buildingId);
    }

    // Change de bâtiment actif : sauvegarde l'ancien puis charge le nouveau.
    function switchToBuilding(buildingId) {
        var currentId = getCurrentBuildingId();
        var chain = (currentId && currentId !== buildingId)
            ? saveCurrentBuildingSnapshot()
            : Promise.resolve();
        return chain.then(function () {
            return loadBuildingSnapshot(buildingId);
        });
    }

    // Vrai si au moins une localisation a été ajoutée dans un secteur quelconque.
    function hasSecteursConfigured(buildingId) {
        var raw = localStorage.getItem(snapshotKey(buildingId));
        if (!raw) return false;
        var snapshot = JSON.parse(raw);
        return Object.keys(SECTEUR_DATA_KEYS).some(function (secteurId) {
            var data = snapshot[SECTEUR_DATA_KEYS[secteurId]];
            return data && Object.keys(data).length > 0;
        });
    }

    /* =========================
       REMISE À ZÉRO COMPLÈTE
    ========================= */

    function wipeEverything() {
        listBuildings().forEach(function (b) {
            localStorage.removeItem(snapshotKey(b.id));
        });
        localStorage.removeItem(BUILDINGS_KEY);
        localStorage.removeItem(CURRENT_BUILDING_KEY);
        localStorage.removeItem("siteInfo");
        localStorage.removeItem("currentSecteur");
        Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
            localStorage.removeItem(SECTEUR_DATA_KEYS[secteurId]);
        });
        Object.keys(SECTEUR_CURRENT_KEYS).forEach(function (secteurId) {
            localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteurId]);
        });
        return PhotoManager.clearAllPhotosAndArchive();
    }

    /* =========================
       AGRÉGATION POUR LE RAPPORT
    ========================= */

    // Force la fraîcheur du bâtiment actif puis renvoie, pour chaque bâtiment,
    // { id, nom, donnees } où donnees = { secteurId: {...fiches} } comme
    // l'attend LotMapping.buildAllRows.
    function collectAllBuildingsAuditData() {
        return saveCurrentBuildingSnapshot().then(function () {
            return listBuildings().map(function (building) {
                var raw = localStorage.getItem(snapshotKey(building.id));
                var snapshot = raw ? JSON.parse(raw) : {};
                var donnees = {};
                Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
                    var key = SECTEUR_DATA_KEYS[secteurId];
                    if (snapshot[key]) donnees[secteurId] = snapshot[key];
                });
                return { id: building.id, nom: building.nom, donnees: donnees };
            });
        });
    }

    // Photos de tous les bâtiments, groupées par bâtiment (utilisé pour le zip du rapport).
    function collectAllBuildingsPhotos() {
        return saveCurrentBuildingSnapshot().then(function () {
            var buildings = listBuildings();
            return Promise.all(buildings.map(function (building) {
                return PhotoManager.getArchivedPhotosForBuilding(building.id).then(function (photos) {
                    return { id: building.id, nom: building.nom, photos: photos };
                });
            }));
        });
    }

    /* =========================
       API PUBLIQUE
    ========================= */

    return {
        listBuildings: listBuildings,
        getCurrentBuildingId: getCurrentBuildingId,
        createBuilding: createBuilding,
        saveCurrentBuildingSnapshot: saveCurrentBuildingSnapshot,
        loadBuildingSnapshot: loadBuildingSnapshot,
        switchToBuilding: switchToBuilding,
        hasSecteursConfigured: hasSecteursConfigured,
        wipeEverything: wipeEverything,
        collectAllBuildingsAuditData: collectAllBuildingsAuditData,
        collectAllBuildingsPhotos: collectAllBuildingsPhotos
    };

})();
