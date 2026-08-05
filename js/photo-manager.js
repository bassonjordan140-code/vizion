/* ============================================================
   ViZion — Photo Manager
   Gère la capture photo (caméra + galerie), le stockage
   IndexedDB et l'affichage des miniatures.
============================================================ */

window.PhotoManager = (function () {

    var DB_NAME = "vizion-photos";
    var DB_VERSION = 2;
    var STORE_NAME = "photos";
    var ARCHIVE_STORE_NAME = "photos_archive";
    var MAX_WIDTH = 1600;       // compression image pleine
    var THUMB_WIDTH = 300;      // miniature
    var JPEG_QUALITY = 0.8;

    var _db = null;

    /* =========================
       IndexedDB
    ========================= */

    function openDB() {
        if (_db) return Promise.resolve(_db);
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "key" });
                }
                if (!db.objectStoreNames.contains(ARCHIVE_STORE_NAME)) {
                    var archiveStore = db.createObjectStore(ARCHIVE_STORE_NAME, { keyPath: "archiveKey" });
                    archiveStore.createIndex("by_buildingId", "buildingId", { unique: false });
                }
            };
            req.onsuccess = function (e) {
                _db = e.target.result;
                resolve(_db);
            };
            req.onerror = function () { reject(req.error); };
        });
    }

    function savePhoto(key, blob, thumbnail) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).put({
                    key: key,
                    blob: blob,
                    thumbnail: thumbnail,
                    timestamp: Date.now()
                });
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    function loadThumbnail(key) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readonly");
                var req = tx.objectStore(STORE_NAME).get(key);
                req.onsuccess = function () {
                    resolve(req.result ? req.result.thumbnail : null);
                };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    function deletePhoto(key) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).delete(key);
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    /* =========================
       Archive par bâtiment
       Le store "photos" représente toujours le bâtiment actif ;
       "photos_archive" conserve les photos des autres bâtiments.
    ========================= */

    function getAllPhotos() {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var req = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    function clearPhotos() {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction(STORE_NAME, "readwrite");
                tx.objectStore(STORE_NAME).clear();
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // Déplace tout le store actif vers l'archive, tagué buildingId, puis vide le store actif.
    function archivePhotosForBuilding(buildingId) {
        return getAllPhotos().then(function (photos) {
            if (!photos.length) return clearPhotos();
            return openDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx = db.transaction(ARCHIVE_STORE_NAME, "readwrite");
                    var store = tx.objectStore(ARCHIVE_STORE_NAME);
                    photos.forEach(function (photo) {
                        store.put({
                            archiveKey: buildingId + "::" + photo.key,
                            buildingId: buildingId,
                            key: photo.key,
                            blob: photo.blob,
                            thumbnail: photo.thumbnail,
                            timestamp: photo.timestamp
                        });
                    });
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { reject(tx.error); };
                });
            }).then(clearPhotos);
        });
    }

    // Lit l'archive d'un bâtiment sans toucher au store actif (utilisé pour l'export du rapport).
    function getArchivedPhotosForBuilding(buildingId) {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var index = db.transaction(ARCHIVE_STORE_NAME, "readonly")
                    .objectStore(ARCHIVE_STORE_NAME).index("by_buildingId");
                var req = index.getAll(buildingId);
                req.onsuccess = function () { resolve(req.result || []); };
                req.onerror = function () { reject(req.error); };
            });
        });
    }

    // Vide entièrement le store actif ET l'archive (remise à zéro complète, tous bâtiments confondus).
    function clearAllPhotosAndArchive() {
        return openDB().then(function (db) {
            return new Promise(function (resolve, reject) {
                var tx = db.transaction([STORE_NAME, ARCHIVE_STORE_NAME], "readwrite");
                tx.objectStore(STORE_NAME).clear();
                tx.objectStore(ARCHIVE_STORE_NAME).clear();
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    }

    // Réinjecte l'archive d'un bâtiment dans le store actif (le store actif est vide à cet instant).
    function restorePhotosForBuilding(buildingId) {
        return getArchivedPhotosForBuilding(buildingId).then(function (archived) {
            if (!archived.length) return;
            return openDB().then(function (db) {
                return new Promise(function (resolve, reject) {
                    var tx = db.transaction(STORE_NAME, "readwrite");
                    var store = tx.objectStore(STORE_NAME);
                    archived.forEach(function (photo) {
                        store.put({
                            key: photo.key,
                            blob: photo.blob,
                            thumbnail: photo.thumbnail,
                            timestamp: photo.timestamp
                        });
                    });
                    tx.oncomplete = function () { resolve(); };
                    tx.onerror = function () { reject(tx.error); };
                });
            });
        });
    }

    /* =========================
       Image processing
    ========================= */

    function resizeImage(file, maxW, quality) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = new Image();
                img.onload = function () {
                    var w = img.width;
                    var h = img.height;
                    if (w > maxW) {
                        h = Math.round(h * maxW / w);
                        w = maxW;
                    }
                    var canvas = document.createElement("canvas");
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                    canvas.toBlob(function (blob) {
                        resolve(blob);
                    }, "image/jpeg", quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function generateThumbnail(file) {
        return resizeImage(file, THUMB_WIDTH, 0.7).then(function (blob) {
            return new Promise(function (resolve) {
                var reader = new FileReader();
                reader.onload = function (e) { resolve(e.target.result); };
                reader.readAsDataURL(blob);
            });
        });
    }

    /* =========================
       Widget HTML
    ========================= */

    function createPhotoWidget(photoKey) {
        return '<div class="photo-widget" data-photo-key="' + photoKey + '">' +
            '<div class="photo-widget-preview hidden">' +
                '<img class="photo-widget-thumb" src="" alt="Photo">' +
                '<button type="button" class="photo-widget-delete" aria-label="Supprimer la photo">✕</button>' +
            '</div>' +
            '<label class="photo-widget-capture">' +
                '<input type="file" accept="image/*" class="photo-widget-input">' +
                '<span class="photo-widget-label">📷 Prendre / choisir une photo</span>' +
            '</label>' +
        '</div>';
    }

    /* =========================
       Widget binding
    ========================= */

    function bindWidget(widget) {
        var key = widget.getAttribute("data-photo-key");
        if (!key) return;

        var preview = widget.querySelector(".photo-widget-preview");
        var thumb = widget.querySelector(".photo-widget-thumb");
        var capture = widget.querySelector(".photo-widget-capture");
        var input = widget.querySelector(".photo-widget-input");
        var deleteBtn = widget.querySelector(".photo-widget-delete");

        // Charger miniature existante
        loadThumbnail(key).then(function (dataUrl) {
            if (dataUrl) {
                thumb.src = dataUrl;
                preview.classList.remove("hidden");
                capture.classList.add("hidden");
            }
        });

        // Capture / upload
        input.addEventListener("change", function () {
            var file = input.files[0];
            if (!file) return;

            Promise.all([
                resizeImage(file, MAX_WIDTH, JPEG_QUALITY),
                generateThumbnail(file)
            ]).then(function (results) {
                var compressedBlob = results[0];
                var thumbnailUrl = results[1];

                return savePhoto(key, compressedBlob, thumbnailUrl).then(function () {
                    thumb.src = thumbnailUrl;
                    preview.classList.remove("hidden");
                    capture.classList.add("hidden");
                });
            });
        });

        // Suppression
        deleteBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            deletePhoto(key).then(function () {
                thumb.src = "";
                preview.classList.add("hidden");
                capture.classList.remove("hidden");
                input.value = "";
            });
        });
    }

    function bindAll(container) {
        var root = container || document;
        var widgets = root.querySelectorAll(".photo-widget");
        widgets.forEach(function (w) { bindWidget(w); });
    }

    /* =========================
       Page init helper
    ========================= */

    // Remplace tous les <div class="photo-slot" data-photo-field="xxx">
    // par un vrai widget avec la clé complète module_numero_field
    function initPage(moduleId, numero) {
        var slots = document.querySelectorAll(".photo-slot[data-photo-field]");
        slots.forEach(function (slot) {
            var field = slot.getAttribute("data-photo-field");
            var key = moduleId + "_" + numero + "_" + field;
            slot.innerHTML = createPhotoWidget(key);
        });
        // Bind les widgets statiques
        bindAll();
    }

    /* =========================
       API publique
    ========================= */

    return {
        openDB: openDB,
        createPhotoWidget: createPhotoWidget,
        bindWidget: bindWidget,
        bindAll: bindAll,
        initPage: initPage,
        savePhoto: savePhoto,
        loadThumbnail: loadThumbnail,
        deletePhoto: deletePhoto,
        archivePhotosForBuilding: archivePhotosForBuilding,
        restorePhotosForBuilding: restorePhotosForBuilding,
        getArchivedPhotosForBuilding: getArchivedPhotosForBuilding,
        clearPhotos: clearPhotos,
        clearAllPhotosAndArchive: clearAllPhotosAndArchive
    };

})();
