/**
 * Motor Principal do Jogo de Truco Paulista.
 * Gerencia o estado, fluxo de turnos, apostas (Truco/Seis/Nove/Doze),
 * placar, regras de vaza/empuche e interface do usuário.
 */

class TrucoGame {
  constructor() {
    // Jogadores:
    // 0: Você (Time 1 - Nós)
    // 1: Tonho (Time 2 - Eles)
    // 2: Chicó (Time 1 - Nós - Seu Parceiro)
    // 3: Tião (Time 2 - Eles)
    this.players = [
      { id: 0, name: 'Você', team: 1, hand: [], isHuman: true },
      { id: 1, name: 'Tonho', team: 2, hand: [], isHuman: false },
      { id: 2, name: 'Chicó', team: 1, hand: [], isHuman: false },
      { id: 3, name: 'Tião', team: 2, hand: [], isHuman: false }
    ];

    // Placar da Partida (vai até 12)
    this.scores = { 1: 0, 2: 0 };

    // Baralho e estado da mão
    this.deck = new TrucoDeck();
    this.viraCard = null;
    this.dealerIndex = 3; // O jogador 3 dá as cartas inicialmente, jogador 0 começa
    this.currentPlayerIndex = 0;
    this.currentTrick = 1; // 1, 2 ou 3

    // Estado das apostas
    this.currentBetValue = 1;
    this.pendingBetValue = 1;
    this.lastRaiseTeam = null; // 1 ou 2

    // Histórico de jogadas da vaza atual
    this.currentTrickPlays = []; // { player, card, isCovered }
    this.trickHistory = []; // { winnerTeam, winnerPlayer, isTie }
    this.tricksWon = { 1: 0, 2: 0 };

    // Configuração de Mão Especial
    this.isMaoDe11 = false;
    this.isMaoDeFerro = false;
    this.isPlayCoveredSelected = false;
    this.isWaitingAction = false;
    this.isHandInProgress = false;

    // Elementos do DOM
    this.initDOMElements();
    this.setupEventListeners();
  }

  initDOMElements() {
    this.elScoreWe = document.getElementById('score-we');
    this.elScoreThey = document.getElementById('score-they');
    this.elBetBadge = document.getElementById('bet-badge');
    this.elTrickDots = [
      document.getElementById('trick-dot-1'),
      document.getElementById('trick-dot-2'),
      document.getElementById('trick-dot-3')
    ];
    this.elViraWrapper = document.getElementById('vira-card-wrapper');
    this.elViraInfoName = document.getElementById('vira-info-name');
    this.elManilhaInfoName = document.getElementById('manilha-info-name');
    this.elGameFeed = document.getElementById('game-feed');
    this.elSpeechContainer = document.getElementById('speech-bubbles-container');

    this.elHands = [
      document.getElementById('hand-player-0'),
      document.getElementById('hand-player-1'),
      document.getElementById('hand-player-2'),
      document.getElementById('hand-player-3')
    ];

    this.elPlayedSpots = [
      document.getElementById('played-spot-0'),
      document.getElementById('played-spot-1'),
      document.getElementById('played-spot-2'),
      document.getElementById('played-spot-3')
    ];

    this.elPlayerSlots = [
      document.getElementById('player-slot-0'),
      document.getElementById('player-slot-1'),
      document.getElementById('player-slot-2'),
      document.getElementById('player-slot-3')
    ];

    // Botões
    this.btnCallTruco = document.getElementById('btn-call-truco');
    this.btnCoveredCard = document.getElementById('btn-covered-card');
    this.btnNewGame = document.getElementById('btn-new-game');
    this.btnRules = document.getElementById('btn-rules');
    this.btnCloseRules = document.getElementById('btn-close-rules');
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.elSoundIcon = document.getElementById('sound-icon');

    // Modais
    this.modalTruco = document.getElementById('modal-truco-challenge');
    this.trucoTitle = document.getElementById('truco-challenge-title');
    this.trucoDesc = document.getElementById('truco-challenge-desc');
    this.btnTrucoAccept = document.getElementById('btn-truco-accept');
    this.btnTrucoRun = document.getElementById('btn-truco-run');
    this.btnTrucoRaise = document.getElementById('btn-truco-raise');

    this.modalMao11 = document.getElementById('modal-mao-11');
    this.btnMao11Play = document.getElementById('btn-mao-11-play');
    this.btnMao11Run = document.getElementById('btn-mao-11-run');
    this.partnerHandPreview = document.getElementById('partner-hand-preview');

    this.modalGameOver = document.getElementById('modal-game-over');
    this.gameOverTitle = document.getElementById('game-over-title');
    this.gameOverDesc = document.getElementById('game-over-desc');
    this.btnRestartGame = document.getElementById('btn-restart-game');

    this.modalRules = document.getElementById('modal-rules');
  }

