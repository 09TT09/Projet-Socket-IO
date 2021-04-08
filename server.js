const express = require('express')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

let idUsers = []
let joueurTour = undefined
let oldTurn = undefined
let endFirstPioche = 0
let varTimeout = undefined
let firstPiocheActive = true;


app.use(express.static(__dirname + '/public'))

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html')
})
 
io.on('connection', function(socket) {

  const socketId = socket.id
  idUsers.push(socketId)
  clearTimeout(varTimeout);
  console.log(idUsers)

  // UTILISATEURS MAXIMUN (2)
  if (idUsers.length > 2) {
    socket.emit('clientMaxUsers')
    idUsers.splice(idUsers.indexOf(socket.id), 1)
    socket.disconnect()
  }

  // UTILISATEURS * DECONNEXION FORCEE SANS MESSAGE
  socket.on('signalDisconnectAll', function() {
    io.emit('clientDisconnectAll')
  })
  socket.on('serverDisconnectAll', function() {
    idUsers.splice(idUsers.indexOf(socket.id), 1)
    socket.disconnect()
    console.log(idUsers)
  })

  // UTILISATEURS 0 && 1 : FONCTION INITIALISATION
  io.to(idUsers[0]).emit('clientHoteInitialisation', {serverSocketId: idUsers[0]})
  if (idUsers[1]){
    io.to(idUsers[1]).emit('clientInitialisation', {serverSocketId: idUsers[1]})
  }
  io.emit('clientNombreUtilisateurs', {usersLength: idUsers.length})

  // UTILISATEURS * : FONCTION COMMENCER || WAITFORUSER
  socket.on('serverCommencer', function() {
    if (idUsers.length === 2) {
      joueurTour = Math.floor(Math.random() * 2)
      io.emit('clientCommencer')
    }
    else if (idUsers.length < 2){
      io.to(idUsers[0]).emit('clientWaitForUser')
    }
  })

  // UTILISATEURS * : FONCTION DISTRIBUTION
  socket.on('serverDistribution', function() {
      let firstpiocheMax = 7
      if (idUsers[0] === socketId) {
        firstpiocheMax = 8
      }
      for (let firstpioche = 0; firstpioche != firstpiocheMax; firstpioche++) {
        endFirstPioche++
        distribution(firstpioche)
      }
      setTimeout(function(){
        if (endFirstPioche === 15){
            io.to(idUsers[joueurTour]).emit('clientTourDuJoueur')
            oldTurn = joueurTour
            firstPiocheActive = false
        }
      }, 1000);
      socket.emit('activatePioche')
  })

  // UTILISATEUR * : FONCTION CHANGETOURJOUEUR
  socket.on('serverChangeTourJoueur', function() {
    joueurTour++
    if (joueurTour > 1){
      joueurTour = 0
    }
    io.to(idUsers[joueurTour]).emit('clientTourDuJoueur')
    io.to(idUsers[oldTurn]).emit('clientNotTourDuJoueur')
    oldTurn = joueurTour
  })

  // UTILISATEUR * EXCEPT SENDER : FONCTION HOVER
  socket.on('serverHover', function(data) {
    socket.broadcast.emit('clientHover', {index : data.index})
  })

  // UTILISATEUR * EXCEPT SENDER : FONCTION MOUSEOUT
  socket.on('serverMouseOut', function(data) {
    socket.broadcast.emit('clientMouseOut', {index : data.index})
  })

  // UTILISATEUR : FONCTION PIOCHE
  socket.on('serverPioche', function(data) {
    if (idUsers[joueurTour] === socketId) {
      let joueur = idUsers.indexOf(data.clientSocketId)
      joueurCardDistribution = joueur + 1
      randomIdCard()
    }
  })

  // UTILISATEURS * : FONCTION CARTEVERIFIEE
  socket.on('serverCarteVerifiee', function(data) {
    io.emit('clientChangePlateau', {CardId: data.CardId, CardIdSplit: data.CardIdSplit})
  })

  // UTILISATEURS * EXCEPT SENDER : FONCTION ADVERSAIRECARDMOINS
  socket.on('serverAdversaireCardMoins', function(data) {
    socket.broadcast.emit('clientAdversaireCardMoins', {index : data.index})
  })

  // UTILISATEURS * : FONCTION COULEURSELECTED
  socket.on('serverColorSelected', function(data) {
    io.emit('clientColorSelected', {Color: data.Color})
  })

  // CARD PROPERTIES
  socket.on('serverCardPasse', function() {
    joueurTour++
    if (joueurTour > 1){
      joueurTour = 0
    }
    oldTurn = joueurTour
  })

  socket.on('serverCardPlus2', function() {
    joueurCardDistribution = idUsers.indexOf(socketId) + 2
    for (let pioche2 = 0; pioche2 < 2; pioche2++) {
      randomIdCard()
    }
  })

  socket.on('serverCardPlus4', function() {
    joueurCardDistribution = idUsers.indexOf(socketId) + 2
    for (let pioche4 = 0; pioche4 < 4; pioche4++) {
      randomIdCard()
    }
  })

  // DECONNEXION UTILISATEUR
  socket.on('disconnect', function () {
    idUsers.splice(idUsers.indexOf(socketId), 1)
    if (idUsers[0]) {
      io.to(idUsers[0]).emit('clientHoteInitialisation', {serverSocketId: idUsers[0]})
      io.emit('clientNombreUtilisateurs', {usersLength: idUsers.length})
    }

    if (idUsers.length === 0) {
      const trenteSec = 30000
      varTimeout = setTimeout(function(){ console.log('30 secondes : Reset'); globalReset() }, trenteSec);
    }
  })

  // RESET DES VARIABLES
  function globalReset() {

    // VAR SOCKET
    idUsers = []
    joueurTour = undefined
    oldTurn = undefined
    endFirstPioche = 0
    varTimeout = undefined

    // VAR LOGIQUE CARTES
    notTheSame = [];
    nombreDeJoueur = 2;
    cardInDeck = 108;
    joueurCardDistribution = 1;
    releavedCard = false;

    // VAR FRONT END
    io.emit('globalReset')
  }

})

