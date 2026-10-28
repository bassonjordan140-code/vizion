/* ============================================================
   ViZion — Plans d'évacuation
   Un hôtel peut avoir plusieurs plans d'évacuation (photos) sur
   lesquels on pose des points de couleur : un type de chambre
   (Standard, Deluxe, ...) = une couleur attribuée automatiquement.

   Données (niveau hôtel) dans siteInfo.plansEvacuation, donc
   échangées avec l'hôtel actif (voir js/hotel-manager.js) et
   reprises telles quelles dans audit.json et les sauvegardes :
     { types: [{ id, nom, couleur }],
       plans: [{ id, nom, photoKey, points: [{ id, typeId, x, y, label }] }] }
   x et y sont des fractions (0 à 1) de la largeur / hauteur du plan.

   Les images sont rangées dans l'archive photo sous le casier
   "plans_<index de l'hôtel>" (voir PhotoManager.putArchivedPhoto).
   Dépend de js/photo-manager.js et js/hotel-manager.js.
============================================================ */

window.PlansManager = (function () {

    var SITE_INFO_KEY = "siteInfo";
    var PLAN_IMAGE_WIDTH = 2000;
    var PLAN_IMAGE_QUALITY = 0.85;

    // Couleurs bien distinctes entre elles, lisibles sur un plan clair comme sombre
    // (chaque point a en plus un liseré blanc).
    var TYPE_COLORS = [
        "#E5484D", "#3E8EF7", "#F5C518", "#A66CFF", "#FF8A3D", "#19C3A6",
        "#FF5FA2", "#A3E635", "#22D3EE", "#A0693B", "#6366F1", "#F8FAFC"
    ];

    var SUGGESTED_TYPES = ["Standard", "Supérieure", "Deluxe", "Suite", "Familiale", "PMR"];

    function uid(prefix) {
        return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    /* =========================
       DONNÉES
    ========================= */

    function readSiteInfo() {
        return JSON.parse(localStorage.getItem(SITE_INFO_KEY)) || {};
    }

    function getData() {
        var data = readSiteInfo().plansEvacuation || {};
        return { types: data.types || [], plans: data.plans || [] };
    }

    function saveData(data) {
        var info = readSiteInfo();
        info.plansEvacuation = data;
        localStorage.setItem(SITE_INFO_KEY, JSON.stringify(info));
    }

    function bucketId() {
        return "plans_" + HotelManager.getCurrentHotelIndex();
    }

    function nextColor(types) {
        var used = {};
        types.forEach(function (t) { used[t.couleur] = true; });
        for (var i = 0; i < TYPE_COLORS.length; i++) {
            if (!used[TYPE_COLORS[i]]) return TYPE_COLORS[i];
        }
        return TYPE_COLORS[types.length % TYPE_COLORS.length];
    }

    // Ajoute un type de chambre avec la prochaine couleur libre. Renvoie le type,
    // ou null si le nom est vide ou déjà pris.
    function addType(data, nom) {
        nom = (nom || "").trim();
        if (!nom) return null;
        var lower = nom.toLowerCase();
        if (data.types.some(function (t) { return t.nom.toLowerCase() === lower; })) return null;
        var type = { id: uid("t_"), nom: nom, couleur: nextColor(data.types) };
        data.types.push(type);
        return type;
    }

    function removeType(data, typeId) {
        data.types = data.types.filter(function (t) { return t.id !== typeId; });
        data.plans.forEach(function (plan) {
            plan.points = plan.points.filter(function (p) { return p.typeId !== typeId; });
        });
    }

    function countPoints(data, typeId) {
        return data.plans.reduce(function (sum, plan) {
            return sum + plan.points.filter(function (p) { return p.typeId === typeId; }).length;
        }, 0);
    }

    function totalPoints(data) {
        return data.plans.reduce(function (sum, plan) { return sum + plan.points.length; }, 0);
    }

    function typeById(data, typeId) {
        return data.types.find(function (t) { return t.id === typeId; }) || null;
    }

    /* =========================
       IMAGES DES PLANS
    ========================= */

    // Réduit la photo, la range dans l'archive et ajoute le plan. Renvoie le plan.
    function addPlanFromFile(data, file) {
        return PhotoManager.resizeImage(file, PLAN_IMAGE_WIDTH, PLAN_IMAGE_QUALITY).then(function (blob) {
            var plan = {
                id: uid("p_"),
                nom: "Plan " + (data.plans.length + 1),
                photoKey: "",
                points: []
            };
            plan.photoKey = "plan_" + plan.id;
            return PhotoManager.putArchivedPhoto(bucketId(), plan.photoKey, blob).then(function () {
                data.plans.push(plan);
                return plan;
            });
        });
    }

    function removePlan(data, planId) {
        var plan = data.plans.find(function (p) { return p.id === planId; });
        data.plans = data.plans.filter(function (p) { return p.id !== planId; });
        return plan ? PhotoManager.deleteArchivedPhoto(bucketId(), plan.photoKey) : Promise.resolve();
    }

    function loadPlanImage(plan) {
        return PhotoManager.getArchivedPhoto(bucketId(), plan.photoKey);
    }

    /* =========================
       IMAGE ANNOTÉE (pour le rapport)
       Le plan avec ses points de couleur + une légende (type, couleur,
       nombre) dans un bandeau en bas : lisible hors de l'app.
    ========================= */

    function loadImageElement(blob) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Image de plan illisible")); };
            img.src = url;
        });
    }

    function renderAnnotatedPlan(plan, data, blob) {
        return loadImageElement(blob).then(function (img) {
            var w = img.naturalWidth;
            var h = img.naturalHeight;
            var fontPx = Math.max(18, Math.round(w / 55));
            var legendRowH = Math.round(fontPx * 2);
            var pad = Math.round(fontPx * 0.8);

            var measure = document.createElement("canvas").getContext("2d");
            measure.font = "600 " + fontPx + "px sans-serif";

            // Légende : une entrée par type utilisé sur ce plan, à la suite, sur
            // autant de lignes que nécessaire.
            var entries = data.types.map(function (type) {
                var n = plan.points.filter(function (p) { return p.typeId === type.id; }).length;
                return n ? { type: type, text: type.nom + " (" + n + ")" } : null;
            }).filter(Boolean);
            var swatch = fontPx;
            var rows = [[]];
            var rowW = pad;
            entries.forEach(function (entry) {
                entry.width = swatch + 8 + measure.measureText(entry.text).width + pad * 2;
                if (rowW + entry.width > w && rows[rows.length - 1].length) {
                    rows.push([]);
                    rowW = pad;
                }
                rows[rows.length - 1].push(entry);
                rowW += entry.width;
            });
            var legendH = entries.length ? rows.length * legendRowH + pad : 0;

            var canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h + legendH;
            var ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, w, h);

            var radius = Math.max(12, Math.round(w / 80));
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            plan.points.forEach(function (point) {
                var type = typeById(data, point.typeId);
                if (!type) return;
                var cx = point.x * w;
                var cy = point.y * h;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = type.couleur;
                ctx.fill();
                var borderW = Math.max(2, radius / 4);
                ctx.lineWidth = borderW;
                ctx.strokeStyle = "#ffffff";
                ctx.stroke();
                // Fin contour sombre autour du liseré blanc : le point reste visible
                // sur un plan clair comme sur un plan foncé.
                ctx.lineWidth = 1;
                ctx.strokeStyle = "rgba(0,0,0,0.55)";
                ctx.beginPath();
                ctx.arc(cx, cy, radius + borderW / 2 + 0.5, 0, Math.PI * 2);
                ctx.stroke();
                if (point.label) {
                    ctx.font = "700 " + Math.round(fontPx * 0.8) + "px sans-serif";
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = "#ffffff";
                    ctx.strokeText(point.label, cx, cy + radius + 4);
                    ctx.fillStyle = "#111111";
                    ctx.fillText(point.label, cx, cy + radius + 4);
                }
            });

            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.font = "600 " + fontPx + "px sans-serif";
            rows.forEach(function (row, rowIndex) {
                var x = pad;
                var y = h + pad / 2 + rowIndex * legendRowH + legendRowH / 2;
                row.forEach(function (entry) {
                    ctx.beginPath();
                    ctx.arc(x + swatch / 2, y, swatch / 2, 0, Math.PI * 2);
                    ctx.fillStyle = entry.type.couleur;
                    ctx.fill();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#555555";
                    ctx.stroke();
                    ctx.fillStyle = "#111111";
                    ctx.fillText(entry.text, x + swatch + 8, y);
                    x += entry.width;
                });
            });

            return new Promise(function (resolve) {
                canvas.toBlob(function (out) { resolve(out); }, "image/jpeg", 0.88);
            });
        });
    }

    function safeFileName(text) {
        return String(text || "plan").replace(/[\\/:*?"<>|]/g, "-").trim() || "plan";
    }

    // Plans annotés prêts pour le rapport : [{ name: "01_<nom>.jpg", blob }, ...].
    // Tableau vide s'il n'y a aucun plan : le rapport reste alors identique à avant.
    function collectExportFiles() {
        var data = getData();
        var files = [];
        return data.plans.reduce(function (chain, plan, index) {
            return chain.then(function () {
                return loadPlanImage(plan).then(function (blob) {
                    if (!blob) return null;
                    return renderAnnotatedPlan(plan, data, blob).then(function (annotated) {
                        files.push({
                            name: String(index + 1).padStart(2, "0") + "_" + safeFileName(plan.nom) + ".jpg",
                            blob: annotated
                        });
                    });
                });
            });
        }, Promise.resolve()).then(function () { return files; });
    }

    /* =========================
       API PUBLIQUE
    ========================= */

    return {
        TYPE_COLORS: TYPE_COLORS,
        SUGGESTED_TYPES: SUGGESTED_TYPES,
        getData: getData,
        saveData: saveData,
        addType: addType,
        removeType: removeType,
        countPoints: countPoints,
        totalPoints: totalPoints,
        typeById: typeById,
        addPlanFromFile: addPlanFromFile,
        removePlan: removePlan,
        loadPlanImage: loadPlanImage,
        renderAnnotatedPlan: renderAnnotatedPlan,
        collectExportFiles: collectExportFiles,
        uid: uid
    };

})();
