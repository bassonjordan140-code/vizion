# ViZion — Contexte de développement

> Plateforme de récolte de données pour audit énergétique et rétrocommissioning.
> Application web statique (HTML/CSS/JS vanilla, pas de build, pas de framework).
> Stockage : `localStorage` côté client.

---

## 1. Stack & architecture

**Aucune dépendance, aucun build.** Tout est en HTML/CSS/JS pur, servi en static.

```
App_projet/
├── index.html               # Accueil (choix Audit / Rétrocommissioning)
├── audit.html               # Sélection des modules présents sur le site
├── site-data.html           # Tableau de bord terrain (liste modules)
├── module-detail.html       # Détail d'un module (liste des hébergements 1..N)
├── hebergement-detail.html  # Fiche complète d'un hébergement
├── script.js                # Logique audit.html
├── site-data.js             # Logique site-data.html
├── module-detail.js         # Logique module-detail.html
├── hebergement-detail.js    # Logique fiche hébergement
├── style.css                # Styles globaux (toutes les pages)
└── images/
    ├── Nouveau logo_viszion.png   # Logo officiel utilisé
    ├── logo_vizion.png            # Ancien logo (legacy)
    └── logo_vizion.svg            # Logo SVG itératif (legacy)
```

---

## 2. Direction artistique — Dark premium

Palette inspirée du logo `Nouveau logo_viszion.png` :

**Fonds bleu nuit**
- Fond principal de l'application : `#060915` (flat, partout — body + container, pour que le logo se fonde sans seam visible)
- Bleu sombre principal du logo : `#020B22`
- Bleu nuit secondaire : `#07163B` (utilisé pour les `input/select`)
- Bleu profond de dégradé : `#0A1F4F`

**Argent métallique**
- Texte principal (h1, valeurs, titres) : `#E6E8ED`
- Texte secondaire (subtitle, labels) : `#C8CCD5`
- Texte muet (small, footer, hints) : `#9DA4B2`
- Boutons primaires + compteurs : gradient `#E6E8ED → #9DA4B2`, texte sombre `#020B22` dessus
- Bordures : `rgba(157, 164, 178, 0.15)` au repos, `0.35` au hover
- Progress bar : gradient `#9DA4B2 → #C8CCD5 → #E6E8ED` ("acier brossé")

**Typographie** : `Montserrat, Arial, sans-serif`

---

## 3. Parcours utilisateur

```
index.html (Accueil)
   └─ "Audit énergétique"
       └─ audit.html (cocher les modules présents + nombre)
           └─ "Continuer"
               └─ site-data.html (Tableau de bord terrain — liste des modules cochés)
                   └─ Cliquer sur un module (ex: Hébergements)
                       └─ module-detail.html (liste Hébergement 1, 2, 3…)
                           └─ Cliquer sur "Hébergement N"
                               └─ hebergement-detail.html (Fiche complète à remplir)
                                   └─ "Sauvegarder" → retour module-detail.html
```

Le bouton retour (flèche en haut à gauche) de **audit.html** déclenche une **remise à zéro complète** de toutes les données.

---

## 4. Stockage localStorage

| Clé | Contenu |
|---|---|
| `selectedModules` | `[{id, label, quantity}]` — modules cochés à l'audit |
| `moduleProgress` | `{moduleId: %}` — progression par module (pas encore exploitée) |
| `currentModule` | Module actuellement consulté (depuis site-data.html) |
| `currentHebergement` | `{moduleId, numero}` — hébergement consulté |
| `hebergementsData` | **Toutes les fiches hébergement** (voir structure ci-dessous) |
| `piscinesData`, `restaurantData`, etc. | Réservé aux futurs modules |

### Structure `hebergementsData`