// SERVER LISTEN

http.listen(3000, function(){
  console.log('server running on port 3000')
})
















// LOGIQUE CARTES

let notTheSame = [];
let nombreDeJoueur = 2;
let cardInDeck = 108;
let joueurCardDistribution = 1;
let releavedCard = false;

function distribution(firstpioche) {
  setTimeout(function(){ randomIdCard(); }, 100 * firstpioche);
}

function randomIdCard() {

    const cardValue = Math.floor(Math.random() * 108 + 1);

    if (cardInDeck > 0)  {
        if (notTheSame.length < 108){
            if (notTheSame.indexOf(cardValue) === -1) {
                notTheSame.push(cardValue);
                cardInDeck--;
                funColorCard(cardValue);
            }
            else { randomIdCard(); }
        }
    }
    else { alert('Aucune cartes dans le deck !'); }
    //console.log(cardInDeck);
}

function funColorCard(cardValue){
    let cardColor;
    let cardColorId;
    let cardGetVarNumber;

    if (cardValue > 100) {
        cardColor = 4;
        cardColorId = 'neutre';
    }
    else if (cardValue > 75) {
        cardColor = 3;
        cardColorId = 'bleu';
        cardGetVarNumber = cardValue - 75;
    }
    else if (cardValue > 50) {
        cardColor = 2;
        cardColorId = 'vert';
        cardGetVarNumber = cardValue - 50;
    }
    else if (cardValue > 25) {
        cardColor = 1;
        cardColorId = 'jaune';
        cardGetVarNumber = cardValue - 25;
    }
    else if (cardValue <= 25) {
        cardColor = 0;
        cardColorId = 'rouge';
        cardGetVarNumber = cardValue;
    }

    pioche(cardColor, cardColorId, cardValue, cardGetVarNumber);
}

function pioche(cardColor, cardColorId, cardValue, cardGetVarNumber) {
    let cardId;
    
    if (cardColor < 4) {
        if (cardGetVarNumber === 1){ cardId = 0 }
        else if (cardGetVarNumber > 1 && cardGetVarNumber <= 3) { cardId = '1'; }
        else if (cardGetVarNumber > 3 && cardGetVarNumber <= 5) { cardId = '2'; }
        else if (cardGetVarNumber > 5 && cardGetVarNumber <= 7) { cardId = '3'; }
        else if (cardGetVarNumber > 7 && cardGetVarNumber <= 9) { cardId = '4'; }
        else if (cardGetVarNumber > 9 && cardGetVarNumber <= 11) { cardId = '5'; }
        else if (cardGetVarNumber > 11 && cardGetVarNumber <= 13) { cardId = '6'; }
        else if (cardGetVarNumber > 13 && cardGetVarNumber <= 15) { cardId = '7'; }
        else if (cardGetVarNumber > 15 && cardGetVarNumber <= 17) { cardId = '8'; }
        else if (cardGetVarNumber > 17 && cardGetVarNumber <= 19) { cardId = '9'; }
        else if (cardGetVarNumber > 19 && cardGetVarNumber <= 21) { cardId = 'changement'; }
        else if (cardGetVarNumber > 21 && cardGetVarNumber <= 23) { cardId = 'passe'; }
        else if (cardGetVarNumber > 23 && cardGetVarNumber <= 25) { cardId = 'plus2'; }
    }
    else if (cardColor === 4) {
        if (cardValue > 104) { cardId = 'plus4'; }
        else if (cardValue > 100 && cardValue <= 104) { cardId = 'couleur'; }
    }

    if (joueurCardDistribution > nombreDeJoueur) {
      if (firstPiocheActive === true){
        joueurCardDistribution = 1;
      }
    }

    if (releavedCard === false){
      revealFirstCard(cardId, cardColorId);
    }
    else if (releavedCard === true){
      if (joueurCardDistribution === 1) {
        io.to(idUsers[0]).emit('clientDrawCard', { color: cardColorId, id: cardId })
        io.to(idUsers[1]).emit('clientDrawCardAdversaire')
        if (firstPiocheActive === true){
          joueurCardDistribution++;
        }
      }
      else if (joueurCardDistribution === 2) {
        io.to(idUsers[1]).emit('clientDrawCard', { color: cardColorId, id: cardId })
        io.to(idUsers[0]).emit('clientDrawCardAdversaire')
        if (firstPiocheActive === true){
          joueurCardDistribution++;
        }
      }
    }
}

function revealFirstCard(cardId, cardColorId) {
  if (releavedCard === false){
      io.emit('clientDrawCardIndicator', { color: cardColorId, id: cardId })
      releavedCard = true;
  }
}