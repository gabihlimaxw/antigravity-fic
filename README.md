# 🃏 Truco Brasileiro (Truco Paulista)

Um jogo de **Truco Brasileiro (Truco Paulista)** completo, moderno e intuitivo, desenvolvido em **HTML5, CSS3 e JavaScript puro**, sem qualquer framework ou biblioteca externa.

---

## 🌟 Características Principais

- **Mesa Verde de Feltro Realista**: Visual com borda de madeira/couro almofadado, iluminação radial, texturas de feltro e animações suaves de cartas.
- **Modo 4 Jogadores (2x2)**:
  - **NÓS**: Você + Chicó (seu parceiro controlado pelo computador).
  - **ELES**: Tonho + Tião (dupla adversária com inteligência artificial tática).
- **Regras Oficiais do Truco Paulista**:
  - Baralho limpo de 40 cartas (sem 8, 9 e 10).
  - **Vira & Manilhas dinâmicas**: A manilha muda a cada rodada conforme a carta virada na mesa.
  - Hierarquia de manilhas com naipes: **♣ Zap (Paus) > ♥ Copeta (Copas) > ♠ Espadilha (Espadas) > ♦ Pica-fumo (Ouros)**.
  - Ordem das cartas normais: `4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3`.
- **Sistema Completo de Truco**:
  - Pedir **TRUCO! (3)** ➔ **SEIS! (6)** ➔ **NOVE! (9)** ➔ **DOZE! (12)**.
  - Opções para **Aceitar**, **Correr** (entregando os pontos anteriores) ou **Aumentar**.
  - Balões de fala estilizados estilo quadrinhos com frases e bordões típicos de boteco brasileiro.
- **Carta Coberta (Encoberta)**:
  - Opção de jogar a carta virada para baixo a partir da 2ª vaza para esconder estratégia.
- **Placar e Marcadores Automáticos**:
  - Contagem de pontos até 12.
  - Marcadores de vaza em tempo real (1ª, 2ª e 3ª queda) indicando vitórias de Nós (azul), Eles (vermelho) ou Empuche (amarelo).
  - Detecção completa de empates (*canga na primeira*, *empate na segunda*, etc.).
- **Mão de 11 e Mão de Ferro**:
  - Ao atingir 11 pontos, a dupla tem direito a ver as cartas e decidir se joga valendo 3 pontos ou corre entregando 1 ponto.
  - Disputa de 11x11 (*Mão de Ferro*) sem truco.
- **Efeitos Sonoros Procedurais (Web Audio API)**:
  - Batida de Truco na mesa, estalo e atrito de cartas, gritos de aceitar/correr, fanfarras de vitória e derrota gerados via código, sem necessidade de arquivos de áudio externos.
  - Botão para ativar/desativar o áudio a qualquer momento.
- **Design Totalmente Responsivo**:
  - Funciona perfeitamente em computadores, tablets e smartphones.

---

## 📂 Estrutura de Arquivos

```
├── index.html       # Estrutura semântica da mesa, placar, cartas e modais
├── style.css        # Estilos, mesa verde de feltro, cartas, balões e animações
├── js/
│   ├── audio.js     # Sintetizador procedural de efeitos sonoros (Web Audio API)
│   ├── cards.js     # Baralho, naipes, cálculo de manilhas e renderizador de cartas
│   ├── ai.js        # Inteligência artificial tática dos 3 jogadores virtuais
│   └── game.js      # Máquina de estados, fluxo de turnos, apostas e regras
└── README.md        # Documentação completa
```

---

## 🚀 Como Jogar

1. Basta abrir o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari, Opera). Não requer instalação, Node.js ou servidores!
2. **Na sua vez**:
   - Clique em uma das suas cartas para jogá-la na mesa.
   - Antes de jogar, você pode clicar em **PEDIR TRUCO!** para desafiar a dupla adversária.
   - A partir da 2ª vaza, você pode ativar o botão **Carta Coberta** se quiser queimar uma carta sem revelá-la.
3. **Quando o adversário pedir Truco**:
   - Uma janela de decisão aparecerá permitindo **Aceitar**, **Correr** ou **Pedir Seis!**.
4. A primeira dupla a completar **12 pontos** vence a partida!