```json
{
  "1": {
    "typeSelect": "Autre",
    "type": "Studio Premium",
    "nom": "Studio côté mer",
    "nbEtages": 1,
    "nbHebergements": 12,
    "nbChambres": 1,
    "capacite": 2,
    "parois": [
      { "materiau": "Béton", "epaisseur": 20 },
      { "materiau": "Laine de verre", "epaisseur": 10 },
      { "materiau": "BA13", "epaisseur": 1.3 }
    ],
    "ouvrants": {
      "nord":        [{ "type": "Baie vitrée", "nombre": 2 }],
      "nord-est":    [],
      "est":         [{ "type": "Porte", "nombre": 1 }],
      "sud-est":     [],
      "sud":         [{ "type": "Baie vitrée", "nombre": 3 }, { "type": "Coulissant", "nombre": 1 }],
      "sud-ouest":   [],
      "ouest":       [],
      "nord-ouest":  []
    }
  },
  "2": { ... }
}
```

### Fonctions de reset (dans `script.js`)

- `clearModuleData(moduleId)` → efface les clés d'un module spécifique
- `clearAllModuleData()` → efface toutes les données de tous les modules + `currentHebergement`
- Mapping dans `moduleDataKeys` (objet en haut de script.js) — à enrichir quand on ajoute des modules

---

## 5. Modules audit — État d'avancement

### Modules disponibles à l'audit (`script.js`)
```js
hebergements, piscines, restaurant, bar, spa, buanderie, cuisine,
jeux, reunion, sport, bureaux, parking
```
Tous ont un counter de quantité. Seul `hebergements` est implémenté en détail pour l'instant.

### Module Hébergements — Blocs

| Bloc | Statut | Description |
|---|---|---|
| **1. Identification** | OK | Type (avec "Autre" → texte libre), Nom, Nb étages, Nb hébergements, Nb chambres, Capacité. Sauvegarde + reload OK. Affichage du `type` sur la liste module-detail. |
| **2. Parois multicouches** | OK | Liste de couches `{materiau, epaisseur}`. 10 matériaux par défaut avec épaisseurs auto (Béton 20cm, Parpaing 20cm, Brique 15cm, Tôle 1cm, Laine de verre 10cm, Laine de roche 10cm, Polystyrène 8cm, BA13 1.3cm, Bois 5cm, Autre 0cm). Épaisseur modifiable (step 0.1). Bouton ✕ pour supprimer. |
| **3. Ouvrants / façades** | OK | 8 orientations (N, NE, E, SE, S, SO, O, NO). Par orientation : liste de `{type, nombre}`. 10 types : Porte, Simple/Double/Triple vantail, Baie vitrée, Coulissant, À la française, Jalousie, Fixe, Autre. Compteur d'ouvrants par façade dans l'en-tête. |
| **4. Protections solaires** | À FAIRE | Question Oui/Non. Si oui : Type (Brise-soleil, Casquette, Végétation, Autre), Façade concernée, Photo. Tableau (plusieurs entrées possibles). |
| **5. Climatisation** | À FAIRE | Climatisé ? O/N. Plaque signalétique ? O/N → si oui photo. État (Bon / Moyen / Dégradé). |
| **6. ECS** | À FAIRE | ECS ? O/N. Si oui : Centralisée/Individuelle, Énergie (Élec, Solaire, Thermodynamique, Gaz, Autre), Photo. |
| **7. Équipements** | À FAIRE | Cases à cocher : Télé, Minibar, Frigo, Machine café, Sèche-cheveux, Téléphone, Cave vin, Machine glaçons, Bain remous, Brasseur air, Bouilloire, Plaques cuisson, Micro-ondes. Photo générale. |
| **8. Piscine privée** | À FAIRE | Piscine ? O/N. Si oui : Chauffée O/N, Volume m³, Éclairage immergé O/N (si oui : Nombre + Type LED/Halogène/Autre). Photo. |
| **9. Éclairage** | À FAIRE | Liste `{type ampoule, puissance auto, quantité, puissance totale calculée}`. Types : LED 9W, Fluocompacte 18W, Tube fluorescent 36W, Halogène 50W, Incandescence 60W. Calcul : `puissance × quantité`. |
| **10. Photos obligatoires** | À FAIRE | Checklist : chambre générale, équipements, ouvrants, protections solaires, végétation abords, plaque clim, ECS, piscine privée. Renommage auto : `photo_hebergement_{N}_{type}_{XX}.jpg`. |
| **11. Commentaire libre** | À FAIRE | Un seul `<textarea>` "Observation terrain". |

---