  setupEventListeners() {
    this.btnCallTruco.addEventListener('click', () => this.handleUserTrucoClick());

    this.btnCoveredCard.addEventListener('click', () => {
      if (this.currentTrick === 1) {
        this.logFeed('⚠️ Carta coberta não é permitida na 1ª vaza!');
        return;
      }
      this.isPlayCoveredSelected = !this.isPlayCoveredSelected;
      this.btnCoveredCard.classList.toggle('active', this.isPlayCoveredSelected);
      this.btnCoveredCard.innerHTML = `<span>🃏</span> Carta Coberta: <strong>${this.isPlayCoveredSelected ? 'SIM' : 'NÃO'}</strong>`;
    });

    this.btnNewGame.addEventListener('click', () => {
      if (confirm('Deseja reiniciar a partida do zero?')) {
        this.resetMatch();
      }
    });

    this.btnRestartGame.addEventListener('click', () => {
      this.modalGameOver.classList.remove('active');
      this.resetMatch();
    });

    this.btnRules.addEventListener('click', () => {
      this.modalRules.classList.add('active');
    });

    this.btnCloseRules.addEventListener('click', () => {
      this.modalRules.classList.remove('active');
    });

    this.btnSoundToggle.addEventListener('click', () => {
      const enabled = window.trucoAudio.toggle();
      this.elSoundIcon.textContent = enabled ? '🔊' : '🔇';
      this.logFeed(enabled ? 'Som ativado.' : 'Som silenciado.');
    });

    // Modais Truco
    this.btnTrucoAccept.addEventListener('click', () => this.handleUserRespondTruco('accept'));
    this.btnTrucoRun.addEventListener('click', () => this.handleUserRespondTruco('run'));
    this.btnTrucoRaise.addEventListener('click', () => this.handleUserRespondTruco('raise'));

    // Modal Mão de 11
    this.btnMao11Play.addEventListener('click', () => {
      this.modalMao11.classList.remove('active');
      this.logFeed('Vocês aceitaram jogar a Mão de 11 (Vale 3 pontos)!');
      this.currentBetValue = 3;
      this.updateScoreboardUI();
      this.runNextTurn();
    });

    this.btnMao11Run.addEventListener('click', () => {
      this.modalMao11.classList.remove('active');
      this.logFeed('Vocês correram da Mão de 11. 1 ponto para Eles.');
      window.trucoAudio.playRun();
      this.awardHandPoints(2, 1);
    });
  }

  logFeed(msg) {
    if (this.elGameFeed) {
      this.elGameFeed.textContent = msg;
    }
  }

  showSpeechBubble(playerIndex, text, isShout = false) {
    const bubble = document.createElement('div');
    const positionClasses = ['bubble-bottom', 'bubble-left', 'bubble-top', 'bubble-right'];
    bubble.className = `speech-bubble ${positionClasses[playerIndex]} ${isShout ? 'shout' : ''}`;
    bubble.textContent = text;

    this.elSpeechContainer.appendChild(bubble);

    setTimeout(() => {
      if (bubble.parentElement) {
        bubble.parentElement.removeChild(bubble);
      }
    }, 2400);
  }

