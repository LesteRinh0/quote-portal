Ниже — подробное ТЗ (`TZ.md` / промпт), которое можно сразу скормить **Codex** в VS Code, чтобы он собрал проект по шагам без лишней сложности и без серверной инфраструктуры.

---

# Техническое задание: Quote & Client Portal (упрощённая версия для VS Code + GitHub + Vercel)

## 1. Цель проекта

Создать веб-приложение **Quote & Client Portal** — интерактивный конструктор смет и клиентский портал для согласования коммерческих предложений и этапов оплаты.

Проект должен запускаться локально через `npm run dev` и деплоиться на Vercel без собственного бэкенда, Docker и внешних баз данных:

* хранение данных в браузере через слой репозитория поверх `localStorage`;
* автозаполнение реалистичными демо-данными (`seed`) при первом запуске;
* экспорт/импорт всей базы в `.json` и кнопка сброса к демо-данным;
* формирование PDF-версии сметы через стили печати (`@media print` / `window.print()`).

---

## 2. Технологический стек и правила кода

* **Язык:** TypeScript (strict mode включён, без `any` в публичных интерфейсах и моделях).
* **Фреймворк и сборка:** React + Vite.
* **Стилизация и UI:** Tailwind CSS (плюс аккуратные кастомные компоненты кнопок, модалок, карточек, бейджей и таблиц).
* **Роутинг:** `react-router-dom` (с поддержкой вложенных маршрутов и fallback на главную для SPA на Vercel).
* **Иконки:** `lucide-react` (если нужно).
* **Принципы архитектуры:**
* строгое разделение на типы (`types/`), слой хранения (`storage/`), чистую бизнес-логику расчётов и генерации (`utils/`), демо-данные (`data/`) и UI (`components/`, `pages/`);
* все расчёты сумм, скидок, опций и этапов оплаты вынесены в чистые функции в `src/utils/calcQuote.ts` и покрыты unit-тестами (например, `vitest`).



---

## 3. Структура проекта

Сформировать следующую структуру файлов:

```text
quote-portal/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Typecheck (tsc --noEmit), lint/test и build
├── public/
│   └── vercel.json                 # SPA rewrite для корректного обновления страниц вида /p/:slug
├── src/
│   ├── types/
│   │   └── quote.types.ts          # Все доменные типы, статусы, сущности и контракт репозитория
│   ├── data/
│   │   └── seed.ts                 # Готовые демо-данные: профиль, клиенты, услуги, сметы
│   ├── storage/
│   │   └── localStorageRepo.ts     # Реализация репозитория на localStorage + seed + JSON export/import/reset
│   ├── utils/
│   │   ├── calcQuote.ts            # Расчёт итогов сметы, скидок, опций, вариантов и этапов
│   │   └── briefGenerator.ts       # Локальный генератор черновика сметы по тексту брифа
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx       # Боковое/верхнее меню кабинета исполнителя + кнопка перехода в демо-портал
│   │   ├── quote-builder/
│   │   │   ├── QuoteEditorForm.tsx # Редактор разделов, позиций, типов позиций, скидок и этапов
│   │   │   ├── QuotePreviewCard.tsx# Живой предпросмотр сметы в реальном времени
│   │   │   └── BriefModal.tsx      # Модалка вставки брифа и автогенерации разделов/позиций
│   │   └── client-portal/
│   │       ├── QuoteItemsList.tsx  # Отрисовка разделов, чекбоксов опций и радио-выбора вариантов
│   │       ├── QuoteSummaryBox.tsx # Итоговая сумма, скидка, график оплат, кнопка согласования и PDF
│   │       └── QuoteComments.tsx   # Комментарии клиента/исполнителя и журнал событий сметы
│   ├── pages/
│   │   ├── DashboardPage.tsx       # KPI, воронка/список смет, быстрые действия, управление JSON/seed
│   │   ├── QuotesListPage.tsx      # Полный список смет, поиск по названию/клиенту, фильтр по статусу
│   │   ├── QuoteEditorPage.tsx     # Создание (/quotes/new) и редактирование (/quotes/:id/edit) сметы
│   │   ├── ClientPortalPage.tsx    # Публичный вид сметы для клиента (/p/:slug)
│   │   ├── TemplatesPage.tsx       # Справочник типовых услуг/позиций + добавление в смету
│   │   └── ClientsPage.tsx         # Список клиентов, их сметы и суммарная выручка
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                   # Стили Tailwind + правила @media print для чистой печати в PDF
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md

```

