/**
 * Representação e regras do baralho de Truco Paulista.
 * 40 cartas (sem 8, 9, 10).
 * Ordem base de força: 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3
 * Manilhas definidas pelo "Vira" (próxima carta na sequência).
 * Força das manilhas: Ouros (♦) < Espadas (♠) < Copas (♥) < Paus (♣ - Zap)
 */

const SUITS = [
  { id: 'ouros', name: 'Ouros', symbol: '♦', color: 'red', manilhaPower: 101, nickname: 'Pica-fumo' },
  { id: 'espadas', name: 'Espadas', symbol: '♠', color: 'black', manilhaPower: 102, nickname: 'Espadilha' },
  { id: 'copas', name: 'Copas', symbol: '♥', color: 'red', manilhaPower: 103, nickname: 'Copeta' },
  { id: 'paus', name: 'Paus', symbol: '♣', color: 'black', manilhaPower: 104, nickname: 'Zap' }
];

const CARD_RANKS = [
  { id: '4', label: '4', name: 'Quatro', basePower: 1 },
  { id: '5', label: '5', name: 'Cinco', basePower: 2 },
  { id: '6', label: '6', name: 'Seis', basePower: 3 },
  { id: '7', label: '7', name: 'Sete', basePower: 4 },
  { id: 'Q', label: 'Q', name: 'Dama', basePower: 5 },
  { id: 'J', label: 'J', name: 'Valete', basePower: 6 },
  { id: 'K', label: 'K', name: 'Rei', basePower: 7 },
  { id: 'A', label: 'A', name: 'Ás', basePower: 8 },
  { id: '2', label: '2', name: 'Dois', basePower: 9 },
  { id: '3', label: '3', name: 'Três', basePower: 10 }
];

// Sequência circular para descobrir a manilha a partir do Vira
const MANILHA_SEQUENCE = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];

class TrucoCard {
  constructor(rank, suit) {
    this.rank = rank; // objeto CARD_RANKS
    this.suit = suit; // objeto SUITS
    this.isManilha = false;
    this.manilhaNickname = '';
    this.isCovered = false; // Carta virada / encoberta
    this.id = `${rank.id}_${suit.id}_${Math.random().toString(36).substr(2, 6)}`;
  }

  get fullName() {
    if (this.isCovered) return 'Carta Coberta';
    if (this.isManilha) {
      return `${this.rank.name} de ${this.suit.name} (${this.manilhaNickname})`;
    }
    return `${this.rank.name} de ${this.suit.name}`;
  }

  get power() {
    if (this.isCovered) return 0;
    if (this.isManilha) return this.suit.manilhaPower;
    return this.rank.basePower;
  }

  /**
   * Atualiza se esta carta é uma manilha com base na carta "Vira".
   */
  updateManilhaStatus(viraCard) {
    if (!viraCard) {
      this.isManilha = false;
      this.manilhaNickname = '';
      return;
    }
    const viraIndex = MANILHA_SEQUENCE.indexOf(viraCard.rank.id);
    const manilhaRankId = MANILHA_SEQUENCE[(viraIndex + 1) % MANILHA_SEQUENCE.length];

    if (this.rank.id === manilhaRankId) {
      this.isManilha = true;
      this.manilhaNickname = this.suit.nickname;
    } else {
      this.isManilha = false;
      this.manilhaNickname = '';
    }
  }

  /**
   * Cria o elemento HTML correspondente à carta.
   */
  renderElement(options = {}) {
    const { isFaceDown = false, playable = false, onClick = null, mini = false } = options;
    const cardEl = document.createElement('div');
    cardEl.className = `truco-card ${this.suit.color} ${mini ? 'mini' : ''} ${this.isManilha ? 'is-manilha' : ''}`;
    cardEl.dataset.cardId = this.id;

    if (isFaceDown || this.isCovered) {
      cardEl.classList.add('face-down');
      cardEl.innerHTML = `
        <div class="card-back-pattern">
          <div class="inner-diamond"></div>
        </div>
      `;
      return cardEl;
    }

    cardEl.innerHTML = `
      <div class="card-corner top-left">
        <span class="card-rank">${this.rank.label}</span>
        <span class="card-suit">${this.suit.symbol}</span>
      </div>
      <div class="card-center">
        <span class="card-center-suit">${this.suit.symbol}</span>
        ${this.isManilha ? `<span class="manilha-badge">${this.manilhaNickname}</span>` : ''}
      </div>
      <div class="card-corner bottom-right">
        <span class="card-rank">${this.rank.label}</span>
        <span class="card-suit">${this.suit.symbol}</span>
      </div>
    `;

    if (playable) {
      cardEl.classList.add('playable');
      if (onClick) {
        cardEl.addEventListener('click', () => onClick(this));
      }
    }

    return cardEl;
  }
}

class TrucoDeck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of CARD_RANKS) {
        this.cards.push(new TrucoCard(rank, suit));
      }
    }
  }

  shuffle() {
    // Algoritmo Fisher-Yates
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw() {
    return this.cards.pop();
  }
}

// Funções auxiliares de comparação de cartas
function compareCards(cardA, cardB) {
  if (cardA.power > cardB.power) return 1;
  if (cardA.power < cardB.power) return -1;
  return 0; // Empate
}

if (typeof window !== 'undefined') {
  window.SUITS = SUITS;
  window.CARD_RANKS = CARD_RANKS;
  window.MANILHA_SEQUENCE = MANILHA_SEQUENCE;
  window.TrucoCard = TrucoCard;
  window.TrucoDeck = TrucoDeck;
  window.compareCards = compareCards;
}
if (typeof global !== 'undefined') {
  global.SUITS = SUITS;
  global.CARD_RANKS = CARD_RANKS;
  global.MANILHA_SEQUENCE = MANILHA_SEQUENCE;
  global.TrucoCard = TrucoCard;
  global.TrucoDeck = TrucoDeck;
  global.compareCards = compareCards;
}
