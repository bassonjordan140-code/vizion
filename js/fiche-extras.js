/* ============================================================
   ViZion — Compléments de fiche
   Champs facultatifs ajoutés à la fin des fiches de localisation et à la
   page "Informations du site" pour ce que le rapport d'audit demande en
   plus du relevé de base : marques et modèles des équipements de froid,
   ventilation, eau chaude, surfaces, parois horizontales, critères PERENE,
   et surtout le régime de fonctionnement (heures, simultanéité) qui permet
   de calculer les consommations.

   Principe : un champ jamais rempli n'existe pas dans les données ("non
   relevé"), il n'est donc jamais confondu avec un zéro saisi.

   Rangement :
   - fiche de localisation : <fiche>.complements = { groupe: {champ: valeur}
     ou [ {…}, … ] pour un groupe répétable } ;
   - site : siteInfo.complements, même forme.
   Les deux sont repris tels quels dans audit.json et les sauvegardes.

   Chargé APRÈS le script de la fiche : le clic sur "Sauvegarder" de la fiche
   enregistre d'abord la fiche, puis ce script y ajoute ses compléments.
   Dépend de js/secteur-config.js ; js/lot-mapping.js et
   js/materiaux-thermiques.js sont utilisés quand ils sont chargés.
============================================================ */

