/* ============================================================
   ViZion — Génération et envoi du rapport
   Construit rapport.xlsx (SheetJS) au format "Rapport type"
   (Page de garde / Lots de travaux / Observations) + photos.zip
   (JSZip). Le rapport est toujours téléchargé directement sur
   l'appareil ; un repli GitHub optionnel (token configuré par
   l'utilisateur) en conserve aussi une copie en ligne.
============================================================ */

window.ReportExport = (function () {

    var OBSERVATIONS_HEADERS = [
        "Numéro", "Localisation", "X / Latitude", "Y / Longitude", "Posé le",
        "Bâtiment", "Secteur", "Puissance unitaire", "Nombre", "État",
        "Description", "Plan", "Visite", "short:Date de pose", "Visite levée",
        "Date de levée", "Lot", "Lot:Nom", "Lot:ABR", "Lot:Contact",
        "Lot:Entreprise", "Statut", "Couleur", "Formulaire d'origine",
        "Nom du formulaire saisi"
    ];

    var LOTS_HEADERS = ["Index", "Nom", "Contact", "Tel", "ABR", "Email", "Entreprise", "Adresse"];

    var PAGE_GARDE_HEADERS = ["Index", "Type construction", "Adresse", "Centrale PV", "Puissance PV (W)"];

    var CONTACTS_HEADERS = ["Rôle", "Nom", "Téléphone", "ABR", "Email", "Adresse", "Entreprise"];

    /* =========================
       INFOS SITE
    ========================= */

    function getSiteInfo() {
        return JSON.parse(localStorage.getItem("siteInfo")) || {};
    }

    function setSiteInfo(info) {
        localStorage.setItem("siteInfo", JSON.stringify(info));
    }

    function photoFileName(photo, idx) {
        return String(idx + 1).padStart(3, "0") + "_" + photo.key + ".jpg";
    }

    /* =========================
       CONSTRUCTION DU CLASSEUR XLSX
    ========================= */

    // buildingsAuditData = [{ id, nom, donnees }, ...] — une entrée par bâtiment
    // (voir BuildingManager.collectAllBuildingsAuditData).
    function buildWorkbook(siteInfo, buildingsAuditData) {

        var wb = XLSX.utils.book_new();

        // --- Page de garde --- (niveau hôtel, ne varie pas par bâtiment)
        var pageGardeData = [
            PAGE_GARDE_HEADERS,
            [
                siteInfo.nom || "Audit ViZion",
                siteInfo.typeConstruction || "",
                siteInfo.adresse || "",
                siteInfo.centralePvPresente ? "Oui" : "Non",
                siteInfo.centralePvPresente ? (siteInfo.centralePvPuissance || 0) : ""
            ],
            [],
            CONTACTS_HEADERS
        ];
        var contacts = siteInfo.contacts || [];
        contacts.forEach(function (contact) {
            pageGardeData.push([
                contact.role || "",
                contact.nom || "",
                contact.telephone || "",
                contact.abr || "",
                contact.email || "",
                contact.adresse || "",
                contact.entreprise || ""
            ]);
        });
        var wsPageGarde = XLSX.utils.aoa_to_sheet(pageGardeData);
        XLSX.utils.book_append_sheet(wb, wsPageGarde, "Page de garde");

        // --- Lots de travaux ---
        var lotsData = [LOTS_HEADERS];
        LotMapping.LOTS.forEach(function (lot) {
            lotsData.push([lot.code, lot.nom, "", "", "", "", "", ""]);
        });
        var wsLots = XLSX.utils.aoa_to_sheet(lotsData);
        XLSX.utils.book_append_sheet(wb, wsLots, "Lots de travaux");

        // --- Observations --- (toutes les lignes de tous les bâtiments, une seule numérotation)
        var rows = [];
        buildingsAuditData.forEach(function (building) {
            var buildingRows = LotMapping.buildAllRows(building.donnees, building.customLabels);
            buildingRows.forEach(function (row) { row.batiment = building.nom; });
            rows = rows.concat(buildingRows);
        });

        var obsData = [OBSERVATIONS_HEADERS];
        rows.forEach(function (row, idx) {
            obsData.push([
                idx + 1,
                row.localisation,
                "",
                "",
                "",
                row.batiment || "",
                row.secteur,
                row.puissance === null ? "" : row.puissance,
                row.nombre === null ? "" : row.nombre,
                "",
                row.description,
                "",
                "",
                "",
                "",
                "",
                row.lot,
                row.lotNom,
                "",
                "",
                "",
                "",
                "",
                row.formulaireOrigine,
                row.nomFormulaire
            ]);
        });
        var wsObs = XLSX.utils.aoa_to_sheet(obsData);
        XLSX.utils.book_append_sheet(wb, wsObs, "Observations");

        var wbArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        return new Blob([wbArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    }

    /* =========================
       CONSTRUCTION DU ZIP PHOTOS
    ========================= */

    // buildingsPhotos = [{ id, nom, photos }, ...] — voir BuildingManager.collectAllBuildingsPhotos.
    // Un sous-dossier par bâtiment dans le zip, pour éviter toute collision de nom de fichier.
    function buildPhotosZip(buildingsPhotos) {
        var zip = new JSZip();
        buildingsPhotos.forEach(function (building) {
            if (!building.photos.length) return;
            var folder = zip.folder((building.nom || building.id).replace(/[\\/]/g, "-"));
            building.photos.forEach(function (photo, idx) {
                folder.file(photoFileName(photo, idx), photo.blob);
            });
        });
        return zip.generateAsync({ type: "blob" });
    }

    /* =========================
       REPLI GITHUB (optionnel)
    ========================= */

    function sendToGithub(xlsxBlob, zipBlob, siteInfo, onProgress) {
        var folderName = ExportGitHub.buildFolderName(siteInfo.nom);
        var msg = "📋 Rapport audit — " + new Date().toLocaleDateString("fr-FR");
        return ExportGitHub.pushFiles(folderName, [
            { path: "rapport.xlsx", blob: xlsxBlob },
            { path: "photos.zip", blob: zipBlob }
        ], msg, onProgress);
    }

    /* =========================
       TÉLÉCHARGEMENT LOCAL
    ========================= */

    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    }

    /* =========================
       ORCHESTRATION
    ========================= */

    function sendReport(onProgress) {

        var siteInfo = getSiteInfo();

        if (onProgress) onProgress("Collecte des bâtiments...");

        return BuildingManager.collectAllBuildingsAuditData().then(function (buildingsAuditData) {

            if (onProgress) onProgress("Génération du rapport Excel...");
            var xlsxBlob = buildWorkbook(siteInfo, buildingsAuditData);

            if (onProgress) onProgress("Préparation des photos...");

            return BuildingManager.collectAllBuildingsPhotos().then(function (buildingsPhotos) {
                return buildPhotosZip(buildingsPhotos).then(function (zipBlob) {

                    var nbPhotos = buildingsPhotos.reduce(function (sum, b) { return sum + b.photos.length; }, 0);
                    var result = { xlsxBlob: xlsxBlob, zipBlob: zipBlob, nbPhotos: nbPhotos, channel: "local", detail: "Rapport téléchargé sur cet appareil." };

                    // Le repli GitHub est optionnel (nécessite un token configuré) : s'il échoue
                    // ou n'est pas configuré, le téléchargement local reste toujours disponible.
                    var afterGithub = ExportGitHub.getToken()
                        ? sendToGithub(xlsxBlob, zipBlob, siteInfo, onProgress).then(function (gh) {
                            result.channel = "github";
                            result.detail = "Rapport téléchargé sur cet appareil, et copié sur GitHub.";
                            result.url = gh.url;
                            return result;
                        }).catch(function (err) {
                            console.warn("Envoi GitHub impossible :", err);
                            return result;
                        })
                        : Promise.resolve(result);

                    return afterGithub.then(function (r) {
                        downloadBlob(r.xlsxBlob, "rapport.xlsx");
                        downloadBlob(r.zipBlob, "photos.zip");
                        return r;
                    });
                });
            });
        });
    }

    /* =========================
       API PUBLIQUE
    ========================= */

    return {
        getSiteInfo: getSiteInfo,
        setSiteInfo: setSiteInfo,
        buildWorkbook: buildWorkbook,
        buildPhotosZip: buildPhotosZip,
        sendReport: sendReport
    };

})();