  resetMatch() {
    this.scores = { 1: 0, 2: 0 };
    this.dealerIndex = 3;
    this.updateScoreboardUI();
    this.startNewHand();
  }

  startNewHand() {
    this.isHandInProgress = true;
    this.isWaitingAction = false;
    this.currentTrick = 1;
    this.currentBetValue = 1;
    this.pendingBetValue = 1;
    this.lastRaiseTeam = null;
    this.currentTrickPlays = [];
    this.trickHistory = [];
    this.tricksWon = { 1: 0, 2: 0 };
    this.isPlayCoveredSelected = false;
    this.btnCoveredCard.classList.remove('active');
    this.btnCoveredCard.innerHTML = `<span>🃏</span> Carta Coberta: <strong>NÃO</strong>`;

    // Rotaciona o distribuidor (dealer)
    this.dealerIndex = (this.dealerIndex + 1) % 4;
    this.currentPlayerIndex = (this.dealerIndex + 1) % 4;

    // Embaralha e distribui
    this.deck.reset();
    this.deck.shuffle();
    window.trucoAudio.playDeal();

    // Distribui 3 cartas para cada jogador
    for (let i = 0; i < 4; i++) {
      this.players[i].hand = [this.deck.draw(), this.deck.draw(), this.deck.draw()];
    }

    // Vira a carta na mesa
    this.viraCard = this.deck.draw();

    // Atualiza o status de manilha em todas as cartas
    for (const player of this.players) {
      for (const card of player.hand) {
        card.updateManilhaStatus(this.viraCard);
      }
    }

    // Verifica Mão de 11 e Mão de Ferro
    this.isMaoDe11 = (this.scores[1] === 11 || this.scores[2] === 11);
    this.isMaoDeFerro = (this.scores[1] === 11 && this.scores[2] === 11);

    this.updateScoreboardUI();
    this.renderViraUI();
    this.renderAllHands();
    this.clearPlayedSpots();

    this.logFeed(`Nova mão iniciada! Começa: ${this.players[this.currentPlayerIndex].name}`);

    // Fluxo especial: Mão de 11
    if (this.isMaoDe11 && !this.isMaoDeFerro) {
      this.handleMaoDe11Flow();
      return;
    }

    if (this.isMaoDeFerro) {
      this.logFeed('⚡ MÃO DE FERRO! Disputa final no escuro!');
    }

    this.runNextTurn();
  }

  handleMaoDe11Flow() {
    if (this.scores[1] === 11) {
      // Jogador e Chicó têm 11 pontos! Usuário decide
      this.partnerHandPreview.innerHTML = '';
      this.players[2].hand.forEach(c => {
        const el = c.renderElement({ mini: true });
        this.partnerHandPreview.appendChild(el);
      });
      this.modalMao11.classList.add('active');
    } else if (this.scores[2] === 11) {
      // Tonho e Tião têm 11 pontos! IA decide
      const teamStrength = TrucoAI.evaluateHandStrength(this.players[1].hand) + TrucoAI.evaluateHandStrength(this.players[3].hand);
      if (teamStrength >= 45) {
        this.logFeed('Tonho & Tião aceitaram jogar a Mão de 11 (Vale 3 pontos)!');
        this.showSpeechBubble(1, 'Aceitamos jogar a Mão de 11!');
        this.currentBetValue = 3;
        this.updateScoreboardUI();
        setTimeout(() => this.runNextTurn(), 1200);
      } else {
        this.logFeed('Tonho & Tião correram da Mão de 11. 1 ponto para Nós!');
        this.showSpeechBubble(1, 'Não vamos arriscar, corremos.');
        window.trucoAudio.playRun();
        setTimeout(() => this.awardHandPoints(1, 1), 1200);
      }
    }
  }

