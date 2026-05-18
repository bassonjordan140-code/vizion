# ViZion — Spécifications des modules

> Document destiné à Claude Code pour le développement.
> Lire d'abord `CONTEXT.md` pour la palette, la stack, les conventions et le parcours utilisateur.

---

## Structure du projet

```
App_projet/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── progress.js          (calcul de progression centralisé)
│   ├── script.js             (audit.html — config modules)
│   ├── site-data.js           (tableau de bord terrain)
│   ├── module-detail.js       (liste des fiches par module)
│   ├── hebergement-detail.js
│   ├── piscine-detail.js
│   ├── spa-detail.js
│   ├── restaurant-detail.js
│   └── bar-detail.js
├── pages/
│   ├── audit.html
│   ├── site-data.html
│   ├── module-detail.html
│   ├── hebergement-detail.html
│   ├── piscine-detail.html
│   ├── spa-detail.html
│   ├── restaurant-detail.html
│   └── bar-detail.html
├── images/
└── docs/
    ├── CONTEXT.md
    ├── MODULES_SPECS.md
    └── PRESENTATION.md
```

---

## Statut des modules

| Module | Statut | Fichiers |
|---|---|---|
| **Hébergement** | Livré | `hebergement-detail.html` + `.js` |
| **Piscine** | Livré | `piscine-detail.html` + `.js` |
| **Spa** | Livré | `spa-detail.html` + `.js` |
| **Restaurant** | Livré | `restaurant-detail.html` + `.js` |
| **Bar** | Livré | `bar-detail.html` + `.js` |
| Buanderie | À faire | — |
| Cuisine | À faire | — |
| Salle de jeux | À faire | — |
| Salle de réunion | À faire | — |
| Salle de sport | À faire | — |
| Bureaux | À faire | — |
| Parking | À faire | — |

---

## Patterns communs à tous les modules

### Climatisation (pattern hébergement)
Toggle "Climatisé ?" → si oui :
- Nombre de climatiseurs (input number)
- État du système (select : Bon / Moyen / Dégradé)
- Photo du climatiseur (placeholder)
- Toggle "Plaque signalétique visible ?" → si oui : photo plaque (placeholder)

### Brasseur d'air
Toggle "Brasseur d'air ?" → si oui :
- Nombre de brasseurs (input number)
- Photo brasseur (placeholder)

### Éclairage (liste dynamique)
Bouton "+ Ajouter type d'éclairage". Par ligne :
- Type (select : LED / Fluocompacte / Tube fluorescent / Halogène / Incandescence)
- W unitaire (input number, pré-rempli selon type, modifiable)
- Quantité (input number)
- Total (calculé auto, affiché en texte)
- Photo (placeholder)
- Bouton supprimer

### Photos
Tous les champs photo sont des **placeholders** (bouton "Photo à venir" disabled).
Les photos sont intégrées dans leur section respective (pas de bloc Photos séparé).

### Observations
Textarea libre en fin de fiche. Optionnel, ne compte pas dans la progression.

### Progression (`js/progress.js`)
- Ne comptent que les champs qui démarrent **vides** et nécessitent une saisie active
- Les selects pré-remplis et toggles Oui/Non ne comptent **pas** comme points autonomes
- Les champs conditionnels (dans un toggle = oui) comptent uniquement quand le toggle est actif
- Deux niveaux : par fiche (Piscine 1 = 33%) et par module (moyenne des fiches)

---

## Architecture par module

Chaque module suit le même pattern :

1. **Page `pages/<module>-detail.html`** — fiche détaillée
2. **Fichier `js/<module>-detail.js`** — logique de la fiche
3. **Clé localStorage** `<module>Data` — `{ "1": {...}, "2": {...} }`
4. **Clé navigation** `current<Module>` — `{ moduleId, numero }`
5. **Branche dans `js/module-detail.js`** — `else if (currentModule.id === "<module>")`

---

# 1. Module PISCINE (livré)

**Clé localStorage** : `piscinesData`
**Clé navigation** : `currentPiscine`

## Identification
- Type de piscine (select : Lagon / À débordement / Couloir de nage / Rectangle classique / Forme libre / Autre)
- Si "Autre" → champ texte libre
- Nom de la piscine (input text)
- Couverte ? (toggle Oui/Non)
- Photo générale (placeholder)

## Dimensions
- Volume total (m³) — input number

## Filtration
- Liste dynamique de pompes (+ Ajouter pompe)
  - Par pompe : puissance (kW), durée (h/jour), photo pompe, toggle plaque signalétique → photo plaque
