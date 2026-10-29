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

    var FONCTIONNEMENT_HEADERS = [
        "Bâtiment", "Secteur", "Localisation", "Lot", "Lot:Nom",
        "Heures par jour", "Jours par an", "Heures par an", "Simultanéité", "Taux d'utilisation"
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

        // --- Fonctionnement --- (régime par lot : heures, simultanéité, taux d'utilisation).
        // Feuille ajoutée seulement si au moins un régime a été saisi : sans saisie,
        // le classeur reste exactement celui d'avant.
        var fonctionnementData = [FONCTIONNEMENT_HEADERS];
        buildingsAuditData.forEach(function (building) {
            buildFonctionnement(building).forEach(function (f) {
                fonctionnementData.push([
                    building.nom, f.secteur, f.localisation, f.lot, f.lotNom,
                    f.heuresParJour === null ? "" : f.heuresParJour,
                    f.joursParAn === null ? "" : f.joursParAn,
                    f.heuresParAn === null ? "" : f.heuresParAn,
                    f.simultaneite === null ? "" : f.simultaneite,
                    f.tauxUtilisation === null ? "" : f.tauxUtilisation
                ]);
            });
        });
        if (fonctionnementData.length > 1) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(fonctionnementData), "Fonctionnement");
        }

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

    // Fiches d'un bâtiment à plat : [{ moduleId, numero, fiche }, ...] — mêmes
    // règles que LotMapping.buildAllRows (modules inconnus ignorés).
    function listFiches(building) {
        var fiches = [];
        Object.keys(building.donnees || {}).forEach(function (moduleId) {
            var moduleData = building.donnees[moduleId] || {};
            Object.keys(moduleData).forEach(function (numero) {
                if (moduleData[numero]) fiches.push({ moduleId: moduleId, numero: numero, fiche: moduleData[numero] });
            });
        });
        return fiches;
    }

    function ratio(percent) {
        return typeof percent === "number" ? Math.round(percent) / 100 : null;
    }

    // Régime de fonctionnement saisi sur la fiche, par lot : heures par jour, jours
    // par an, heures par an (calculées), simultanéité et taux d'utilisation en
    // fractions de 1 (0,7 = 70 %). Les valeurs non saisies sont null.
    function regimesByLot(fiche) {
        var byLot = {};
        ((fiche.complements && fiche.complements.regimes) || []).forEach(function (r) {
            if (!r.lot) return;
            var hj = typeof r.heuresParJour === "number" ? r.heuresParJour : null;
            var ja = typeof r.joursParAn === "number" ? r.joursParAn : null;
            byLot[r.lot] = {
                heuresParJour: hj,
                joursParAn: ja,
                heuresParAn: hj !== null && ja !== null ? Math.round(hj * ja * 10) / 10 : null,
                simultaneite: ratio(r.simultaneite),
                tauxUtilisation: ratio(r.tauxUtilisation)
            };
        });
        return byLot;
    }

    // Une ligne par équipement, avec son lot de travaux (toujours renseigné pour
    // les familles connues), sa puissance unitaire EN WATTS quelle que soit l'unité
    // de saisie de la fiche, et le régime de fonctionnement de son lot.
    function buildLignes(building) {
        if (!window.LotMapping || !LotMapping.extractFiche) return [];
        var lignes = [];
        listFiches(building).forEach(function (entry) {
            var label = building.customLabels && building.customLabels[entry.moduleId];
            var regimes = regimesByLot(entry.fiche);
            LotMapping.extractFiche(entry.moduleId, entry.fiche, entry.numero, label).forEach(function (row) {
                lignes.push({
                    fiche: entry.moduleId + "_" + entry.numero,
                    secteur: row.secteur,
                    localisation: row.localisation,
                    description: row.description,
                    nombre: row.nombre,
                    puissanceUnitaireW: row.puissanceW,
                    lot: row.lot || null,
                    lotNom: row.lotNom || null,
                    fonctionnement: (row.lot && regimes[row.lot]) || null
                });
            });
        });
        return lignes;
    }

    // Lignes de la feuille "Fonctionnement" : un régime par lot et par fiche.
    function buildFonctionnement(building) {
        var out = [];
        listFiches(building).forEach(function (entry) {
            var regimes = regimesByLot(entry.fiche);
            Object.keys(regimes).forEach(function (lot) {
                var secteur = (window.SECTEURS || []).filter(function (s) { return s.id === entry.moduleId; })[0];
                var custom = building.customLabels && building.customLabels[entry.moduleId];
                var r = regimes[lot];
                out.push({
                    secteur: (secteur && secteur.label) || custom || entry.moduleId,
                    localisation: entry.fiche.nom || (entry.moduleId + " " + entry.numero),
                    lot: lot,
                    lotNom: window.LotMapping ? LotMapping.lotNom(lot) : "",
                    heuresParJour: r.heuresParJour,
                    joursParAn: r.joursParAn,
                    heuresParAn: r.heuresParAn,
                    simultaneite: r.simultaneite,
                    tauxUtilisation: r.tauxUtilisation
                });
            });
        });
        return out;
    }

    // Calcul thermique des parois d'une fiche hébergement : λ, masse volumique et
    // chaleur spécifique de chaque couche (bibliothèque de matériaux), Rth, U et
    // facteur solaire. Rien n'est calculé si une couche manque de données.
    function buildThermique(building) {
        if (!window.MateriauxThermiques) return [];
        var out = [];
        listFiches(building).forEach(function (entry) {
            if (entry.moduleId !== "hebergements") return;
            var fiche = entry.fiche;
            var complements = fiche.complements || {};
            var verticales = fiche.parois && fiche.parois.length
                ? MateriauxThermiques.calculerParoi(fiche.parois, "verticale",
                    complements.enveloppe && complements.enveloppe.couleurFacade)
                : null;

            var horizontales = [];
            ["Toiture", "Plancher haut", "Plancher bas"].forEach(function (type) {
                var couches = (complements.parois_horizontales || []).filter(function (c) { return c.paroi === type; });
                if (!couches.length) return;
                var couleur = (couches.filter(function (c) { return c.couleurExterieure; })[0] || {}).couleurExterieure;
                horizontales.push(MateriauxThermiques.calculerParoi(couches, type.toLowerCase(), couleur));
            });

            if (verticales || horizontales.length) {
                out.push({
                    fiche: entry.moduleId + "_" + entry.numero,
                    localisation: fiche.nom || ("Hébergement " + entry.numero),
                    parois: { verticales: verticales, horizontales: horizontales }
                });
            }
        });
        return out;
    }

    // Champs qui valent "" ou 0 tant que personne ne les a renseignés : dans
    // l'export, null veut dire "non relevé" et ne se confond plus avec un vrai zéro.
    var UNSET_WHEN_EMPTY_TEXT = { periode: true, periodeChauffage: true };
    var UNSET_WHEN_ZERO = { nbChambres: true, cyclesLaveLinge: true, cyclesSecheLinge: true };

    function markUnset(node) {
        if (Array.isArray(node)) return node.map(markUnset);
        if (!node || typeof node !== "object") return node;
        var out = {};
        Object.keys(node).forEach(function (key) {
            var value = node[key];
            if (UNSET_WHEN_EMPTY_TEXT[key] && value === "") out[key] = null;
            else if (UNSET_WHEN_ZERO[key] && value === 0) out[key] = null;
            else out[key] = markUnset(value);
        });
        return out;
    }

    function slug(text) {
        return String(text || "").toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    }

    // Identifiant stable de l'hôtel : numéro dans le référentiel des hôtels
    // (js/hotels-data.js, liste qui ne fait que s'allonger) + nom du référentiel.
    function hotelIdentity(siteInfo) {
        var index = window.HotelManager ? HotelManager.getCurrentHotelIndex() : "";
        var ref = index !== "" && window.HOTELS ? window.HOTELS[Number(index)] : null;
        return {
            index: index === "" ? null : Number(index),
            id: slug((ref && ref.nom) || siteInfo.nom) || null,
            nomReferentiel: ref ? ref.nom : null
        };
    }

    // buildingsAuditData = [{ id, nom, donnees, customLabels }, ...].
    function buildAuditJSON(siteInfo, buildingsAuditData) {
        var audit = {
            meta: {
                exportDate: new Date().toISOString(),
                exportDateFormatted: new Date().toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                }),
                formatVersion: 2,
                hotel: hotelIdentity(siteInfo),
                unites: {
                    lignes: "puissances en watts, toujours",
                    secteurs: "valeurs telles que saisies sur les fiches : puissances en watts, sauf les champs saisis en kW (pompes de piscine et de bain à remous, chauffage de piscine, calandre, ventilation et bornes de parking) ; utiliser lignes[].puissanceUnitaireW",
                    simultaneite: "fraction de 1 (0,7 = 70 %)"
                },
                nonReleve: "null = non relevé (périodes vides, nbChambres et cycles de blanchisserie à 0 jamais saisis)"
            },
            siteInfo: siteInfo,
            batiments: buildingsAuditData.map(function (b) {
                var thermique = buildThermique(b);
                var batiment = {
                    id: b.id,
                    nom: b.nom,
                    secteurs: markUnset(b.donnees),
                    secteursPersonnalisesLabels: b.customLabels,
                    lignes: buildLignes(b)
                };
                if (thermique.length) batiment.thermique = thermique;
                return batiment;
            })
        };
        return new Blob([JSON.stringify(audit, null, 2)], { type: "application/json" });
    }

    /* =========================
       CONSTRUCTION DU ZIP PHOTOS
    ========================= */

    // buildingsPhotos = [{ id, nom, photos }, ...] — voir BuildingManager.collectAllBuildingsPhotos.
    // Un sous-dossier par bâtiment dans le zip, pour éviter toute collision de nom de fichier.
    // planFiles = [{ name, blob }, ...] — plans d'évacuation annotés (voir
    // PlansManager.collectExportFiles), rangés dans un dossier "plans".
    function buildPhotosZip(buildingsPhotos, planFiles) {
        var zip = new JSZip();
        if (planFiles && planFiles.length) {
            var plansFolder = zip.folder("plans");
            planFiles.forEach(function (file) { plansFolder.file(file.name, file.blob); });
        }
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

    function isNativeApp() {
        return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() &&
            window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem);
    }

    // Web : trois téléchargements séparés (le navigateur gère très bien plusieurs
    // fichiers à la suite, et la mémoire d'un ordinateur n'est pas un problème).
    function deliverReportFilesWeb(xlsxBlob, jsonBlob, zipBlob) {
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

    // Nom de dossier unique par bâtiment (deux bâtiments peuvent porter le même nom).
    function uniqueFolderName(building, used) {
        var base = (building.nom || building.id).replace(/[\\/]/g, "-");
        var name = base;
        if (used[name]) name = base + " (" + building.id + ")";
        used[name] = true;
        return name;
    }

    // App native : une seule archive vizion-rapport-<date>.zip (rapport.xlsx,
    // audit.json et un dossier photos/<bâtiment>/…), écrite par morceaux : une
    // photo en mémoire à la fois. Avant, toutes les photos étaient zippées en
    // mémoire (deux fois : photos.zip puis l'archive finale) puis converties en
    // base64 : sur un gros audit, la mémoire de l'appareil était dépassée.
    function deliverReportNative(xlsxBlob, jsonBlob, buildingsPhotos, planFiles, onProgress) {
        var stamp = new Date().toISOString().slice(0, 10);
        var filename = "vizion-rapport-" + stamp + ".zip";

        return BackupManager.exportZipFile(filename, function (zip) {
            var jobs = [];
            var usedFolders = {};
            (planFiles || []).forEach(function (file) {
                jobs.push({ path: "plans/" + file.name, photo: { blob: file.blob } });
            });
            buildingsPhotos.forEach(function (building) {
                if (!building.photos.length) return;
                var folder = uniqueFolderName(building, usedFolders);
                building.photos.forEach(function (photo, idx) {
                    jobs.push({ path: "photos/" + folder + "/" + photoFileName(photo, idx), photo: photo });
                });
            });

            return zip.addBlob("rapport.xlsx", xlsxBlob)
                .then(function () { return zip.addBlob("audit.json", jsonBlob); })
                .then(function () {
                    return jobs.reduce(function (chain, job, index) {
                        return chain.then(function () {
                            if (onProgress) onProgress("Écriture des photos (" + (index + 1) + "/" + jobs.length + ")...");
                            var blob = job.photo.blob;
                            job.photo.blob = null; // libère la référence dès qu'elle est lue
                            return zip.addBlob(job.path, blob);
                        });
                    }, Promise.resolve());
                });
        }).then(function (delivery) {
            delivery.filename = filename;
            return delivery;
        });
    }

    function nativeDeliveryMessage(delivery) {
        if (delivery.downloads) {
            return "Rapport enregistré dans Téléchargements (" + delivery.filename +
                " : rapport.xlsx, audit.json, plans et dossier photos).";
        }
        if (delivery.shared) {
            return "Rapport prêt (" + delivery.filename + ") : choisissez où l'envoyer ou l'enregistrer.";
        }
        return "Rapport enregistré sur cet appareil (" + delivery.filename + ").";
    }

    /* =========================
       ORCHESTRATION
    ========================= */

    function sendReport(onProgress) {

        var siteInfo = getSiteInfo();
        var native = isNativeApp();

        if (onProgress) onProgress("Collecte des bâtiments...");

        return BuildingManager.collectAllBuildingsAuditData().then(function (buildingsAuditData) {

            if (onProgress) onProgress("Génération du rapport Excel...");
            var xlsxBlob = buildWorkbook(siteInfo, buildingsAuditData);

            if (onProgress) onProgress("Génération du JSON complet...");
            var jsonBlob = buildAuditJSON(siteInfo, buildingsAuditData);

            if (onProgress) onProgress("Préparation des photos...");

            return Promise.all([
                BuildingManager.collectAllBuildingsPhotos(),
                PlansManager.collectExportFiles()
            ]).then(function (collected) {
                var buildingsPhotos = collected[0];
                var planFiles = collected[1];

                // photos.zip en mémoire seulement quand c'est nécessaire : téléchargement
                // web, ou copie GitHub (optionnelle). L'app native écrit l'archive par morceaux.
                var needsPhotosZip = !native || !!ExportGitHub.getToken();
                var zipPromise = needsPhotosZip ? buildPhotosZip(buildingsPhotos, planFiles) : Promise.resolve(null);

                return zipPromise.then(function (zipBlob) {

                    var nbPhotos = buildingsPhotos.reduce(function (sum, b) { return sum + b.photos.length; }, 0);
                    var result = { xlsxBlob: xlsxBlob, jsonBlob: jsonBlob, nbPhotos: nbPhotos, channel: "local", detail: "Rapport téléchargé sur cet appareil." };

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
                        if (!native) {
                            return deliverReportFilesWeb(xlsxBlob, jsonBlob, zipBlob).then(function () { return r; });
                        }
                        zipBlob = null;
                        return deliverReportNative(xlsxBlob, jsonBlob, buildingsPhotos, planFiles, onProgress).then(function (delivery) {
                            r.detail = nativeDeliveryMessage(delivery) +
                                (r.channel === "github" ? " Une copie a aussi été envoyée sur GitHub." : "");
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
