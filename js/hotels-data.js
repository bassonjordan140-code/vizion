/* ============================================================
   ViZion — Référentiel des hôtels suivis
   Liste fixe utilisée à la sélection du site avant un audit
   énergétique (pages/select-hotel.html). Alimente la feuille
   "Page de garde" du rapport (js/report-export.js) :
   nom -> Index, activite -> Type construction, adresse -> Adresse.
============================================================ */

window.HOTELS = [
    { nom: "Villa Delisle", adresse: "42 boulevard Hubert Delisle, 97410 Saint-Pierre", villeQuartier: "Centre-ville de Saint-Pierre", commune: "Saint-Pierre", zonePerene: "Zone 1 - sous le vent", stationMeteo: "PIERREFONDS-AEROPORT", activite: "Hôtel 4*" },
    { nom: "Tama Hôtel", adresse: "77 rue des Navigateurs, 97434 Saint-Gilles-les-Bains", villeQuartier: "Mont Roquefeuil", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 3*" },
    { nom: "Le Grand Bleu", adresse: "46 boulevard Roland Garros, 97434 Saint-Gilles-les-Bains", villeQuartier: "Saint-Gilles-les-Bains", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 3*" },
    { nom: "Le Kervéguen", adresse: "84 avenue de la Croix du Sud, Mont Roquefeuil, 97434 Saint-Paul", villeQuartier: "Mont-Roquefeuil", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 3*" },
    { nom: "Iloha", adresse: "44 rue Georges Pompidou, Pointe des Châteaux, 97436 Saint-Leu", villeQuartier: "Pointe des Châteaux, Saint-Leu", commune: "Saint-Leu", zonePerene: "Zone 1 - sous le vent", stationMeteo: "COLIMACONS", activite: "Hôtel 3*" },
    { nom: "Palm", adresse: "43 rue des Mascarins, Grand-Anse, 97429 Petite-Île", villeQuartier: "Grand'Anse, Petite-Île", commune: "Petite-Île", zonePerene: "Zone 2 - au vent", stationMeteo: "PIERREFONDS-AEROPORT", activite: "Hôtel 5*" },
    { nom: "Relais de l'Hermitage", adresse: "123 rue Leconte de Lisle, Hermitage-les-Bains, 97434 Saint-Gilles-les-Bains", villeQuartier: "L'Hermitage-les-Bains", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 3*" },
    { nom: "Victoria", adresse: "8-10 allée des Lataniers, Grands-Bois, 97410 Saint-Pierre", villeQuartier: "Grand Bois, Saint-Pierre", commune: "Saint-Pierre", zonePerene: "Zone 2 - au vent", stationMeteo: "PIERREFONDS-AEROPORT", activite: "Hôtel 3*" },
    { nom: "Le Saint-Pierre", adresse: "51 avenue des Indes, 97410 Saint-Pierre", villeQuartier: "Centre-ville de Saint-Pierre", commune: "Saint-Pierre", zonePerene: "Zone 1 - sous le vent", stationMeteo: "PIERREFONDS-AEROPORT", activite: "Hôtel 3*" },
    { nom: "Les Aigrettes", adresse: "30 chemin Bottard, 97434 Saint-Gilles-les-Bains", villeQuartier: "Saint-Gilles-les-Bains", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 2*" },
    { nom: "Lindsey Hôtel", adresse: "21B rue François Isautier, 97410 Saint-Pierre", villeQuartier: "Centre-ville de Saint-Pierre", commune: "Saint-Pierre", zonePerene: "Zone 1 - sous le vent", stationMeteo: "PIERREFONDS-AEROPORT", activite: "Hôtel 3*" },
    { nom: "Créolia", adresse: "14 rue du Stade, Montgaillard, 97400 Saint-Denis", villeQuartier: "Montgaillard, Saint-Denis", commune: "Saint-Denis", zonePerene: "Zone 2 - au vent", stationMeteo: "GILLOT-AEROPORT", activite: "Hôtel 4*" },
    { nom: "Floralys", adresse: "2 avenue de l'Océan, 97427 Étang-Salé-les-Bains", villeQuartier: "Étang-Salé-les-Bains", commune: "L'Étang-Salé", zonePerene: "Zone 1 - sous le vent", stationMeteo: "PONT-MATHURIN", activite: "Hôtel 3*" },
    // Roseaux des Sables : même adresse trouvée que Floralys (établissements voisins, groupe Exsel) — à vérifier sur place si besoin d'un numéro distinct.
    { nom: "Roseaux des Sables", adresse: "2 avenue de l'Océan, 97427 Étang-Salé-les-Bains", villeQuartier: "Étang-Salé-les-Bains", commune: "L'Étang-Salé", zonePerene: "Zone 1 - sous le vent", stationMeteo: "PONT-MATHURIN", activite: "Résidence de tourisme / appart-hôtel (non classé)" },
    { nom: "Alamanda", adresse: "81 avenue de Bourbon, 97434 Saint-Gilles-les-Bains", villeQuartier: "Saint-Gilles-les-Bains", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 2*" },
    { nom: "Boucan Canot", adresse: "32 rue du Boucan Canot, 97434 Saint-Gilles-les-Bains", villeQuartier: "Boucan Canot", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 4*" },
    { nom: "Le Nautile", adresse: "60 rue Lacaussade, 97434 La Saline-les-Bains", villeQuartier: "La Saline-les-Bains", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 4*" },
    { nom: "Juliette Dodu", adresse: "31 rue Juliette Dodu, 97400 Saint-Denis", villeQuartier: "Centre-ville de Saint-Denis", commune: "Saint-Denis", zonePerene: "Zone 2 - au vent", stationMeteo: "GILLOT-AEROPORT", activite: "Hôtel 3*" },
    { nom: "Wood Hôtel & SPA", adresse: "11 rue de la Poudrière, 97426 Trois-Bassins", villeQuartier: "Pointe des Diamants, Trois-Bassins", commune: "Trois-Bassins", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 4*" },
    { nom: "Clos de la Rivière", adresse: "54 rue Militaire, 97400 Saint-Denis", villeQuartier: "Centre-ville de Saint-Denis", commune: "Saint-Denis", zonePerene: "Zone 2 - au vent", stationMeteo: "GILLOT-AEROPORT", activite: "Appart-hôtel" },
    { nom: "Les Créoles", adresse: "43 avenue de Bourbon, 97434 Saint-Gilles-les-Bains", villeQuartier: "Saint-Gilles-les-Bains", commune: "Saint-Paul", zonePerene: "Zone 1 - sous le vent", stationMeteo: "POINTE DES TROIS-BASSINS", activite: "Hôtel 3*" },
    { nom: "Hôtel Les Géraniums", adresse: "11 rue Alfred Lacroix, 97418 Plaine-des-Cafres", villeQuartier: "Plaine-des-Cafres", commune: "Le Tampon", zonePerene: "Zone 4 - d'altitude", stationMeteo: "PLAINE DES PALMISTES", activite: "Hôtel 2*" },
    { nom: "Hôtel des Neiges", adresse: "1 rue de la Mare-à-Joncs, 97413 Cilaos", villeQuartier: "Mare-à-Joncs, Cilaos", commune: "Cilaos", zonePerene: "Zone 4 - d'altitude", stationMeteo: "PLAINE DES PALMISTES", activite: "Hôtel 3*" },
    { nom: "Le Vieux Cep", adresse: "44 rue Saint-Louis, 97413 Cilaos", villeQuartier: "Centre-ville de Cilaos", commune: "Cilaos", zonePerene: "Zone 4 - d'altitude", stationMeteo: "PLAINE DES PALMISTES", activite: "Hôtel 3*" }
];
