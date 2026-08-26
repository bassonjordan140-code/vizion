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

    // Réinjecte les photos du bâtiment actif dans le store actif : flushActiveState
    // vient de les déplacer vers l'archive (comportement normal de
    // saveCurrentBuildingSnapshot). Sans cette étape, le store actif serait vide
    // au moment de lire les photos pour la sauvegarde et les photos du bâtiment
    // en cours n'apparaîtraient que dans l'archive du zip — donc absentes du
    // store actif après un import, invisibles sur la fiche ouverte. On l'annule
    // AVANT de lire les photos (pas après le zip, sinon le zip lui-même garde
    // le trou).
    function restoreActivePhotosAfterExport() {
        var buildingId = typeof BuildingManager !== "undefined" ? BuildingManager.getCurrentBuildingId() : "";
        if (!buildingId) return Promise.resolve();
        return PhotoManager.restorePhotosForBuilding(buildingId);
    }

    // Construit le zip de sauvegarde (manifest + photos), partagé par l'export
    // manuel (téléchargement) et la sauvegarde automatique silencieuse.
    function buildBackupZipBlob() {
        return flushActiveState()
            .then(function () { return restoreActivePhotosAfterExport(); })
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

                return zip.generateAsync({ type: "blob" });
            });
    }

    function exportBackup() {
        var stamp = new Date().toISOString().slice(0, 10);
        return buildBackupZipBlob()
            .then(function (blob) {
                return saveOrShareBlob(blob, "vizion-sauvegarde-" + stamp + ".zip");
            });
    }

    /* =========================
       SAUVEGARDE AUTOMATIQUE SILENCIEUSE (app native)
    ========================= */

    var AUTO_BACKUP_MIN_INTERVAL_MS = 2 * 60 * 1000; // 2 min entre deux écritures
    var AUTO_BACKUP_LAST_KEY = "autoBackupLastRun";
    var AUTO_BACKUP_FILENAME = "vizion-auto-backup.zip";
    var AUTO_BACKUP_DIRECTORY = "EXTERNAL"; // Directory.External : dossier propre à l'app, sans permission requise

    function getFilesystemPlugin() {
        return (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() &&
            window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem) || null;
    }

    function getSharePlugin() {
        return (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() &&
            window.Capacitor.Plugins && window.Capacitor.Plugins.Share) || null;
    }

    function blobToBase64(blob) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onloadend = function () {
                var result = reader.result || "";
                var commaIdx = result.indexOf(",");
                resolve(commaIdx === -1 ? result : result.slice(commaIdx + 1));
            };
            reader.onerror = function () { reject(reader.error); };
            reader.readAsDataURL(blob);
        });
    }

    // Appelée après chaque sauvegarde de fiche (voir js/unsaved-guard.js).
    // Ne fait rien : sur le web (pas de plugin natif), ou si une sauvegarde
    // automatique a déjà eu lieu il y a moins de AUTO_BACKUP_MIN_INTERVAL_MS
    // (évite de re-zipper toutes les photos à chaque frappe de sauvegarde
    // rapprochée). Écrase toujours le même fichier — pas d'accumulation.
    function autoBackupSilent() {
        var Filesystem = getFilesystemPlugin();
        if (!Filesystem) return Promise.resolve();

        var last = parseInt(localStorage.getItem(AUTO_BACKUP_LAST_KEY), 10) || 0;
        if (Date.now() - last < AUTO_BACKUP_MIN_INTERVAL_MS) return Promise.resolve();

        return buildBackupZipBlob()
            .then(function (blob) { return blobToBase64(blob); })
            .then(function (base64) {
                return Filesystem.writeFile({
                    path: AUTO_BACKUP_FILENAME,
                    data: base64,
                    directory: AUTO_BACKUP_DIRECTORY,
                    recursive: true
                });
            })
            .then(function () {
                localStorage.setItem(AUTO_BACKUP_LAST_KEY, String(Date.now()));
            })
            .catch(function (err) {
                console.error("Sauvegarde automatique silencieuse échouée :", err);
            });
    }

    /* =========================
       EXPORT VISIBLE (rapport, sauvegarde manuelle)
       Sur le web, un simple lien <a download> suffit : le navigateur gère le
       téléchargement. Dans l'app native (WebView Capacitor), ce lien ne
       déclenche RIEN — il n'y a pas de gestionnaire de téléchargement par
       défaut. On écrit alors le fichier via le plugin Filesystem puis on
       ouvre la feuille de partage native (Share) : c'est aussi le seul moyen
       simple pour l'utilisateur de récupérer le fichier, car le dossier
       d'écriture (Directory.External) n'est pas visible depuis la plupart
       des gestionnaires de fichiers Android.
    ========================= */

    var VISIBLE_EXPORT_DIRECTORY = "EXTERNAL";
    var VISIBLE_EXPORT_SUBFOLDER = "ViZion";

    function saveOrShareBlob(blob, filename) {
        var Filesystem = getFilesystemPlugin();

        if (!Filesystem) {
            // Web : téléchargement classique via un lien <a download>.
            var url = URL.createObjectURL(blob);
            var a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
            return Promise.resolve({ native: false });
        }

        var path = VISIBLE_EXPORT_SUBFOLDER + "/" + filename;

        return blobToBase64(blob)
            .then(function (base64) {
                return Filesystem.writeFile({
                    path: path,
                    data: base64,
                    directory: VISIBLE_EXPORT_DIRECTORY,
                    recursive: true
                });
            })
            .then(function () {
                return Filesystem.getUri({ path: path, directory: VISIBLE_EXPORT_DIRECTORY });
            })
            .then(function (uriResult) {
                var Share = getSharePlugin();
                if (!Share) return { native: true, uri: uriResult.uri };
                return Share.share({ title: filename, url: uriResult.uri })
                    .catch(function (err) {
                        // L'utilisateur peut simplement fermer la feuille de partage
                        // sans rien choisir : ce n'est pas une erreur, le fichier est
                        // déjà écrit sur l'appareil à ce stade.
                        console.warn("Partage annulé ou échoué :", err);
                    })
                    .then(function () { return { native: true, uri: uriResult.uri }; });
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
        importBackup: importBackup,
        autoBackupSilent: autoBackupSilent,
        saveOrShareBlob: saveOrShareBlob
    };

})();
