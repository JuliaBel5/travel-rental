# Wanderstay

<p>
  <a href="https://github.com/JuliaBel5/travel-rental/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/JuliaBel5/travel-rental/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql&logoColor=white">
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss&logoColor=white">
</p>

A full-stack, bilingual (RU / EN) travel-rental web app. · Полнофункциональное двуязычное (RU / EN) веб-приложение для аренды жилья.

**🌍 Live demo / Демо:** [travel-rental-ashy.vercel.app](https://travel-rental-ashy.vercel.app)

**Language / Язык:** [English](#english) · [Русский](#русский)

---

## English

A full-stack, bilingual (RU / EN) travel-rental web app — browse unique stays, check real-time availability, and book after signing in. Built with the **Next.js Pages Router**, a **PostgreSQL** database via **Prisma**, and email/password **authentication**.

### Screenshots

| Home | Catalog (dark mode) |
|------|---------------------|
| ![Home page — hero and search](docs/screenshots/home-light.png) | ![Catalog with filters, dark theme](docs/screenshots/catalog-dark.png) |

![Listing page — gallery and booking widget](docs/screenshots/listing-light.png)

### Features

- **Catalog & search** — filter by price, property type, amenities and guests; sort by price or rating.
- **Listing details** — image gallery, amenities, host card, guest reviews, and a location map.
- **Real bookings** — persisted in PostgreSQL; **double-booking is impossible by construction** (Postgres `EXCLUDE` constraint, conflicts surface as `409`), and already-booked nights are **grayed out in the date picker**.
- **Authentication** — email/password sign-up & sign-in (NextAuth Credentials, JWT sessions, `bcrypt`-hashed passwords, **rate-limited** login and registration).
- **Account-scoped bookings** — booking requires sign-in; **My bookings** shows only your reservations and lets you **cancel upcoming stays**.
- **Favorites** — tap the heart on any card to save a stay; your saved list lives at **Favorites** (per account, optimistic UI).
- **Transparent pricing** — per-night subtotal, cleaning fee and service fee broken down before you confirm.
- **Internationalization** — full RU / EN dictionaries that are kept in sync at compile time via TypeScript.
- **Light / dark theme** — system-aware, toggleable, no flash on load.
- **Polished UX** — SSR data fetching, loading skeletons, SEO meta tags, a custom 404, and accessibility touches (skip-to-content, semantic landmarks).

### Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (Pages Router) + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, `shadcn/ui` on top of Base UI, `lucide-react` icons |
| Database | PostgreSQL (Neon in production) via Prisma 6 |
| Auth | NextAuth v4 (Credentials provider) + `bcryptjs` |
| Forms & validation | React Hook Form + Zod |
| Dates | `date-fns`, `react-day-picker` |
| Theming | `next-themes` |

### Getting started

**Prerequisites:** Node.js 20+, pnpm (or npm), and a PostgreSQL database — locally the easiest option is Docker.

**1. Install dependencies**

```bash
pnpm install
```

**2. Start a local database (Docker)**

```bash
docker run --name wanderstay-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wanderstay \
  -p 5433:5432 \
  -v wanderstay-pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

**3. Configure environment** — copy the example file and fill in the values:

```bash
cp .env.example .env
```

```dotenv
# Local Docker Postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/wanderstay?schema=public"
DATABASE_URL_UNPOOLED="postgresql://postgres:postgres@localhost:5433/wanderstay?schema=public"

# Session signing secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret"
```

> `DATABASE_URL` is the pooled connection used by the app at runtime; `DATABASE_URL_UNPOOLED` is the direct connection Prisma uses for migrations. With local Docker the two are identical.

**4. Apply migrations & seed data**

```bash
pnpm prisma migrate deploy   # create the schema
pnpm prisma db seed          # load hosts, listings, reviews, etc.
```

**5. Run the dev server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Pooled Postgres connection (runtime queries). |
| `DATABASE_URL_UNPOOLED` | ✅ | Direct Postgres connection (used by `prisma migrate`). |
| `NEXTAUTH_SECRET` | ✅ | Secret used to sign session JWTs. |
| `NEXTAUTH_URL` | optional | Canonical site URL. Usually auto-detected on Vercel. |

### Database

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). Core models:

- **Host**, **Listing**, **Review** — catalog content (localized text fields stored as JSON).
- **Amenity**, **Category** — reference data with localized labels.
- **Booking** — a reservation, optionally linked to a `User`; indexed on `(listingId, checkIn, checkOut)` for availability lookups.
- **User** — account with a unique email and a hashed password.

Seed data is generated from the mock sources in [`src/data`](src/data) by [`prisma/seed.ts`](prisma/seed.ts).

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the dev server. |
| `pnpm build` | Generate the Prisma client and build for production. |
| `pnpm start` | Run the production build. |
| `pnpm lint` | Lint with ESLint. |
| `pnpm test:e2e` | Run the Playwright E2E suite (needs `pnpm build` first). |
| `pnpm format` | Format with Prettier. |
| `pnpm prisma db seed` | Seed the database. |

### Project structure

```
src/
├── pages/                 # Routes (Pages Router)
│   ├── index.tsx          # Home
│   ├── listings/          # Catalog (index) + detail ([id])
│   ├── booking/           # Checkout (index) + confirmation
│   ├── bookings/          # "My bookings" (auth-gated)
│   ├── login, signup      # Auth pages
│   └── api/               # listings, bookings, register, auth/[...nextauth]
├── components/            # UI by domain: booking, home, layout, listings, search, ui
├── lib/                   # auth, prisma client, data-access layer, pricing, utils
├── locales/               # ru / en dictionaries + hook
├── data/                  # Mock source data (used for seeding)
├── types/                 # Shared types + NextAuth type augmentation
└── styles/                # Global styles
```

### How it works

- **Data access** — all reads/writes go through [`src/lib/data.ts`](src/lib/data.ts), which queries Prisma and maps rows to the app's domain types.
- **Availability** — the picker disables taken nights (`/api/listings/[id]/availability`), the API pre-checks overlaps for a friendly `409`, and a **btree_gist `EXCLUDE` constraint** guarantees no double-booking even under concurrent requests (verified by [`scripts/race-test.ts`](scripts/race-test.ts)).
- **Auth** — [`src/lib/auth.ts`](src/lib/auth.ts) defines the NextAuth Credentials provider; sessions are JWT-based and carry the user id. `/booking` and `/bookings` gate access in `getServerSideProps`. Login counts only failed attempts (per IP + account); registration is capped per IP.
- **i18n** — `en` is typed against the shape of `ru` (`Dictionary`), so a missing or renamed key is a compile error rather than a runtime surprise.
- **Tests & CI** — the Playwright suite in [`tests/`](tests) covers auth, the full booking lifecycle (including the `409` overlap path and cancellation) and rate limiting; GitHub Actions runs lint, build and the E2E suite against a disposable Postgres on every push and PR.

### Deployment

Deployed on **Vercel** with a **Neon** Postgres database.

1. Provision Postgres (e.g. the Vercel ↔ Neon integration, which supplies `DATABASE_URL` and `DATABASE_URL_UNPOOLED`).
2. Add `NEXTAUTH_SECRET` to the project's environment variables.
3. Apply migrations against the production database: `prisma migrate deploy`.
4. Push to the production branch — Vercel builds with `prisma generate && next build`.

<p align="right"><a href="#wanderstay">↑ Back to top</a></p>

---

## Русский

Полнофункциональное двуязычное (RU / EN) веб-приложение для аренды жилья для путешествий — просматривайте уникальные варианты, проверяйте доступность дат в реальном времени и бронируйте после входа в аккаунт. Построено на **Next.js Pages Router**, базе данных **PostgreSQL** через **Prisma** и авторизации по email/паролю.

### Скриншоты

| Главная | Каталог (тёмная тема) |
|---------|----------------------|
| ![Главная — hero и поиск](docs/screenshots/home-light.png) | ![Каталог с фильтрами, тёмная тема](docs/screenshots/catalog-dark.png) |

![Страница объекта — галерея и виджет бронирования](docs/screenshots/listing-light.png)

### Возможности

- **Каталог и поиск** — фильтры по цене, типу жилья, удобствам и числу гостей; сортировка по цене или рейтингу.
- **Страница объекта** — галерея, удобства, карточка хозяина, отзывы гостей и карта расположения.
- **Реальные брони** — хранятся в PostgreSQL; **двойное бронирование невозможно по построению** (Postgres `EXCLUDE`-констрейнт, конфликты — `409`), а занятые ночи **гаснут прямо в календаре**.
- **Авторизация** — регистрация и вход по email/паролю (NextAuth Credentials, JWT-сессии, пароли хешируются `bcrypt`, вход и регистрация **защищены rate-limit**).
- **Брони по аккаунту** — для бронирования нужен вход; в «Моих бронированиях» только свои брони и **отмена предстоящих поездок**.
- **Избранное** — сердечко на карточке сохраняет жильё; список — на странице «Избранное» (по аккаунту, optimistic UI).
- **Прозрачная цена** — стоимость за ночи, плата за уборку и сервисный сбор показываются до подтверждения.
- **Интернационализация** — полные словари RU / EN, синхронность которых гарантируется типами на этапе компиляции.
- **Светлая / тёмная тема** — учитывает системную, переключается, без мигания при загрузке.
- **Продуманный UX** — SSR-загрузка данных, скелетоны, SEO-теги, кастомная 404 и элементы доступности (skip-to-content, семантические лендмарки).

### Стек технологий

| Область | Технология |
|---------|-----------|
| Фреймворк | Next.js 16 (Pages Router) + React 19 |
| Язык | TypeScript |
| Стилизация | Tailwind CSS v4, `shadcn/ui` поверх Base UI, иконки `lucide-react` |
| База данных | PostgreSQL (в проде — Neon) через Prisma 6 |
| Авторизация | NextAuth v4 (провайдер Credentials) + `bcryptjs` |
| Формы и валидация | React Hook Form + Zod |
| Даты | `date-fns`, `react-day-picker` |
| Темизация | `next-themes` |

### Быстрый старт

**Требования:** Node.js 20+, pnpm (или npm) и база данных PostgreSQL — локально проще всего через Docker.

**1. Установка зависимостей**

```bash
pnpm install
```

**2. Локальная база данных (Docker)**

```bash
docker run --name wanderstay-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=wanderstay \
  -p 5433:5432 \
  -v wanderstay-pgdata:/var/lib/postgresql/data \
  -d postgres:16
```

**3. Настройка окружения** — скопируйте пример и заполните значения:

```bash
cp .env.example .env
```

```dotenv
# Локальный Docker Postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/wanderstay?schema=public"
DATABASE_URL_UNPOOLED="postgresql://postgres:postgres@localhost:5433/wanderstay?schema=public"

# Секрет для подписи сессий — сгенерируйте: openssl rand -base64 32
NEXTAUTH_SECRET="ваш-сгенерированный-секрет"
```

> `DATABASE_URL` — пуловое соединение, которое приложение использует в рантайме; `DATABASE_URL_UNPOOLED` — прямое соединение, которое Prisma использует для миграций. С локальным Docker обе строки одинаковы.

**4. Миграции и наполнение данными**

```bash
pnpm prisma migrate deploy   # создать схему
pnpm prisma db seed          # загрузить хостов, объекты, отзывы и т.д.
```

**5. Запуск дев-сервера**

```bash
pnpm dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Переменные окружения

| Переменная | Обязательна | Описание |
|------------|-------------|----------|
| `DATABASE_URL` | ✅ | Пуловое соединение с Postgres (запросы в рантайме). |
| `DATABASE_URL_UNPOOLED` | ✅ | Прямое соединение с Postgres (для `prisma migrate`). |
| `NEXTAUTH_SECRET` | ✅ | Секрет для подписи JWT-сессий. |
| `NEXTAUTH_URL` | опц. | Канонический URL сайта. Обычно определяется автоматически на Vercel. |

### База данных

Схема — в [`prisma/schema.prisma`](prisma/schema.prisma). Основные модели:

- **Host**, **Listing**, **Review** — контент каталога (локализованные текстовые поля хранятся как JSON).
- **Amenity**, **Category** — справочные данные с локализованными подписями.
- **Booking** — бронирование, опционально связано с `User`; индекс по `(listingId, checkIn, checkOut)` для проверки доступности.
- **User** — аккаунт с уникальным email и хешем пароля.

Данные для наполнения генерируются из мок-источников в [`src/data`](src/data) скриптом [`prisma/seed.ts`](prisma/seed.ts).

### Скрипты

| Команда | Описание |
|---------|----------|
| `pnpm dev` | Запустить дев-сервер. |
| `pnpm build` | Сгенерировать Prisma-клиент и собрать продакшн. |
| `pnpm start` | Запустить продакшн-сборку. |
| `pnpm lint` | Линтинг ESLint. |
| `pnpm test:e2e` | Прогнать Playwright E2E-сьюту (сначала `pnpm build`). |
| `pnpm format` | Форматирование Prettier. |
| `pnpm prisma db seed` | Наполнить базу данными. |

### Структура проекта

```
src/
├── pages/                 # Роуты (Pages Router)
│   ├── index.tsx          # Главная
│   ├── listings/          # Каталог (index) + объект ([id])
│   ├── booking/           # Оформление (index) + подтверждение
│   ├── bookings/          # «Мои бронирования» (требует входа)
│   ├── login, signup      # Страницы авторизации
│   └── api/               # listings, bookings, register, auth/[...nextauth]
├── components/            # UI по доменам: booking, home, layout, listings, search, ui
├── lib/                   # auth, Prisma-клиент, слой доступа к данным, pricing, utils
├── locales/               # словари ru / en + хук
├── data/                  # Мок-данные (для наполнения БД)
├── types/                 # Общие типы + расширение типов NextAuth
└── styles/                # Глобальные стили
```

### Как это устроено

- **Доступ к данным** — все чтения/записи идут через [`src/lib/data.ts`](src/lib/data.ts), который обращается к Prisma и маппит строки в доменные типы приложения.
- **Доступность** — календарь гасит занятые ночи (`/api/listings/[id]/availability`), API пре-чеком возвращает дружелюбный `409`, а **btree_gist `EXCLUDE`-констрейнт** гарантирует отсутствие двойных броней даже при одновременных запросах (проверено скриптом [`scripts/race-test.ts`](scripts/race-test.ts)).
- **Авторизация** — [`src/lib/auth.ts`](src/lib/auth.ts) описывает провайдер Credentials; сессии на JWT и несут id пользователя. `/booking` и `/bookings` проверяют доступ в `getServerSideProps`. На входе считаются только неудачные попытки (по IP + аккаунту); регистрация ограничена по IP.
- **i18n** — `en` типизирован по форме `ru` (`Dictionary`), поэтому пропущенный или переименованный ключ — ошибка компиляции, а не сюрприз в рантайме.
- **Тесты и CI** — Playwright-сьюта в [`tests/`](tests) покрывает авторизацию, полный цикл брони (включая путь `409` при пересечении и отмену) и rate limiting; GitHub Actions на каждый push и PR гоняет линт, сборку и E2E против одноразового Postgres.

### Деплой

Развёрнуто на **Vercel** с базой **Neon** Postgres.

1. Подготовьте Postgres (например, интеграция Vercel ↔ Neon, которая выдаёт `DATABASE_URL` и `DATABASE_URL_UNPOOLED`).
2. Добавьте `NEXTAUTH_SECRET` в переменные окружения проекта.
3. Примените миграции к продакшн-базе: `prisma migrate deploy`.
4. Запушьте в продакшн-ветку — Vercel собирает командой `prisma generate && next build`.

<p align="right"><a href="#wanderstay">↑ Наверх</a></p>

---

Built as a portfolio project to demonstrate a production-shaped Next.js app: real persistence, authentication, i18n, and a considered UX. · Сделано как портфолио-проект, чтобы показать Next.js-приложение продакшн-уровня: реальное хранение данных, авторизация, i18n и продуманный UX.
