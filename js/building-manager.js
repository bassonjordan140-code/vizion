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

    function createBuilding(nom, niveaux) {
        var buildings = listBuildings();
        var id = "b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        buildings.push({ id: id, nom: nom, niveaux: niveaux || 1 });
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
            localStorage.removeItem(CUSTOM_SECTEURS_KEY);
            localStorage.removeItem(CUSTOM_SECTEUR_DATA_KEY);
            localStorage.removeItem(CUSTOM_SECTEUR_CURRENT_KEY);
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
            activeSecteurs: JSON.parse(localStorage.getItem("activeSecteurs")) || [],
            customSecteurs: JSON.parse(localStorage.getItem(CUSTOM_SECTEURS_KEY)) || [],
            customSecteurData: JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {}
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

        localStorage.setItem(CUSTOM_SECTEURS_KEY, JSON.stringify(snapshot.customSecteurs || []));
        localStorage.setItem(CUSTOM_SECTEUR_DATA_KEY, JSON.stringify(snapshot.customSecteurData || {}));

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
        localStorage.removeItem(CUSTOM_SECTEUR_CURRENT_KEY);
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
        var fixedConfigured = Object.keys(SECTEUR_DATA_KEYS).some(function (secteurId) {
            var data = snapshot[SECTEUR_DATA_KEYS[secteurId]];
            return data && Object.keys(data).length > 0;
        });
        if (fixedConfigured) return true;
        var customData = snapshot.customSecteurData || {};
        return Object.keys(customData).some(function (secteurId) {
            return Object.keys(customData[secteurId] || {}).length > 0;
        });
    }

    /* =========================
       DUPLICATION D'UNE LOCALISATION
       Copie une fiche déjà remplie (ex: "Chambre standard") vers un autre
       bâtiment (ou le même, pour une variante côte à côte), afin d'éviter de
       ressaisir une localisation quasi identique. La copie peut ensuite être
       modifiée librement, indépendamment de l'original.
    ========================= */

    // secteurId : id du secteur (fixe ou personnalisé) ; isCustom : vrai si
    // secteur personnalisé ; customLabel : son libellé (créé dans le bâtiment
    // cible s'il n'y existe pas encore) ; targetBuildingId : bâtiment de
    // destination (peut être getCurrentBuildingId() lui-même).
    // Opère toujours sur les clés ACTIVES pour lire la fiche source : à
    // n'appeler que depuis l'écran de localisation du bâtiment actif.
    function duplicateLocalisation(secteurId, sourceNumero, isCustom, customLabel, targetBuildingId) {
        var currentId = getCurrentBuildingId();
        var sameBuilding = targetBuildingId === currentId;

        var sourceFiche;
        if (isCustom) {
            var allCustomSrc = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
            sourceFiche = (allCustomSrc[secteurId] || {})[sourceNumero];
        } else {
            var dataSrc = JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[secteurId])) || {};
            sourceFiche = dataSrc[sourceNumero];
        }
        if (!sourceFiche) return null;
        var ficheCopy = JSON.parse(JSON.stringify(sourceFiche));
        // La copie récupère les informations saisies mais pas les photos (voir
        // plus bas) : on le signale sur la fiche pour que l'utilisateur ne
        // pense pas que les photos ont été perdues par erreur.
        ficheCopy._dupliquee = true;

        var newNumero;

        if (sameBuilding) {
            if (isCustom) {
                var allCustomSame = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
                var secteurDataSame = allCustomSame[secteurId] || {};
                var numsSame = Object.keys(secteurDataSame).map(Number);
                newNumero = numsSame.length ? Math.max.apply(null, numsSame) + 1 : 1;
                secteurDataSame[newNumero] = ficheCopy;
                allCustomSame[secteurId] = secteurDataSame;
                localStorage.setItem(CUSTOM_SECTEUR_DATA_KEY, JSON.stringify(allCustomSame));
            } else {
                var dataSame = JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[secteurId])) || {};
                var numsSame2 = Object.keys(dataSame).map(Number);
                newNumero = numsSame2.length ? Math.max.apply(null, numsSame2) + 1 : 1;
                dataSame[newNumero] = ficheCopy;
                localStorage.setItem(SECTEUR_DATA_KEYS[secteurId], JSON.stringify(dataSame));
            }
        } else {
            var raw = localStorage.getItem(snapshotKey(targetBuildingId));
            var snapshot = raw ? JSON.parse(raw) : {};

            if (isCustom) {
                snapshot.customSecteurs = snapshot.customSecteurs || [];
                if (!snapshot.customSecteurs.some(function (s) { return s.id === secteurId; })) {
                    snapshot.customSecteurs.push({ id: secteurId, label: customLabel || secteurId });
                }
                snapshot.customSecteurData = snapshot.customSecteurData || {};
                var secteurDataOther = snapshot.customSecteurData[secteurId] || {};
                var numsOther = Object.keys(secteurDataOther).map(Number);
                newNumero = numsOther.length ? Math.max.apply(null, numsOther) + 1 : 1;
                secteurDataOther[newNumero] = ficheCopy;
                snapshot.customSecteurData[secteurId] = secteurDataOther;
            } else {
                var key = SECTEUR_DATA_KEYS[secteurId];
                snapshot[key] = snapshot[key] || {};
                var numsOther2 = Object.keys(snapshot[key]).map(Number);
                newNumero = numsOther2.length ? Math.max.apply(null, numsOther2) + 1 : 1;
                snapshot[key][newNumero] = ficheCopy;

                snapshot.activeSecteurs = snapshot.activeSecteurs || [];
                if (snapshot.activeSecteurs.indexOf(secteurId) === -1) {
                    snapshot.activeSecteurs.push(secteurId);
                }
            }

            localStorage.setItem(snapshotKey(targetBuildingId), JSON.stringify(snapshot));
        }

        // Les photos ne sont volontairement PAS dupliquées (fiche marquée
        // "_dupliquee" ci-dessus) : elles restent propres à l'original.
        return { newNumero: newNumero };
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
        localStorage.removeItem(CUSTOM_SECTEURS_KEY);
        localStorage.removeItem(CUSTOM_SECTEUR_DATA_KEY);
        localStorage.removeItem(CUSTOM_SECTEUR_CURRENT_KEY);
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
    // { id, nom, donnees, customLabels } où donnees = { secteurId: {...fiches} }
    // (secteurs fixes ET personnalisés confondus) comme l'attend
    // LotMapping.buildAllRows ; customLabels donne le nom affiché de chaque
    // secteur personnalisé (non déductible de son id).
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

                var customLabels = {};
                (snapshot.customSecteurs || []).forEach(function (secteur) {
                    customLabels[secteur.id] = secteur.label;
                });
                var customData = snapshot.customSecteurData || {};
                Object.keys(customData).forEach(function (secteurId) {
                    if (Object.keys(customData[secteurId] || {}).length) {
                        donnees[secteurId] = customData[secteurId];
                    }
                });

                return { id: building.id, nom: building.nom, donnees: donnees, customLabels: customLabels };
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
        var data;
        if (isCustomSecteurId(secteurId)) {
            data = (snapshot.customSecteurData || {})[secteurId];
        } else {
            var dataKey = SECTEUR_DATA_KEYS[secteurId];
            data = dataKey && snapshot[dataKey];
        }
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
        duplicateLocalisation: duplicateLocalisation,
        wipeEverything: wipeEverything,
        collectAllBuildingsAuditData: collectAllBuildingsAuditData,
        collectAllBuildingsPhotos: collectAllBuildingsPhotos
    };

})();
