# REST API Дошки оголошень (Announcements Board REST API)

REST API для дошки оголошень з JWT-автентифікацією, ротацією refresh-токенів, контролем доступу на основі власності (ownership), валідацією Zod та інтерактивною OpenAPI/Swagger документацією.

## Технологічний стек

| Технологія                     | Опис                                                  |
| ------------------------------ | ----------------------------------------------------- |
| **Node.js + TypeScript**       | Середовище виконання (`tsx`, ES Modules)              |
| **Express 5**                  | Веб-фреймворк для REST API                            |
| **Prisma 7 + PostgreSQL**      | ORM та драйвер-адаптер `@prisma/adapter-pg`           |
| **Zod 4**                      | Валідація `body`, `params` та `query`                 |
| **bcrypt**                     | Безпечне хешування паролів (cost factor 10)           |
| **jsonwebtoken**               | JWT-автентифікація (`accessToken` 15m, `refresh` 7d)  |
| **@asteasolutions/zod-to-openapi** | Автоматична генерація OpenAPI 3.0 специфікації    |
| **swagger-ui-express**         | Інтерактивна документація Swagger UI на `/api-docs`   |

---

## Встановлення та запуск

1. **Встановіть залежності:**

```bash
npm install
```

2. **Створіть файл конфігурації `.env` на основі `.env.example`:**

```bash
cp .env.example .env
```

3. **Налаштуйте змінні середовища у `.env`:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/announcements?schema=public"
JWT_SECRET="your-secret-key-at-least-256-bits-long"
PORT=3000
```

4. **Застосуйте міграції бази даних Prisma та згенеруйте клієнт:**

```bash
npm run prisma:migrate
npm run prisma:generate
```

5. **Запустіть сервер:**

```bash
# Режим розробки з автоперезавантаженням
npm run dev

# Продакшн-режим
npm start
```

Після запуску сервер доступний за адресою `http://localhost:3000`, а інтерактивна документація Swagger UI — за адресою:
👉 **`http://localhost:3000/api-docs`**

---

## Архітектура та структура проекту

```text
goit-nodejs-hw-02/
├── prisma/
│   ├── schema.prisma                  # Моделі User, RefreshToken, Announcement
│   ├── client.ts                      # Ініціалізація PrismaClient з PrismaPg адаптером
│   └── migrations/                    # SQL-міграції бази даних
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts         # Логіка реєстрації, входу, refresh, logout, профілю
│   │   └── announcements.controller.ts# CRUD операції оголошень, пагінація, пошук, ownership
│   ├── middleware/
│   │   ├── authenticate.ts            # Перевірка Bearer JWT та типізація req.user
│   │   └── validate.ts                # Middleware-фабрики validateBody, validateParams, validateQuery
│   ├── routes/
│   │   ├── auth.routes.ts             # Маршрути /auth + реєстрація в OpenAPI registry
│   │   └── announcements.routes.ts    # Маршрути /announcements + реєстрація в OpenAPI registry
│   ├── validators/
│   │   ├── auth.validator.ts          # Zod-схеми для автентифікації
│   │   └── announcements.validator.ts # Zod-схеми для оголошень, параметрів та пагінації
│   └── openapi.ts                     # Ініціалізація OpenAPIRegistry та bearerAuth
├── app.ts                             # Точка входу Express, підключення маршрутів та обробка помилок
├── prisma.config.ts                   # Конфігурація Prisma 7
├── .env.example                       # Шаблон змінних середовища
├── package.json
├── tsconfig.json
└── README.md
```

---

## Опис маршрутів (API Endpoints)

### 1. Автентифікація (`/auth`)

| Метод  | Шлях             | Доступ       | Статус | Опис                                                                 |
| ------ | ---------------- | ------------ | ------ | -------------------------------------------------------------------- |
| `POST` | `/auth/register` | Публічний    | `201`  | Реєстрація користувача, хешування пароля, видача пари токенів        |
| `POST` | `/auth/login`    | Публічний    | `200`  | Вхід за `username` і `password`, заміна старого refresh токена в БД  |
| `POST` | `/auth/refresh`  | Публічний    | `200`  | Ротація refresh токена: видалення старого, видача нової пари токенів |
| `POST` | `/auth/logout`   | Захищений 🔒 | `204`  | Видалення refresh токенів поточного користувача (`deleteMany`)       |
| `GET`  | `/auth/me`       | Захищений 🔒 | `200`  | Отримання профілю поточного користувача (без поля `password`)        |

### 2. Оголошення (`/announcements`)

| Метод    | Шлях                 | Доступ                   | Статус | Опис                                                              |
| -------- | -------------------- | ------------------------ | ------ | ----------------------------------------------------------------- |
| `GET`    | `/announcements`     | Публічний                | `200`  | Список оголошень з пагінацією (`10`/стор.), пошуком і сортуванням |
| `GET`    | `/announcements/:id` | Публічний                | `200`  | Деталі одного оголошення разом з інформацією про автора (`user`)  |
| `POST`   | `/announcements`     | Захищений 🔒             | `201`  | Створення оголошення (`userId` береться з JWT токена)             |
| `PATCH`  | `/announcements/:id` | Захищений 🔒 (Власник)   | `200`  | Часткове оновлення власного оголошення (`403` для чужого)         |
| `DELETE` | `/announcements/:id` | Захищений 🔒 (Власник)   | `204`  | Видалення власного оголошення (`403` для чужого)                  |

---

## Правила валідації

### `POST /auth/register`
- `username`: рядок, обов'язковий, `3–30` символів
- `email`: валідна email-адреса, обов'язковий
- `password`: рядок, обов'язковий, мінімум `6` символів
- `name`: рядок, обов'язковий, мінімум `2` символи

### `GET /announcements` (Query параметри)
- `search` *(опціонально)*: нечутливий до регістру пошук підрядка у `title`
- `sort` *(опціонально)*: `newest` (за замовчуванням, за спаданням `createdAt`) або `oldest` (за зростанням `createdAt`)
- `page` *(опціонально)*: номер сторінки (`ціле число > 0`, за замовчуванням `1`, по `10` оголошень на сторінку)

### `POST /announcements` та `PATCH /announcements/:id`
- `title`: рядок, `5–50` символів
- `description`: рядок, мінімум `10` символів
- `price`: число `> 0`
- `category`: одне зі значень `sale`, `service`, `job`, `other`
- Для `PATCH` усі поля опціональні, проте порожнє тіло `{}` відхиляється зі статусом `400 Bad Request`.

---

## Приклади відповідей

### `POST /auth/register` (`201 Created`)
```json
{
  "user": {
    "id": 1,
    "username": "ivan_petrenko",
    "email": "ivan@example.com",
    "name": "Іван"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### `GET /announcements?search= ноутбук&sort=newest&page=1` (`200 OK`)
```json
{
  "data": [
    {
      "id": 1,
      "title": "Продам ноутбук ASUS",
      "description": "Відмінний стан, 16GB RAM, SSD 512GB",
      "price": 18000,
      "category": "sale",
      "createdAt": "2025-01-10T12:00:00.000Z",
      "updatedAt": "2025-01-10T12:00:00.000Z",
      "user": {
        "id": 1,
        "username": "ivan_petrenko",
        "email": "ivan@example.com",
        "name": "Іван"
      }
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "totalPages": 1,
    "perPage": 10
  }
}
```