window.FicheExtras = (function () {

    /* =========================
       DESCRIPTION DES CHAMPS
    ========================= */

    var FLUIDES = ["R32", "R410A", "R407C", "R134a", "R22", "R290", "R1234ze", "Autre"];
    var OUI_NON = ["Oui", "Non"];

    function text(key, label, opts) { return merge({ key: key, label: label, type: "text" }, opts); }
    function number(key, label, unit, opts) { return merge({ key: key, label: label, type: "number", unit: unit || "" }, opts); }
    function select(key, label, options, opts) { return merge({ key: key, label: label, type: "select", options: options }, opts); }
    function merge(base, extra) {
        Object.keys(extra || {}).forEach(function (k) { base[k] = extra[k]; });
        return base;
    }

    var GROUPS = {

        // --- Climatisation ---
        clim_ue: {
            titre: "Climatisation — unités extérieures",
            aide: "À relever sur la plaque signalétique (prise en photo ci-dessus).",
            fields: [
                text("marque", "Marque"),
                text("modele", "Modèle"),
                select("fluide", "Fluide frigorigène", FLUIDES),
                number("eer", "EER (ou COP)", "", { step: 0.01 }),
                number("puissanceFrigorifique", "Puissance frigorifique", "kW", { step: 0.1 })
            ]
        },
        clim_ui: {
            titre: "Climatisation — unités intérieures",
            fields: [
                text("marque", "Marque"),
                select("type", "Type", ["Mural", "Cassette", "Gainable", "Console", "Plafonnier", "Autre"]),
                select("fluide", "Fluide frigorigène", FLUIDES),
                select("thermostat", "Thermostat", ["Individuel", "Centralisé"])
            ]
        },

        // --- Ventilation ---
        vmc: {
            titre: "Ventilation (VMC)",
            aide: "Un bloc par localisation : laissez vide s'il n'y a pas de ventilation mécanique.",
            fields: [
                select("type", "Type", ["Simple flux", "Double flux", "Extraction seule"]),
                text("marque", "Marque"),
                number("nombre", "Nombre de bouches / caissons", "", { step: 1 }),
                number("debit", "Débit", "m³/h", { step: 1 }),
                select("pilotage", "Pilotage", ["Continu", "Horloge", "Détection de présence", "Manuel"])
            ]
        },
        brasseur: {
            titre: "Brasseurs d'air",
            fields: [
                number("nombre", "Nombre", "", { step: 1 }),
                text("marque", "Marque"),
                select("type", "Type", ["Plafond", "Mural", "Sur pied"]),
                number("puissance", "Puissance unitaire", "W", { step: 1 })
            ]
        },

        // --- Eau chaude sanitaire ---
        ecs: {
            titre: "Eau chaude sanitaire — détail",
            fields: [
                number("nombreBallons", "Nombre de ballons", "", { step: 1 }),
                number("volumeBallons", "Volume d'un ballon", "L", { step: 1 }),
                number("surfaceCapteurs", "Surface de capteurs solaires", "m²", { step: 0.1 }),
                select("appoint", "Appoint", ["Aucun", "Électrique", "Gaz", "Pompe à chaleur"]),
                number("temperatureConsigne", "Température de consigne", "°C", { step: 1 }),
                select("bouclage", "Bouclage", OUI_NON)
            ]
        },

        // --- Éclairage ---
        eclairage: {
            titre: "Éclairage — localisation et pilotage",
            aide: "Complète les lignes d'éclairage de la fiche (type, puissance, quantité).",
            fields: [
                text("localisation", "Où sont-ils placés ?", {
                    placeholder: "Ex : point central, spots, liseuses",
                    list: ["Point central", "Spots encastrés", "Applique", "Liseuse / chevet", "Rampe", "Extérieur"]
                }),
                select("pilotage", "Pilotage", ["Manuel", "Détection de présence", "Horloge", "Gradation", "Mixte"])
            ]
        },

        // --- Hébergements ---
        typologie: {
            titre: "Typologie du logement",
            fields: [
                number("surface", "Surface d'un logement de ce type", "m²", { step: 0.1 })
            ]
        },
        enveloppe: {
            titre: "Parois verticales — couleur extérieure",
            aide: "Avec le matériau et l'épaisseur saisis plus haut, la couleur permet de calculer Rth, U et le facteur solaire.",
            fields: [
                select("couleurFacade", "Couleur extérieure des façades", couleurOptions())
            ]
        },
        parois_horizontales: {
            titre: "Parois horizontales (toiture, plancher)",
            aide: "Une ligne par couche : toiture, plancher haut ou plancher bas.",
            repeatable: true,
            itemLabel: "Couche",
            fields: [
                select("paroi", "Paroi", ["Toiture", "Plancher haut", "Plancher bas"]),
                text("materiau", "Matériau", { list: materiauOptions(), placeholder: "Ex : Tôle isolée" }),
                number("epaisseur", "Épaisseur", "cm", { step: 0.1 }),
                select("couleurExterieure", "Couleur extérieure", couleurOptions())
            ]
        },

        // --- Cuisine ---
        chambres_froides: {
            titre: "Chambres froides",
            repeatable: true,
            itemLabel: "Chambre froide",
            fields: [
                select("type", "Type", ["Positive", "Négative"]),
                text("localisation", "Localisation"),
                number("temperature", "Température", "°C", { step: 1 }),
                text("marque", "Marque")
            ]
        },
        extraction_cuisine: {
            titre: "Extraction (hottes)",
            fields: [
                number("nombreHottes", "Nombre de hottes", "", { step: 1 }),
                number("debit", "Débit total", "m³/h", { step: 1 })
            ]
        },
        lavage_cuisine: {
            titre: "Lavage (plonge, lave-vaisselle)",
            fields: [
                number("capacite", "Capacité", "paniers/h", { step: 1 }),
                number("temperatureLavage", "Température de lavage", "°C", { step: 1 }),
                number("temperatureRincage", "Température de rinçage", "°C", { step: 1 })
            ]
        },

        // --- Buanderie ---
        machines_buanderie: {
            titre: "Machines — marque et âge",
            aide: "Les cycles par jour se saisissent dans la section « Usage » de la fiche.",
            fields: [
                text("marqueLaveLinge", "Marque des lave-linge"),
                number("ageLaveLinge", "Âge des lave-linge", "ans", { step: 1 }),
                text("marqueSecheLinge", "Marque des sèche-linge"),
                number("ageSecheLinge", "Âge des sèche-linge", "ans", { step: 1 }),
                text("marqueCalandre", "Marque de la calandre")
            ]
        },

        // --- Piscine ---
        bassin: {
            titre: "Bassin et pompes",
            fields: [
                number("surfaceBassin", "Surface du bassin", "m²", { step: 0.1 }),
                text("marquePompes", "Marque des pompes")
            ]
        },

        // --- Régime de fonctionnement ---
        regimes: {
            titre: "Fonctionnement (heures et simultanéité)",
            aide: "Sert à calculer les consommations : une ligne par type d'équipement (lot de travaux). " +
                "Simultanéité : part des équipements qui tournent en même temps. Taux d'utilisation : part du temps de présence où ils sont réellement sollicités.",
            repeatable: true,
            itemLabel: "Lot",
            suggestLots: true,
            fields: [
                { key: "lot", label: "Lot de travaux", type: "lot" },
                number("heuresParJour", "Heures par jour", "h", { step: 0.5, max: 24 }),
                number("joursParAn", "Jours par an", "j", { step: 1, max: 366 }),
                number("simultaneite", "Simultanéité", "%", { step: 1, max: 100 }),
                number("tauxUtilisation", "Taux d'utilisation", "%", { step: 1, max: 100 })
            ]
        },

        // --- Site (page "Informations du site") ---
        descriptif: {
            titre: "Descriptif général du site",
            fields: [
                number("surfaceUtile", "Surface utile", "m²", { step: 1 }),
                number("surfaceClimatisee", "Surface climatisée", "m²", { step: 1 }),
                number("surfaceParcelle", "Surface de la parcelle", "m²", { step: 1 }),
                number("nombreNiveaux", "Nombre de niveaux", "", { step: 1 }),
                number("anneeConstruction", "Année de construction", "", { step: 1, min: 1800, max: 2100 }),
                text("exploitant", "Exploitant")
            ]
        },
        perene: {
            titre: "Environnement extérieur (critères PERENE)",
            aide: "Évaluation sur place de chaque critère.",
            fields: [
                select("ventilationNaturelle", "Potentiel de ventilation naturelle (logements traversants ?)", ["Favorable", "Moyen", "Défavorable"]),
                select("vegetalisation", "Végétalisation des abords", ["Favorable", "Moyen", "Défavorable"]),
                select("protectionToitures", "Protection solaire des toitures", ["Favorable", "Moyen", "Défavorable"]),
                select("protectionBaies", "Protection solaire des baies", ["Favorable", "Moyen", "Défavorable"]),
                select("protectionParois", "Protection solaire des parois", ["Favorable", "Moyen", "Défavorable"]),
                text("observation", "Observation")
            ]
        },
        poste_transformation: {
            titre: "Poste de transformation EDF",
            fields: [
                select("present", "Poste de transformation", ["Présent", "Absent"]),
                number("puissance", "Puissance", "kVA", { step: 1 }),
                text("emplacementTgbt", "Emplacement du TGBT")
            ]
        },
        groupes_eau_glacee: {
            titre: "Groupes d'eau glacée",
            repeatable: true,
            itemLabel: "Groupe",
            fields: [
                text("marque", "Marque"),
                text("modele", "Modèle"),
                select("type", "Type", ["Condensation par air", "Condensation par eau", "Autre"]),
                select("fluide", "Fluide frigorigène", FLUIDES),
                number("puissanceAbsorbee", "Puissance absorbée", "kW", { step: 0.1 }),
                number("puissanceFrigorifique", "Puissance frigorifique", "kW", { step: 0.1 }),
                number("eer", "EER", "", { step: 0.01 }),
                number("temperatureBoucle", "Température de boucle (départ)", "°C", { step: 0.5 }),
                text("plageFonctionnement", "Plage de fonctionnement", { placeholder: "Ex : 7 h – 22 h" })
            ]
        }
    };

    function materiauOptions() {
        return window.MateriauxThermiques ? MateriauxThermiques.MATERIAUX.map(function (m) { return m.nom; }) : [];
    }

    function couleurOptions() {
        return window.MateriauxThermiques ? MateriauxThermiques.COULEURS.map(function (c) { return c.nom; }) : [];
    }

    // Groupes proposés pour chaque secteur, dans l'ordre d'affichage.
    var INTERIEUR = ["clim_ue", "clim_ui", "vmc", "eclairage", "regimes"];

    var SECTEUR_GROUPS = {
        hebergements: ["typologie", "enveloppe", "parois_horizontales", "clim_ue", "clim_ui", "vmc", "brasseur", "ecs", "eclairage", "regimes"],
        piscines: ["bassin", "regimes"],
        restaurant: INTERIEUR.slice(0, 3).concat(["brasseur", "eclairage", "regimes"]),
        bar: INTERIEUR.slice(0, 3).concat(["brasseur", "eclairage", "regimes"]),
        spa: INTERIEUR.slice(0, 3).concat(["brasseur", "ecs", "eclairage", "regimes"]),
        buanderie: INTERIEUR.slice(0, 3).concat(["brasseur", "machines_buanderie", "eclairage", "regimes"]),
        cuisine: INTERIEUR.slice(0, 3).concat(["chambres_froides", "extraction_cuisine", "lavage_cuisine", "eclairage", "regimes"]),
        jeux: INTERIEUR,
        reunion: INTERIEUR,
        sport: INTERIEUR,
        bureaux: INTERIEUR,
        parking: ["eclairage", "regimes"],
        custom: INTERIEUR
    };

    var SITE_GROUPS = ["descriptif", "perene", "poste_transformation", "groupes_eau_glacee"];

    /* =========================
       VALEURS
    ========================= */

    function isFilled(value) {
        return value !== undefined && value !== null && value !== "";
    }

    // Retire tout champ vide, puis tout groupe sans aucune valeur : ce qui n'a
    // pas été relevé n'est jamais enregistré.
    function compact(state) {
        var out = {};
        Object.keys(state).forEach(function (id) {
            var value = state[id];
            if (Array.isArray(value)) {
                var items = value.map(compactObject).filter(function (item) {
                    return Object.keys(item).length > 0;
                });
                if (items.length) out[id] = items;
            } else {
                var obj = compactObject(value);
                if (Object.keys(obj).length) out[id] = obj;
            }
        });
        return out;
    }

    function compactObject(obj) {
        var out = {};
        Object.keys(obj || {}).forEach(function (key) {
            if (isFilled(obj[key])) out[key] = obj[key];
        });
        return out;
    }

    /* =========================
       RENDU
    ========================= */

    function el(tag, className, html) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (html !== undefined) node.innerHTML = html;
        return node;
    }

    function escapeHtml(text) {
        return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    var listCounter = 0;

    function renderField(field, values, onChange) {
        var wrap = el("div", "field-group");
        var label = el("label", "", escapeHtml(field.label) + (field.unit ? " (" + escapeHtml(field.unit) + ")" : ""));
        wrap.appendChild(label);

        var input;
        var current = values[field.key];

        if (field.type === "select" || field.type === "lot") {
            input = document.createElement("select");
            var options = [];
            if (field.type === "lot") {
                options = (window.LotMapping ? LotMapping.LOTS : []).map(function (l) { return { value: l.code, text: l.code + " — " + l.nom }; });
            } else {
                options = field.options.map(function (o) { return { value: o, text: o }; });
            }
            input.appendChild(new Option("Non relevé", ""));
            options.forEach(function (o) { input.appendChild(new Option(o.text, o.value)); });
            input.value = isFilled(current) ? current : "";
        } else {
            input = document.createElement("input");
            input.type = field.type === "number" ? "number" : "text";
            if (field.type === "number") {
                input.inputMode = "decimal";
                input.step = field.step || "any";
                input.min = field.min !== undefined ? field.min : 0;
                if (field.max !== undefined) input.max = field.max;
            }
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.list && field.list.length) {
                var listId = "extras-list-" + (++listCounter);
                var datalist = el("datalist");
                datalist.id = listId;
                field.list.forEach(function (o) { datalist.appendChild(new Option(o, o)); });
                wrap.appendChild(datalist);
                input.setAttribute("list", listId);
            }
            input.value = isFilled(current) ? current : "";
        }

        function commit() {
            var raw = input.value;
            if (field.type === "number") {
                var n = parseFloat(raw);
                if (isNaN(n) || n < (field.min !== undefined ? field.min : 0)) {
                    delete values[field.key];
                } else {
                    values[field.key] = field.max !== undefined ? Math.min(n, field.max) : n;
                }
            } else if (raw.trim() === "") {
                delete values[field.key];
            } else {
                values[field.key] = raw.trim();
            }
            onChange();
        }
        input.addEventListener(field.type === "text" || field.type === "number" ? "input" : "change", commit);
        wrap.appendChild(input);
        return wrap;
    }

    // Une carte repliable par groupe. state[id] est mis à jour en direct ; la
    // persistance (fiche ou site) est décidée par l'appelant via onChange.
    function renderGroup(id, state, onChange, ctx) {
        var def = GROUPS[id];
        var details = el("details", "extras-group");
        details.dataset.group = id;

        var summary = el("summary", "extras-summary");
        var title = el("span", "extras-title", escapeHtml(def.titre));
        var badge = el("span", "extras-badge");
        summary.appendChild(title);
        summary.appendChild(badge);
        details.appendChild(summary);

        var body = el("div", "extras-body");
        if (def.aide) body.appendChild(el("p", "section-hint", escapeHtml(def.aide)));
        details.appendChild(body);

        function refreshBadge() {
            var filled = compact((function () { var o = {}; o[id] = state[id] || (def.repeatable ? [] : {}); return o; })())[id];
            var n = !filled ? 0 : (Array.isArray(filled) ? filled.length : Object.keys(filled).length);
            badge.textContent = n ? (def.repeatable ? n + (n > 1 ? " lignes" : " ligne") : n + " renseigné" + (n > 1 ? "s" : "")) : "";
            details.classList.toggle("has-values", n > 0);
        }

        function changed() {
            refreshBadge();
            onChange();
        }

        if (!def.repeatable) {
            if (!state[id]) state[id] = {};
            var fieldsBox = el("div", "extras-fields");
            def.fields.forEach(function (field) { fieldsBox.appendChild(renderField(field, state[id], changed)); });
            body.appendChild(fieldsBox);
        } else {
            if (!Array.isArray(state[id])) state[id] = [];
            var list = el("div", "extras-items");
            body.appendChild(list);

            var renderItems = function () {
                list.innerHTML = "";
                state[id].forEach(function (item, index) {
                    var card = el("div", "extras-item");
                    var head = el("div", "extras-item-head");
                    head.appendChild(el("strong", "", escapeHtml(def.itemLabel) + " " + (index + 1)));
                    var del = el("button", "parois-delete-btn", "✕");
                    del.type = "button";
                    del.setAttribute("aria-label", "Supprimer cette ligne");
                    del.addEventListener("click", function () {
                        state[id].splice(index, 1);
                        renderItems();
                        changed();
                    });
                    head.appendChild(del);
                    card.appendChild(head);
                    var box = el("div", "extras-fields");
                    def.fields.forEach(function (field) { box.appendChild(renderField(field, item, changed)); });
                    card.appendChild(box);
                    list.appendChild(card);
                });
            };
            renderItems();

            var addBtn = el("button", "add-row-button", "+ Ajouter " + (def.suggestLots ? "une ligne" : "un élément"));
            addBtn.type = "button";
            addBtn.addEventListener("click", function () {
                state[id].push({});
                renderItems();
                changed();
            });
            body.appendChild(addBtn);

            if (def.suggestLots && ctx && ctx.suggestedLots && ctx.suggestedLots.length) {
                var suggest = el("button", "secondary-button extras-suggest-btn",
                    "Ajouter les lots de cette fiche (" + ctx.suggestedLots.map(function (l) { return l.code; }).join(", ") + ")");
                suggest.type = "button";
                suggest.addEventListener("click", function () {
                    ctx.suggestedLots.forEach(function (lot) {
                        var exists = state[id].some(function (item) { return item.lot === lot.code; });
                        if (!exists) state[id].push({ lot: lot.code });
                    });
                    renderItems();
                    changed();
                });
                body.appendChild(suggest);
            }
        }

        refreshBadge();
        return details;
    }

    function renderAll(container, groupIds, state, onChange, ctx) {
        groupIds.forEach(function (id) {
            if (GROUPS[id]) container.appendChild(renderGroup(id, state, onChange, ctx));
        });
        // Les groupes déjà renseignés s'ouvrent d'eux-mêmes : on voit tout de suite ce qui est saisi.
        container.querySelectorAll("details.has-values").forEach(function (d) { d.open = true; });
    }

    /* =========================
       FICHE DE LOCALISATION
    ========================= */

    // Page -> secteur : "hebergement-detail.html" -> "hebergements", "custom-detail.html" -> "custom".
    function secteurFromPage() {
        var file = (window.location.pathname.split("/").pop() || "");
        if (file === window.CUSTOM_SECTEUR_DETAIL_PAGE) return "custom";
        var found = null;
        Object.keys(window.SECTEUR_DETAIL_PAGES || {}).forEach(function (id) {
            if (window.SECTEUR_DETAIL_PAGES[id] === file) found = id;
        });
        return found;
    }

    function readFicheContext(secteurId) {
        var current;
        if (secteurId === "custom") {
            current = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_CURRENT_KEY));
            if (!current) return null;
            return { moduleId: current.secteurId || current.moduleId, numero: current.numero, label: current.label, custom: true };
        }
        current = JSON.parse(localStorage.getItem(SECTEUR_CURRENT_KEYS[secteurId]));
        if (!current) return null;
        return { moduleId: secteurId, numero: current.numero, label: current.label, custom: false };
    }

    function readRecord(ctx) {
        if (ctx.custom) {
            var all = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
            return (all[ctx.moduleId] || {})[ctx.numero] || null;
        }
        var data = JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[ctx.moduleId])) || {};
        return data[ctx.numero] || null;
    }

    function writeComplements(ctx, complements) {
        if (ctx.custom) {
            var all = JSON.parse(localStorage.getItem(CUSTOM_SECTEUR_DATA_KEY)) || {};
            var bucket = all[ctx.moduleId] || {};
            if (!bucket[ctx.numero]) return;
            if (Object.keys(complements).length) bucket[ctx.numero].complements = complements;
            else delete bucket[ctx.numero].complements;
            all[ctx.moduleId] = bucket;
            localStorage.setItem(CUSTOM_SECTEUR_DATA_KEY, JSON.stringify(all));
            return;
        }
        var data = JSON.parse(localStorage.getItem(SECTEUR_DATA_KEYS[ctx.moduleId])) || {};
        if (!data[ctx.numero]) return;
        if (Object.keys(complements).length) data[ctx.numero].complements = complements;
        else delete data[ctx.numero].complements;
        localStorage.setItem(SECTEUR_DATA_KEYS[ctx.moduleId], JSON.stringify(data));
    }

    // Lots des lignes déjà présentes dans la fiche enregistrée (équipements, éclairage…),
    // pour proposer un régime de fonctionnement pour chacun.
    function lotsOfRecord(ctx, record) {
        if (!window.LotMapping || !record || !LotMapping.extractFiche) return [];
        var seen = {};
        var lots = [];
        try {
            LotMapping.extractFiche(ctx.moduleId, record, ctx.numero, ctx.label).forEach(function (row) {
                if (row.lot && !seen[row.lot]) {
                    seen[row.lot] = true;
                    lots.push({ code: row.lot, nom: row.lotNom });
                }
            });
        } catch (e) { /* fiche incomplète : pas de suggestion */ }
        return lots;
    }

    function mountFiche() {
        var secteurId = secteurFromPage();
        var saveButton = document.querySelector("button.primary-button[id^='save']");
        if (!secteurId || !saveButton) return;
        var ctx = readFicheContext(secteurId);
        if (!ctx) return;

        var record = readRecord(ctx);
        var state = JSON.parse(JSON.stringify((record && record.complements) || {}));
        var groups = SECTEUR_GROUPS[secteurId] || [];
        if (!groups.length) return;

        var card = el("div", "module-detail-card extras-card");
        card.appendChild(el("h2", "section-title", "Compléments techniques"));
        card.appendChild(el("p", "section-hint",
            "Facultatif. Ce que le rapport demande en plus : marques, ventilation, heures de fonctionnement… " +
            "Un champ laissé sur « Non relevé » reste absent des données."));
        var box = el("div", "extras-groups");
        card.appendChild(box);
        saveButton.parentNode.insertBefore(card, saveButton);

        renderAll(box, groups, state, function () { /* enregistré au clic sur Sauvegarder */ },
            { suggestedLots: lotsOfRecord(ctx, record) });

        saveButton.addEventListener("click", function () {
            writeComplements(ctx, compact(state));
        });
    }

    /* =========================
       PAGE "INFORMATIONS DU SITE"
    ========================= */

    function mountSite(container) {
        var info = ReportExport.getSiteInfo();
        var state = JSON.parse(JSON.stringify(info.complements || {}));
        renderAll(container, SITE_GROUPS, state, function () {
            var current = ReportExport.getSiteInfo();
            var complements = compact(state);
            var next = Object.assign({}, current);
            if (Object.keys(complements).length) next.complements = complements;
            else delete next.complements;
            ReportExport.setSiteInfo(next);
        });
    }

    // Se branche tout seul : page "Informations du site" (conteneur #siteExtras)
    // ou fiche de localisation (bouton Sauvegarder). Attend la fin du chargement
    // pour que le clic sur Sauvegarder soit traité APRÈS celui de la fiche.
    function autoMount() {
        var siteBox = document.getElementById("siteExtras");
        if (siteBox) mountSite(siteBox);
        else mountFiche();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoMount);
    else autoMount();

    return {
        GROUPS: GROUPS,
        SECTEUR_GROUPS: SECTEUR_GROUPS,
        mountFiche: mountFiche,
        mountSite: mountSite
    };

})();
