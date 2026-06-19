if (!api.isAuthenticated()) {
  window.location.href = "login.html"
}

const params = new URLSearchParams(window.location.search)
const collectionId = params.get("id")
if (!collectionId) {
  window.location.href = "index.html"
}

document.getElementById("back-link").href = `collection.html?id=${collectionId}`

const errorEl = document.getElementById("error")
const studyArea = document.getElementById("study-area")
const emptyState = document.getElementById("empty-state")
const flashcard = document.getElementById("flashcard")
const frontEl = document.getElementById("card-front")
const backEl = document.getElementById("card-back")
const progressEl = document.getElementById("progress")

const basicControls = document.getElementById("basic-controls")
const sm2Controls = document.getElementById("sm2-controls")

let cards = []
let index = 0
let flipped = false
let cardStartTime = 0

// Умный поиск токена (на случай, если Денис назвал ключ нестандартно)
function getAuthToken() {
    let t = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("jwt");
    if (t) return t;
    
    // Если стандартные ключи не подошли, ищем любой JWT-токен в памяти
    for (let i = 0; i < localStorage.length; i++) {
        let val = localStorage.getItem(localStorage.key(i));
        if (val && typeof val === 'string' && val.split('.').length === 3) {
            return val;
        }
    }
    return null;
}

// Шапка и профиль
;(async () => {
  try {
    const user = await api.getMe()
    document.getElementById("user-info").textContent = user.username
  } catch {
    api.clearToken()
    window.location.href = "login.html"
  }
})()

document.getElementById("logout-btn").addEventListener("click", () => {
  api.clearToken()
  window.location.href = "login.html"
})

// Загрузка карточек для ПОВТОРЕНИЯ
async function loadReviewCards() {
  try {
    const token = getAuthToken();
    const res = await fetch(`http://201.51.28.93:8000/cards/review/${collectionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Ошибка сервера: ${res.status}`);
    }
    
    cards = await res.json();
    
    if (cards.length === 0) {
        studyArea.style.display = "none";
        emptyState.style.display = "block";
    } else {
        render();
    }
  } catch (err) {
    errorEl.innerHTML = `<strong>Сбой загрузки:</strong> ${err.message}`;
    errorEl.style.display = "block";
    console.error(err);
  }
}

function render() {
  if (index >= cards.length) {
    studyArea.style.display = "none";
    emptyState.style.display = "block";
    return;
  }

  const card = cards[index]
  frontEl.textContent = card.front || ""
  backEl.textContent = card.back || ""
  progressEl.textContent = `Осталось повторить: ${cards.length - index}`
  
  flipped = false
  flashcard.classList.remove("flipped")
  
  basicControls.style.display = "flex"
  sm2Controls.style.display = "none"
  
  cardStartTime = Date.now()
}

function flip() {
  if (flipped) return
  
  flipped = true
  flashcard.classList.add("flipped")
  
  basicControls.style.display = "none"
  sm2Controls.style.display = "flex"
}

async function rateCard(quality) {
    const card = cards[index];
    const timeSpentMs = Date.now() - cardStartTime;

    try {
        const token = getAuthToken();
        fetch(`http://201.51.28.93:8000/cards/${card.id}/review`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ quality: quality, time_spent_ms: timeSpentMs })
        }).catch(e => console.error("Ошибка сохранения оценки:", e));
    } catch (e) {
        console.error(e);
    }

    index++;
    render();
}

flashcard.addEventListener("click", () => {
    if (!flipped) flip();
});

document.getElementById("flip-btn").addEventListener("click", flip);

document.querySelectorAll(".rate-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const quality = parseInt(e.target.getAttribute("data-quality"), 10);
        rateCard(quality);
    });
});

document.addEventListener("keydown", (e) => {
  if (!cards.length || index >= cards.length) return;
  
  if (e.code === "Space") {
    e.preventDefault();
    if (!flipped) flip();
  } 
  
  if (flipped && e.key >= '0' && e.key <= '5') {
      rateCard(parseInt(e.key, 10));
  }
});

loadReviewCards();