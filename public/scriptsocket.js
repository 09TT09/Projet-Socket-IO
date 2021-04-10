let socket = io();
let initHoteIsSet = false;
let initIsSet = false;
let socketId = undefined;
let adversaireIdCard = 0;
let tourJoueur = false;

// UTILISATEURS MAXIMUN (2)
socket.on('clientMaxUsers', function() {
    alert('Le nombre d\'utilisateur maximum à été atteint: déconnexion !');
});

// TOUR DU JOUEUR
socket.on('clientTourDuJoueur', function() {
    document.getElementById('infoTourJoueur').innerHTML = "Votre tour";
    document.getElementById('infoTourJoueur').classList.add("votreTour");
    tourJoueur = true;
});

// NOT TOUR DU JOUEUR
socket.on('clientNotTourDuJoueur', function() {
    if (document.getElementById('infoTourJoueur')) {
        document.getElementById('infoTourJoueur').innerHTML = "Tour adverse";
        document.getElementById('infoTourJoueur').classList.remove("votreTour");
    }
    tourJoueur = false;
});

// INITIALISATION HôTE
socket.on('clientHoteInitialisation', function(data) {
    socketId = data.serverSocketId
    if (initHoteIsSet === false){
        if (document.getElementById('ecranInit')){
            document.getElementById('ecranInit').remove();
        }
        document.getElementById('conteneur').insertAdjacentHTML('afterbegin', `<div class="ecranInit" id="ecranInit"><div class="ecrantInitConteneur"><button class="buttonCommencer" id="buttonCommencer">Commencer</button><p>Nombre d\'utilisateur : <span class="utilisateurs" id="nombreUsers"></span></p></div></div>`);
        document.getElementById('buttonCommencer').addEventListener('click', function(){
            socket.emit('serverCommencer');
        });
        initHoteIsSet = true;
    }
});

// INITIALISATION != HôTE
socket.on('clientInitialisation', function(data) {
    socketId = data.serverSocketId
    if (initIsSet === false){
        document.getElementById('conteneur').insertAdjacentHTML('afterbegin', `<div class="ecranInit" id="ecranInit"><div class="ecrantInitConteneur"><h3>Veuillez attendre que l\'hôte lance la partie</h3><p>Nombre d\'utilisateur : <span class="utilisateurs" id="nombreUsers"></span></p></div></div>`);
        initIsSet = true;
    }
});

// COMPTER LE NOMBRE D'UTILISATEURS
socket.on('clientNombreUtilisateurs', function(data) {
    if (document.getElementById('nombreUsers')) {
        document.getElementById('nombreUsers').innerHTML = `${data.usersLength}`;
    }
});

// ATTENTE D'UN AUTRE JOUEUR
socket.on('clientWaitForUser', function() {
    alert('Veuillez attendre un autre joueur');
});

// CLIENTCOMMENCER
socket.on('clientCommencer', function() {
    if (document.getElementById('ecranInit')) {
        document.getElementById('ecranInit').remove();
    }
    document.getElementById('conteneur').insertAdjacentHTML('beforeend', '<div class="mainJ2" id="mainJ2"></div><div class="divVide"></div><div class="gameContainer" id="gameContainer"><img id="pioche" src="svg/back/dos-neutre.svg" class="cardPioche"></div><div class="tourJoueur" id="tourJoueur"><div class="infoBarre pasVotreTour" id="infoTourJoueur">Tour adverse</div><div class="infoBarre">Touche uno : <span>u</span></div><div class="infoBarre">Touche contre-uno : <span>i</span></div></div><div class="main" id="main"></div>');
    socket.emit('serverDistribution');
});

// PIOCHER LA CARTE D'INDICATION
socket.on('clientDrawCardIndicator', function(data) {
    document.getElementById('gameContainer').insertAdjacentHTML('beforeend', `<img id="${data.id}-${data.color}-indicator" ondrop="drop(event)" ondragover="allowDrop(event)" src="svg/${data.color}/${data.id}-${data.color}.svg" class="cardIndicator">`);
})

