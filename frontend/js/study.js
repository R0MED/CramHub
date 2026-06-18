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

let cards = []
let index = 0
let flipped = false

// шапка
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

function render() {
  const card = cards[index]
  frontEl.textContent = card.front || ""
  backEl.textContent = card.back || ""
  progressEl.textContent = `Карточка ${index + 1} из ${cards.length}`
  flipped = false
  flashcard.classList.remove("flipped")
}

function flip() {
  flipped = !flipped
  flashcard.classList.toggle("flipped", flipped)
}

function next() {
  if (index < cards.length - 1) {
    index++
    render()
  }
}

function prev() {
  if (index > 0) {
    index--
    render()
  }
}

flashcard.addEventListener("click", flip)
document.getElementById("flip-btn").addEventListener("click", flip)
document.getElementById("next-btn").addEventListener("click", next)
document.getElementById("prev-btn").addEventListener("click", prev)

document.addEventListener("keydown", (e) => {
  if (!cards.length) return
  if (e.code === "Space") {
    e.preventDefault()
    flip()
  } else if (e.code === "ArrowRight") next()
  else if (e.code === "ArrowLeft") prev()
})

async function loadStudy() {
  try {
    cards = await api.getCards(collectionId)
  } catch (err) {
    errorEl.textContent = err.message
    errorEl.style.display = "block"
    return
  }

  if (!cards.length) {
    studyArea.style.display = "none"
    emptyState.style.display = "block"
    return
  }
  render()
}

loadStudy()
