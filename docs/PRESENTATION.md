# ViZion

**Plateforme de récolte de données pour audit énergétique et rétrocommissioning**

*Document de présentation — Mai 2026*
*Développé par Jordan BASSON*

---

## 1. Résumé exécutif

ViZion est une application web légère qui digitalise la collecte de données terrain lors des audits énergétiques et opérations de rétrocommissioning, principalement dans le secteur hôtelier et tertiaire.

L'auditeur arrive sur site avec son téléphone ou sa tablette, ouvre ViZion, coche les modules présents dans l'établissement (hébergements, piscines, restaurants, spa, etc.), puis remplit pour chaque module une fiche détaillée structurée. Toutes les données sont sauvegardées en local et peuvent être consultées ou modifiées à tout moment.

**Stade actuel : prototype fonctionnel** — l'app tourne, le module Hébergements est à 30 % de complétion. La direction artistique est validée, le parcours utilisateur est en place.

**Vision** : remplacer le combo « Excel + papier + photos en vrac » par un outil unique, structuré, qui guide l'auditeur étape par étape et produit un rapport exploitable.

---

## 2. Problématique adressée

### Comment se passe un audit énergétique aujourd'hui

Un bureau d'études énergétique mandaté pour auditer un hôtel passe par ces étapes :

1. Repérage sur place — l'auditeur parcourt l'établissement
2. Prise de notes — souvent sur papier ou dans un fichier Excel générique
3. Photos en vrac — stockées dans un dossier sans nomenclature
4. Retour au bureau — saisie manuelle des données dans le logiciel d'analyse
5. Rédaction du rapport

### Les douleurs réelles

- **Perte de temps** : l'auditeur ressaisit en moyenne 40 à 60 % de ses données entre le terrain et le bureau.
- **Oublis sur site** : sans checklist structurée, des informations clés sont régulièrement oubliées (épaisseurs de parois, plaques signalétiques, etc.), nécessitant un retour sur place.
- **Photos non identifiables** : 200 à 500 photos par audit, souvent impossibles à associer à un équipement précis quelques semaines plus tard.
- **Pas de standardisation** : chaque auditeur a sa propre méthode, ce qui complique la consolidation en cabinet et la transmission entre collaborateurs.
- **Rétrocommissioning encore moins outillé** : c'est un marché en croissance (obligation décret tertiaire), mais les outils dédiés sont quasi inexistants.

### Le marché

- Le décret tertiaire impose à tous les bâtiments tertiaires de plus de 1 000 m² une réduction de consommation énergétique de **40 % d'ici 2030, 60 % d'ici 2050**.
- Cela représente plusieurs **centaines de milliers de bâtiments** à auditer puis suivre en France.
- Le secteur hôtelier français compte environ **17 000 hôtels** dont la majorité doit se mettre en conformité.

---

## 3. La solution ViZion

### Principe

Une application web responsive (utilisable sur téléphone, tablette ou ordinateur), qui :

1. **Guide** l'auditeur : il coche les modules présents sur site (hébergements, piscines, etc.) au début de la mission.
2. **Structure** la collecte : pour chaque module, une fiche organisée en blocs thématiques (identification, parois, ouvrants, équipements, photos, etc.).
3. **Sauvegarde** automatiquement toutes les données dans le navigateur.
4. **Produit** une base de données propre exploitable pour la rédaction du rapport.

### Le parcours utilisateur

```
1. Accueil → choix entre Audit énergétique et Rétrocommissioning
2. Configuration du site → cocher les modules présents et leur quantité
3. Tableau de bord terrain → liste des modules à auditer avec barre de progression
4. Détail d'un module → liste des éléments (Hébergement 1, Hébergement 2, etc.)
5. Fiche détaillée → 11 blocs structurés à remplir par élément
6. Sauvegarde et reprise possible à tout moment
```

### Modules couverts

L'application couvre déjà la sélection de 12 modules typiques d'un complexe hôtelier :
hébergements, piscines, restaurant, bar, spa, buanderie, cuisine, salle de jeux, salle de réunion / séminaire, salle de sport, bureaux, parking.

---

## 4. État d'avancement

### Ce qui est fait