---

## 4. Модель данных (`src/types/quote.types.ts`)

Описать чёткие интерфейсы и union-типы:

1. **`Currency`**: `'USD' | 'EUR' | 'BYN' | 'RUB'`
2. **`QuoteStatus`**: `'DRAFT' | 'SENT' | 'VIEWED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'`
3. **`DiscountType`**: `'NONE' | 'PERCENT' | 'FIXED'`
4. **`QuoteItemType`**:
* `'FIXED'` — обязательная позиция, всегда учитывается в расчёте.
* `'OPTIONAL'` — дополнительная опция (`isSelected: boolean`), клиент в портале может включать/выключать.
* `'CHOICE'` — выбор одного варианта из массива `choices: QuoteChoiceOption[]` (`id`, `label`, `unitPrice`), хранится выбранный `selectedChoiceId`.


5. **`QuoteItem`**:
* `id: string`
* `title: string`
* `description?: string`
* `unit: string` (например: `'шт'`, `'час'`, `'стр.'`, `'услуга'`)
* `quantity: number` (`>= 0`)
* `unitPrice: number` (`>= 0`)
* `type: QuoteItemType`
* `isSelected: boolean`
* `choices?: QuoteChoiceOption[]`
* `selectedChoiceId?: string`


6. **`QuoteSection`**:
* `id: string`
* `title: string`
* `description?: string`
* `items: QuoteItem[]`


7. **`PaymentMilestone`**:
* `id: string`
* `title: string` (например: `'Предоплата 50%'`, `'Постоплата 50%'`)
* `percentage: number` (`0..100`)
* `dueNote?: string`
* `isPaid: boolean`


8. **`QuoteComment`**:
* `id: string`
* `authorName: string`
* `authorRole: 'FREELANCER' | 'CLIENT' | 'SYSTEM'`
* `text: string`
* `createdAt: string` (ISO string)


9. **`Quote`**:
* `id: string`
* `slug: string` (уникальный читаемый/короткий ключ для ссылки `/p/:slug`)
* `title: string`
* `clientId: string`
* `status: QuoteStatus`
* `currency: Currency`
* `validUntil?: string`
* `createdAt: string`
* `updatedAt: string`
* `approvedAt?: string`
* `approvedByName?: string`
* `sections: QuoteSection[]`
* `discountType: DiscountType`
* `discountValue: number`
* `milestones: PaymentMilestone[]`
* `comments: QuoteComment[]`


10. **`Client`**:
* `id: string`
* `name: string`
* `company?: string`
* `email?: string`
* `telegram?: string`
* `notes?: string`


11. **`ServiceTemplate`**:
* `id: string`
* `category: string`
* `title: string`
* `description?: string`
* `unit: string`
* `defaultQuantity: number`
* `unitPrice: number`
* `defaultType: QuoteItemType`


12. **`CompanyProfile`**:
* `companyName: string`
* `contactName: string`
* `email?: string`
* `telegram?: string`
* `accentColor: string` (HEX, например `'#2563eb'`)
* `defaultCurrency: Currency`


13. **`DatabaseState`**:
* `profile: CompanyProfile`
* `clients: Client[]`
* `templates: ServiceTemplate[]`
* `quotes: Quote[]`


