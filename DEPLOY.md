# StarQuest — Полная инструкция по запуску

---

## 📋 Что нужно установить на компьютер

### 1. Node.js (для фронтенда)
1. Открой https://nodejs.org
2. Скачай версию **LTS** (зелёная кнопка)
3. Установи, нажимая "Next" → "Next" → "Install"
4. Проверь: открой PowerShell и набери `node --version` → должно показать версию

### 2. Python 3.11+ (для бэкенда)
1. Открой https://python.org/downloads
2. Скачай и установи (⚠️ **Обязательно поставь галочку "Add Python to PATH"**)
3. Проверь: в PowerShell набери `python --version`

---

## 🎨 Запуск фронтенда (React-приложение)

Открой **PowerShell** (или терминал VS Code) и выполни по очереди:

```powershell
# 1. Перейди в папку фронтенда
cd "d:\Бот 2.0\starquest\frontend"

# 2. Установи все зависимости (React, Tailwind, Framer Motion и т.д.)
npm install

# 3. Запусти dev-сервер
npm run dev
```

После этого в терминале появится ссылка типа `http://localhost:5173/` — это твоё приложение. Открой в браузере чтобы увидеть его.

> ⚠️ **Важно**: Для полноценной работы приложение должно открываться внутри Telegram как Mini App. В браузере оно покажет интерфейс, но API-запросы не будут работать без бэкенда.

---

## 🖥️ Запуск бэкенда (API + Telegram Bot)

Открой **ещё одно** окно PowerShell:

```powershell
# 1. Перейди в папку бэкенда
cd "d:\Бот 2.0\starquest\backend"

# 2. Установи Python-зависимости
pip install -r requirements.txt

# 3. Задай переменные окружения (подставь свои значения!)
$env:BOT_TOKEN = "СЮДА_ТОКЕН_БОТА"
$env:DATABASE_URL = "postgresql://user:password@host:5432/dbname"

# 4. Запусти сервер
python main.py
```

Если всё ок, увидишь:
```
✅ PostgreSQL connected!
🌐 API started on port 8080
🤖 StarQuest Bot started!
```

---

## 🗄️ База данных PostgreSQL

### Вариант А: Локально (для разработки)

1. Скачай PostgreSQL: https://postgresql.org/download/windows
2. Установи, запомни пароль для пользователя `postgres`
3. Открой **pgAdmin** (устанавливается вместе с PostgreSQL)
4. Создай новую базу данных, например `starquest`
5. Твой `DATABASE_URL` будет:
```
postgresql://postgres:ТВОЙ_ПАРОЛЬ@localhost:5432/starquest
```

### Вариант Б: На Railway (для продакшена)

1. Зайди на https://railway.app → создай проект
2. Нажми **"+ New"** → **Database** → **PostgreSQL**
3. Скопируй `DATABASE_URL` из настроек базы

---

## 🚀 Деплой на Railway (чтобы работало 24/7)

### Шаг 1: Залей код на GitHub
```powershell
cd "d:\Бот 2.0\starquest"
git init
git add .
git commit -m "StarQuest v3.0"
git remote add origin https://github.com/ТВОЙ_ЮЗЕР/starquest.git
git push -u origin main
```

### Шаг 2: Бэкенд на Railway
1. На railway.app → **"+ New"** → **GitHub Repo** → выбери репозиторий
2. Root Directory: `backend`
3. Добавь **Environment Variables**:
   - `BOT_TOKEN` = токен бота
   - `DATABASE_URL` = ссылка на PostgreSQL (из шага выше)
   - `WEBAPP_URL` = URL фронтенда (из шага 3)
   - `PORT` = `8080`
4. Railway сам определит Python и запустит `main.py`

### Шаг 3: Фронтенд на GitHub Pages
```powershell
cd "d:\Бот 2.0\starquest\frontend"
npm run build
# Содержимое папки dist/ загрузи на GitHub Pages
```

Или используй [Vercel](https://vercel.com) / [Netlify](https://netlify.com) — просто подключи GitHub репо.

### Шаг 4: Свяжи бота с WebApp
1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Выбери бота → **Bot Settings** → **Menu Button**
3. Укажи URL фронтенда

---

## ✅ Проверка что всё работает

| Что проверить | Как |
|---|---|
| Бэкенд жив | Открой `http://localhost:8080/api/version` — должно показать `{"version":"3.0"}` |
| Фронтенд жив | Открой `http://localhost:5173` — должен показать интерфейс StarQuest |
| Бот работает | Напиши `/start` боту в Telegram |
| Полный тест | Открой кнопку "🌟 Открыть StarQuest" в боте |

---

## 🆘 Частые проблемы

| Проблема | Решение |
|---|---|
| `npm: command not found` | Не установлен Node.js → установи с nodejs.org |
| `python: command not found` | Не установлен Python или не добавлен в PATH → переустанови с галочкой "Add to PATH" |
| Бэкенд не запускается | Проверь `DATABASE_URL` — база PostgreSQL должна быть запущена |
| Фронтенд показывает пустую страницу | Проверь консоль браузера (F12), возможно не запущен бэкенд |