- Type de filtration (select : Sable / Cartouche / Diatomée / Verre)
- Traitement de l'eau (select : Chlore / Sel-électrolyse / UV / Brome / Ozone / Mixte)

## Chauffage
- Chauffée ? (toggle Oui/Non)
- Si oui :
  - Type de chauffe (select : Pompe à chaleur / Échangeur chaudière / Solaire thermique / Électrique direct / Récupération de chaleur / Autre)
  - Photo du système de chauffage (placeholder)
  - Température de consigne (°C)
  - Toggle "Plaque signalétique visible ?" → photo plaque
- Bâche / couverture isothermique ? (toggle Oui/Non)

## Observations
Textarea libre.

## Progression (3 champs de base + conditionnels)
1. nom, 2. volumeTotal, 3. pompes (au moins 1)
+ si chauffée=oui : temperatureConsigne

## Structure JSON

```json
{
  "1": {
    "typeSelect": "À débordement",
    "type": "À débordement",
    "nom": "Bassin principal",
    "couverte": "oui",
    "volumeTotal": 320,
    "pompes": [
      { "puissance": 1.5, "duree": 12, "plaque": true }
    ],
    "typeFiltration": "Sable",
    "traitementEau": "Sel-électrolyse",
    "chauffee": "oui",
    "typeChauffe": "Pompe à chaleur",
    "temperatureConsigne": 28,
    "chauffagePlaque": "oui",
    "bache": "oui",
    "photos": {},
    "observations": ""
  }
}
```

---

# 2. Module SPA (livré)

**Clé localStorage** : `spaData`
**Clé navigation** : `currentSpa`

## Identification
- Nom de l'espace (input text)
- Surface totale (m²)
- Heure d'ouverture / fermeture (deux inputs time)
- Photo générale (placeholder)

## Climatisation
Pattern climatisation hébergement + brasseur d'air

## Chauffage global
- Type de chauffe (select : Électrique / Gaz / Thermodynamique / Récupération hôtel / Autre)

## ECS
- Distribution (select : Dédiée au spa / Centralisée hôtel)
- Nombre de douches (input number)
- Si dédiée : photo installation ECS (placeholder)

## Bains à remous
Liste dynamique (+ Ajouter bain). Par bain :
- Volume (m³), température consigne (°C), bâche (toggle)
- Pompes de filtration (sous-liste dynamique) : puissance + durée + photo
- Photo du bain (placeholder)

## Hammams
Liste dynamique. Par hammam :
- Température consigne (°C), type générateur (select), photo (placeholder)

## Saunas
Liste dynamique. Par sauna :
- Température consigne (°C), type (select), photo (placeholder)

## Salles de massage
- Nombre de salles (compteur +/-)
- Si > 0 : photo (placeholder)

## Éclairage
Pattern éclairage dynamique hébergement

## Observations
Textarea libre.

## Progression (7 champs de base + conditionnels)
1. nom, 2. surface, 3. nbDouches, 4. bainsRemous (au moins 1), 5. hammams (au moins 1), 6. saunas (au moins 1), 7. eclairages (au moins 1)
+ si brasseur=oui : nombre
+ si clim=oui : nombre

## Structure JSON

```json
{
  "1": {
    "nom": "Espace Aqualis",
    "surface": 250,
    "ouvertureDebut": "10:00",
    "ouvertureFin": "20:00",
    "climatisation": { "present": true, "nombre": 2, "etat": "Bon", "plaque": false },
    "brasseurAir": { "present": "oui", "nombre": 2 },
    "typeChauffeGlobal": "Thermodynamique",
    "ecsDistribution": "Centralisée hôtel",
    "nbDouches": 6,
    "bainsRemous": [
      { "volume": 1.5, "temperatureConsigne": 36, "bache": "oui", "pompes": [{ "puissance": 0.75, "duree": 8 }] }
    ],
    "hammams": [
      { "temperatureConsigne": 45, "typeGenerateur": "Électrique" }
    ],
    "saunas": [
      { "temperatureConsigne": 90, "type": "Électrique" }
    ],
    "nbSallesMassage": 3,
    "eclairages": [{ "type": "LED", "puissance": 9, "quantite": 20 }],
    "photos": {},
    "observations": ""
  }
}
```

---

# 3. Module RESTAURANT (livré)

**Clé localStorage** : `restaurantData`
**Clé navigation** : `currentRestaurant`

## Identification
- Type (select : Restaurant principal / Gastronomique / Brasserie / Snack / Beach club / Autre)
- Si "Autre" → champ texte libre
- Nom (input text)
- Surface salle (m²)
- Couverts (input number)
- Places assises (input number)
- Photo générale (placeholder)

