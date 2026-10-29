# Format d'export de ViZion — ce qui a changé (v2026.10.29-43)

Réponse au document « Ce que l'export de l'outil de visite donne au rapport, et ce qui lui manque ».
Tout ce qui existait avant est conservé tel quel : **rien n'est renommé ni retiré**, les ajouts sont
de nouveaux champs ou de nouvelles feuilles. `meta.formatVersion` passe à **2**.

## audit.json

### `meta`
| Champ | Contenu |
|---|---|
| `formatVersion` | `2` |
| `hotel` | `{ index, id, nomReferentiel }` : numéro de l'hôtel dans le référentiel (`js/hotels-data.js`, liste qui ne fait que s'allonger), identifiant lisible (`villa-delisle`) et nom du référentiel. À utiliser pour rapprocher l'export de l'hôtel, plutôt que `siteInfo.nom` (texte libre). |
| `unites` | Rappel des unités (voir plus bas). |
| `nonReleve` | `null` veut dire « non relevé ». |

### `batiments[].lignes` (nouveau)
Une ligne par équipement, **toujours avec son lot de travaux** et sa puissance **en watts** :

```json
{ "fiche": "hebergements_1", "secteur": "Hébergements", "localisation": "Appartement",
  "description": "Climatisation (splits)", "nombre": 16, "puissanceUnitaireW": 2500,
  "lot": "1-2", "lotNom": "Climatisation split system",
  "fonctionnement": { "heuresParJour": 8, "joursParAn": 300, "heuresParAn": 2400,
                      "simultaneite": 0.7, "tauxUtilisation": 0.6 } }
```

* `fiche` = `<secteur>_<numéro>`, le même préfixe que les noms de photos.
* `puissanceUnitaireW` : **toujours des watts**. Les champs `secteurs[…]` gardent leur unité de saisie
  (inchangée pour ne pas fausser les générateurs existants), qui est le **kW** pour : pompes de piscine
  et de bain à remous, chauffage de piscine, calandre, ventilation et bornes de parking.
  Seules les pompes de piscine étaient connues du générateur ; les cinq autres champs passaient en
  « watts » alors qu'ils sont en kW. `lignes[]` règle le problème sans toucher au reste.
* `fonctionnement` : régime saisi pour le lot de la ligne, ou `null`. `simultaneite` et
  `tauxUtilisation` sont des fractions de 1.
* Le lot est celui de la fiche ; sans lot choisi, il est déduit du nom (table de la fiche hébergement,
  puis base d'équipements connus) ; en dernier recours `9-1` « Autres ». Le récapitulatif avant export
  signale maintenant les équipements dont le lot ne peut pas être déduit.
* Lave-linge, sèche-linge et calandre sont rattachés explicitement à **`7-1` Forces motrices**
  (ils finissaient en « Autres » ou dans la cuisine).
* Les noms d'équipement sont normalisés (« Mirco onde » → « Micro-ondes ») : à la saisie, et à
  l'export pour les anciennes fiches.

### `batiments[].thermique` (nouveau, seulement si des parois existent)
Par fiche hébergement : `parois.verticales` et `parois.horizontales[]` (toiture, plancher haut,
plancher bas) avec, par couche, `lambda`, `masseVolumique`, `chaleurSpecifique` (bibliothèque de
matériaux `js/materiaux-thermiques.js`, valeurs conventionnelles type EN ISO 10456), puis `rth`, `u`,
`absorption` (selon la couleur extérieure) et `facteurSolaire` (S = 0,04 × α × U).
`complet: false` quand une couche est inconnue (« Autre », épaisseur manquante) : rien n'est inventé.
**Non calculés : exigences et conformité PERENE.**

### « Non relevé »
`periode`, `periodeChauffage` (texte vide) et `nbChambres`, `cyclesLaveLinge`, `cyclesSecheLinge`
(zéro jamais saisi) sortent en `null`.

### Compléments saisis (`secteurs[…][n].complements`, `siteInfo.complements`)
Un champ jamais rempli n'existe pas. Groupes par fiche : `clim_ue`, `clim_ui`, `vmc`, `brasseur`,
`ecs`, `eclairage`, `typologie`, `enveloppe`, `parois_horizontales[]`, `chambres_froides[]`,
`extraction_cuisine`, `lavage_cuisine`, `machines_buanderie`, `bassin`, `regimes[]`.
Groupes du site : `descriptif` (surfaces, niveaux, année, exploitant), `perene` (5 critères),
`poste_transformation`, `groupes_eau_glacee[]`.
Dans `regimes[]` les pourcentages sont saisis en % (70 = 70 %) ; `lignes[].fonctionnement` les
donne en fractions.

## rapport.xlsx
Inchangé, avec une nouvelle feuille **« Fonctionnement »** (ajoutée seulement si au moins un régime est
saisi) : Bâtiment, Secteur, Localisation, Lot, Lot:Nom, Heures par jour, Jours par an, Heures par an,
Simultanéité, Taux d'utilisation. La feuille « Observations » portait déjà `Lot` et `Lot:Nom`.
Lave-linge, sèche-linge et calandre y passent en `7-1`.

## Photos
`clim` est remplacé par **`clim_ue`** (unité extérieure) et **`clim_ui`** (unité intérieure) ; la
plaque signalétique avait déjà son rôle `clim_plaque`. Les photos prises avec l'ancien rôle `clim`
restent exportées et visibles dans la fiche (« Photos de clim déjà prises »).
Les photos prises dans l'appli sont toutes réenregistrées en JPEG : les `.HEIC` de l'export du Clos
y ont été ajoutés à la main.

## À savoir
* Les valeurs de la bibliothèque de matériaux et les coefficients de couleur sont **indicatifs**
  (à valider par le bureau d'études) ; elles se règlent dans `js/materiaux-thermiques.js`.
* Convertir les puissances de `secteurs[…]` en watts partout est possible, mais ferait doubler la
  correction « pompes de piscine » du générateur : à faire en même temps des deux côtés, en
  s'appuyant sur `meta.formatVersion`.
