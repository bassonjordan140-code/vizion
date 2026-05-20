var currentModule =
    JSON.parse(localStorage.getItem("currentModule"));

var moduleContent =
    document.getElementById("moduleContent");

var moduleTitle =
    document.getElementById("moduleTitle");

var moduleSubtitle =
    document.getElementById("moduleSubtitle");

if (currentModule && moduleTitle) {
    moduleTitle.textContent = currentModule.label;
}

/* ==============================
   Fonction générique de carte
============================== */

function createItemCard(opts) {
    // opts: { title, progress, hintEmpty, storageKey, currentKey, numero, moduleId, detailPage }

    var card = document.createElement("button");
    card.className = "dashboard-card";

    card.innerHTML =
        '<div class="dashboard-header">' +
            '<strong>' + opts.title + '</strong>' +
            '<span>' + opts.progress + '% ' + (opts.progress === 100 ? "✅" : "") + '</span>' +
        '</div>' +
        '<div class="progress-bar">' +
            '<div class="progress-fill" style="width: ' + opts.progress + '%"></div>' +
        '</div>' +
        '<small>' +
            (opts.progress === 100 ? "Terminé — modifier" :
             opts.progress > 0 ? "En cours — continuer" : opts.hintEmpty) +
        '</small>';

    card.addEventListener("click", function () {

        localStorage.setItem(
            opts.currentKey,
            JSON.stringify({
                moduleId: currentModule.id,
                numero: opts.numero
            })
        );

        window.location.href = opts.detailPage;

    });

    moduleContent.appendChild(card);
}

/* ==============================
   Branchement par module
============================== */

if (currentModule && currentModule.id === "hebergements") {

    var hebergementsData =
        JSON.parse(localStorage.getItem("hebergementsData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = hebergementsData[i];

        createItemCard({
            title: saved ? saved.type : "Hébergement " + i,
            progress: calcItemProgress("hebergements", saved),
            hintEmpty: "Studio, chambre deluxe, suite, villa, bungalow...",
            currentKey: "currentHebergement",
            numero: i,
            detailPage: "hebergement-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "piscines") {

    var piscinesData =
        JSON.parse(localStorage.getItem("piscinesData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = piscinesData[i];

        createItemCard({
            title: saved ? saved.type : "Piscine " + i,
            progress: calcItemProgress("piscines", saved),
            hintEmpty: "Lagon, débordement, couloir de nage, rectangle...",
            currentKey: "currentPiscine",
            numero: i,
            detailPage: "piscine-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "spa") {

    var spaData =
        JSON.parse(localStorage.getItem("spaData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = spaData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Spa " + i,
            progress: calcItemProgress("spa", saved),
            hintEmpty: "Spa hôtel, thalasso, wellness, espace détente...",
            currentKey: "currentSpa",
            numero: i,
            detailPage: "spa-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "restaurant") {

    var restaurantData =
        JSON.parse(localStorage.getItem("restaurantData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = restaurantData[i];

        createItemCard({
            title: saved ? saved.type : "Restaurant " + i,
            progress: calcItemProgress("restaurant", saved),
            hintEmpty: "Principal, gastronomique, brasserie, snack...",
            currentKey: "currentRestaurant",
            numero: i,
            detailPage: "restaurant-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "bar") {

    var barData =
        JSON.parse(localStorage.getItem("barData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = barData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Bar " + i,
            progress: calcItemProgress("bar", saved),
            hintEmpty: "Bar lobby, piscine, lounge, beach bar...",
            currentKey: "currentBar",
            numero: i,
            detailPage: "bar-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "buanderie") {

    var buanderieData =
        JSON.parse(localStorage.getItem("buanderieData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = buanderieData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Buanderie " + i,
            progress: calcItemProgress("buanderie", saved),
            hintEmpty: "Lave-linge, sèche-linge, calandre...",
            currentKey: "currentBuanderie",
            numero: i,
            detailPage: "buanderie-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "cuisine") {

    var cuisineData =
        JSON.parse(localStorage.getItem("cuisineData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = cuisineData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Cuisine " + i,
            progress: calcItemProgress("cuisine", saved),
            hintEmpty: "Cuisine centrale, satellite, laboratoire...",
            currentKey: "currentCuisine",
            numero: i,
            detailPage: "cuisine-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "bureaux") {

    var bureauxData =
        JSON.parse(localStorage.getItem("bureauxData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = bureauxData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Bureaux " + i,
            progress: calcItemProgress("bureaux", saved),
            hintEmpty: "Open space, bureaux cloisonnés, mixte...",
            currentKey: "currentBureaux",
            numero: i,
            detailPage: "bureaux-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "parking") {

    var parkingData =
        JSON.parse(localStorage.getItem("parkingData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = parkingData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Parking " + i,
            progress: calcItemProgress("parking", saved),
            hintEmpty: "Extérieur, couvert, sous-sol, silo...",
            currentKey: "currentParking",
            numero: i,
            detailPage: "parking-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "sport") {

    var sportData =
        JSON.parse(localStorage.getItem("sportData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = sportData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Salle de sport " + i,
            progress: calcItemProgress("sport", saved),
            hintEmpty: "Fitness, musculation, cardio...",
            currentKey: "currentSport",
            numero: i,
            detailPage: "sport-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "reunion") {

    var reunionData =
        JSON.parse(localStorage.getItem("reunionData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = reunionData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Salle de réunion " + i,
            progress: calcItemProgress("reunion", saved),
            hintEmpty: "Salle de réunion, séminaire, conférence...",
            currentKey: "currentReunion",
            numero: i,
            detailPage: "reunion-detail.html"
        });
    }

} else if (currentModule && currentModule.id === "jeux") {

    var jeuxData =
        JSON.parse(localStorage.getItem("jeuxData")) || {};

    for (var i = 1; i <= currentModule.quantity; i++) {

        var saved = jeuxData[i];

        createItemCard({
            title: saved && saved.nom ? saved.nom : "Salle de jeux " + i,
            progress: calcItemProgress("jeux", saved),
            hintEmpty: "Billard, baby-foot, arcade, flipper...",
            currentKey: "currentJeux",
            numero: i,
            detailPage: "jeux-detail.html"
        });
    }
}