## Climatisation
Pattern climatisation hébergement + brasseur d'air

## Éclairage
Pattern éclairage dynamique hébergement

## Repas servis et horaires
Pour chacun des 3 services (petit-déjeuner, déjeuner, dîner) :
- Toggle Oui/Non → si oui : heure début + heure fin (inputs time)
- Si non : horaires masqués

## Observations
Textarea libre.

## Progression (5 champs de base + conditionnels)
1. nom, 2. surface, 3. couverts, 4. placesAssises, 5. eclairages (au moins 1)
+ si brasseur=oui : nombre
+ si clim=oui : nombre
+ si petit-déj=oui : début + fin (2)
+ si déjeuner=oui : début + fin (2)
+ si dîner=oui : début + fin (2)

## Structure JSON

```json
{
  "1": {
    "typeSelect": "Restaurant principal",
    "type": "Restaurant principal",
    "nom": "La Terrasse",
    "surface": 180,
    "couverts": 80,
    "placesAssises": 80,
    "climatisation": { "present": true, "nombre": 2, "etat": "Bon", "plaque": false },
    "brasseurAir": { "present": "oui", "nombre": 4 },
    "eclairages": [{ "type": "LED", "puissance": 9, "quantite": 30 }],
    "repas": {
      "petitDejeuner": { "servi": "oui", "debut": "07:00", "fin": "10:30" },
      "dejeuner": { "servi": "oui", "debut": "12:00", "fin": "14:30" },
      "diner": { "servi": "oui", "debut": "19:00", "fin": "22:00" }
    },
    "photos": {},
    "observations": ""
  }
}
```

---

# 4. Module BAR (livré)

**Clé localStorage** : `barData`
**Clé navigation** : `currentBar`

## Identification
- Nom du bar (input text)
- Surface (m²)
- Places assises (input number)
- Heure d'ouverture / fermeture (inputs time)
- Photo générale (placeholder)

## Climatisation
Pattern climatisation hébergement + brasseur d'air

## Équipements frigorifiques
4 sous-sections, chacune avec toggle Oui/Non :
- **Vitrines réfrigérées** → si oui : nombre + photo
- **Pompe à bière / tireuse** → si oui : photo
- **Machine à glaçons** → si oui : nombre de machines + photo
- **Cave à vin / cellier** → si oui : nombre de caves + photo

## Préparation boissons chaudes
- Machine à café pro ? (toggle) → si oui : nombre de machines + photo

## Éclairage
Pattern éclairage dynamique hébergement

## Écrans
- TV / écrans présents ? (toggle) → si oui : nombre + allumés en permanence (toggle)

## Observations
Textarea libre.

## Progression (4 champs de base + conditionnels)
1. nom, 2. surface, 3. placesAssises, 4. eclairages (au moins 1)
+ si brasseur=oui : nombre
+ si clim=oui : nombre
+ si vitrines=oui : nombre
+ si glaçons=oui : nombre
+ si cave=oui : nombre
+ si café=oui : nombre
+ si écrans=oui : nombre

## Structure JSON

```json
{
  "1": {
    "type": "Le Sunset",
    "nom": "Le Sunset",
    "surface": 65,
    "placesAssises": 24,
    "ouvertureDebut": "17:00",
    "ouvertureFin": "01:00",
    "climatisation": { "present": true, "nombre": 1, "etat": "Bon", "plaque": false },
    "brasseurAir": { "present": "oui", "nombre": 2 },
    "vitrinesRefrigerees": { "presente": "oui", "nombre": 2 },
    "tireuse": { "presente": "oui" },
    "machineGlacons": { "presente": "oui", "nombre": 1 },
    "caveVin": { "presente": "non", "nombre": 1 },
    "machineCafe": { "presente": "oui", "nombre": 1 },
    "eclairages": [{ "type": "LED", "puissance": 9, "quantite": 15 }],
    "ecrans": { "present": "oui", "nombre": 2, "permanents": "non" },
    "photos": {},
    "observations": ""
  }
}
```

---

# Composants CSS existants

