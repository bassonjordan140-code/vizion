/* ============================================================
   ViZion — Gestion des hôtels
   Plusieurs hôtels peuvent être suivis en parallèle. À tout instant,
   les clés localStorage "siteInfo" et "buildings" (+ tout ce que gère
   BuildingManager en dessous) représentent l'hôtel ACTIF. Changer
   d'hôtel = échanger (swap) ce contenu avec un instantané par hôtel,
   exactement comme BuildingManager le fait pour les bâtiments au
   sein d'un hôtel.
   Dépend de js/secteur-config.js, js/photo-manager.js, js/building-manager.js.
============================================================ */

window.HotelManager = (function () {

    var HOTELS_STARTED_KEY = "hotelsStarted";   // [hotelIndex (string), ...]
    var CURRENT_HOTEL_KEY = "currentHotelIndex";
    var SITE_INFO_KEY = "siteInfo";
    var BUILDINGS_KEY = "buildings";
    var CURRENT_BUILDING_KEY = "currentBuildingId";

    function hotelSnapshotKey(hotelIndex) {
        return "hotelData_" + hotelIndex;
    }

    function listStartedHotelIndexes() {
        return JSON.parse(localStorage.getItem(HOTELS_STARTED_KEY)) || [];
    }

    function getCurrentHotelIndex() {
        return localStorage.getItem(CURRENT_HOTEL_KEY) || "";
    }

    function markStarted(hotelIndex) {
        hotelIndex = String(hotelIndex);
        var list = listStartedHotelIndexes();
        if (list.indexOf(hotelIndex) === -1) {
            list.push(hotelIndex);
            localStorage.setItem(HOTELS_STARTED_KEY, JSON.stringify(list));
        }
    }

    // siteInfo enregistré pour un hôtel donné (actif ou archivé), sans le rendre actif.
    function getSiteInfoFor(hotelIndex) {
        hotelIndex = String(hotelIndex);
        if (getCurrentHotelIndex() === hotelIndex) {
            return JSON.parse(localStorage.getItem(SITE_INFO_KEY)) || {};
        }
        var raw = localStorage.getItem(hotelSnapshotKey(hotelIndex));
        var snapshot = raw ? JSON.parse(raw) : {};
        return snapshot.siteInfo || {};
    }

    // Bâtiments enregistrés pour un hôtel donné (actif ou archivé), sans le rendre actif.
    function getBuildingsFor(hotelIndex) {
        hotelIndex = String(hotelIndex);
        if (getCurrentHotelIndex() === hotelIndex) {
            return JSON.parse(localStorage.getItem(BUILDINGS_KEY)) || [];
        }
        var raw = localStorage.getItem(hotelSnapshotKey(hotelIndex));
        var snapshot = raw ? JSON.parse(raw) : {};
        return snapshot.buildings || [];
    }

    function clearActiveFlatKeys() {
        localStorage.removeItem("activeSecteurs");
        localStorage.removeItem("currentSecteur");
        localStorage.removeItem(CUSTOM_SECTEURS_KEY);
        localStorage.removeItem(CUSTOM_SECTEUR_DATA_KEY);
        localStorage.removeItem(CUSTOM_SECTEUR_CURRENT_KEY);
        Object.keys(SECTEUR_DATA_KEYS).forEach(function (secteurId) {
            localStorage.removeItem(SECTEUR_DATA_KEYS[secteurId]);
        });
        Object.keys(SECTEUR_CURRENT_KEYS).forEach(function (secteurId) {
            localStorage.removeItem(SECTEUR_CURRENT_KEYS[secteurId]);
        });
    }

    // Sauvegarde le bâtiment actif (via BuildingManager) puis range siteInfo +
    // la liste des bâtiments dans l'instantané de l'hôtel actif.
    function saveCurrentHotelSnapshot() {
        var currentIndex = getCurrentHotelIndex();
        if (!currentIndex) return Promise.resolve();
        return BuildingManager.saveCurrentBuildingSnapshot().then(function () {
            var snapshot = {
                siteInfo: JSON.parse(localStorage.getItem(SITE_INFO_KEY)) || {},
                buildings: JSON.parse(localStorage.getItem(BUILDINGS_KEY)) || []
            };
            localStorage.setItem(hotelSnapshotKey(currentIndex), JSON.stringify(snapshot));
        });
    }

    // Écrit l'instantané de l'hôtel ciblé dans les clés actives. Si l'hôtel n'a
    // jamais été ouvert, defaultSiteInfo (fiche hôtel fixe) sert de base initiale.
    function loadHotelSnapshot(hotelIndex, defaultSiteInfo) {
        var raw = localStorage.getItem(hotelSnapshotKey(hotelIndex));
        var snapshot = raw ? JSON.parse(raw) : null;

        localStorage.setItem(SITE_INFO_KEY, JSON.stringify((snapshot && snapshot.siteInfo) || defaultSiteInfo || {}));
        localStorage.setItem(BUILDINGS_KEY, JSON.stringify((snapshot && snapshot.buildings) || []));
        localStorage.removeItem(CURRENT_BUILDING_KEY);
        clearActiveFlatKeys();

        localStorage.setItem(CURRENT_HOTEL_KEY, hotelIndex);

        return PhotoManager.clearPhotos();
    }

    // Change d'hôtel actif : sauvegarde l'ancien puis charge le nouveau. On sauvegarde
    // aussi quand hotelIndex === currentIndex (ré-ouverture du même hôtel) : sinon,
    // loadHotelSnapshot ci-dessous écraserait les clés actives avec un instantané
    // périmé et perdrait les changements faits depuis le dernier snapshot (ex. le
    // flag "confirmed" de siteInfo posé sans passer par backToHotelsButton).
    function switchToHotel(hotelIndex, defaultSiteInfo) {
        hotelIndex = String(hotelIndex);
        var currentIndex = getCurrentHotelIndex();
        var chain = currentIndex ? saveCurrentHotelSnapshot() : Promise.resolve();
        return chain.then(function () {
            markStarted(hotelIndex);
            return loadHotelSnapshot(hotelIndex, defaultSiteInfo);
        });
    }

    // Supprime un hôtel : ses bâtiments (instantanés + photos archivées), son
    // propre instantané, et - si c'était l'hôtel actif - les clés actives.
    function deleteHotel(hotelIndex) {
        hotelIndex = String(hotelIndex);
        var isCurrent = getCurrentHotelIndex() === hotelIndex;
        var buildings = getBuildingsFor(hotelIndex);

        var chain = Promise.resolve();
        buildings.forEach(function (b) {
            localStorage.removeItem("buildingData_" + b.id);
            chain = chain.then(function () {
                return PhotoManager.deleteArchivedPhotosForBuilding(b.id);
            });
        });

        localStorage.removeItem(hotelSnapshotKey(hotelIndex));

        var started = listStartedHotelIndexes().filter(function (idx) { return idx !== hotelIndex; });
        localStorage.setItem(HOTELS_STARTED_KEY, JSON.stringify(started));

        if (isCurrent) {
            localStorage.removeItem(CURRENT_HOTEL_KEY);
            localStorage.removeItem(SITE_INFO_KEY);
            localStorage.removeItem(BUILDINGS_KEY);
            localStorage.removeItem(CURRENT_BUILDING_KEY);
            clearActiveFlatKeys();
            chain = chain.then(function () { return PhotoManager.clearPhotos(); });
        }

        return chain;
    }

    return {
        listStartedHotelIndexes: listStartedHotelIndexes,
        getCurrentHotelIndex: getCurrentHotelIndex,
        getSiteInfoFor: getSiteInfoFor,
        getBuildingsFor: getBuildingsFor,
        saveCurrentHotelSnapshot: saveCurrentHotelSnapshot,
        switchToHotel: switchToHotel,
        deleteHotel: deleteHotel
    };

})();
