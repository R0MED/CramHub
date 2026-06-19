if (!api.isAuthenticated()) {
    window.location.href = "login.html";
}

// Умный поиск токена (возвращаем цикл, который нас спас!)
function getAuthToken() {
    let t = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("jwt") || localStorage.getItem("auth_token");
    if (t) return t;
    
    // Ищем любой JWT-токен в памяти (спасает, если ключ назван нестандартно)
    for (let i = 0; i < localStorage.length; i++) {
        let val = localStorage.getItem(localStorage.key(i));
        if (val && typeof val === 'string' && val.split('.').length === 3) {
            return val;
        }
    }
    return null;
}

// Шапка профиля
;(async () => {
    try {
        const user = await api.getMe();
        document.getElementById("user-info").textContent = user.username;
    } catch {
        api.clearToken();
        window.location.href = "login.html";
    }
})();

document.getElementById("logout-btn").addEventListener("click", () => {
    api.clearToken();
    window.location.href = "login.html";
});

// Загрузка статистики
async function loadStatistics() {
    const loadingEl = document.getElementById("loading");
    const contentEl = document.getElementById("stats-content");
    const errorEl = document.getElementById("error");

    try {
        const token = getAuthToken();
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Получаем сводку
        const sumRes = await fetch("http://201.51.28.93:8000/cards/statistics/summary", { headers });
        if (!sumRes.ok) {
            const err = await sumRes.json().catch(() => ({}));
            throw new Error(err.detail || `Ошибка сервера: ${sumRes.status}`);
        }
        const sumData = await sumRes.json();

        document.getElementById("stat-total").textContent = sumData.total_reviews;
        document.getElementById("stat-correct").textContent = `${sumData.correct_rate_percent}%`;
        document.getElementById("stat-total-time").textContent = `${sumData.average_time_spent_sec} сек`;

        // 2. Получаем активность для графика
        const actRes = await fetch("http://201.51.28.93:8000/cards/statistics/activity", { headers });
        if (!actRes.ok) {
            const err = await actRes.json().catch(() => ({}));
            throw new Error(err.detail || `Ошибка сервера: ${actRes.status}`);
        }
        let activityData = await actRes.json();

        loadingEl.style.display = "none";
        contentEl.style.display = "block";

        // 3. Рисуем график
        activityData.reverse(); 
        const labels = activityData.map(item => item.review_date);
        const data = activityData.map(item => item.cards_reviewed);

        const ctx = document.getElementById("activityChart").getContext("2d");
        new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Повторено карточек",
                    data: data,
                    backgroundColor: "#007bff",
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });

    } catch (err) {
        loadingEl.style.display = "none";
        errorEl.innerHTML = `<strong>Сбой:</strong> ${err.message}`;
        errorEl.style.display = "block";
    }
}

loadStatistics();