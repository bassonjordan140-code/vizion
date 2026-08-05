/* ============================================================
   ViZion — Référentiel des secteurs
   Source de vérité unique pour la liste des secteurs auditables
   (hébergements, piscines, restaurant, ...), leur clé de données
   localStorage et leur clé de navigation "current<Secteur>".
   Remplace les copies auparavant dupliquées dans script.js,
   report-export.js et progress.js.
============================================================ */

window.SECTEURS = [
    { id: "hebergements", label: "Hébergements", hasCounter: true },
    { id: "piscines", label: "Piscines", hasCounter: true },
    { id: "restaurant", label: "Restaurant", hasCounter: true },
    { id: "bar", label: "Bar", hasCounter: true },
    { id: "spa", label: "Spa", hasCounter: true },
    { id: "buanderie", label: "Buanderie", hasCounter: true },
    { id: "cuisine", label: "Cuisine", hasCounter: true },
    { id: "jeux", label: "Salle de jeux", hasCounter: true },
    { id: "reunion", label: "Salle de réunion/séminaire", hasCounter: true },
    { id: "sport", label: "Salle de sport", hasCounter: true },
    { id: "bureaux", label: "Bureaux", hasCounter: true },
    { id: "parking", label: "Parking", hasCounter: true }
];

window.SECTEUR_DATA_KEYS = {
    hebergements: "hebergementsData",
    piscines: "piscinesData",
    restaurant: "restaurantData",
    bar: "barData",
    spa: "spaData",
    buanderie: "buanderieData",
    cuisine: "cuisineData",
    jeux: "jeuxData",
    reunion: "reunionData",
    sport: "sportData",
    bureaux: "bureauxData",
    parking: "parkingData"
};

window.SECTEUR_CURRENT_KEYS = {
    hebergements: "currentHebergement",
    piscines: "currentPiscine",
    restaurant: "currentRestaurant",
    bar: "currentBar",
    spa: "currentSpa",
    buanderie: "currentBuanderie",
    cuisine: "currentCuisine",
    jeux: "currentJeux",
    reunion: "currentReunion",
    sport: "currentSport",
    bureaux: "currentBureaux",
    parking: "currentParking"
};
