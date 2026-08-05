/* ============================================================
   ViZion — Export GitHub (repli)
   Helpers bas niveau pour pousser des fichiers (rapport.xlsx,
   photos.zip) dans un dossier du repo, via l'API Git Data de
   GitHub. Utilisé par js/report-export.js comme repli quand
   l'envoi email échoue.
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
       HELPERS BLOB
    ========================= */

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

    function buildFolderName(nomSite) {
        var now = new Date();
        var date = now.toISOString().slice(0, 10); // 2026-05-19
        var heure = now.toTimeString().slice(0, 5).replace(":", "h"); // 14h30

        var nom = (nomSite || "audit")
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ\s-]/g, "")
            .replace(/\s+/g, "_")
            .substring(0, 40);

        return "rapports/" + date + "_" + heure + "_" + (nom || "audit");
    }

    /* =========================
       PUSH GÉNÉRIQUE DE FICHIERS
    ========================= */

    // files = [{ path: "rapport.xlsx", blob: Blob }, { path: "photos.zip", blob: Blob }]
    function pushFiles(folderName, files, commitMessage, onProgress) {

        if (!hasToken()) {
            return Promise.reject(new Error("Token GitHub non configuré"));
        }

        var treeItems = [];

        if (onProgress) onProgress("Préparation des fichiers...");

        var chain = Promise.resolve();
        files.forEach(function (file) {
            chain = chain.then(function () {
                if (onProgress) onProgress("Upload de " + file.path + "...");
                return blobToBase64(file.blob).then(function (b64) {
                    return createBlob(b64).then(function (blob) {
                        treeItems.push({
                            path: folderName + "/" + file.path,
                            mode: "100644",
                            type: "blob",
                            sha: blob.sha
                        });
                    });
                });
            });
        });

        return chain.then(function () {

            if (onProgress) onProgress("Création du commit...");

            return getRef().then(function (ref) {
                var latestCommitSha = ref.object.sha;
                return getCommit(latestCommitSha).then(function (commit) {
                    var baseTreeSha = commit.tree.sha;
                    return createTree(baseTreeSha, treeItems).then(function (tree) {
                        return createCommit(commitMessage, tree.sha, latestCommitSha).then(function (newCommit) {
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
        blobToBase64: blobToBase64,
        buildFolderName: buildFolderName,
        pushFiles: pushFiles
    };

})();
