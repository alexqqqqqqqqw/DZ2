# Backend «Нормы»

## Архитектура

Браузер говорит только с Route Handlers Next.js. Обработчики вызывают функции в `src/server`. База — PostgreSQL 16.

Роли:

- суперпользователь `postgres` выполняет `scripts/init-db.mjs`: создаёт роль, базу и схему
- `norma_app` без `BYPASSRLS` обслуживает приложение

Сессия — JWT HS256 в cookie `norma_session` (HttpOnly, SameSite=Lax, 7 суток). Пароль — bcrypt cost 10. Полный номер карты в таблицы не пишется.

Row level security включён и форсирован. Заказы и платежи видны роли приложения только при `set_config('app.user_id', ..., true)` внутри транзакции. Функции `app_register_user`, `app_find_user_by_email` и `app_order_owner` объявлены `SECURITY DEFINER`, потому что регистрация и проверка владельца идут до или вне политики строки.

## Как поднять локально

Нужны Node.js 22 и PostgreSQL 16.

```bash
cp .env.example .env.local
# выставьте APP_DB_PASSWORD и тот же пароль в DATABASE_URL
# для локального postgres:
# sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
npm install
npm run db:init
npm run dev
```

Приложение слушает порт 38471. Проверка живости: `GET http://127.0.0.1:38471/api/health`.

Демо-аккаунт после инициализации: `demo@norma.test` / `Demo12345`.

Вариант с Docker, если демон доступен:

```bash
docker compose up -d
```

Образ описан в `docker/postgres/Dockerfile` (PostgreSQL 16, локаль ru_RU). На этой машине демона Docker нет, поэтому стенд поднят пакетом PostgreSQL, а compose оставлен для повторения.

## Облако

На Vercel процесс не держит свой PostgreSQL. База — проект Supabase, сайт собирает Vercel.

- Инициализация идёт с компьютера через Session pooler, порт 5432, пользователь `postgres.КОДПРОЕКТА`. Скрипт не выполняет `DROP SCHEMA public` и не создаёт отдельную базу: в Supabase база уже называется `postgres`.
- Приложение на Vercel ходит через Transaction pooler, порт 6543, пользователь `norma_app.КОДПРОЕКТА`. Пул в коде для этого режима равен 1, SSL включён. `set_config('app.user_id', ..., true)` остаётся внутри транзакции, поэтому ограничение строк работает и через pooler.
- Переменные на Vercel: `DATABASE_URL`, `JWT_SECRET`, `APP_ORIGIN`. Пароль суперпользователя туда не кладётся.
- Журнал в файл на Vercel не пишется: диск функции только для чтения. События остаются в stdout и в `audit_log`.

Пошаговое подключение — в `README.md`, раздел «Облако: Supabase и Vercel».

`npm run db:init` пересоздаёт схему `public` в базе `norma`. Повторный запуск стирает заказы и пользователей, кроме нового демо-аккаунта.

Тестовая база: `npm run db:init:test` создаёт `norma_test`.

## Схема

Таблицы: `users`, `diet_types`, `meal_plans`, `meals`, `orders`, `payments`, `audit_log`.

Связи: план принадлежит типу питания, блюдо принадлежит плану, заказ принадлежит пользователю и плану, платёж принадлежит заказу.

Файл: `db/001_schema.sql`.

## API

Общая ошибка:

```json
{ "error": { "code": "validation_error", "message": "Проверьте поля заказа.", "fields": { "startDate": "..." } } }
```

| Метод | Путь | Сессия | Успех |
| --- | --- | --- | --- |
| GET | `/api/health` | нет | 200 или 503 |
| GET | `/api/diets` | нет | 200, 4 типа |
| GET | `/api/plans?diet=balanced` | нет | 200 |
| GET | `/api/plans/:id` | нет | 200 или 404 |
| POST | `/api/auth/register` | нет | 201 и cookie |
| POST | `/api/auth/login` | нет | 200 и cookie |
| POST | `/api/auth/logout` | нет | 200 |
| GET | `/api/auth/me` | по cookie | 200, `user` или `null` |
| GET | `/api/orders` | да | 200 |
| POST | `/api/orders` | да | 201 |
| GET | `/api/orders/:id` | да | 200, 403 или 404 |
| POST | `/api/orders/:id/receive` | да | 200 или 409 |
| POST | `/api/payments` | да | 200, 400, 402 или 409 |

CORS для `/api` выставляет `Access-Control-Allow-Origin` только для origin стенда (`src/proxy.ts`).

### Примеры

Регистрация:

```bash
curl -c /tmp/norma.ck -H 'content-type: application/json' \
  -d '{"name":"Пётр Проверка","email":"petr@norma.test","password":"Test1234","phone":"+79035550011"}' \
  http://127.0.0.1:38471/api/auth/register
```

Заказ (дата не раньше чем через 2 календарных дня по Москве):

```bash
curl -b /tmp/norma.ck -H 'content-type: application/json' \
  -d '{"planId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1","startDate":"2026-10-16","slot":"10-14","city":"Москва","street":"Арбат","house":"10","apartment":"2","comment":"","phone":"+79035550011"}' \
  http://127.0.0.1:38471/api/orders
```

Оплата. Успех — `4242424242424242`. Отказ банка — `4000000000000002`.

```bash
curl -b /tmp/norma.ck -H 'content-type: application/json' \
  -d '{"orderId":"<uuid>","card":{"number":"4242424242424242","expMonth":12,"expYear":2030,"cvv":"123"}}' \
  http://127.0.0.1:38471/api/payments
```

Без cookie `GET /api/orders` возвращает 401.

## Журнал

Каждый запрос пишет JSON в stdout и в `logs/app.log`: `ts`, `level`, `event`, `method`, `path`, `status`. Отдельные события: `user_registered`, `login_succeeded`, `login_failed`, `order_created`, `payment_succeeded`, `payment_declined`, `order_forbidden`, `order_delivered`. Пароль и полный номер карты в поля не входят. Та же строка дублируется в `audit_log`, если вставка не нарушает политику.

Коды, которые ищутся в журнале: 401 (`unauthorized`, `invalid_credentials`), 403 (`forbidden`), 500 (`internal_error`).

## Как это проектировалось

Схема собрана промптом «таблицы пользователя, типа питания, плана, блюда, заказа и платежа, цена заказа копируется, номер карты не хранится». Затем в SQL добавлены политики и три функции `SECURITY DEFINER`: без них вход по почте не видит строку пользователя под RLS. Отладка: интеграционный тест читает `orders` без `app.user_id` и ждёт 0 строк. Пока политика не была форсирована, владелец таблицы видел все заказы. `FORCE ROW LEVEL SECURITY` и отдельная роль приложения это закрыли.

Секреты лежат в `.env.local`. В репозиторий попадает `.env.example` с заглушками.