| Composant | Statut |
|---|---|
| Parcours utilisateur complet (5 pages) | Fait |
| Direction artistique « dark premium » alignée sur le logo | Fait |
| Sélection multi-modules avec quantité | Fait |
| Tableau de bord terrain avec progression | Fait |
| Liste hébergements et accès individuel | Fait |
| Bloc 1 — Identification de l'hébergement | Fait |
| Bloc 2 — Parois multicouches (avec base de matériaux et épaisseurs auto) | Fait |
| Bloc 3 — Ouvrants par orientation (8 façades, 10 types d'ouvrants) | Fait |
| Logique de réinitialisation propre lors du changement de configuration | Fait |
| Sauvegarde automatique des données | Fait |

### Ce qui reste à faire — Module Hébergements

| Bloc | Description |
|---|---|
| Bloc 4 — Protections solaires | Brise-soleil, casquettes, végétation, par façade |
| Bloc 5 — Climatisation | État, plaque signalétique, photo |
| Bloc 6 — ECS (eau chaude sanitaire) | Type, énergie, photo |
| Bloc 7 — Équipements | Inventaire détaillé (télé, frigo, machine à café, etc.) |
| Bloc 8 — Piscine privée | Volume, chauffage, éclairage immergé |
| Bloc 9 — Éclairage | Avec calcul automatique de puissance totale par type d'ampoule |
| Bloc 10 — Photos obligatoires | Checklist avec renommage automatique |
| Bloc 11 — Commentaire libre | Observations terrain |

### Ce qui reste à faire — Autres modules

- Adaptation des 11 modules restants (piscines, restaurant, bar, spa, etc.) — chacun avec ses spécificités métier
- Partie Rétrocommissioning (à concevoir)
- Génération de rapport (PDF / Excel)
- Synchronisation cloud / multi-utilisateurs (optionnel selon modèle)

### Estimation du temps restant

- **Compléter le module Hébergements** : 2 à 3 semaines de développement
- **Décliner les 11 autres modules** : 4 à 6 semaines
- **Générateur de rapport** : 2 à 3 semaines
- **Beta testing sur site réel** : 2 à 4 semaines
- **Total pour v1 commercialisable** : environ 3 à 4 mois

---

## 5. Avantages

### Pour l'auditeur (utilisateur terrain)

- Gain de temps estimé : **30 à 50 %** sur la phase de collecte et saisie
- Aucun oubli grâce à la structure guidée
- Photos automatiquement nommées et organisées par module
- Reprise possible à tout moment (jamais de perte de données)
- Fonctionne hors-ligne (localStorage)
- Pas d'installation, accessible depuis n'importe quel appareil avec un navigateur

### Pour le bureau d'études (cabinet auditeur)

- **Standardisation** : tous les auditeurs collectent les mêmes informations dans le même format
- **Onboarding facilité** : un nouveau collaborateur est opérationnel en 1 journée
- **Données exploitables** : sortie structurée, prête à alimenter un logiciel de simulation thermique ou un rapport
- **Image moderne** : un outil digital aligne le cabinet avec les attentes des clients 2026+
- **Coût d'infrastructure minimal** : pas de serveur, pas de licence logicielle tierce

### Avantages techniques

- **Légèreté** : application web pure, pas de framework lourd, charge instantanée
- **Pas de dépendance** : aucun service externe nécessaire (Google, AWS, etc.)
- **Données sous contrôle** : tout reste en local côté utilisateur
- **Évolutivité** : architecture par blocs, ajout de nouveaux modules sans refonte

---

## 6. Inconvénients et limitations actuelles

### Limitations techniques actuelles

| Point | Conséquence | Mitigation possible |
|---|---|---|
| Stockage local uniquement | Données liées à un seul navigateur / appareil | Ajouter un export JSON manuel, puis une synchronisation cloud optionnelle |
| Limite de 5 à 10 Mo du localStorage | Limite le nombre de photos stockables | Migrer vers IndexedDB (capacité quasi illimitée) ou stockage serveur |
| Pas de collaboration temps réel | Un seul auditeur par session | Phase 2 : backend partagé |
| Pas encore de génération de rapport | Le rapport final reste à produire manuellement | À développer (Bloc final) |
| Pas de validation des champs | Possibilité de sauvegarder une fiche incomplète | Ajouter une couche de validation par bloc |

### Risques business

- **Adoption** : les auditeurs sont souvent attachés à leurs outils Excel personnels — il faudra accompagner la transition
- **Concurrence** : aucun concurrent direct identifié actuellement, mais des outils généralistes (BatiActu, Audiosphère) commencent à se positionner
- **Conformité RGPD** : si les données quittent le navigateur, il faudra un encadrement contractuel (sous-traitance, hébergement français)
- **Maintenance** : nécessite un développeur disponible pour les évolutions

---

## 7. Plan financier

### Hypothèses de base

- 1 développeur (Jordan BASSON) à temps partiel pour finaliser la v1
- Hébergement minimal : domaine + serveur web statique
- Marché cible : bureaux d'études énergétique français (environ 800 cabinets)

### Coûts de développement (jusqu'à v1)

| Poste | Estimation | Commentaire |
|---|---|---|
| Développement restant (3-4 mois temps partiel) | À valoriser selon coût horaire | Si en propre : coût opportunité. Si externalisé : 15 000 à 25 000 € |
| Design / UX raffinement | 0 à 2 000 € | Logo et DA déjà faits |
| Tests sur site réel | 500 à 1 500 € | Déplacements + temps |
| **Total mise en marché** | **15 000 à 30 000 €** | Si développement externalisé |

### Coûts récurrents (hébergement et maintenance)

| Poste | Coût annuel |
|---|---|
| Nom de domaine | 15 à 30 € |
| Hébergement static (Netlify, OVH, etc.) | 0 à 100 € |
| Backend optionnel (si synchro cloud) | 200 à 1 000 € |
| Maintenance corrective / évolutive | 2 000 à 5 000 € |
| **Total annuel** | **2 000 à 6 000 €** |

### Modèles de monétisation envisageables

#### Option A — Outil interne uniquement (pas de revenu direct)

Utilisation par Green Tech ou la structure de Jordan en propre. Le ROI vient du **gain de productivité** : si un audit prend 2 jours au lieu de 3, sur 30 audits/an cela représente 30 jours-homme économisés, soit environ **15 000 à 25 000 € de capacité supplémentaire** par auditeur.

#### Option B — Licence SaaS B2B

| Formule | Prix mensuel | Cible |
|---|---|---|
| Solo (1 utilisateur) | 49 € | Auditeur indépendant |
| Cabinet (jusqu'à 5 utilisateurs) | 149 € | Petit bureau d'études |
| Entreprise (illimité) | 399 € | Cabinet de plus de 5 personnes |

**Projection conservatrice à 18 mois** :
- 30 abonnés Solo : 30 × 49 € × 12 = **17 640 €/an**
- 10 abonnés Cabinet : 10 × 149 € × 12 = **17 880 €/an**
- 3 abonnés Entreprise : 3 × 399 € × 12 = **14 364 €/an**
- **Total annuel : environ 50 000 €**

Coût d'acquisition client estimé : 200 à 400 € (LinkedIn ciblé, salons, démos).
Marge brute sur SaaS pure : **75 à 85 %** une fois la v1 livrée.

#### Option C — Licence one-shot

Vente de la licence à un bureau d'études contre paiement unique de 1 500 à 3 000 €, plus un contrat de maintenance annuel de 300 à 500 €.

Avantage : plus accessible commercialement.
Inconvénient : revenu moins prévisible, pas d'effet récurrent.

#### Option D — Modèle hybride (recommandé)

- Version gratuite : modules de base, données locales uniquement → effet de viralité et acquisition
- Version payante : génération de rapport, synchronisation cloud, multi-utilisateurs, support → 79 €/mois par utilisateur

### Break-even (option B SaaS)

- Coûts annuels (hébergement + maintenance) : **6 000 €**
- Pour couvrir : **environ 10 abonnés Solo** ou **4 abonnés Cabinet**
- Atteignable réaliste en **6 à 9 mois** post-lancement avec une démarche commerciale active

---

## 8. Conclusion et prochaines étapes

ViZion est un projet à fort potentiel sur un marché en expansion réglementaire (décret tertiaire, transition énergétique). Le prototype fonctionnel valide la faisabilité technique et l'ergonomie. Le travail restant est essentiellement de la déclinaison (modules) plus une couche de génération de rapport.

### Recommandations à 3 mois

1. **Finaliser le module Hébergements** (blocs 4 à 11) — priorité absolue car c'est le module le plus complexe et le plus représentatif
2. **Tester en réel** sur 2 ou 3 audits avec retour utilisateur structuré
3. **Décliner sur les 2 ou 3 modules suivants les plus utilisés** (piscine, restaurant)
4. **Construire le générateur de rapport** (PDF de synthèse + export Excel)

### Recommandations à 6 mois

5. Décision sur le modèle économique (interne vs commercialisation)
6. Si commercialisation : landing page, démo en ligne, premiers prospects
7. Conformité RGPD documentée
8. Beta testing avec 3 à 5 cabinets pilotes

### À 12 mois

9. Lancement commercial v1
10. Backend de synchronisation si demande client
11. Couverture rétrocommissioning

---

## Annexe — Caractéristiques techniques

- **Stack** : HTML / CSS / JavaScript vanille (sans framework)
- **Stockage** : localStorage (5 à 10 Mo par navigateur)
- **Compatibilité** : tous navigateurs modernes (Chrome, Firefox, Safari, Edge) — mobile et desktop
- **Hébergement** : peut tourner sur n'importe quel serveur statique (OVH, Netlify, GitHub Pages, Vercel, AWS S3)
- **Pas de dépendance externe** : aucune librairie tierce
- **Performance** : chargement initial inférieur à 200 Ko, fonctionne hors-ligne après premier accès
- **Données** : structurées en JSON, exportables, conformes à un schéma reproductible

---

*Contact : Jordan BASSON*
*Document généré le 13 mai 2026*