14. **Контракт репозитория (`QuoteRepository`)**:
* `getState(): DatabaseState`
* `saveQuote(quote: Quote): Quote`
* `deleteQuote(quoteId: string): void`
* `saveClient(client: Client): Client`
* `saveTemplate(template: ServiceTemplate): ServiceTemplate`
* `deleteTemplate(templateId: string): void`
* `updateProfile(profile: CompanyProfile): CompanyProfile`
* `addComment(quoteId: string, comment: Omit<QuoteComment, 'id' | 'createdAt'>): Quote | null`
* `approveQuote(quoteId: string, clientName: string): Quote | null`
* `markQuoteViewed(slug: string): Quote | null`
* `resetToSeed(): DatabaseState`
* `exportJson(): string`
* `importJson(rawJson: string): DatabaseState` (с валидацией структуры и понятной ошибкой при битом JSON).



---

## 5. Бизнес-логика и расчёты (`src/utils/calcQuote.ts`)

Реализовать чистые, детерминированные функции для расчёта сметы (используются и в конструкторе, и в клиентском портале, и в тестах):

1. **Стоимость одной позиции (`calculateItemTotal(item: QuoteItem): number`):**
* Для `'FIXED'`: `quantity * unitPrice`.
* Для `'OPTIONAL'`: если `isSelected === true` -> `quantity * unitPrice`, иначе `0`.
* Для `'CHOICE'`: если найден выбранный вариант в `choices` по `selectedChoiceId` -> `quantity * choice.unitPrice`, иначе `quantity * unitPrice`.


2. **Подытог без скидки (`calculateSubtotal(quote: Quote): number`):**
* Сумма стоимостей всех позиций во всех разделах `quote.sections`.


3. **Размер скидки (`calculateDiscountAmount(subtotal: number, discountType: DiscountType, discountValue: number): number`):**
* `'NONE'` -> `0`.
* `'PERCENT'` -> `subtotal * clamp(discountValue, 0, 100) / 100`.
* `'FIXED'` -> `clamp(discountValue, 0, subtotal)`.
* Итог не может быть отрицательным (`Math.max(0, subtotal - discount)`).


4. **Расчёт этапов оплаты (`calculateMilestones(total: number, milestones: PaymentMilestone[])`):**
* Для каждого этапа вычисляет сумму `amount = roundMoney(total * milestone.percentage / 100)`.
* Проверяет сумму процентов (подсказка в UI, если сумма процентов не равна 100%).


5. **Форматирование денег (`formatMoney(amount: number, currency: Currency): string`):**
* Аккуратное форматирование с разделителями тысяч и символом/кодом валюты.



---

## 6. Локальный генератор сметы по брифу (`src/utils/briefGenerator.ts`)

Реализовать функцию `generateSectionsFromBrief(briefText: string): QuoteSection[]`, которая работает полностью оффлайн без внешних API:

* анализирует текст брифа/ТЗ (ключевые слова по разработке, дизайну, верстке, интеграциям, SEO, аналитике, поддержке, а также базовые задачи);
* формирует 2–4 логических раздела (`QuoteSection[]`) с реалистичными позициями, единицами измерения, ценами и хотя бы парой опций (`type: 'OPTIONAL'`);
* если текст общий или короткий — возвращает универсальный стартовый шаблон сметы, который пользователь легко донастроит в редакторе.

---

## 7. Требования к страницам и интерфейсу

1. **Навигация (`AppLayout`):**
* Пункты меню: `Дашборд`, `Сметы`, `Новая смета`, `Услуги и шаблоны`, `Клиенты`.
* На странице сметы — кнопка **«Открыть ссылку клиента»** (переход на `/p/:slug` и копирование ссылки в буфер обмена).
* В футере или шапке — быстрые кнопки **«Экспорт JSON»**, **«Импорт JSON»**, **«Сброс демо»**.


2. **Дашборд (`DashboardPage`):**
* Карточки метрик: всего смет, на согласовании (`SENT` + `VIEWED`), согласовано/в работе (`APPROVED` + `IN_PROGRESS` + `COMPLETED`), общая сумма согласованных смет.
* Таблица/список последних смет с быстрым переключением статуса и переходом в редактор или клиентский портал.
* Последние события/комментарии по сметам.


3. **Список смет (`QuotesListPage`):**
* Поиск по названию сметы и имени/компании клиента.
* Фильтр по статусу (`ALL` и конкретные статусы).
* Действия для каждой сметы: открыть портал клиента (`/p/:slug`), редактировать (`/quotes/:id/edit`), дублировать, удалить.