  renderViraUI() {
    this.elViraWrapper.innerHTML = '';
    const viraEl = this.viraCard.renderElement({ mini: true });
    this.elViraWrapper.appendChild(viraEl);

    const viraIndex = MANILHA_SEQUENCE.indexOf(this.viraCard.rank.id);
    const manilhaRankId = MANILHA_SEQUENCE[(viraIndex + 1) % MANILHA_SEQUENCE.length];
    const manilhaRankObj = CARD_RANKS.find(r => r.id === manilhaRankId);

    this.elViraInfoName.textContent = this.viraCard.fullName;
    this.elManilhaInfoName.textContent = manilhaRankObj ? manilhaRankObj.name : '';
  }

  renderAllHands() {
    for (let i = 0; i < 4; i++) {
      const container = this.elHands[i];
      container.innerHTML = '';
      const isHuman = (i === 0);

      this.players[i].hand.forEach(card => {
        const cardEl = card.renderElement({
          isFaceDown: !isHuman,
          mini: !isHuman,
          playable: isHuman && (this.currentPlayerIndex === 0) && !this.isWaitingAction,
          onClick: (clickedCard) => this.handleUserPlayCard(clickedCard)
        });
        container.appendChild(cardEl);
      });
    }
  }

  clearPlayedSpots() {
    for (let i = 0; i < 4; i++) {
      this.elPlayedSpots[i].innerHTML = '';
    }
  }

  updateScoreboardUI() {
    this.elScoreWe.textContent = this.scores[1];
    this.elScoreThey.textContent = this.scores[2];

    // Texto da aposta
    let betText = `Valendo ${this.currentBetValue} ponto${this.currentBetValue > 1 ? 's' : ''}`;
    if (this.currentBetValue === 3) betText = 'TRUCO! (3 pontos)';
    else if (this.currentBetValue === 6) betText = 'SEIS! (6 pontos)';
    else if (this.currentBetValue === 9) betText = 'NOVE! (9 pontos)';
    else if (this.currentBetValue === 12) betText = 'DOZE! (12 pontos)';

    this.elBetBadge.textContent = betText;
    this.elBetBadge.classList.toggle('raised', this.currentBetValue > 1);

    // Indicadores das 3 vazas
    for (let i = 0; i < 3; i++) {
      const dot = this.elTrickDots[i];
      dot.className = 'trick-dot';
      if (i < this.trickHistory.length) {
        const outcome = this.trickHistory[i];
        if (outcome.isTie) {
          dot.classList.add('tie');
        } else if (outcome.winnerTeam === 1) {
          dot.classList.add('we');
        } else if (outcome.winnerTeam === 2) {
          dot.classList.add('they');
        }
      }
    }

    // Atualiza botão do Truco
    this.updateTrucoButtonUI();
  }

  updateTrucoButtonUI() {
    if (this.isMaoDe11 || this.isMaoDeFerro || this.currentBetValue >= 12) {
      this.btnCallTruco.disabled = true;
      this.btnCallTruco.textContent = 'TRUCO INDISPONÍVEL';
      return;
    }

    if (this.lastRaiseTeam === 1) {
      // Nós fomos os últimos a pedir Truco / Aumentar
      this.btnCallTruco.disabled = true;
      this.btnCallTruco.textContent = 'AGUARDANDO ADVERSÁRIO';
      return;
    }

    let nextVal = 3;
    let label = '⚡ PEDIR TRUCO! (3)';
    if (this.currentBetValue === 3) {
      nextVal = 6;
      label = '⚡ PEDIR SEIS! (6)';
    } else if (this.currentBetValue === 6) {
      nextVal = 9;
      label = '⚡ PEDIR NOVE! (9)';
    } else if (this.currentBetValue === 9) {
      nextVal = 12;
      label = '⚡ PEDIR DOZE! (12)';
    }

    const isUserTurn = (this.currentPlayerIndex === 0);
    this.btnCallTruco.disabled = this.isWaitingAction || !isUserTurn;
    if (isUserTurn) {
      this.btnCallTruco.textContent = label;
    } else {
      const activePlayer = this.players[this.currentPlayerIndex];
      this.btnCallTruco.textContent = activePlayer ? `VEZ DE ${activePlayer.name.toUpperCase()}` : label;
    }
  }

