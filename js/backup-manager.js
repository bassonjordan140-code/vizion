/* ============================================================
   ViZion — Sauvegarde / restauration complète
   Exporte toute la donnée de l'application (tous les hôtels, tous
   les bâtiments, toutes les photos) dans un fichier .zip
   téléchargeable, et permet de la réimporter à l'identique sur un
   autre poste ou après un incident. Le jeton GitHub (identifiants)
   n'est jamais inclus dans la sauvegarde.
   Dépend de js/photo-manager.js, js/building-manager.js,
   js/hotel-manager.js et de JSZip (chargé en <script> sur la page).
============================================================ */

window.BackupManager = (function () {

    var EXCLUDED_KEYS = ["github_token"];

    function dumpLocalStorage() {
        var dump = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (EXCLUDED_KEYS.indexOf(key) === -1) {
                dump[key] = localStorage.getItem(key);
            }
        }
        return dump;
    }

    function restoreLocalStorage(dump) {
        localStorage.clear();
        Object.keys(dump || {}).forEach(function (key) {
            localStorage.setItem(key, dump[key]);
        });
    }

    // Fige l'état actif (hôtel + bâtiment en cours) sur le disque avant l'export,
    // exactement comme le ferait un changement d'hôtel/bâtiment.
    function flushActiveState() {
        if (typeof HotelManager !== "undefined" && HotelManager.getCurrentHotelIndex()) {
            return HotelManager.saveCurrentHotelSnapshot();
        }
        if (typeof BuildingManager !== "undefined" && BuildingManager.getCurrentBuildingId()) {
            return BuildingManager.saveCurrentBuildingSnapshot();
        }
        return Promise.resolve();
    }

    // Réinjecte les photos du bâtiment actif dans le store actif : l'export
    // vient de les déplacer vers l'archive (comportement normal de
    // saveCurrentBuildingSnapshot), on annule cet effet de bord pour ne pas
    // perturber l'écran resté ouvert pendant l'export.
    function restoreActivePhotosAfterExport() {
        var buildingId = typeof BuildingManager !== "undefined" ? BuildingManager.getCurrentBuildingId() : "";
        if (!buildingId) return Promise.resolve();
        return PhotoManager.restorePhotosForBuilding(buildingId);
    }

    function exportBackup() {
        return flushActiveState()
            .then(function () { return PhotoManager.exportAllPhotoRecords(); })
            .then(function (photoRecords) {
                var manifest = {
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    localStorage: dumpLocalStorage(),
                    photos: photoRecords.map(function (record, index) {
                        return {
                            store: record.store,
                            key: record.key,
                            buildingId: record.buildingId,
                            thumbnail: record.thumbnail,
                            timestamp: record.timestamp,
                            file: "blobs/" + index + ".jpg"
                        };
                    })
                };

                var zip = new JSZip();
                zip.file("manifest.json", JSON.stringify(manifest));
                photoRecords.forEach(function (record, index) {
                    zip.file("blobs/" + index + ".jpg", record.blob);
                });

                return zip.generateAsync({ type: "blob" }).then(function (blob) {
                    return restoreActivePhotosAfterExport().then(function () { return blob; });
                });
            })
            .then(function (blob) {
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                var stamp = new Date().toISOString().slice(0, 10);
                a.href = url;
                a.download = "vizion-sauvegarde-" + stamp + ".zip";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
    }

    function importBackup(file) {
        return JSZip.loadAsync(file)
            .then(function (zip) {
                var manifestFile = zip.file("manifest.json");
                if (!manifestFile) throw new Error("Fichier de sauvegarde invalide (manifest.json manquant).");
                return manifestFile.async("string").then(function (text) {
                    return { zip: zip, manifest: JSON.parse(text) };
                });
            })
            .then(function (parsed) {
                var zip = parsed.zip;
                var manifest = parsed.manifest;
                return Promise.all((manifest.photos || []).map(function (entry) {
                    return zip.file(entry.file).async("blob").then(function (blob) {
                        return {
                            store: entry.store,
                            key: entry.key,
                            buildingId: entry.buildingId,
                            thumbnail: entry.thumbnail,
                            timestamp: entry.timestamp,
                            blob: blob
                        };
                    });
                })).then(function (photoRecords) {
                    return PhotoManager.importAllPhotoRecords(photoRecords).then(function () {
                        restoreLocalStorage(manifest.localStorage);
                    });
                });
            });
    }

    return {
        exportBackup: exportBackup,
        importBackup: importBackup
    };

})();
