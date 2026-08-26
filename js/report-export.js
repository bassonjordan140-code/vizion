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

    var PAGE_GARDE_HEADERS = ["Index", "Type construction", "Adresse"];

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
                siteInfo.adresse || ""
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
       EXPORT JSON BRUT (toutes les données de l'audit)
       Contrairement au rapport.xlsx (résumé "Observations" construit par
       LotMapping), ce fichier contient les fiches telles que saisies :
       parois, ouvrants, protections solaires, toggles oui/non, cycles de
       machines, etc. — utile pour ré-exploiter l'audit ailleurs qu'Excel.
    ========================= */

    // buildingsAuditData = [{ id, nom, donnees, customLabels }, ...].
    function buildAuditJSON(siteInfo, buildingsAuditData) {
        var audit = {
            meta: {
                exportDate: new Date().toISOString(),
                exportDateFormatted: new Date().toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                })
            },
            siteInfo: siteInfo,
            batiments: buildingsAuditData.map(function (b) {
                return {
                    id: b.id,
                    nom: b.nom,
                    secteurs: b.donnees,
                    secteursPersonnalisesLabels: b.customLabels
                };
            })
        };
        return new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
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

    function sendToGithub(xlsxBlob, zipBlob, jsonBlob, siteInfo, onProgress) {
        var folderName = ExportGitHub.buildFolderName(siteInfo.nom);
        var msg = "📋 Rapport audit — " + new Date().toLocaleDateString("fr-FR");
        return ExportGitHub.pushFiles(folderName, [
            { path: "rapport.xlsx", blob: xlsxBlob },
            { path: "audit.json", blob: jsonBlob },
            { path: "photos.zip", blob: zipBlob }
        ], msg, onProgress);
    }

    /* =========================
       TÉLÉCHARGEMENT LOCAL
    ========================= */

    // Sur le web, trois téléchargements séparés (le navigateur gère très bien
    // plusieurs fichiers à la suite). Dans l'app native, un lien <a download>
    // ne déclenche rien (voir BackupManager.saveOrShareBlob) : on regroupe
    // alors les 3 fichiers dans une seule archive, pour n'ouvrir qu'UNE seule
    // fois la feuille de partage native plutôt que trois fois d'affilée.
    function deliverReportFiles(xlsxBlob, jsonBlob, zipBlob) {
        var Filesystem = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() &&
            window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;

        if (!Filesystem) {
            var url1 = URL.createObjectURL(xlsxBlob);
            var url2 = URL.createObjectURL(jsonBlob);
            var url3 = URL.createObjectURL(zipBlob);
            [[url1, "rapport.xlsx"], [url2, "audit.json"], [url3, "photos.zip"]].forEach(function (pair) {
                var a = document.createElement("a");
                a.href = pair[0];
                a.download = pair[1];
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });
            setTimeout(function () {
                URL.revokeObjectURL(url1);
                URL.revokeObjectURL(url2);
                URL.revokeObjectURL(url3);
            }, 10000);
            return Promise.resolve();
        }

        var stamp = new Date().toISOString().slice(0, 10);
        var bundle = new JSZip();
        bundle.file("rapport.xlsx", xlsxBlob);
        bundle.file("audit.json", jsonBlob);
        bundle.file("photos.zip", zipBlob);
        return bundle.generateAsync({ type: "blob" }).then(function (bundleBlob) {
            return BackupManager.saveOrShareBlob(bundleBlob, "vizion-rapport-" + stamp + ".zip");
        });
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

            if (onProgress) onProgress("Génération du JSON complet...");
            var jsonBlob = buildAuditJSON(siteInfo, buildingsAuditData);

            if (onProgress) onProgress("Préparation des photos...");

            return BuildingManager.collectAllBuildingsPhotos().then(function (buildingsPhotos) {
                return buildPhotosZip(buildingsPhotos).then(function (zipBlob) {

                    var nbPhotos = buildingsPhotos.reduce(function (sum, b) { return sum + b.photos.length; }, 0);
                    var result = { xlsxBlob: xlsxBlob, zipBlob: zipBlob, jsonBlob: jsonBlob, nbPhotos: nbPhotos, channel: "local", detail: "Rapport téléchargé sur cet appareil." };

                    // Le repli GitHub est optionnel (nécessite un token configuré) : s'il échoue
                    // ou n'est pas configuré, le téléchargement local reste toujours disponible.
                    var afterGithub = ExportGitHub.getToken()
                        ? sendToGithub(xlsxBlob, zipBlob, jsonBlob, siteInfo, onProgress).then(function (gh) {
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
                        return deliverReportFiles(r.xlsxBlob, r.jsonBlob, r.zipBlob).then(function () {
                            return r;
                        });
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
        buildAuditJSON: buildAuditJSON,
        buildPhotosZip: buildPhotosZip,
        sendReport: sendReport
    };

})();
