if (api.isAuthenticated()) {
  window.location.href = "index.html"
}

function showError(message) {
  const box = document.getElementById("error")
  if (box) {
    box.textContent = message
    box.style.display = "block"
  }
}

function clearError() {
  const box = document.getElementById("error")
  if (box) {
    box.textContent = ""
    box.style.display = "none"
  }
}

const registerForm = document.getElementById("register-form")
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    clearError()

    const username = document.getElementById("username").value.trim()
    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value

    if (!username || !email || !password) {
      showError("Заполните все поля")
      return
    }

    try {
      await api.register(username, email, password)
      await api.login(email, password)
      window.location.href = "index.html"
    } catch (err) {
      showError(err.message)
    }
  })
}

const loginForm = document.getElementById("login-form")
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()
    clearError()

    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value

    if (!email || !password) {
      showError("Заполните все поля")
      return
    }

    try {
      await api.login(email, password)
      window.location.href = "index.html"
    } catch (err) {
      showError(err.message)
    }
  })
}
