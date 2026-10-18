Норма

Мобильный веб-сервис заказа готового рациона на день или на неделю. Город запуска — Москва. Первая доставка не раньше чем через два календарных дня. Четыре типа питания, без конструктора блюд и без своей курьерской службы.

Приложение: Норма

Запуск

Нужны Node.js 22 и PostgreSQL 16.

cp .env.example .env.local

В .env.local задайте APP_DB_PASSWORD и тот же пароль в DATABASE_URL. Для локального сервера PostgreSQL:

sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
npm install
npm run db:init
npm run dev

Сервер разработки слушает порт 38471.

Демо-вход после npm run db:init: demo@norma.test / Demo12345.

Тестовая карта: 4242 4242 4242 4242, любой будущий срок, CVV из трёх цифр. Отказ банка: 4000 0000 0000 0002.

Проверки:

npm test

Повторный npm run db:init пересобирает схему и стирает заказы.

Docker-вариант описан в docker-compose.yml и docker/postgres/Dockerfile. На машине без демона Docker используйте локальный PostgreSQL, как выше.

Облако: Supabase и Vercel

Локальный PostgreSQL на Vercel недоступен. База живёт в Supabase, сайт — на Vercel. Роль norma_app и ограничение строк сохраняются.





На supabase.com создайте проект. Запомните пароль базы.



В проекте нажмите Connect → Session pooler и скопируйте строку. Порт в ней должен быть 5432, пользователь — postgres.КОДПРОЕКТА.



В папке проекта откройте .env.local и замените подключение:

ADMIN_DATABASE_URL=сюда-строку-session-pooler
APP_DB_PASSWORD=пароль-роли-без-символов-@#?&
JWT_SECRET=любая-случайная-строка-длиннее-32-символов
APP_ORIGIN=https://ваш-проект.vercel.app

DATABASE_URL пока можно оставить старым: скрипт напечатает новый.





В командной строке Windows из папки проекта:

npm run db:init

В конце будет строка DATABASE_URL для Vercel. Скопируйте её целиком. Повторный запуск стирает заказы в этой облачной базе, схему public целиком он не удаляет.





Залейте проект на vercel.com: Add New → Project и импорт репозитория GitHub. Либо из папки проекта: npx vercel login, затем npx vercel --prod.



В Vercel откройте Settings → Environment Variables и добавьте три переменные для Production:





DATABASE_URL — строка, которую напечатал db:init (порт 6543, пользователь norma_app.КОДПРОЕКТА)



JWT_SECRET — тот же, что в .env.local



APP_ORIGIN — адрес сайта без слэша в конце, например https://norma.vercel.app

ADMIN_DATABASE_URL на Vercel не добавляйте. После сохранения переменных нажмите Redeploy.

Демо-вход тот же: demo@norma.test / Demo12345.

Что внутри





Путь пользователя: user_journey.md



Истории и критерии: user_stories.md



Требования и ошибки: technical_specification.md



Описание продукта: project_description.md



Концепции экрана: ui_concepts/ui_description.md



Сравнение агентов: dz1_report.md



Правила и промпты: rules.md, prompt_templates.md, prompt_methodology.md, testing.md



Отчёт по интерфейсу: development_report.md



API и база: backend_documentation.md

Задание про CI/CD, OAuth, аналитику и боевые платежи в этот репозиторий не входило.

Основные адреса





/ — первый экран



/onboarding — как устроен заказ



/rations — тип питания и наборы



/checkout — дата и адрес



/login и /register



/orders — свои заказы



/concepts — три черновика экрана