// PIOCHER UNE CARTE
socket.on('clientDrawCard', function(data) {
    document.getElementById('main').insertAdjacentHTML('beforeend', `<img onclick="testCard(this.id)" draggable="true" ondragstart="drag(event)" id="${data.id}-${data.color}" src="svg/${data.color}/${data.id}-${data.color}.svg" class="card">`);

    // HOVER DES CARTES VISIBLES PAR TOUS LES UTILISATEURS
    for(let classIndex = 0; classIndex < document.getElementsByClassName('card').length; classIndex++){
        document.getElementsByClassName('card')[classIndex].addEventListener('mouseover', function() {
            socket.emit('serverHover', {index: classIndex});
        });
        document.getElementsByClassName("card")[classIndex].addEventListener('mouseout', function(){
            socket.emit('serverMouseOut', {index: classIndex});
        });
    }
})

// VOIR LA CARTE PIOCHEE PAR L'ADVERSAIRE
socket.on('clientDrawCardAdversaire', function() {
    document.getElementById('mainJ2').insertAdjacentHTML('beforeend', `<img id="${adversaireIdCard}" src="svg/back/dos-neutre.svg" class="cardAdversaire">`);
    adversaireIdCard++;
})

// TESTER SI CARTE CHOISIE EN MAIN === CARTE SUR LE PLATEAU || SI CARTE NEUTRE AFFICHER LA PALETTE DES COULEURS
function testCard(getCardId) {
    if (tourJoueur === true) {
        const numberAndColor = getCardId.split('-');
        const cardIndicatorNumberAndColor = document.getElementsByClassName('cardIndicator')[0].id.split('-');
        const ColorTableau = ['Rouge', 'Bleu', 'Vert', 'Jaune'];
        if (numberAndColor[1] === 'neutre') {
            document.getElementById('conteneur').insertAdjacentHTML('beforeend', '<div class="couleurDiv" id="couleurDiv"></div>');
            for (let buttonColor = 0; buttonColor < ColorTableau.length; buttonColor++){
                document.getElementById('couleurDiv').insertAdjacentHTML('beforeend', `<button class="buttonColor buttonColor${ColorTableau[buttonColor]}" id="buttonColor${ColorTableau[buttonColor]}">${ColorTableau[buttonColor]}</button>`);
            }
        }
        if (numberAndColor[0] === cardIndicatorNumberAndColor[0] || numberAndColor[1] === cardIndicatorNumberAndColor[1] || numberAndColor[1] === 'neutre'){
            for(let allClassCard = 0; allClassCard < document.getElementsByClassName('card').length; allClassCard++){
                if (document.getElementsByClassName('card')[allClassCard].id === getCardId) {
                    socket.emit('serverAdversaireCardMoins', {index: allClassCard});
                }
            }
            document.getElementById(getCardId).remove();
            socket.emit('serverCarteVerifiee', {CardId: getCardId, CardIdSplit: numberAndColor});
            if (numberAndColor[1] != 'neutre') {
                if (numberAndColor[0] === 'passe') {
                    socket.emit('serverCardPasse');
                }
                else if (numberAndColor[0] === 'plus2') {
                    socket.emit('serverCardPlus2');
                }
                socket.emit('serverChangeTourJoueur');
            }
        }
    }
}

// CHANGE LA CARTE SUR LE PLATEAU PAR LA NOUVELLE
socket.on('clientChangePlateau', function(data) {
    document.getElementsByClassName('cardIndicator')[0].remove();
    document.getElementById('gameContainer').insertAdjacentHTML('beforeend', `<img id="${data.CardIdSplit[0]}-${data.CardIdSplit[1]}-indicator" ondrop="drop(event)" ondragover="allowDrop(event)" src="svg/${data.CardIdSplit[1]}/${data.CardIdSplit[0]}-${data.CardIdSplit[1]}.svg" class="cardIndicator">`);
    dataColor = data.CardIdSplit[1].toString();

    if (data.CardIdSplit[1] === 'neutre') {
        const ColorTableau = ['Rouge', 'Bleu', 'Vert', 'Jaune'];
        for (let buttonColor = 0; buttonColor < ColorTableau.length; buttonColor++){
            if (document.getElementById(`buttonColor${ColorTableau[buttonColor]}`)){
                document.getElementById(`buttonColor${ColorTableau[buttonColor]}`).addEventListener('click', function() {
                    socket.emit('serverCardPlus4');
                    document.getElementById('couleurDiv').remove();
                    socket.emit('serverColorSelected', {Color: ColorTableau[buttonColor]});
                    socket.emit('serverChangeTourJoueur');
                });
            }
        }
    }
})