  updateActiveTurnUI() {
    for (let i = 0; i < 4; i++) {
      this.elPlayerSlots[i].classList.toggle('active-turn', i === this.currentPlayerIndex);
    }
  }

  runNextTurn() {
    if (!this.isHandInProgress || this.isWaitingAction) return;

    this.updateActiveTurnUI();
    this.renderAllHands();
    this.updateTrucoButtonUI();

    const currentPlayer = this.players[this.currentPlayerIndex];

    if (currentPlayer.isHuman) {
      this.logFeed('👉 É a sua vez de jogar! Escolha uma carta.');
      return;
    }

    // Vez de um jogador controlado pela IA (Tonho, Chicó ou Tião)
    this.logFeed(`Vez de ${currentPlayer.name}... pensando.`);
    setTimeout(() => {
      if (!this.isHandInProgress || this.isWaitingAction) return;

      // IA avalia se quer pedir Truco antes de jogar a carta
      if (TrucoAI.shouldRaise(currentPlayer, this)) {
        this.handleBotCallTruco(currentPlayer);
        return;
      }

      // IA escolhe e joga a carta
      const playDecision = TrucoAI.chooseCardToPlay(currentPlayer, this);
      this.executePlayCard(currentPlayer, playDecision.card, playDecision.isCovered);
    }, 850);
  }

  handleUserPlayCard(card) {
    if (this.currentPlayerIndex !== 0 || this.isWaitingAction) return;

    const isCovered = this.isPlayCoveredSelected;
    this.executePlayCard(this.players[0], card, isCovered);

    // Reseta seleção de carta coberta
    this.isPlayCoveredSelected = false;
    this.btnCoveredCard.classList.remove('active');
    this.btnCoveredCard.innerHTML = `<span>🃏</span> Carta Coberta: <strong>NÃO</strong>`;
  }

  executePlayCard(player, card, isCovered = false) {
    // Remove a carta da mão do jogador
    player.hand = player.hand.filter(c => c.id !== card.id);
    card.isCovered = isCovered;

    // Registra a jogada
    this.currentTrickPlays.push({ player, card, isCovered });
    window.trucoAudio.playCard();

    // Renderiza a carta na área central correspondente ao jogador
    const spot = this.elPlayedSpots[player.id];
    spot.innerHTML = '';
    const playedEl = card.renderElement({ isFaceDown: isCovered });
    spot.appendChild(playedEl);

    // Se jogou Zap ou manilha alta, solta uma fala de impacto às vezes!
    if (card.isManilha && card.suit.id === 'paus' && !player.isHuman) {
      this.showSpeechBubble(player.id, getRandomQuote('zapPlay'), true);
    }

    this.logFeed(`${player.name} jogou ${card.fullName}.`);

    // Atualiza mãos visualmente
    this.renderAllHands();

    // Verifica se todos os 4 jogadores jogaram nesta vaza
    if (this.currentTrickPlays.length === 4) {
      this.isWaitingAction = true;
      setTimeout(() => this.resolveTrick(), 1000);
    } else {
      // Passa a vez para o próximo jogador à esquerda
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % 4;
      this.runNextTurn();
    }
  }

