/* ============================================================
   ViZion — Plans d'évacuation (écran)
   1. Types de chambres : un nom, une couleur attribuée automatiquement.
   2. Plans : photo d'un plan d'évacuation + points de couleur posés
      sur les chambres (un toucher = un point du type choisi).
   Toute modification est enregistrée aussitôt (voir PlansManager).
============================================================ */

var typeSuggestions = document.getElementById("typeSuggestions");
var typesList = document.getElementById("typesList");
var newTypeInput = document.getElementById("newTypeInput");
var addTypeBtn = document.getElementById("addTypeBtn");
var plansList = document.getElementById("plansList");
var plansError = document.getElementById("plansError");

var ZOOM_LEVELS = [1, 1.5, 2, 3, 4];

var data = PlansManager.getData();
var activeTypeId = data.types.length ? data.types[0].id : "";
var planViews = {};     // planId -> { card, stage, dotsLayer, palette, zoomIndex, selectedPointId, imageUrl }

function save() {
    PlansManager.saveData(data);
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
}

function showError(message) {
    plansError.textContent = message || "";
}

/* =========================
   TYPES DE CHAMBRES
========================= */

function renderSuggestions() {
    typeSuggestions.innerHTML = "";
    var existing = data.types.map(function (t) { return t.nom.toLowerCase(); });
    var remaining = PlansManager.SUGGESTED_TYPES.filter(function (nom) {
        return existing.indexOf(nom.toLowerCase()) === -1;
    });
    typeSuggestions.classList.toggle("hidden", remaining.length === 0);
    remaining.forEach(function (nom) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "contact-suggestion-chip";
        btn.textContent = "+ " + nom;
        btn.addEventListener("click", function () { createType(nom); });
        typeSuggestions.appendChild(btn);
    });
}

function renderTypes() {
    typesList.innerHTML = "";
    data.types.forEach(function (type) {
        var count = PlansManager.countPoints(data, type.id);
        var row = document.createElement("div");
        row.className = "plan-type-row";
        row.innerHTML =
            '<span class="plan-type-swatch" style="background:' + type.couleur + '"></span>' +
            '<input type="text" class="plan-type-name" maxlength="40" value="' + escapeHtml(type.nom) + '" aria-label="Nom du type">' +
            '<span class="plan-type-count">' + count + (count > 1 ? " points" : " point") + '</span>' +
            '<button type="button" class="plan-type-delete" aria-label="Supprimer ce type">✕</button>';

        row.querySelector(".plan-type-name").addEventListener("change", function (e) {
            var nom = e.target.value.trim();
            var taken = data.types.some(function (t) {
                return t.id !== type.id && t.nom.toLowerCase() === nom.toLowerCase();
            });
            if (!nom || taken) {
                e.target.value = type.nom;
                return;
            }
            type.nom = nom;
            save();
            renderSuggestions();
            refreshAllPalettes();
        });

        row.querySelector(".plan-type-delete").addEventListener("click", function () {
            var message = count
                ? 'Supprimer le type "' + type.nom + '" et ses ' + count + ' point' + (count > 1 ? "s" : "") + ' sur les plans ?'
                : 'Supprimer le type "' + type.nom + '" ?';
            if (!confirm(message)) return;
            PlansManager.removeType(data, type.id);
            if (activeTypeId === type.id) activeTypeId = data.types.length ? data.types[0].id : "";
            save();
            renderAllTypeDependent();
        });

        typesList.appendChild(row);
    });
}

function createType(nom) {
    var type = PlansManager.addType(data, nom);
    if (!type) return false;
    if (!activeTypeId) activeTypeId = type.id;
    save();
    renderAllTypeDependent();
    return true;
}

addTypeBtn.addEventListener("click", function () {
    var nom = newTypeInput.value.trim();
    if (!nom) return;
    if (createType(nom)) {
        newTypeInput.value = "";
    } else {
        alert('Le type "' + nom + '" existe déjà.');
    }
});

newTypeInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        addTypeBtn.click();
    }
});

// Tout ce qui dépend de la liste des types : liste, suggestions, palettes, points.
function renderAllTypeDependent() {
    renderTypes();
    renderSuggestions();
    refreshAllPalettes();
    data.plans.forEach(function (plan) {
        var view = planViews[plan.id];
        if (view) {
            renderDots(plan, view);
            renderSelection(plan, view);
        }
    });
}

/* =========================
   PLANS
========================= */

function findPlan(planId) {
    return data.plans.find(function (p) { return p.id === planId; });
}

function findPoint(plan, pointId) {
    return plan.points.find(function (p) { return p.id === pointId; });
}

