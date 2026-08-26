/* ============================================================
   ViZion — Garde anti-perte de saisie
   Suit si l'utilisateur a modifié un champ depuis le chargement de la
   fiche (ou depuis le dernier clic sur "Sauvegarder"). Le bouton "←"
   de chaque fiche appelle confirmLeave() au lieu de naviguer
   directement, pour proposer de sauvegarder si des modifications ne
   sont pas enregistrées.
============================================================ */

window.UnsavedGuard = (function () {

    var dirty = false;
    var saveButtonEl = null;

    function markDirty() { dirty = true; }
    function markClean() { dirty = false; }

    // À appeler une fois au chargement de la fiche, avec son bouton
    // Sauvegarder (redevient "propre" après chaque sauvegarde).
    function watch(btn) {
        saveButtonEl = btn;
        document.addEventListener("input", markDirty, true);
        document.addEventListener("change", markDirty, true);
        if (saveButtonEl) {
            saveButtonEl.addEventListener("click", markClean);
        }
        window.addEventListener("beforeunload", function (e) {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
        });
    }

    // À appeler par le bouton "←" à la place d'une navigation directe.
    function confirmLeave(destinationUrl) {
        if (!dirty) {
            window.location.href = destinationUrl;
            return;
        }
        if (confirm("Vous avez des modifications non sauvegardées sur cette fiche. Voulez-vous les sauvegarder avant de quitter ?")) {
            if (saveButtonEl) saveButtonEl.click();
            window.location.href = destinationUrl;
        } else if (confirm("Quitter sans sauvegarder ces modifications ?")) {
            window.location.href = destinationUrl;
        }
    }

    // Exposés pour js/fiche-nav.js (navigation précédent/suivant) : permet de
    // ne préparer une redirection différée (sessionStorage) que dans les
    // branches où l'utilisateur choisit réellement de quitter la fiche,
    // jamais s'il annule — confirmLeave() seule ne permet pas de distinguer
    // ces cas depuis l'extérieur.
    function isDirty() { return dirty; }
    function triggerSave() { if (saveButtonEl) saveButtonEl.click(); }

    return { watch: watch, confirmLeave: confirmLeave, isDirty: isDirty, triggerSave: triggerSave };

})();