// CARTE NEUTRE CHOIX DE LA COULEUR
socket.on('clientColorSelected', function(data) {
    const colorToLowerCase = data.Color.toLowerCase();
    document.getElementsByClassName('cardIndicator')[0].remove();
    document.getElementById('gameContainer').insertAdjacentHTML('beforeend', `<img id="vide-${colorToLowerCase}-indicator" ondrop="drop(event)" ondragover="allowDrop(event)" src="svg/${colorToLowerCase}/vide-${colorToLowerCase}.svg" class="cardIndicator">`);
})

// ACTIVATION DE LA PIOCHE DE CARTES
socket.on('activatePioche', function() {
    document.getElementById('pioche').addEventListener('click', function(){
        socket.emit('serverPioche', {clientSocketId: socketId});
        if (tourJoueur === true) {
            socket.emit('serverChangeTourJoueur');
        }
    });
})

socket.on('clientAdversaireCardMoins', function(data) {
    if (document.getElementsByClassName("cardAdversaire")[data.index]) {
        document.getElementsByClassName("cardAdversaire")[data.index].remove();
    }
})

socket.on('clientHover', function(data) {
    if (document.getElementsByClassName("cardAdversaire")[data.index]) {
        document.getElementsByClassName("cardAdversaire")[data.index].style.boxShadow = "4px 4px 1px crimson, 4px -4px 1px crimson, -4px 4px 1px crimson, -4px -4px 1px crimson";
        document.getElementById("mainJ2").style.height = "150px";
    }
})

socket.on('clientMouseOut', function(data) {
    if (document.getElementsByClassName("cardAdversaire")[data.index]) {
        document.getElementsByClassName("cardAdversaire")[data.index].style.boxShadow = "";
        document.getElementById("mainJ2").style.height = "50px";
    }
})

















// DRAG SYSTEM

function allowDrop(event) {
    event.preventDefault();
}
  
function drag(event) {
    event.dataTransfer.setData("cardOnBoardId", event.target.id);
}

// TESTER SI CARTE CHOISIE EN MAIN === CARTE SUR LE PLATEAU || SI CARTE NEUTRE AFFICHER LA PALETTE DES COULEURS (DRAG)

function drop(event) {
    if (tourJoueur === true) {
        event.preventDefault();
        let data = event.dataTransfer.getData("cardOnBoardId");
        const numberAndColor = data.split('-');
        const cardIndicatorNumberAndColor = document.getElementsByClassName('cardIndicator')[0].id.split('-');
        const ColorTableau = ['Rouge', 'Bleu', 'Vert', 'Jaune'];

        if (numberAndColor[1] === 'neutre') {
            document.getElementById('conteneur').insertAdjacentHTML('beforeend', '<div class="couleurDiv" id="couleurDiv"></div>');
            for (let buttonColor = 0; buttonColor < ColorTableau.length; buttonColor++){
                document.getElementById('couleurDiv').insertAdjacentHTML('beforeend', `<button class="buttonColor buttonColor${ColorTableau[buttonColor]}" id="buttonColor${ColorTableau[buttonColor]}">${ColorTableau[buttonColor]}</button>`);
            }
        }
        if (numberAndColor[0] === cardIndicatorNumberAndColor[0] || numberAndColor[1] === cardIndicatorNumberAndColor[1] || numberAndColor[1] === 'neutre'){
            for(let allClassCard = 0; allClassCard < document.getElementsByClassName('card').length; allClassCard++){
                if (document.getElementsByClassName('card')[allClassCard].id === data) {
                    socket.emit('serverAdversaireCardMoins', {index: allClassCard});
                }
            }
            document.getElementById(data).remove();
            socket.emit('serverCarteVerifiee', {CardId: data, CardIdSplit: numberAndColor});
        }
    }

}



function disconnectAll(){
    socket.emit('signalDisconnectAll');
}

socket.on('clientDisconnectAll', function() {
    socket.emit('serverDisconnectAll');
})

function globalResetClientFunctionTest() {
    socket.emit('globalResetClientFunctionTest');
}