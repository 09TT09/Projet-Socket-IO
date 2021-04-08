let notTheSame = [];
let nombreDeJoueur = 1;
let cardInDeck = 108;

function setListenerCommencer() {
    document.getElementById('commencer').addEventListener('click', function() {
        for (let firstpioche = 0; firstpioche != (7 * nombreDeJoueur); firstpioche++) { distribution(firstpioche); }
    });
}

function distribution(firstpioche) {
    setTimeout(function(){ randomIdCard(); }, 100 * firstpioche);
}

function setListenerPioche() {
    document.getElementById('pioche').addEventListener('click', function() {
        randomIdCard();
    });
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
    console.log(cardInDeck);
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

    document.getElementById('main').insertAdjacentHTML('beforeend', `<img id="${cardId}-${cardColorId}" src="svg/${cardColorId}/${cardId}-${cardColorId}.svg" class="card">`);

}