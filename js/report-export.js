/* ============================================================
   ViZion — Génération et envoi du rapport
   Construit rapport.xlsx (SheetJS) au format "Rapport type"
   (Page de garde / Lots de travaux / Observations) + photos.zip
   (JSZip), puis tente un envoi par email (EmailJS). En cas
   d'échec (ou EmailJS non configuré), repli automatique vers
   GitHub. Un lien de téléchargement local est toujours proposé.
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

    var PAGE_GARDE_HEADERS = ["Index", "Type construction", "Adresse", "Commune", "Zone PERENE", "Station Météo"];

    /* =========================
       INFOS SITE
    ========================= */

    function getSiteInfo() {
        return JSON.parse(localStorage.getItem("siteInfo")) || {};
    }

    function setSiteInfo(info) {
        localStorage.setItem("siteInfo", JSON.stringify(info));
    }

    /* =========================
       EMAILJS — CONFIG
    ========================= */

    function getEmailConfig() {
        return {
            serviceId: localStorage.getItem("emailjs_service_id") || "",
            templateId: localStorage.getItem("emailjs_template_id") || "",
            publicKey: localStorage.getItem("emailjs_public_key") || ""
        };
    }

    function setEmailConfig(cfg) {
        localStorage.setItem("emailjs_service_id", (cfg.serviceId || "").trim());
        localStorage.setItem("emailjs_template_id", (cfg.templateId || "").trim());
        localStorage.setItem("emailjs_public_key", (cfg.publicKey || "").trim());
    }

    function hasEmailConfig() {
        var cfg = getEmailConfig();
        return !!(cfg.serviceId && cfg.templateId && cfg.publicKey);
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
                siteInfo.commune || "",
                siteInfo.zonePerene || "",
                siteInfo.stationMeteo || ""
            ]
        ];
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
            var buildingRows = LotMapping.buildAllRows(building.donnees);
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
       ENVOI EMAIL (EmailJS)
    ========================= */

    function blobToBase64(blob) {
        return new Promise(function (resolve) {
            var reader = new FileReader();
            reader.onloadend = function () { resolve(reader.result.split(",")[1]); };
            reader.readAsDataURL(blob);
        });
    }

    // Nécessite un template EmailJS configuré avec 2 variables "pièce jointe"
    // (voir doc EmailJS > Attachments) nommées ici xlsx_attachment / zip_attachment,
    // et une variable destinataire "to_email". À adapter selon le template réel.
    function sendByEmail(email, xlsxBlob, zipBlob, siteInfo) {
        var cfg = getEmailConfig();
        if (!hasEmailConfig() || typeof emailjs === "undefined") {
            return Promise.reject(new Error("EmailJS non configuré"));
        }

        emailjs.init(cfg.publicKey);

        return Promise.all([
            blobToBase64(xlsxBlob),
            blobToBase64(zipBlob)
        ]).then(function (results) {
            return emailjs.send(cfg.serviceId, cfg.templateId, {
                to_email: email,
                site_nom: siteInfo.nom || "",
                xlsx_attachment: results[0],
                zip_attachment: results[1]
            });
        });
    }

    /* =========================
       REPLI GITHUB
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

    function sendReport(email, onProgress) {

        var siteInfo = getSiteInfo();

        if (onProgress) onProgress("Collecte des bâtiments...");

        return BuildingManager.collectAllBuildingsAuditData().then(function (buildingsAuditData) {

            if (onProgress) onProgress("Génération du rapport Excel...");
            var xlsxBlob = buildWorkbook(siteInfo, buildingsAuditData);

            if (onProgress) onProgress("Préparation des photos...");

            return BuildingManager.collectAllBuildingsPhotos().then(function (buildingsPhotos) {
                return buildPhotosZip(buildingsPhotos).then(function (zipBlob) {

                    var nbPhotos = buildingsPhotos.reduce(function (sum, b) { return sum + b.photos.length; }, 0);
                    var result = { xlsxBlob: xlsxBlob, zipBlob: zipBlob, nbPhotos: nbPhotos };

                    function tryGithub() {
                        return sendToGithub(xlsxBlob, zipBlob, siteInfo, onProgress).then(function (gh) {
                            result.channel = "github";
                            result.detail = (email ? "Email indisponible — " : "") + "Rapport envoyé sur GitHub.";
                            result.url = gh.url;
                            return result;
                        }).catch(function (err) {
                            // Aucun canal d'envoi disponible : on ne perd pas les fichiers pour autant.
                            console.warn("Envoi GitHub impossible également :", err);
                            result.channel = "local";
                            result.detail = "Envoi impossible (email et GitHub indisponibles) — fichiers téléchargés localement uniquement.";
                            return result;
                        });
                    }

                    var afterEmail = email
                        ? sendByEmail(email, xlsxBlob, zipBlob, siteInfo).then(function () {
                            result.channel = "email";
                            result.detail = "Rapport envoyé par email à " + email;
                            return result;
                        }).catch(function (err) {
                            console.warn("Envoi email impossible, repli GitHub :", err);
                            if (onProgress) onProgress("Email indisponible, envoi vers GitHub...");
                            return tryGithub();
                        })
                        : tryGithub();

                    // Le téléchargement local sert toujours de filet de sécurité,
                    // quel que soit le canal d'envoi effectivement utilisé.
                    return afterEmail.then(function (r) {
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
        getEmailConfig: getEmailConfig,
        setEmailConfig: setEmailConfig,
        hasEmailConfig: hasEmailConfig,
        buildWorkbook: buildWorkbook,
        buildPhotosZip: buildPhotosZip,
        sendReport: sendReport
    };

})();
