/**
 * Inteligência Artificial para os jogadores controlados pelo computador.
 * Simula estratégias de Truco Paulista, personalidades, blefes e falas típicas de boteco.
 */

const TRUCO_QUOTES = {
  truco: [
    'TRUUUUCO, MARRECO!',
    'Truco na cabeça!',
    'Truco, ladrão!',
    'Cai pra dentro! TRUCO!',
    'Truco! Quero ver segurar!'
  ],
  seis: [
    'SEEEEEIS!',
    'Seis no peito do caboclo!',
    'Acha que é brincadeira? É SEIS!',
    'Seis pra esquentar!'
  ],
  nove: [
    'NOOOVE!',
    'Chora cavaco! É NOVE!',
    'Nove pra você pensar na vida!',
    'Vem de nove que eu te mostro!'
  ],
  doze: [
    'DOOOZE PRA FECHAR O CAIXÃO!',
    'DOZE! Não passa nem vento!',
    'Doze na tampa da chaleira!',
    'DOOOZE! Aqui é baralho!'
  ],
  accept: [
    'Desce!',
    'Cai dentro!',
    'Tá aceito, pode vir!',
    'Vem quente que eu tô fervendo!',
    'Aceito de peito aberto!'
  ],
  run: [
    'Corro, tá muito azedo...',
    'Leva essa mixaria...',
    'Deixa passar essa vaza.',
    'Não quero, passo.',
    'Hoje não, marreco.'
  ],
  zapPlay: [
    'Segura a chinelada do ZAP!',
    'PÁ! O gato pulou na mesa!',
    'Toma esse ZAP no lombo!'
  ],
  trickWin: [
    'Essa vaza é minha!',
    'Aqui quem manda sou eu!',
    'Foi passear e não voltou!',
    'Bateu, levou!'
  ]
};

function getRandomQuote(category) {
  const list = TRUCO_QUOTES[category] || [];
  if (list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)];
}

class TrucoAI {
  /**
   * Avalia a força geral da mão de cartas do bot (0 a 100+).
   */
  static evaluateHandStrength(hand) {
    if (!hand || hand.length === 0) return 0;

    let score = 0;
    hand.forEach(card => {
      if (card.isManilha) {
        if (card.suit.id === 'paus') score += 45; // Zap
        else if (card.suit.id === 'copas') score += 38; // Copeta
        else if (card.suit.id === 'espadas') score += 32; // Espadilha
        else if (card.suit.id === 'ouros') score += 28; // Pica-fumo
      } else {
        if (card.rank.id === '3') score += 18;
        else if (card.rank.id === '2') score += 14;
        else if (card.rank.id === 'A') score += 11;
        else if (card.rank.id === 'K') score += 8;
        else if (card.rank.id === 'J') score += 6;
        else if (card.rank.id === 'Q') score += 5;
        else if (card.rank.id === '7') score += 4;
        else score += 2;
      }
    });

    return score;
  }

  /**
   * Decide se o bot deve pedir Truco (ou aumentar para 6, 9, 12).
   */
  static shouldRaise(player, gameState) {
    // Não pode pedir truco na Mão de 11 nem na Mão de Ferro
    if (gameState.isMaoDe11 || gameState.isMaoDeFerro) return false;

    // Não pode aumentar se foi o próprio time quem fez o último aumento
    if (gameState.lastRaiseTeam === player.team) return false;

    // Se já está no valor máximo (12), não pode aumentar
    if (gameState.currentBetValue >= 12) return false;

    const handStrength = this.evaluateHandStrength(player.hand);
    const roundNumber = gameState.currentTrick; // 1, 2 ou 3
    const teamTricksWon = gameState.tricksWon[player.team];
    const opponentTeam = player.team === 1 ? 2 : 1;
    const oppTricksWon = gameState.tricksWon[opponentTeam];

    const currentBet = gameState.currentBetValue; // 1, 3, 6, 9

    // Probabilidade de blefe pequeno (8%)
    const isBluffing = Math.random() < 0.08 && roundNumber <= 2;

    if (currentBet === 1) {
      // Pedir TRUCO (vai para 3)
      if (isBluffing) return true;

      // Se venceu a 1ª rodada e tem qualquer carta média/forte
      if (teamTricksWon === 1 && handStrength >= 20) return true;

      // Se tem mão muito forte (pelo menos 1 manilha alta ou 2 boas)
      if (handStrength >= 40) return true;

      // Na 3ª rodada, se tiver qualquer manilha
      if (roundNumber === 3 && player.hand.some(c => c.isManilha)) return true;

      return false;
    }

    if (currentBet === 3) {
      // Pedir SEIS (vai para 6)
      if (handStrength >= 55) return true;
      if (teamTricksWon === 1 && player.hand.some(c => c.isManilha && (c.suit.id === 'paus' || c.suit.id === 'copas'))) {
        return true;
      }
      return false;
    }

    if (currentBet === 6) {
      // Pedir NOVE (vai para 9)
      if (handStrength >= 75) return true;
      return false;
    }

    if (currentBet === 9) {
      // Pedir DOZE (vai para 12)
      if (handStrength >= 85) return true;
      return false;
    }

    return false;
  }