4. **Конструктор сметы (`QuoteEditorPage`):**
* Выбор клиента из списка (или быстрое создание нового клиента прямо здесь), название сметы, валюта, срок действия, статус.
* Кнопка **«Сгенерировать из брифа»** -> открывает `BriefModal`, вставляет сгенерированные разделы/позиции в смету.
* Управление разделами (добавить, переименовать, удалить) и позициями (название, описание, кол-во, единица, цена, тип `FIXED`/`OPTIONAL`/`CHOICE`, настройка вариантов для `CHOICE`).
* Настройка скидки (`NONE` / `PERCENT` / `FIXED`) и этапов оплаты (добавление/удаление этапов, процент, пометка оплаты).
* Справа (на десктопе) — **Live Preview** с актуальными суммами.


5. **Клиентский портал (`/p/:slug` — `ClientPortalPage`):**
* Показывает информацию об исполнителе, название проекта, статус, срок действия и разбивку по разделам.
* Позволяет клиенту переключать `OPTIONAL`-чекбоксы и `CHOICE`-радиокнопки (если смета ещё не зафиксирована в финальном статусе); изменения сохраняются в репозитории и пересчитывают итоги и этапы.
* При первом открытии сметы со статусом `'SENT'` переводит её в `'VIEWED'` и добавляет системный комментарий о просмотре.
* Кнопка **«Согласовать смету»**: открывает модалку ввода имени клиента, сохраняет `approvedByName`, `approvedAt`, меняет статус на `'APPROVED'` и пишет системный комментарий.
* Блок комментариев (`QuoteComments`): клиент и исполнитель могут оставлять сообщения по смете.
* Кнопка **«Скачать / Распечатать PDF»**: вызывает `window.print()`. В `@media print` скрыть навигацию, кнопки редактирования/навигации и лишний хром, оставив чистый документ сметы.


6. **Услуги и шаблоны (`TemplatesPage`) и Клиенты (`ClientsPage`):**
* Полноценный CRUD/редактирование типовых услуг и клиентов с сохранением в `localStorage`.



---

## 8. Демо-данные (`src/data/seed.ts`)

Создать богатый, аккуратный набор демо-данных на русском языке:

* профиль исполнителя / студии с акцентным цветом;
* 3–4 клиента (например, локальный бизнес и digital-проекты);
* 6–8 типовых услуг в разных категориях;
* 3 сметы в разных статусах (`DRAFT`, `SENT` / `VIEWED`, `APPROVED`), включая смету с чекбоксами опций, выбором варианта (`Базовый / Оптимальный / Расширенный`), скидкой и этапами оплаты.

---

## 9. Документация и CI

* Настроить `.github/workflows/ci.yml`: установка зависимостей, запуск unit-тестов (`npm test`), проверка типов (`npx tsc --noEmit`) и сборка (`npm run build`).
* Написать понятный `README.md`: описание продукта, стек, как запустить локально, как устроен слой хранения на `localStorage` + JSON-экспорт/импорт и как деплоить на Vercel.

---

## 10. Порядок выполнения для Codex

Выполняй задачу поэтапно и после каждого этапа проверяй сборку:

1. Инициализировать Vite + React + TypeScript + Tailwind проект, настроить `vercel.json` и `.github/workflows/ci.yml`.
2. Создать `src/types/quote.types.ts`, `src/utils/calcQuote.ts`, `src/utils/briefGenerator.ts` и unit-тесты для расчётов.
3. Создать `src/data/seed.ts` и `src/storage/localStorageRepo.ts` с валидацией импорта JSON.
4. Собрать layout, дашборд, список смет, справочники шаблонов и клиентов.
5. Собрать конструктор сметы с live-превью и генератором из брифа.
6. Собрать клиентский портал `/p/:slug` с интерактивными опциями, согласованием, комментариями и печатью в PDF (`@media print`).
7. Проверить `npm run build` и `npx tsc --noEmit` без ошибок и написать `README.md`.