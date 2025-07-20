const terms = [
  { term: "Photosynthesis", def: "Process by which plants make food using sunlight" },
  { term: "Evaporation", def: "Changing of liquid into vapor" },
  { term: "Osmosis", def: "Movement of water through semi-permeable membrane" },
  { term: "Gravity", def: "Force attracting two bodies toward each other" },
  { term: "Neuron", def: "Cell that transmits nerve impulses" },
];

let shuffled = [], current = 0, score = 0, timer, timeLeft = 60;

const termEl = document.getElementById('term');
const choiceBox = document.getElementById('choices');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startBtn = document.getElementById('startBtn');

startBtn.onclick = startGame;

function startGame() {
  startBtn.disabled = true;
  shuffled = shuffle([...terms]);
  score = 0; current = 0; timeLeft = 60;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  showTerm();
  timer = setInterval(() => {
    timeLeft--;
    timeEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function showTerm() {
  if (current >= shuffled.length) {
    shuffled = shuffle([...terms]);
    current = 0;
  }
  termEl.textContent = shuffled[current].term;
  let options = shuffle(terms.map(t => t.def));
  choiceBox.innerHTML = '';
  options.forEach(opt => {
    let btn = document.createElement('button');
    btn.textContent = opt;
    btn.onclick = () => {
      if (opt === shuffled[current].def) score++;
      else score--; // or 0 if no penalty
      scoreEl.textContent = score;
      current++;
      showTerm();
    };
    choiceBox.appendChild(btn);
  });
}

function shuffle(arr) {
  for (let i = arr.length -1; i > 0; i--) {
    let j = Math.floor(Math.random()* (i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function endGame() {
  clearInterval(timer);
  termEl.textContent = "Time's up!";
  choiceBox.innerHTML = '';
  startBtn.disabled = false;
}

const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

leftBtn.addEventListener('touchstart', () => player.dx = -player.speed);
leftBtn.addEventListener('touchend', () => player.dx = 0);

rightBtn.addEventListener('touchstart', () => player.dx = player.speed);
rightBtn.addEventListener('touchend', () => player.dx = 0);
