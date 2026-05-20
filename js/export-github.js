/* ============================================================
   ViZion — Export GitHub
   Collecte toutes les données d'audit + photos IndexedDB
   et pousse un dossier structuré sur GitHub via l'API.
============================================================ */

window.ExportGitHub = (function () {

    var REPO_OWNER = "bassonjordan140-code";
    var REPO_NAME = "vizion";
    var BRANCH = "main";
    var API_BASE = "https://api.github.com";

    /* =========================
       TOKEN
    ========================= */

    function getToken() {
        return localStorage.getItem("github_token") || "";
    }

    function setToken(token) {
        localStorage.setItem("github_token", token.trim());
    }

    function hasToken() {
        return getToken().length > 0;
    }

    /* =========================
       HELPERS API
    ========================= */

    function apiHeaders() {
        return {
            "Authorization": "Bearer " + getToken(),
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json"
        };
    }

    function getRef() {
        return fetch(API_BASE + "/repos/" + REPO_OWNER + "/" + REPO_NAME + "/git/ref/heads/" + BRANCH, {
            headers: apiHeaders()
        }).then(function (r) { return r.json(); });
    }

    function getCommit(sha) {
        return fetch(API_BASE + "/repos/" + REPO_OWNER + "/" + REPO_NAME + "/git/commits/" + sha, {
            headers: apiHeaders()
        }).then(function (r) { return r.json(); });
    }

    function createBlob(contentBase64) {
        return fetch(API_BASE + "/repos/" + REPO_OWNER + "/" + REPO_NAME + "/git/blobs", {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({
                content: contentBase64,
                encoding: "base64"
            })
        }).then(function (r) { return r.json(); });
    }

    function createTree(baseTreeSha, treeItems) {
        return fetch(API_BASE + "/repos/" + REPO_OWNER + "/" + REPO_NAME + "/git/trees", {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems
            })
        }).then(function (r) { return r.json(); });
    }

    function createCommit(message, treeSha, parentSha) {
        return fetch(API_BASE + "/repos/" + REPO_OWNER + "/" + REPO_NAME + "/git/commits", {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify({
                message: message,
                tree: treeSha,
                parents: [parentSha]
            })
        }).then(function (r) { return r.json(); });
    }

    function updateRef(commitSha) {
        return fetch(API_BASE + "/repos/" + REPO_OWNER + "/" + REPO_NAME + "/git/refs/heads/" + BRANCH, {
            method: "PATCH",
            headers: apiHeaders(),
            body: JSON.stringify({ sha: commitSha })
        }).then(function (r) { return r.json(); });
    }

    /* =========================
       COLLECTE DES DONNÉES
    ========================= */

    function collectAuditData() {

        var selectedModules = JSON.parse(localStorage.getItem("selectedModules")) || [];

        var moduleDataKeys = {
            hebergements: "hebergementsData",
            piscines: "piscinesData",
            restaurant: "restaurantData",
            bar: "barData",
            spa: "spaData",
            buanderie: "buanderieData",
            cuisine: "cuisineData",
            jeux: "jeuxData",
            reunion: "reunionData",
            sport: "sportData",
            bureaux: "bureauxData",
            parking: "parkingData"
        };

        var audit = {
            meta: {
                exportDate: new Date().toISOString(),
                exportDateFormatted: new Date().toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                }),
                appVersion: "0.1"
            },
            modulesSelectionnes: selectedModules,
            donnees: {}
        };

        selectedModules.forEach(function (mod) {
            var key = moduleDataKeys[mod.id];
            if (key) {
                var data = JSON.parse(localStorage.getItem(key));
                if (data) {
                    audit.donnees[mod.id] = data;
                }
            }
        });

        return audit;
    }

    /* =========================
       COLLECTE DES PHOTOS
    ========================= */

    function collectAllPhotos() {
        return new Promise(function (resolve, reject) {
            var req = indexedDB.open("vizion-photos", 1);
            req.onerror = function () { resolve([]); };
            req.onsuccess = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains("photos")) {
                    resolve([]);
                    return;
                }
                var tx = db.transaction("photos", "readonly");
                var store = tx.objectStore("photos");
                var getAll = store.getAll();
                getAll.onsuccess = function () {
                    resolve(getAll.result || []);
                };
                getAll.onerror = function () { resolve([]); };
            };
        });
    }

    function blobToBase64(blob) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onloadend = function () {
                // Retirer le préfixe "data:...;base64,"
                var base64 = reader.result.split(",")[1];
                resolve(base64);
            };
            reader.readAsDataURL(blob);
        });
    }

    /* =========================
       NOM DU DOSSIER
    ========================= */

    function buildFolderName() {
        var now = new Date();
        var date = now.toISOString().slice(0, 10); // 2026-05-19
        var heure = now.toTimeString().slice(0, 5).replace(":", "h"); // 14h30

        // Tenter de trouver un nom d'établissement
        var selectedModules = JSON.parse(localStorage.getItem("selectedModules")) || [];
        var nomSite = "audit";

        // Chercher le nom dans les données d'hébergement ou autre
        var hebergData = JSON.parse(localStorage.getItem("hebergementsData"));
        if (hebergData) {
            var firstKey = Object.keys(hebergData)[0];
            if (firstKey && hebergData[firstKey].nom) {
                nomSite = hebergData[firstKey].nom;
            }
        }

        // Nettoyer le nom (pas de caractères spéciaux)
        nomSite = nomSite
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 40);

        return "rapports/" + date + "_" + heure + "_" + nomSite;
    }

    /* =========================
       EXPORT PRINCIPAL
    ========================= */

    function exportToGitHub(onProgress) {

        if (!hasToken()) {
            return Promise.reject(new Error("Token GitHub non configuré"));
        }

        var folderName = buildFolderName();
        var treeItems = [];

        if (onProgress) onProgress("Collecte des données...");

        var auditData = collectAuditData();

        // 1. Créer le blob JSON
        var jsonString = JSON.stringify(auditData, null, 2);
        var jsonBase64 = btoa(unescape(encodeURIComponent(jsonString)));

        return collectAllPhotos().then(function (photos) {

            if (onProgress) onProgress("Préparation de " + photos.length + " photo(s)...");

            // Ajouter les noms de fichiers photos dans le JSON
            var photoIndex = [];
            photos.forEach(function (photo, idx) {
                var num = String(idx + 1).padStart(3, "0");
                var filename = num + "_" + photo.key + ".jpg";
                photoIndex.push({
                    numero: idx + 1,
                    fichier: filename,
                    cle: photo.key,
                    date: photo.timestamp ? new Date(photo.timestamp).toISOString() : null
                });
            });

            // Mettre à jour le JSON avec l'index photos
            auditData.photosIndex = photoIndex;
            auditData.meta.nbPhotos = photos.length;
            jsonString = JSON.stringify(auditData, null, 2);
            jsonBase64 = btoa(unescape(encodeURIComponent(jsonString)));

            // 2. Créer les blobs (JSON + photos)
            if (onProgress) onProgress("Upload du fichier JSON...");

            return createBlob(jsonBase64).then(function (jsonBlob) {

                treeItems.push({
                    path: folderName + "/audit.json",
                    mode: "100644",
                    type: "blob",
                    sha: jsonBlob.sha
                });

                // 3. Upload les photos une par une
                var chain = Promise.resolve();
                photos.forEach(function (photo, idx) {
                    chain = chain.then(function () {
                        if (onProgress) onProgress("Upload photo " + (idx + 1) + "/" + photos.length + "...");
                        return blobToBase64(photo.blob).then(function (b64) {
                            return createBlob(b64).then(function (photoBlob) {
                                var num = String(idx + 1).padStart(3, "0");
                                var filename = num + "_" + photo.key + ".jpg";
                                treeItems.push({
                                    path: folderName + "/photos/" + filename,
                                    mode: "100644",
                                    type: "blob",
                                    sha: photoBlob.sha
                                });
                            });
                        });
                    });
                });

                return chain;
            });

        }).then(function () {

            // 4. Créer l'arbre et le commit
            if (onProgress) onProgress("Création du commit...");

            return getRef().then(function (ref) {
                var latestCommitSha = ref.object.sha;
                return getCommit(latestCommitSha).then(function (commit) {
                    var baseTreeSha = commit.tree.sha;
                    return createTree(baseTreeSha, treeItems).then(function (tree) {
                        var msg = "📋 Export audit — " + new Date().toLocaleDateString("fr-FR") +
                                  " (" + treeItems.length + " fichier(s))";
                        return createCommit(msg, tree.sha, latestCommitSha).then(function (newCommit) {
                            return updateRef(newCommit.sha);
                        });
                    });
                });
            });

        }).then(function () {

            if (onProgress) onProgress("Terminé !");

            return {
                success: true,
                folder: folderName,
                url: "https://github.com/" + REPO_OWNER + "/" + REPO_NAME + "/tree/" + BRANCH + "/" + folderName,
                nbFiles: treeItems.length
            };
        });
    }

    /* =========================
       API PUBLIQUE
    ========================= */

    return {
        getToken: getToken,
        setToken: setToken,
        hasToken: hasToken,
        collectAuditData: collectAuditData,
        exportToGitHub: exportToGitHub
    };

})();