function renderPalette(plan, view) {
    view.palette.innerHTML = "";
    if (!data.types.length) {
        view.palette.innerHTML = '<span class="plan-hint-inline">Ajoutez d\'abord un type de chambre ci-dessus.</span>';
        return;
    }
    data.types.forEach(function (type) {
        var inPlan = plan.points.filter(function (p) { return p.typeId === type.id; }).length;
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "plan-palette-chip" + (type.id === activeTypeId ? " active" : "");
        chip.innerHTML =
            '<span class="plan-palette-dot" style="background:' + type.couleur + '"></span>' +
            escapeHtml(type.nom) + ' <span class="plan-palette-count">' + inPlan + '</span>';
        chip.addEventListener("click", function () {
            activeTypeId = type.id;
            refreshAllPalettes();
        });
        view.palette.appendChild(chip);
    });
}

function refreshAllPalettes() {
    data.plans.forEach(function (plan) {
        var view = planViews[plan.id];
        if (view) renderPalette(plan, view);
    });
}

function renderDots(plan, view) {
    view.dotsLayer.innerHTML = "";
    plan.points.forEach(function (point) {
        var type = PlansManager.typeById(data, point.typeId);
        if (!type) return;
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "plan-dot" + (point.id === view.selectedPointId ? " selected" : "");
        dot.style.left = (point.x * 100) + "%";
        dot.style.top = (point.y * 100) + "%";
        dot.style.background = type.couleur;
        dot.setAttribute("aria-label", type.nom + (point.label ? " " + point.label : ""));
        if (point.label) {
            var caption = document.createElement("span");
            caption.className = "plan-dot-label";
            caption.textContent = point.label;
            dot.appendChild(caption);
        }
        dot.addEventListener("click", function (e) {
            e.stopPropagation();
            view.selectedPointId = (view.selectedPointId === point.id) ? "" : point.id;
            renderDots(plan, view);
            renderSelection(plan, view);
        });
        view.dotsLayer.appendChild(dot);
    });
}

// Panneau du point sélectionné : type, numéro de chambre (facultatif), suppression.
function renderSelection(plan, view) {
    var panel = view.selection;
    var point = view.selectedPointId ? findPoint(plan, view.selectedPointId) : null;
    if (!point) {
        view.selectedPointId = "";
        panel.classList.add("hidden");
        panel.innerHTML = "";
        return;
    }

    panel.classList.remove("hidden");
    panel.innerHTML =
        '<div class="plan-selection-fields">' +
            '<select class="plan-selection-type" aria-label="Type de chambre"></select>' +
            '<input type="text" class="plan-selection-label" maxlength="12" placeholder="N° chambre (facultatif)" value="' + escapeHtml(point.label || "") + '">' +
        '</div>' +
        '<div class="plan-selection-actions">' +
            '<button type="button" class="plan-small-button plan-selection-close">OK</button>' +
            '<button type="button" class="plan-small-button danger plan-selection-delete">🗑 Supprimer ce point</button>' +
        '</div>';

    var select = panel.querySelector(".plan-selection-type");
    data.types.forEach(function (type) {
        var option = document.createElement("option");
        option.value = type.id;
        option.textContent = type.nom;
        if (type.id === point.typeId) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener("change", function () {
        point.typeId = select.value;
        save();
        renderDots(plan, view);
        refreshAllPalettes();
        renderTypes();
    });

    panel.querySelector(".plan-selection-label").addEventListener("change", function (e) {
        point.label = e.target.value.trim();
        save();
        renderDots(plan, view);
    });

    panel.querySelector(".plan-selection-close").addEventListener("click", function () {
        view.selectedPointId = "";
        renderDots(plan, view);
        renderSelection(plan, view);
    });

    panel.querySelector(".plan-selection-delete").addEventListener("click", function () {
        plan.points = plan.points.filter(function (p) { return p.id !== point.id; });
        view.selectedPointId = "";
        save();
        renderDots(plan, view);
        renderSelection(plan, view);
        refreshAllPalettes();
        renderTypes();
    });
}

function setZoom(plan, view, index) {
    view.zoomIndex = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, index));
    var zoom = ZOOM_LEVELS[view.zoomIndex];
    view.stage.style.width = (zoom * 100) + "%";
    view.zoomLabel.textContent = Math.round(zoom * 100) + " %";
}

function placePoint(plan, view, event) {
    if (!data.types.length) {
        showError("Ajoutez d'abord un type de chambre (étape 1).");
        return;
    }
    if (!activeTypeId || !PlansManager.typeById(data, activeTypeId)) {
        showError("Choisissez un type de chambre au-dessus du plan.");
        return;
    }
    showError("");

    var rect = view.stage.getBoundingClientRect();
    var x = (event.clientX - rect.left) / rect.width;
    var y = (event.clientY - rect.top) / rect.height;
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    var point = { id: PlansManager.uid("pt_"), typeId: activeTypeId, x: x, y: y, label: "" };
    plan.points.push(point);
    view.selectedPointId = "";
    save();
    renderDots(plan, view);
    renderSelection(plan, view);
    refreshAllPalettes();
    renderTypes();
}