| Classe | Usage |
|---|---|
| `.module-detail-card` + `.section-title` + `.section-hint` | Sections de tous les modules |
| `.toggle-group` + `.toggle-btn` + `.toggle-btn.active` | Toggles Oui/Non |
| `.add-row-button` | Bouton "+ Ajouter" pour listes dynamiques |
| `.pompe-row` | Ligne de pompe (2 cols + delete) |
| `.eclairage-row` | Ligne éclairage (5 cols + delete + photo) |
| `.parois-cell` + `.parois-delete-btn` | Cellules et suppression dans les listes |
| `.row-photo-group` | Photo pleine largeur dans une ligne dynamique |
| `.photo-placeholder-btn` | Bouton photo placeholder (dashed, disabled) |
| `.time-input` + `.horaires-row` | Inputs time + grille 2 cols |
| `.commentaire-textarea` | Textarea observations |
| `.progress-bar` + `.progress-fill` | Barres de progression |
| `.counter-block` + `.counter-button` | Compteur +/- |
| `.hidden` | `display: none !important` |

---

# Validation après chaque module

1. `moduleDataKeys` dans `js/script.js` inclut la clé du module
2. `clearAllModuleData()` dans `js/script.js` supprime `current<Module>`
3. `js/module-detail.js` a une branche pour le module
4. `js/progress.js` a une fonction `calc<Module>Progress()` et une entrée dans `progressCalculators`
5. La fiche se recharge correctement après save → navigate away → come back
6. Les barres de progression se mettent à jour dans le dashboard et la liste des fiches

---

# Note sur les photos

Tous les champs photo sont des **placeholders** (bouton "Photo à venir" disabled).
La stratégie photo définitive sera décidée plus tard (upload base64 + IndexedDB, ou File System Access API, ou stratégie hybride).
Structure `photos: {}` conservée dans le JSON pour préparer le terrain.

---

# Modules complémentaires (à faire)

Les specs détaillées des modules suivants sont conservées pour référence.
Ordre conseillé : Buanderie → Cuisine → Bureaux → Parking → Salle de sport → Salle de réunion → Salle de jeux.

---

# 5. Module BUANDERIE

**Clé localStorage** : `buanderieData` | **Clé navigation** : `currentBuanderie`

- Identification : nom, surface
- Lave-linge : nombre, capacité (kg), ECS associée
- Sèche-linge : nombre, capacité (kg), type d'énergie (levier majeur)
- Calandre/repasseuse : toggle → puissance (kW)
- Usage : cycles/jour
- Observations

---

# 6. Module CUISINE

**Clé localStorage** : `cuisineData` | **Clé navigation** : `currentCuisine`

- Identification : type, nom, surface, climatisée
- Cuisson : liste dynamique (type + nombre)
- Fours : liste dynamique (type + nombre + puissance)
- Friteuses : toggle → nombre, énergie, puissance
- Plonge : nombre lave-vaisselle, type, ECS
- Chambres froides : liste dynamique (type + volume + puissance)
- Ventilation : type, nombre de hottes
- Observations

---

# 7. Module SALLE DE JEUX

**Clé localStorage** : `jeuxData` | **Clé navigation** : `currentJeux`

- Identification : nom, surface, climatisée, horaires
- Éclairage dominant
- Équipements : compteurs par type (billard, baby-foot, flipper, arcades, etc.)
- Écrans : nombre, permanents
- Observations

---

# 8. Module SALLE DE RÉUNION

**Clé localStorage** : `reunionData` | **Clé navigation** : `currentReunion`

- Identification : nom, surface, places assises, climatisée, brasseur d'air
- Ventilation et éclairage
- Audiovisuel : vidéoprojection, sonorisation, visioconférence
- Ouvrants par orientation
- Fréquence d'usage
- Observations

---

# 9. Module SALLE DE SPORT

**Clé localStorage** : `sportData` | **Clé navigation** : `currentSport`

- Identification : nom, nombre d'espaces, surface, climatisée, horaires
- Machines cardio : compteurs par type
- Autres machines
- Ventilation et éclairage
- Audiovisuel et sono
- Vestiaires : toggle → nombre de douches
- Observations

---

# 10. Module BUREAUX

**Clé localStorage** : `bureauxData` | **Clé navigation** : `currentBureaux`

- Identification : aménagement, surface, postes, climatisé, horaires
- Postes de travail : type, écrans, imprimantes
- Confort : brasseur d'air, ventilation
- Éclairage + détection de présence
- Équipements partagés : photocopieurs, distributeurs
- Salle serveur : toggle → surface, clim dédiée, puissance
- Ouvrants par orientation
- Observations

---

# 11. Module PARKING

**Clé localStorage** : `parkingData` | **Clé navigation** : `currentParking`

- Identification : type, surface, nombre de places
- Éclairage : type, nombre de points, pilotage
- Ventilation (conditionnel couvert/sous-sol) : toggle → puissance, mode
- Bornes VE : toggle → nombre, puissance unitaire
- Observations

---

**Dernière mise à jour** : 14 mai 2026