  resolveTrick() {
    if (!this.currentTrickPlays || this.currentTrickPlays.length === 0) return;

    // Determina a carta vencedora da vaza
    let winningPlay = this.currentTrickPlays[0];
    let isTie = false;

    for (let i = 1; i < this.currentTrickPlays.length; i++) {
      const current = this.currentTrickPlays[i];
      const comp = compareCards(current.card, winningPlay.card);

      if (comp > 0) {
        winningPlay = current;
        isTie = false;
      } else if (comp === 0) {
        // Empate na maior carta da vaza
        if (current.player.team !== winningPlay.player.team) {
          isTie = true;
        }
      }
    }

    if (isTie) {
      this.logFeed(`🤝 Empuche na ${this.currentTrick}ª vaza!`);
      this.trickHistory.push({ isTie: true, winnerTeam: null, winnerPlayer: winningPlay.player });
      window.trucoAudio.playTrickWin();
    } else {
      const winnerTeam = winningPlay.player.team;
      this.tricksWon[winnerTeam]++;
      this.trickHistory.push({ isTie: false, winnerTeam, winnerPlayer: winningPlay.player });
      const teamName = winnerTeam === 1 ? 'NÓS' : 'ELES';
      this.logFeed(`🏆 ${winningPlay.player.name} (${teamName}) fez a ${this.currentTrick}ª vaza!`);
      window.trucoAudio.playTrickWin();

      if (!winningPlay.player.isHuman && Math.random() < 0.4) {
        this.showSpeechBubble(winningPlay.player.id, getRandomQuote('trickWin'));
      }
    }

    this.updateScoreboardUI();

    // Verifica se a mão foi decidida
    const handWinnerTeam = this.checkHandWinner();
    if (handWinnerTeam !== null) {
      // Mão finalizada!
      setTimeout(() => {
        if (handWinnerTeam === 0) {
          this.logFeed('Empate total na mão! Nenhum ponto distribuído.');
          this.startNewHand();
        } else {
          this.awardHandPoints(handWinnerTeam, this.currentBetValue);
        }
      }, 1200);
      return;
    }

    // Prepara para a próxima vaza da mesma mão
    this.currentTrick++;
    this.currentTrickPlays = [];

    // O jogador que venceu a vaza anterior (ou que empatou primeiro) começa a próxima
    this.currentPlayerIndex = winningPlay.player.id;

    setTimeout(() => {
      this.clearPlayedSpots();
      this.isWaitingAction = false;
      this.runNextTurn();
    }, 1200);
  }

  /**
   * Avalia as regras clássicas de melhor de 3 do Truco Paulista.
   * Retorna: 1 (Time 1 venceu), 2 (Time 2 venceu), 0 (Empate sem pontos), ou null (continua).
   */
  checkHandWinner() {
    const t1 = this.tricksWon[1];
    const t2 = this.tricksWon[2];

    // Se uma equipe já tem 2 vazas ganhas
    if (t1 >= 2) return 1;
    if (t2 >= 2) return 2;

    const h = this.trickHistory;

    // Regras de Empuche (Canga):
    // Se a 1ª vaza empatou:
    if (h.length >= 2 && h[0].isTie) {
      // Quem fizer a 2ª vaza leva a mão!
      if (!h[1].isTie) {
        return h[1].winnerTeam;
      }
      // Se a 2ª vaza também empatou, quem fizer a 3ª leva
      if (h.length === 3) {
        if (!h[2].isTie) return h[2].winnerTeam;
        return 0; // Se as 3 empatarem, ninguém pontua
      }
    }

    // Se a 1ª vaza teve vencedor e a 2ª empatou:
    if (h.length >= 2 && !h[0].isTie && h[1].isTie) {
      return h[0].winnerTeam; // Quem fez a 1ª leva!
    }

    // Se a 1ª e a 2ª vazas foram divididas (1 a 1) e a 3ª empatou:
    if (h.length === 3 && h[2].isTie) {
      return h[0].winnerTeam; // Favorece quem fez a 1ª
    }

    // Se chegou na 3ª vaza e alguém fez
    if (h.length === 3 && !h[2].isTie) {
      return h[2].winnerTeam;
    }

    return null; // Mão ainda não terminou
  }

  awardHandPoints(team, points) {
    this.scores[team] += points;
    if (this.scores[team] > 12) this.scores[team] = 12;
    const teamName = team === 1 ? 'NÓS' : 'ELES';
    this.logFeed(`🎉 Equipe ${teamName} ganhou ${points} ponto${points > 1 ? 's' : ''}!`);
    this.updateScoreboardUI();

    // Verifica fim de jogo (12 pontos)
    if (this.scores[team] >= 12) {
      setTimeout(() => this.triggerMatchEnd(team), 1000);
      return;
    }

    setTimeout(() => this.startNewHand(), 2000);
  }

