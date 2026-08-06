/* ============================================================
   ViZion — Référentiel des secteurs
   Source de vérité unique pour la liste des secteurs auditables
   (hébergements, piscines, restaurant, ...), leur clé de données
   localStorage et leur clé de navigation "current<Secteur>".
   Remplace les copies auparavant dupliquées dans script.js,
   report-export.js et progress.js.
============================================================ */

window.SECTEURS = [
    { id: "hebergements", label: "Hébergements" },
    { id: "piscines", label: "Piscines" },
    { id: "restaurant", label: "Restaurant" },
    { id: "bar", label: "Bar" },
    { id: "spa", label: "Spa" },
    { id: "buanderie", label: "Buanderie" },
    { id: "cuisine", label: "Cuisine" },
    { id: "jeux", label: "Salle de jeux" },
    { id: "reunion", label: "Salle de réunion/séminaire" },
    { id: "sport", label: "Salle de sport" },
    { id: "bureaux", label: "Bureaux" },
    { id: "parking", label: "Parking / Extérieur" }
];

window.SECTEUR_DETAIL_PAGES = {
    hebergements: "hebergement-detail.html",
    piscines: "piscine-detail.html",
    restaurant: "restaurant-detail.html",
    bar: "bar-detail.html",
    spa: "spa-detail.html",
    buanderie: "buanderie-detail.html",
    cuisine: "cuisine-detail.html",
    jeux: "jeux-detail.html",
    reunion: "reunion-detail.html",
    sport: "sport-detail.html",
    bureaux: "bureaux-detail.html",
    parking: "parking-detail.html"
};

// Exemples affichés quand un secteur n'a encore aucune localisation.
window.SECTEUR_HINTS = {
    hebergements: "Studio, chambre deluxe, suite, villa, bungalow...",
    piscines: "Lagon, débordement, couloir de nage, rectangle...",
    spa: "Spa hôtel, thalasso, wellness, espace détente...",
    restaurant: "Principal, gastronomique, brasserie, snack...",
    bar: "Bar lobby, piscine, lounge, beach bar...",
    buanderie: "Lave-linge, sèche-linge, calandre...",
    cuisine: "Cuisine centrale, satellite, laboratoire...",
    bureaux: "Open space, bureaux cloisonnés, mixte...",
    parking: "Extérieur, couvert, sous-sol, silo...",
    sport: "Fitness, musculation, cardio...",
    reunion: "Salle de réunion, séminaire, conférence...",
    jeux: "Billard, baby-foot, arcade, flipper..."
};

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

// Secteurs personnalisés : ajoutés librement par l'utilisateur quand aucun des
// 12 secteurs fixes ci-dessus ne correspond. Contrairement aux secteurs fixes,
// tous les secteurs personnalisés partagent la même fiche générique (nom +
// observation + photo) et les mêmes clés — seul leur id et leur label
// diffèrent d'un secteur à l'autre. Important : l'id ne doit JAMAIS contenir
// "_" — les clés photo sont construites en "secteurId_numero_champ" et
// séparées par "_" (voir PhotoManager.initPage / buildPhotoDisplayKey).
window.CUSTOM_SECTEURS_KEY = "customSecteurs";
window.CUSTOM_SECTEUR_DATA_KEY = "customSecteurData";
window.CUSTOM_SECTEUR_CURRENT_KEY = "currentCustomSecteur";
window.CUSTOM_SECTEUR_DETAIL_PAGE = "custom-detail.html";

function isCustomSecteurId(id) {
    return typeof id === "string" && id.indexOf("custom") === 0;
}