function renderPlanCard(plan) {
    var card = document.createElement("div");
    card.className = "plan-card";
    card.innerHTML =
        '<div class="plan-card-head">' +
            '<input type="text" class="plan-name" maxlength="60" placeholder="Nom du plan (ex : Niveau 1)" value="' + escapeHtml(plan.nom) + '">' +
            '<button type="button" class="plan-delete" aria-label="Supprimer ce plan">✕</button>' +
        '</div>' +
        '<div class="plan-palette"></div>' +
        '<div class="plan-toolbar">' +
            '<button type="button" class="plan-small-button plan-zoom-out" aria-label="Zoom arrière">−</button>' +
            '<span class="plan-zoom-label">100 %</span>' +
            '<button type="button" class="plan-small-button plan-zoom-in" aria-label="Zoom avant">+</button>' +
            '<button type="button" class="plan-small-button plan-undo">↶ Annuler le dernier point</button>' +
        '</div>' +
        '<div class="plan-viewport">' +
            '<div class="plan-stage"><img class="plan-image" alt="Plan d\'évacuation" draggable="false"><div class="plan-dots"></div></div>' +
        '</div>' +
        '<div class="plan-selection hidden"></div>' +
        '<p class="plan-hint">Choisissez un type, puis touchez le plan pour poser un point. Touchez un point pour le modifier ou le supprimer. Utilisez + pour zoomer et faites défiler pour viser une chambre.</p>';

    var view = {
        card: card,
        stage: card.querySelector(".plan-stage"),
        dotsLayer: card.querySelector(".plan-dots"),
        palette: card.querySelector(".plan-palette"),
        selection: card.querySelector(".plan-selection"),
        zoomLabel: card.querySelector(".plan-zoom-label"),
        zoomIndex: 0,
        selectedPointId: "",
        imageUrl: ""
    };
    planViews[plan.id] = view;

    card.querySelector(".plan-name").addEventListener("change", function (e) {
        plan.nom = e.target.value.trim() || plan.nom;
        e.target.value = plan.nom;
        save();
    });

    card.querySelector(".plan-delete").addEventListener("click", function () {
        var n = plan.points.length;
        var message = 'Supprimer le plan "' + plan.nom + '"' + (n ? " et ses " + n + " point" + (n > 1 ? "s" : "") : "") + " ?";
        if (!confirm(message)) return;
        PlansManager.removePlan(data, plan.id).then(function () {
            save();
            if (view.imageUrl) URL.revokeObjectURL(view.imageUrl);
            delete planViews[plan.id];
            card.remove();
            renderTypes();
        });
    });

    card.querySelector(".plan-zoom-in").addEventListener("click", function () { setZoom(plan, view, view.zoomIndex + 1); });
    card.querySelector(".plan-zoom-out").addEventListener("click", function () { setZoom(plan, view, view.zoomIndex - 1); });

    card.querySelector(".plan-undo").addEventListener("click", function () {
        if (!plan.points.length) return;
        plan.points.pop();
        view.selectedPointId = "";
        save();
        renderDots(plan, view);
        renderSelection(plan, view);
        refreshAllPalettes();
        renderTypes();
    });

    view.stage.addEventListener("click", function (e) { placePoint(plan, view, e); });

    renderPalette(plan, view);
    renderDots(plan, view);

    PlansManager.loadPlanImage(plan).then(function (blob) {
        var img = card.querySelector(".plan-image");
        if (!blob) {
            card.querySelector(".plan-viewport").innerHTML = '<p class="plan-hint">Image du plan introuvable.</p>';
            return;
        }
        view.imageUrl = URL.createObjectURL(blob);
        img.src = view.imageUrl;
    });

    plansList.appendChild(card);
}

function renderPlans() {
    plansList.innerHTML = "";
    planViews = {};
    data.plans.forEach(renderPlanCard);
}

/* =========================
   AJOUT D'UN PLAN
========================= */

function handlePlanFile(input) {
    var file = input.files[0];
    if (!file) return;
    showError("Enregistrement du plan…");
    PlansManager.addPlanFromFile(data, file).then(function (plan) {
        save();
        renderPlanCard(plan);
        showError("");
        var view = planViews[plan.id];
        if (view) view.card.scrollIntoView({ behavior: "smooth", block: "start" });
    }).catch(function (err) {
        console.error(err);
        showError("Impossible d'enregistrer ce plan : " + err.message);
    }).finally(function () {
        input.value = "";
    });
}

document.getElementById("planCameraInput").addEventListener("change", function () { handlePlanFile(this); });
document.getElementById("planGalleryInput").addEventListener("change", function () { handlePlanFile(this); });

/* =========================
   NAVIGATION
========================= */

document.getElementById("continueBtn").addEventListener("click", function () {
    window.location.href = "buildings.html";
});

window.addEventListener("pagehide", function () {
    Object.keys(planViews).forEach(function (id) {
        if (planViews[id].imageUrl) URL.revokeObjectURL(planViews[id].imageUrl);
    });
});

renderTypes();
renderSuggestions();
renderPlans();
