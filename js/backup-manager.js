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

    // Plugin natif maison (android/app/.../SaveToDownloadsPlugin.java) : écrit
    // directement dans le dossier public "Téléchargements" de l'appareil via
    // MediaStore (Android 10+, aucune permission requise). C'est le seul moyen
    // d'obtenir un vrai "fichier enregistré sur l'appareil" sans passer par une
    // feuille de partage — certains appareils n'ont aucune app qui propose une
    // option "Enregistrer" dans cette feuille, seulement des apps de partage.
    function getSaveToDownloadsPlugin() {
        return (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() &&
            window.Capacitor.Plugins && window.Capacitor.Plugins.SaveToDownloads) || null;
    }

    function mimeTypeFor(filename) {
        if (/\.zip$/i.test(filename)) return "application/zip";
        if (/\.xlsx$/i.test(filename)) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (/\.json$/i.test(filename)) return "application/json";
        return "application/octet-stream";
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

    function bytesToBase64(bytes) {
        return blobToBase64(new Blob([bytes]));
    }

    function readBlobBytes(blob) {
        if (blob.arrayBuffer) {
            return blob.arrayBuffer().then(function (buffer) { return new Uint8Array(buffer); });
        }
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () { resolve(new Uint8Array(reader.result)); };
            reader.onerror = function () { reject(reader.error); };
            reader.readAsArrayBuffer(blob);
        });
    }

    // Exécute les promesses une par une (pas en parallèle : on veut une seule
    // photo / un seul morceau en mémoire à la fois).
    function sequence(items, task) {
        return items.reduce(function (chain, item, index) {
            return chain.then(function () { return task(item, index); });
        }, Promise.resolve());
    }

    // Un seul export/sauvegarde à la fois : flushActiveState() déplace
    // temporairement les photos du bâtiment actif vers l'archive, deux
    // sauvegardes simultanées (manuelle + automatique) pourraient se marcher
    // dessus et produire une archive sans ces photos.
    var backupBusy = false;
    var backupQueue = Promise.resolve();

    function runExclusive(task) {
        var run = backupQueue.then(function () {
            backupBusy = true;
            return task();
        });
        run.then(function () { backupBusy = false; }, function () { backupBusy = false; });
        backupQueue = run.catch(function () {});
        return run;
    }

    /* =========================
       ZIP EN FLUX (sans compression)
       Les photos sont déjà des JPEG : les compresser ne gagnerait rien. Avant,
       JSZip chargeait TOUTES les photos en mémoire, fabriquait un énorme blob,
       puis il fallait en faire une chaîne base64 (+33 %) pour la passer au
       plugin natif : sur une grosse sauvegarde (plusieurs hôtels pleins de
       photos) la mémoire de la WebView était dépassée et l'app plantait. Ici
       l'archive est écrite entrée par entrée vers une "sortie" (sink) qui la
       transmet par morceaux de 1 Mo : en mémoire, une photo + un morceau.
       Format : ZIP classique, méthode STORE, lisible par JSZip et unzip.
       Pas de ZIP64 : au-delà de 4 Go ou 65 535 fichiers, on refuse proprement.
    ========================= */

    var ZIP_CHUNK_BYTES = 1024 * 1024;
    var ZIP_MAX_BYTES = 0xFFFFFFFF;
    var ZIP_MAX_ENTRIES = 0xFFFF;

    var CRC_TABLE = (function () {
        var table = new Uint32Array(256);
        for (var n = 0; n < 256; n++) {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            table[n] = c >>> 0;
        }
        return table;
    })();

    function crc32(bytes) {
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    function dosDateTime(date) {
        return {
            time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
            date: ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
        };
    }

    function splitChunks(bytes) {
        var chunks = [];
        for (var i = 0; i < bytes.length; i += ZIP_CHUNK_BYTES) {
            chunks.push(bytes.subarray(i, Math.min(i + ZIP_CHUNK_BYTES, bytes.length)));
        }
        return chunks;
    }

    // sink = { write(Uint8Array) -> Promise, close() -> Promise<résultat>, abort() -> Promise }
    function createZipWriter(sink) {
        var entries = [];
        var offset = 0;
        var stamp = dosDateTime(new Date());
        var encoder = new TextEncoder();

        function emit(bytes) {
            offset += bytes.length;
            return sink.write(bytes);
        }

        function addFile(name, bytes) {
            // Marge pour l'annuaire central et la fin d'archive écrits à la fin.
            if (entries.length >= ZIP_MAX_ENTRIES ||
                offset + bytes.length + (entries.length + 2) * 512 > ZIP_MAX_BYTES) {
                return Promise.reject(new Error("Sauvegarde trop volumineuse pour le format ZIP (4 Go ou 65 535 fichiers maximum)."));
            }

            var nameBytes = encoder.encode(name);
            var crc = crc32(bytes);
            var header = new Uint8Array(30 + nameBytes.length);
            var view = new DataView(header.buffer);
            view.setUint32(0, 0x04034B50, true);
            view.setUint16(4, 20, true);           // version nécessaire
            view.setUint16(6, 0x0800, true);       // noms de fichiers en UTF-8
            view.setUint16(8, 0, true);            // méthode : STORE
            view.setUint16(10, stamp.time, true);
            view.setUint16(12, stamp.date, true);
            view.setUint32(14, crc, true);
            view.setUint32(18, bytes.length, true);
            view.setUint32(22, bytes.length, true);
            view.setUint16(26, nameBytes.length, true);
            view.setUint16(28, 0, true);
            header.set(nameBytes, 30);

            entries.push({ nameBytes: nameBytes, crc: crc, size: bytes.length, offset: offset });
            return emit(header).then(function () { return emit(bytes); });
        }

        function finish() {
            var centralOffset = offset;
            var records = entries.map(function (entry) {
                var record = new Uint8Array(46 + entry.nameBytes.length);
                var view = new DataView(record.buffer);
                view.setUint32(0, 0x02014B50, true);
                view.setUint16(4, 20, true);
                view.setUint16(6, 20, true);
                view.setUint16(8, 0x0800, true);
                view.setUint16(10, 0, true);
                view.setUint16(12, stamp.time, true);
                view.setUint16(14, stamp.date, true);
                view.setUint32(16, entry.crc, true);
                view.setUint32(20, entry.size, true);
                view.setUint32(24, entry.size, true);
                view.setUint16(28, entry.nameBytes.length, true);
                view.setUint32(42, entry.offset, true);
                record.set(entry.nameBytes, 46);
                return record;
            });
            var centralSize = records.reduce(function (sum, record) { return sum + record.length; }, 0);

            var end = new Uint8Array(22);
            var endView = new DataView(end.buffer);
            endView.setUint32(0, 0x06054B50, true);
            endView.setUint16(8, entries.length, true);
            endView.setUint16(10, entries.length, true);
            endView.setUint32(12, centralSize, true);
            endView.setUint32(16, centralOffset, true);

            return sequence(records.concat([end]), emit).then(function () { return sink.close(); });
        }

        return { addFile: addFile, finish: finish };
    }

    // Sortie web : le navigateur gère le téléchargement (lien <a download>).
    function downloadBlobInBrowser(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }

    function createWebSink(filename) {
        var parts = [];
        return {
            write: function (bytes) { parts.push(bytes); return Promise.resolve(); },
            close: function () {
                downloadBlobInBrowser(new Blob(parts, { type: mimeTypeFor(filename) }), filename);
                parts = [];
                return Promise.resolve({ native: false });
            },
            abort: function () { parts = []; return Promise.resolve(); }
        };
    }

    // Sortie native "Téléchargements" : plugin maison, écriture par morceaux
    // dans MediaStore (begin / append / finish — voir SaveToDownloadsPlugin.java).
    function createDownloadsSink(plugin, filename) {
        return plugin.begin({ filename: filename, mimeType: mimeTypeFor(filename) }).then(function (started) {
            var id = started.id;
            return {
                write: function (bytes) {
                    return sequence(splitChunks(bytes), function (chunk) {
                        return bytesToBase64(chunk).then(function (data) {
                            return plugin.append({ id: id, data: data });
                        });
                    });
                },
                close: function () {
                    return plugin.finish({ id: id }).then(function (result) {
                        return { native: true, downloads: true, uri: result.uri };
                    });
                },
                abort: function () { return plugin.abort({ id: id }).catch(function () {}); }
            };
        });
    }

    // Sortie native dans un fichier du dossier de l'app (plugin Filesystem),
    // écrit par morceaux : premier morceau = writeFile, suivants = appendFile.
    function createFilesystemSink(Filesystem, path, directory) {
        var started = false;
        return {
            write: function (bytes) {
                return sequence(splitChunks(bytes), function (chunk) {
                    return bytesToBase64(chunk).then(function (data) {
                        if (!started) {
                            started = true;
                            return Filesystem.writeFile({ path: path, data: data, directory: directory, recursive: true });
                        }
                        return Filesystem.appendFile({ path: path, data: data, directory: directory });
                    });
                });
            },
            close: function () { return Promise.resolve({ native: true, path: path }); },
            abort: function () { return Filesystem.deleteFile({ path: path, directory: directory }).catch(function () {}); }
        };
    }

    // Écrit manifest.json puis chaque photo, une à la fois, dans le zip.
    function buildBackupToSink(sink) {
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

                var writer = createZipWriter(sink);
                return writer.addFile("manifest.json", new TextEncoder().encode(JSON.stringify(manifest)))
                    .then(function () {
                        return sequence(photoRecords, function (record, index) {
                            var blob = record.blob;
                            record.blob = null; // libère la référence dès qu'elle est lue
                            return readBlobBytes(blob).then(function (bytes) {
                                return writer.addFile("blobs/" + index + ".jpg", bytes);
                            });
                        });
                    })
                    .then(function () { return writer.finish(); });
            });
    }

    // Ouvre la bonne sortie pour un export visible (web, Téléchargements natif,
    // ou repli dossier de l'app + feuille de partage), y écrit, et nettoie en
    // cas d'échec pour ne pas laisser un fichier à moitié écrit.
    function writeZipExport(filename, build) {
        var Filesystem = getFilesystemPlugin();
        var openSink;

        if (!Filesystem) {
            openSink = Promise.resolve(createWebSink(filename));
        } else {
            var viaShare = function () {
                var path = VISIBLE_EXPORT_SUBFOLDER + "/" + filename;
                var sink = createFilesystemSink(Filesystem, path, VISIBLE_EXPORT_DIRECTORY);
                sink.close = function () { return shareFileAtPath(path, filename); };
                return sink;
            };
            var SaveToDownloads = getSaveToDownloadsPlugin();
            openSink = SaveToDownloads
                ? createDownloadsSink(SaveToDownloads, filename).catch(function (err) {
                    console.warn("Enregistrement direct dans Téléchargements impossible, repli sur le partage :", err);
                    return viaShare();
                })
                : Promise.resolve(viaShare());
        }

        return openSink.then(function (sink) {
            return build(sink).catch(function (err) {
                return sink.abort().then(function () { throw err; });
            });
        });
    }

    function exportBackup() {
        var stamp = new Date().toISOString().slice(0, 10);
        return runExclusive(function () {
            return writeZipExport("vizion-sauvegarde-" + stamp + ".zip", buildBackupToSink);
        });
    }

    // Export ZIP générique par morceaux, réutilisé par le rapport (js/report-export.js).
    // fill(zip) reçoit { addBlob(nom, blob), addText(nom, texte) } et renvoie une
    // promesse ; chaque fichier est lu, écrit puis oublié avant le suivant.
    function exportZipFile(filename, fill) {
        return runExclusive(function () {
            return writeZipExport(filename, function (sink) {
                var writer = createZipWriter(sink);
                var zip = {
                    addBlob: function (name, blob) {
                        return readBlobBytes(blob).then(function (bytes) { return writer.addFile(name, bytes); });
                    },
                    addText: function (name, text) {
                        return writer.addFile(name, new TextEncoder().encode(text));
                    }
                };
                return fill(zip).then(function () { return writer.finish(); });
            });
        });
    }

    // Appelée après chaque sauvegarde de fiche (voir js/unsaved-guard.js).
    // Ne fait rien : sur le web (pas de plugin natif), si une sauvegarde
    // automatique a déjà eu lieu il y a moins de AUTO_BACKUP_MIN_INTERVAL_MS
    // (évite de re-zipper toutes les photos à chaque frappe de sauvegarde
    // rapprochée), ou si une autre sauvegarde est déjà en cours. Écrit dans un
    // fichier temporaire puis le renomme : un plantage en cours d'écriture ne
    // détruit jamais la dernière bonne sauvegarde. Écrase toujours le même
    // fichier — pas d'accumulation.
    function autoBackupSilent() {
        var Filesystem = getFilesystemPlugin();
        if (!Filesystem) return Promise.resolve();

        var last = parseInt(localStorage.getItem(AUTO_BACKUP_LAST_KEY), 10) || 0;
        if (Date.now() - last < AUTO_BACKUP_MIN_INTERVAL_MS) return Promise.resolve();
        if (backupBusy) return Promise.resolve();

        var tmpName = AUTO_BACKUP_FILENAME + ".tmp";

        return runExclusive(function () {
            var sink = createFilesystemSink(Filesystem, tmpName, AUTO_BACKUP_DIRECTORY);
            return buildBackupToSink(sink)
                .catch(function (err) {
                    return sink.abort().then(function () { throw err; });
                })
                .then(function () {
                    return Filesystem.deleteFile({ path: AUTO_BACKUP_FILENAME, directory: AUTO_BACKUP_DIRECTORY }).catch(function () {});
                })
                .then(function () {
                    return Filesystem.rename({
                        from: tmpName,
                        to: AUTO_BACKUP_FILENAME,
                        directory: AUTO_BACKUP_DIRECTORY,
                        toDirectory: AUTO_BACKUP_DIRECTORY
                    });
                })
                .then(function () {
                    localStorage.setItem(AUTO_BACKUP_LAST_KEY, String(Date.now()));
                })
                .catch(function (err) {
                    console.error("Sauvegarde automatique silencieuse échouée :", err);
                });
        });
    }

    /* =========================
       PARTAGE (repli)
       Sur le web, un simple lien <a download> suffit. Dans l'app native, ce lien
       ne déclenche RIEN (pas de gestionnaire de téléchargement dans la WebView) :
       on écrit dans "Téléchargements" via le plugin SaveToDownloads. Sur Android
       < 10, où ce plugin n'est pas disponible, on écrit dans le dossier de l'app
       (Directory.External, invisible dans la plupart des gestionnaires de
       fichiers) puis on ouvre la feuille de partage native pour que l'utilisateur
       puisse récupérer le fichier.
    ========================= */

    var VISIBLE_EXPORT_DIRECTORY = "EXTERNAL";
    var VISIBLE_EXPORT_SUBFOLDER = "ViZion";

    // Ouvre la feuille de partage native sur un fichier déjà écrit dans le
    // dossier de l'app (Directory.External).
    function shareFileAtPath(path, filename) {
        var Filesystem = getFilesystemPlugin();
        return Filesystem.getUri({ path: path, directory: VISIBLE_EXPORT_DIRECTORY })
            .then(function (uriResult) {
                var Share = getSharePlugin();
                if (!Share) return { native: true, shared: false, uri: uriResult.uri };
                return Share.share({ title: filename, url: uriResult.uri })
                    .catch(function (err) {
                        // L'utilisateur peut simplement fermer la feuille de partage
                        // sans rien choisir : ce n'est pas une erreur, le fichier est
                        // déjà écrit sur l'appareil à ce stade.
                        console.warn("Partage annulé ou échoué :", err);
                    })
                    .then(function () { return { native: true, shared: true, uri: uriResult.uri }; });
            });
    }

    /* =========================
       IMPORT EN FLUX
       Lit l'annuaire central du ZIP puis chaque photo directement depuis le
       fichier (Blob.slice : aucune copie en mémoire), et les écrit par lots dans
       IndexedDB. Avant, JSZip chargeait le fichier entier puis en recopiait chaque
       photo : sur une grosse sauvegarde, ça dépassait la mémoire de l'appareil.
    ========================= */

    var IMPORT_BATCH_SIZE = 25;

    // Ancienne méthode (JSZip charge tout le fichier en mémoire) : seulement pour les
    // archives que le lecteur en flux ne gère pas (ZIP64, entrées compressées).
    function importBackupWithJSZip(file) {
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

    function readBlobText(blob) {
        if (blob.text) return blob.text();
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.onerror = function () { reject(reader.error); };
            reader.readAsText(blob);
        });
    }

    // Renvoie { nom: { size, localOffset } } ou null si le format n'est pas pris en
    // charge (ZIP64, entrées compressées) : l'appelant se rabat alors sur JSZip.
    function readZipIndex(file) {
        var size = file.size;
        if (size < 22) return Promise.resolve(null);

        return readBlobBytes(file.slice(Math.max(0, size - 65557), size)).then(function (tail) {
            var tailView = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
            var eocd = -1;
            for (var i = tail.length - 22; i >= 0; i--) {
                if (tailView.getUint32(i, true) === 0x06054B50) { eocd = i; break; }
            }
            if (eocd === -1) return null;

            var count = tailView.getUint16(eocd + 10, true);
            var centralSize = tailView.getUint32(eocd + 12, true);
            var centralOffset = tailView.getUint32(eocd + 16, true);
            if (count === 0xFFFF || centralSize === 0xFFFFFFFF || centralOffset === 0xFFFFFFFF) return null;
            if (centralOffset + centralSize > size) return null;

            return readBlobBytes(file.slice(centralOffset, centralOffset + centralSize)).then(function (central) {
                var view = new DataView(central.buffer, central.byteOffset, central.byteLength);
                var decoder = new TextDecoder("utf-8");
                var entries = {};
                var pos = 0;
                for (var n = 0; n < count; n++) {
                    if (pos + 46 > central.length || view.getUint32(pos, true) !== 0x02014B50) return null;
                    var method = view.getUint16(pos + 10, true);
                    var compressed = view.getUint32(pos + 20, true);
                    var uncompressed = view.getUint32(pos + 24, true);
                    var nameLength = view.getUint16(pos + 28, true);
                    var extraLength = view.getUint16(pos + 30, true);
                    var commentLength = view.getUint16(pos + 32, true);
                    var localOffset = view.getUint32(pos + 42, true);
                    if (method !== 0 || compressed !== uncompressed || compressed === 0xFFFFFFFF || localOffset === 0xFFFFFFFF) return null;
                    var name = decoder.decode(central.subarray(pos + 46, pos + 46 + nameLength));
                    entries[name] = { size: uncompressed, localOffset: localOffset };
                    pos += 46 + nameLength + extraLength + commentLength;
                }
                return entries;
            });
        });
    }

    // Blob (vue sur le fichier, sans copie) du contenu d'une entrée STORE.
    function zipEntryBlob(file, entry, type) {
        return readBlobBytes(file.slice(entry.localOffset, entry.localOffset + 30)).then(function (header) {
            var view = new DataView(header.buffer, header.byteOffset, header.byteLength);
            if (header.length < 30 || view.getUint32(0, true) !== 0x04034B50) {
                throw new Error("Fichier de sauvegarde invalide (archive corrompue).");
            }
            var start = entry.localOffset + 30 + view.getUint16(26, true) + view.getUint16(28, true);
            if (start + entry.size > file.size) {
                throw new Error("Fichier de sauvegarde incomplet (archive tronquée).");
            }
            return file.slice(start, start + entry.size, type || "");
        });
    }

    function importBackup(file) {
        return readZipIndex(file).then(function (index) {
            if (!index) return importBackupWithJSZip(file);

            var manifestEntry = index["manifest.json"];
            if (!manifestEntry) throw new Error("Fichier de sauvegarde invalide (manifest.json manquant).");

            return zipEntryBlob(file, manifestEntry, "application/json")
                .then(readBlobText)
                .then(function (text) {
                    var manifest = JSON.parse(text);
                    var photos = manifest.photos || [];

                    // On vérifie tout AVANT d'effacer quoi que ce soit.
                    photos.forEach(function (entry) {
                        if (!index[entry.file]) {
                            throw new Error("Fichier de sauvegarde invalide (photo manquante : " + entry.file + ").");
                        }
                    });

                    var batches = [];
                    for (var i = 0; i < photos.length; i += IMPORT_BATCH_SIZE) {
                        batches.push(photos.slice(i, i + IMPORT_BATCH_SIZE));
                    }

                    return PhotoManager.clearAllPhotosAndArchive()
                        .then(function () {
                            return sequence(batches, function (batch) {
                                return Promise.all(batch.map(function (entry) {
                                    return zipEntryBlob(file, index[entry.file], "image/jpeg").then(function (blob) {
                                        return {
                                            store: entry.store,
                                            key: entry.key,
                                            buildingId: entry.buildingId,
                                            thumbnail: entry.thumbnail,
                                            timestamp: entry.timestamp,
                                            blob: blob
                                        };
                                    });
                                })).then(function (records) { return PhotoManager.putPhotoRecords(records); });
                            });
                        })
                        .then(function () { restoreLocalStorage(manifest.localStorage); });
                });
        });
    }

    return {
        exportBackup: exportBackup,
        importBackup: importBackup,
        autoBackupSilent: autoBackupSilent,
        exportZipFile: exportZipFile,
        createZipWriter: createZipWriter
    };

})();