## 6. Conventions de code

### JS
- **Vanilla JS, ES2017+** (const/let, arrow OK mais on utilise plutôt `function ()` pour la lisibilité, template literals OK)
- **Pas de framework**, pas d'imports — chaque fichier JS est inclus via `<script src="…">` directement dans son HTML
- **Pas de classe**, fonctions et IIFE
- **Re-render complet** des listes dynamiques (parois, ouvrants) sur change/delete/add — simple à maintenir
- **Listeners attachés à la fin du renderXxx()** pour éviter les listeners orphelins

### HTML
- Une `module-detail-card` par bloc dans la fiche hébergement, pour bien découper visuellement
- IDs explicites pour les éléments interactifs (`addParoiButton`, `ouvrantsContainer`, etc.)
- Boutons de suppression : `<button type="button">` impératif (sinon submit du form si dans un formulaire)

### CSS
- Sections commentées avec `/* ========================= */`
- `box-sizing: border-box` global
- Responsive mobile via `@media (max-width: 760px)` (container) et `@media (max-width: 600px)` (grid des parois/ouvrants)
- Pas de gradient sur le container principal (le `#060915` flat fait blender le logo)

### Reset
- **Le bouton retour de audit.html clear TOUT** via `clearAllModuleData()`
- **Au "Continuer" de audit.html, les modules décochés voient leurs données effacées** via `clearModuleData(id)`

---

## 7. Bugs corrigés (historique)

- `module-detail.js` n'avait pas les déclarations de `currentModule` et `moduleContent` → ajoutées en tête de fichier
- Le retour à l'accueil ne supprimait pas `hebergementsData` → corrigé
- Décocher un module ne nettoyait pas ses fiches → corrigé via `clearModuleData(id)` au Continuer

---

## 8. Prompt de reprise pour Claude Code

```
Je continue le développement de ViZion, une app web vanilla JS pour
audit énergétique. Lis CONTEXT.md à la racine du projet pour le contexte
complet (architecture, palette, structure localStorage, blocs faits / à faire).

Prochain bloc à coder : Bloc 4 — Protections solaires.
Spec dans CONTEXT.md section 5.

Respecte :
- La DA dark premium (palette #060915 fond, argent #E6E8ED / #C8CCD5 / #9DA4B2,
  bleus #020B22 / #07163B / #0A1F4F)
- Les conventions de code (vanilla JS, re-render complet des listes,
  pas de framework, structure module-detail-card par bloc)
- Le format de sauvegarde dans hebergementsData[N].protectionsSolaires
- Le pattern UX déjà en place (carte avec section-title + section-hint
  + liste + add-row-button)

Ne touche pas au logo, ni au CSS du logo, ni au fond du container
(c'est calibré pour blender avec le PNG).
```

---

## 9. Points d'attention pour la suite

1. **Photos** — pour les blocs qui demandent des photos (4, 5, 6, 7, 8, 10), il faudra :
   - Soit un upload local → base64 → localStorage (lourd, limite ~5 Mo total)
   - Soit un système File System Access API (mais moins compatible)
   - Soit une approche "à venir" qu'on déclenche plus tard
   - **Pour l'instant, prévoir le champ photo en placeholder** (input file disabled ou bouton "Photo à venir") pour ne pas bloquer la structure des données

2. **Renommage auto des photos** (Bloc 10) — `photo_hebergement_1_chambre_01.jpg` — à implémenter quand on a la stratégie photo

3. **Tableau de bord (`site-data.html`)** — la progression par module est calculée à 0% partout pour l'instant. Quand les blocs avanceront, prévoir une fonction `computeHebergementProgress(N)` qui retourne un % basé sur le remplissage des blocs.

4. **Validation des champs** — actuellement pas de validation (on peut sauvegarder une fiche vide). À voir si on veut bloquer la sauvegarde sans nom/type.

5. **Rétrocommissioning** — le bouton sur index.html n'a pas d'action. Tout reste à faire pour ce flux.

---

**Dernière mise à jour** : 12 mai 2026
**Stack** : HTML/CSS/JS vanilla, localStorage
**Mode** : développement local (Live Server VS Code recommandé)