  triggerMatchEnd(winnerTeam) {
    this.isHandInProgress = false;
    const isPlayerWin = (winnerTeam === 1);

    if (isPlayerWin) {
      window.trucoAudio.playMatchWin();
      this.gameOverTitle.textContent = '🏆 VITÓRIA!';
      this.gameOverTitle.style.color = '#60a5fa';
      this.gameOverDesc.innerHTML = `Parabéns! <strong>Você e Chicó (NÓS)</strong> venceram a partida com <strong>${this.scores[1]}</strong> pontos contra <strong>${this.scores[2]}</strong> de Tonho e Tião!`;
    } else {
      window.trucoAudio.playMatchLoss();
      this.gameOverTitle.textContent = '😢 DERROTA!';
      this.gameOverTitle.style.color = '#f87171';
      this.gameOverDesc.innerHTML = `Não foi dessa vez! <strong>Tonho e Tião (ELES)</strong> fecharam a partida com <strong>${this.scores[2]}</strong> pontos. Que tal uma revanche?`;
    }

    this.modalGameOver.classList.add('active');
  }

  /* ============================================================
     SISTEMA DE TRUCO (APOSTAS, RESPOSTAS E AUMENTOS)
     ============================================================ */

  handleUserTrucoClick() {
    if (this.isWaitingAction || this.lastRaiseTeam === 1 || this.currentBetValue >= 12) return;

    let nextValue = 3;
    let quoteCategory = 'truco';
    if (this.currentBetValue === 3) { nextValue = 6; quoteCategory = 'seis'; }
    else if (this.currentBetValue === 6) { nextValue = 9; quoteCategory = 'nove'; }
    else if (this.currentBetValue === 9) { nextValue = 12; quoteCategory = 'doze'; }

    this.initiateTrucoRaise(this.players[0], nextValue, quoteCategory);
  }

  handleBotCallTruco(botPlayer) {
    let nextValue = 3;
    let quoteCategory = 'truco';
    if (this.currentBetValue === 3) { nextValue = 6; quoteCategory = 'seis'; }
    else if (this.currentBetValue === 6) { nextValue = 9; quoteCategory = 'nove'; }
    else if (this.currentBetValue === 9) { nextValue = 12; quoteCategory = 'doze'; }

    this.initiateTrucoRaise(botPlayer, nextValue, quoteCategory);
  }

  initiateTrucoRaise(raiserPlayer, raiseValue, quoteCategory) {
    this.isWaitingAction = true;
    this.pendingBetValue = raiseValue;
    this.lastRaiseTeam = raiserPlayer.team;

    window.trucoAudio.playTrucoSlam();
    const shoutText = getRandomQuote(quoteCategory) || `PEDIU ${raiseValue}!`;
    this.showSpeechBubble(raiserPlayer.id, shoutText, true);

    const raiserTeamName = raiserPlayer.team === 1 ? 'NÓS' : 'ELES';
    this.logFeed(`⚡ ${raiserPlayer.name} (${raiserTeamName}) gritou ${raiseValue === 3 ? 'TRUCO' : raiseValue}!`);

    // A equipe adversária deve responder
    const challengedTeam = raiserPlayer.team === 1 ? 2 : 1;

    setTimeout(() => {
      if (challengedTeam === 1) {
        // Desafiou a equipe do usuário!
        this.promptUserTrucoChallenge(raiserPlayer, raiseValue);
      } else {
        // Desafiou os bots adversários (Tonho / Tião)!
        this.processBotTrucoResponse(raiseValue);
      }
    }, 1200);
  }