  /**
   * Decide como responder a um pedido de Truco/Aumento:
   * Retorna 'raise', 'accept', ou 'run'
   */
  static respondToTruco(player, gameState) {
    const handStrength = this.evaluateHandStrength(player.hand);
    const targetBet = gameState.pendingBetValue;
    const opponentTeam = player.team === 1 ? 2 : 1;
    const teamTricksWon = gameState.tricksWon[player.team];
    const oppTricksWon = gameState.tricksWon[opponentTeam];

    // Verifica se pode aumentar de volta (contra-golpe)
    if (targetBet < 12 && handStrength >= 65 && Math.random() < 0.7) {
      return 'raise';
    }

    // Critérios para ACEITAR ou CORRER
    if (targetBet === 3) {
      // Pediram Truco
      if (teamTricksWon === 1) return 'accept'; // Já ganhamos a primeira vaza!
      if (handStrength >= 22) return 'accept';
      if (gameState.trickHistory.length === 0 && handStrength >= 18) return 'accept';
      // Se não tem nada e adversário ganhou a 1ª vaza
      if (oppTricksWon === 1 && handStrength < 28) return 'run';

      return Math.random() < 0.4 ? 'accept' : 'run';
    }

    if (targetBet === 6) {
      // Pediram Seis
      if (handStrength >= 45) return 'accept';
      if (teamTricksWon === 1 && player.hand.some(c => c.isManilha)) return 'accept';
      return 'run';
    }

    if (targetBet === 9) {
      // Pediram Nove
      if (handStrength >= 60) return 'accept';
      return 'run';
    }

    if (targetBet === 12) {
      // Pediram Doze
      if (handStrength >= 75) return 'accept';
      return 'run';
    }

    return 'accept';
  }

  /**
   * Escolhe qual carta jogar da mão.
   */
  static chooseCardToPlay(player, gameState) {
    const hand = [...player.hand];
    if (hand.length === 1) {
      return { card: hand[0], isCovered: false };
    }

    // Ordena as cartas da menor força para a maior força
    hand.sort((a, b) => a.power - b.power);

    const playedCards = gameState.currentTrickPlays; // array de { player, card, isCovered }
    const trickIndex = gameState.currentTrick; // 1, 2, ou 3

    // Se o bot é o primeiro a jogar nesta vaza
    if (playedCards.length === 0) {
      if (trickIndex === 1) {
        // Na primeira vaza ("a primeira manda o jogo"):
        // Joga uma carta intermediária ou a mais forte se tiver manilha
        const manilhas = hand.filter(c => c.isManilha);
        if (manilhas.length >= 2) {
          // Tem duas manilhas! Joga a menor manilha para garantir a primeira
          return { card: manilhas[0], isCovered: false };
        }
        // Joga a carta do meio (para testar a mesa)
        const midIdx = Math.floor(hand.length / 2);
        return { card: hand[midIdx], isCovered: false };
      }

      if (trickIndex === 2) {
        // Se o time ganhou a 1ª vaza, joga a mais forte para matar logo
        if (gameState.tricksWon[player.team] === 1) {
          return { card: hand[hand.length - 1], isCovered: false };
        }
        // Se perdeu a 1ª vaza, precisa vencer a 2ª de qualquer jeito!
        return { card: hand[hand.length - 1], isCovered: false };
      }

      // 3ª vaza: joga a carta mais forte disponível
      return { card: hand[hand.length - 1], isCovered: false };
    }

    // Já existem cartas jogadas nesta vaza
    // Descobre quem está ganhando atualmente a vaza
    let bestPlay = playedCards[0];
    for (let i = 1; i < playedCards.length; i++) {
      if (compareCards(playedCards[i].card, bestPlay.card) > 0) {
        bestPlay = playedCards[i];
      }
    }

    const partnerIsWinning = bestPlay.player.team === player.team;

    // Se o parceiro está ganhando a vaza
    if (partnerIsWinning) {
      // Se a carta do parceiro já for forte (manilha ou 3)
      const partnerHasStrongCard = bestPlay.card.isManilha || bestPlay.card.rank.id === '3';
      const isLastToPlay = playedCards.length === 3;

      if (partnerHasStrongCard || isLastToPlay) {
        // Economiza a melhor carta: joga a menor da mão!
        // Pode até jogar encoberta se for 2ª ou 3ª vaza e carta for fraca
        const lowestCard = hand[0];
        const canCover = trickIndex > 1 && lowestCard.power <= 4;
        return { card: lowestCard, isCovered: canCover && Math.random() < 0.4 };
      }
    }

    // Adversário está ganhando ou parceiro tem carta fraca sujeita a corte
    const targetPower = bestPlay.card.power;
    // Encontra a menor carta da mão que ainda ganha da carta do adversário
    const winningCards = hand.filter(c => c.power > targetPower);

    if (winningCards.length > 0) {
      // Joga a menor carta vencedora (otimização de força)
      return { card: winningCards[0], isCovered: false };
    }

    // Não consegue vencer a carta atual:
    // Queima a carta mais fraca da mão
    const lowestCard = hand[0];
    const canCover = trickIndex > 1 && Math.random() < 0.5;
    return { card: lowestCard, isCovered: canCover };
  }
}

if (typeof window !== 'undefined') {
  window.TrucoAI = TrucoAI;
  window.TRUCO_QUOTES = TRUCO_QUOTES;
  window.getRandomQuote = getRandomQuote;
}
if (typeof global !== 'undefined') {
  global.TrucoAI = TrucoAI;
  global.TRUCO_QUOTES = TRUCO_QUOTES;
  global.getRandomQuote = getRandomQuote;
}
