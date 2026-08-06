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

    function renameBuilding(id, nom) {
        var buildings = listBuildings();
        var building = buildings.find(function (b) { return b.id === id; });
        if (building) {
            building.nom = nom;
            saveBuildingsList(buildings);
        }
    }

    // Supprime le bâtiment (liste, instantané, photos archivées). Si c'était le
    // bâtiment actif, vide aussi les clés plates actives (secteurs, fiches, photos).
    function deleteBuilding(id) {
        saveBuildingsList(listBuildings().filter(function (b) { return b.id !== id; }));
        localStorage.removeItem(snapshotKey(id));

        var chain = PhotoManager.deleteArchivedPhotosForBuilding(id);

        if (getCurrentBuildingId() === id) {
            localStorage.removeItem(CURRENT_BUILDING_KEY);
            localStorage.removeItem("activeSecteurs");
            localStorage.removeItem("currentSecteur");
            Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
                localStorage.removeItem(SECTEUR_DATA_KEYS[secteurId]);
            });
            Object.keys(SECTEUR_CURRENT_KEYS).forEach(function (secteurId) {
                localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteurId]);
            });
            chain = chain.then(function () { return PhotoManager.clearPhotos(); });
        }

        return chain;
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

        var snapshot = {
            activeSecteurs: JSON.parse(localStorage.getItem("activeSecteurs")) || []
        };
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

        var activeSecteurs = snapshot.activeSecteurs;
        if (!activeSecteurs) {
            // Migration : bâtiment créé avant l'ajout/retrait de secteurs — on rend
            // visibles ceux qui ont déjà des localisations, pour ne rien cacher.
            activeSecteurs = Object.keys(SECTEUR_DATA_KEYS).filter(function (secteurId) {
                var data = snapshot[SECTEUR_DATA_KEYS[secteurId]];
                return data && Object.keys(data).length > 0;
            });
        }
        localStorage.setItem("activeSecteurs", JSON.stringify(activeSecteurs));

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
        localStorage.removeItem("activeSecteurs");
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

    // Transforme la clé technique "secteurId_numero_champ" en un nom lisible
    // "secteurId_nomLocalisation_champ" (ex: "bureaux_1_clim" → "bureaux_Bureau audit_clim"),
    // en utilisant le nom donné par l'utilisateur à la localisation. Si le nom est
    // introuvable (localisation supprimée entretemps), le numéro d'origine est conservé.
    function buildPhotoDisplayKey(photoKey, snapshot) {
        var parts = photoKey.split("_");
        var secteurId = parts[0];
        var numero = parts[1];
        var champ = parts.slice(2).join("_");
        var dataKey = SECTEUR_DATA_KEYS[secteurId];
        var data = dataKey && snapshot[dataKey];
        var entry = data && data[numero];
        var nomPart = (entry && entry.nom) ? entry.nom.replace(/[\\/:*?"<>|]/g, "-") : numero;
        return secteurId + "_" + nomPart + "_" + champ;
    }

    // Photos de tous les bâtiments, groupées par bâtiment (utilisé pour le zip du rapport).
    function collectAllBuildingsPhotos() {
        return saveCurrentBuildingSnapshot().then(function () {
            var buildings = listBuildings();
            return Promise.all(buildings.map(function (building) {
                var raw = localStorage.getItem(snapshotKey(building.id));
                var snapshot = raw ? JSON.parse(raw) : {};
                return PhotoManager.getArchivedPhotosForBuilding(building.id).then(function (photos) {
                    var renamed = photos.map(function (photo) {
                        return { key: buildPhotoDisplayKey(photo.key, snapshot), blob: photo.blob };
                    });
                    return { id: building.id, nom: building.nom, photos: renamed };
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
        renameBuilding: renameBuilding,
        deleteBuilding: deleteBuilding,
        saveCurrentBuildingSnapshot: saveCurrentBuildingSnapshot,
        loadBuildingSnapshot: loadBuildingSnapshot,
        switchToBuilding: switchToBuilding,
        hasSecteursConfigured: hasSecteursConfigured,
        wipeEverything: wipeEverything,
        collectAllBuildingsAuditData: collectAllBuildingsAuditData,
        collectAllBuildingsPhotos: collectAllBuildingsPhotos
    };

})();