  promptUserTrucoChallenge(raiserPlayer, targetValue) {
    let callName = 'TRUCO!';
    if (targetValue === 6) callName = 'SEIS!';
    else if (targetValue === 9) callName = 'NOVE!';
    else if (targetValue === 12) callName = 'DOZE!';

    this.trucoTitle.textContent = `${raiserPlayer.name.toUpperCase()} GRITOU ${callName}`;
    this.trucoDesc.innerHTML = `A aposta passará para <strong>${targetValue} pontos</strong>. Se você correr agora, eles levam <strong>${this.currentBetValue} ponto${this.currentBetValue > 1 ? 's' : ''}</strong>.`;

    if (targetValue < 12) {
      const nextRaise = targetValue + 3;
      this.btnTrucoRaise.style.display = 'inline-block';
      this.btnTrucoRaise.textContent = `⚡ Pedir ${nextRaise === 6 ? 'Seis' : nextRaise === 9 ? 'Nove' : 'Doze'}!`;
    } else {
      this.btnTrucoRaise.style.display = 'none';
    }

    this.modalTruco.classList.add('active');
  }

  handleUserRespondTruco(action) {
    this.modalTruco.classList.remove('active');

    if (action === 'accept') {
      window.trucoAudio.playAccept();
      this.showSpeechBubble(0, getRandomQuote('accept'));
      this.currentBetValue = this.pendingBetValue;
      this.logFeed(`Você aceitou! A mão agora vale ${this.currentBetValue} pontos.`);
      this.updateScoreboardUI();
      this.isWaitingAction = false;
      this.runNextTurn();
    } else if (action === 'run') {
      window.trucoAudio.playRun();
      this.showSpeechBubble(0, getRandomQuote('run'));
      this.logFeed(`Você correu! A equipe ELES leva ${this.currentBetValue} ponto(s).`);
      // O time desafiante (2) ganha o valor antes do aumento
      this.awardHandPoints(2, this.currentBetValue);
    } else if (action === 'raise') {
      // Usuário contra-ataca pedindo mais!
      const counterValue = this.pendingBetValue + 3;
      const quoteKey = counterValue === 6 ? 'seis' : counterValue === 9 ? 'nove' : 'doze';
      this.initiateTrucoRaise(this.players[0], counterValue, quoteKey);
    }
  }

  processBotTrucoResponse(targetValue) {
    // Escolhe um bot do time desafiado para responder (ex: Tonho ou Tião)
    const bot = this.players[1];
    const decision = TrucoAI.respondToTruco(bot, this);

    if (decision === 'accept') {
      window.trucoAudio.playAccept();
      this.showSpeechBubble(bot.id, getRandomQuote('accept'));
      this.currentBetValue = this.pendingBetValue;
      this.logFeed(`${bot.name} aceitou! A mão agora vale ${this.currentBetValue} pontos.`);
      this.updateScoreboardUI();
      this.isWaitingAction = false;
      this.runNextTurn();
    } else if (decision === 'run') {
      window.trucoAudio.playRun();
      this.showSpeechBubble(bot.id, getRandomQuote('run'));
      this.logFeed(`${bot.name} correu! NÓS levamos ${this.currentBetValue} ponto(s).`);
      // Time 1 (Nós) ganha o valor anterior
      this.awardHandPoints(1, this.currentBetValue);
    } else if (decision === 'raise') {
      // Bot aumenta o desafio!
      const counterValue = this.pendingBetValue + 3;
      const quoteKey = counterValue === 6 ? 'seis' : counterValue === 9 ? 'nove' : 'doze';
      this.initiateTrucoRaise(bot, counterValue, quoteKey);
    }
  }
}

if (typeof window !== 'undefined') {
  window.TrucoGame = TrucoGame;
}
if (typeof global !== 'undefined') {
  global.TrucoGame = TrucoGame;
}

// Inicia o jogo quando a página carrega no navegador
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('DOMContentLoaded', () => {
    window.trucoGame = new TrucoGame();
    window.trucoGame.resetMatch();
  });
}
