import type { DatabaseState, Quote, QuoteItem, QuoteSection } from '../types/quote.types';

const item = (value: QuoteItem): QuoteItem => value;

const quote = (value: Quote): Quote => value;

const landingSection: QuoteSection = {
  id: 'landing-discovery',
  title: 'Структура и подготовка',
  description: 'Подготовка проекта к дизайну и разработке',
  items: [
    item({ id: 'landing-brief', title: 'Интервью и прототипирование', description: 'Сбор требований и схема основных страниц', unit: 'час', quantity: 8, unitPrice: 2800, type: 'FIXED', isSelected: true }),
    item({ id: 'landing-copy', title: 'Редактура текстов', description: 'Редактура материалов заказчика для сайта', unit: 'страница', quantity: 4, unitPrice: 3500, type: 'OPTIONAL', isSelected: true }),
  ],
};

const landingDesign: QuoteSection = {
  id: 'landing-design',
  title: 'Дизайн и запуск',
  items: [
    item({
      id: 'landing-design-choice', title: 'Дизайн-концепция и макеты', description: 'Выберите объём дизайн-проработки', unit: 'проект', quantity: 1, unitPrice: 42000, type: 'CHOICE', isSelected: true,
      choices: [
        { id: 'design-basic', label: 'Базовый', unitPrice: 42000 },
        { id: 'design-standard', label: 'Оптимальный', unitPrice: 68000 },
        { id: 'design-full', label: 'Расширенный', unitPrice: 94000 },
      ], selectedChoiceId: 'design-standard',
    }),
    item({ id: 'landing-launch', title: 'Публикация и проверка', description: 'Настройка домена и контроль запуска', unit: 'услуга', quantity: 1, unitPrice: 12000, type: 'FIXED', isSelected: true }),
    item({ id: 'landing-analytics', title: 'Настройка аналитики', description: 'Счётчики и базовые события', unit: 'услуга', quantity: 1, unitPrice: 9000, type: 'OPTIONAL', isSelected: false }),
  ],
};

export const seed: DatabaseState = {
  profile: {
    companyName: 'Студия «Север»',
    contactName: 'Анна Смирнова',
    email: 'hello@sever.studio',
    telegram: '@anna_sever',
    accentColor: '#2563eb',
    defaultCurrency: 'RUB',
  },
  clients: [
    { id: 'client-kofe', name: 'Мария Волкова', company: 'Кофейня «Тёплый берег»', email: 'maria@teplybereg.ru', telegram: '@mvolkova', notes: 'Новая сеть кофеен, запуск сайта к весне.' },
    { id: 'client-lumen', name: 'Илья Крылов', company: 'Lumen Architecture', email: 'ik@lumen.example', notes: 'Архитектурное бюро, портфолио и кейсы.' },
    { id: 'client-edu', name: 'Елена Морозова', company: 'Онлайн-школа «Практика»', email: 'elena@praktika.example', telegram: '@emorozova' },
    { id: 'client-market', name: 'Денис Беляев', company: '«Дом и сад»', email: 'denis@domsad.example', notes: 'Интернет-магазин товаров для дома.' },
  ],
  templates: [
    { id: 'template-discovery', category: 'Аналитика', title: 'Интервью и сбор требований', description: 'Уточнение целей, аудитории и сценариев', unit: 'час', defaultQuantity: 6, unitPrice: 2800, defaultType: 'FIXED' },
    { id: 'template-prototype', category: 'Дизайн', title: 'Интерактивный прототип', description: 'Прототип ключевых пользовательских сценариев', unit: 'экран', defaultQuantity: 5, unitPrice: 5000, defaultType: 'FIXED' },
    { id: 'template-design', category: 'Дизайн', title: 'Дизайн страницы сайта', unit: 'страница', defaultQuantity: 1, unitPrice: 14000, defaultType: 'FIXED' },
    { id: 'template-layout', category: 'Разработка', title: 'Адаптивная вёрстка', description: 'Вёрстка с поддержкой мобильных устройств', unit: 'страница', defaultQuantity: 1, unitPrice: 12000, defaultType: 'FIXED' },
    { id: 'template-cms', category: 'Разработка', title: 'Подключение CMS', description: 'Настройка системы управления контентом', unit: 'услуга', defaultQuantity: 1, unitPrice: 32000, defaultType: 'FIXED' },
    { id: 'template-integration', category: 'Интеграции', title: 'Интеграция CRM', description: 'Передача заявок и проверка сценариев', unit: 'интеграция', defaultQuantity: 1, unitPrice: 24000, defaultType: 'OPTIONAL' },
    { id: 'template-seo', category: 'Продвижение', title: 'Базовая SEO-настройка', unit: 'проект', defaultQuantity: 1, unitPrice: 18000, defaultType: 'OPTIONAL' },
    { id: 'template-support', category: 'Поддержка', title: 'Техническая поддержка', unit: 'месяц', defaultQuantity: 1, unitPrice: 15000, defaultType: 'OPTIONAL' },
  ],
  quotes: [
    quote({
      id: 'quote-teply-bereg', slug: 'teply-bereg-site', title: 'Сайт кофейни «Тёплый берег»', clientId: 'client-kofe', status: 'SENT', currency: 'RUB',
      validUntil: '2026-12-20', createdAt: '2026-11-12T09:00:00.000Z', updatedAt: '2026-11-18T15:30:00.000Z',
      sections: [landingSection, landingDesign], discountType: 'PERCENT', discountValue: 5,
      milestones: [
        { id: 'milestone-teply-1', title: 'Предоплата', percentage: 50, dueNote: 'После согласования сметы', isPaid: false },
        { id: 'milestone-teply-2', title: 'Перед публикацией', percentage: 50, dueNote: 'После приёмки работ', isPaid: false },
      ], comments: [
        { id: 'comment-teply-1', authorName: 'Анна Смирнова', authorRole: 'FREELANCER', text: 'Подготовила смету с тремя вариантами дизайна. Можно выбрать подходящий объём.', createdAt: '2026-11-18T15:30:00.000Z' },
      ],
    }),
    quote({
      id: 'quote-lumen', slug: 'lumen-portfolio', title: 'Портфолио архитектурного бюро', clientId: 'client-lumen', status: 'APPROVED', currency: 'EUR',
      validUntil: '2026-12-05', createdAt: '2026-10-28T10:00:00.000Z', updatedAt: '2026-11-03T12:20:00.000Z', approvedAt: '2026-11-03T12:20:00.000Z', approvedByName: 'Илья Крылов',
      sections: [
        { id: 'lumen-design', title: 'Дизайн', items: [item({ id: 'lumen-home', title: 'Дизайн главной страницы', unit: 'страница', quantity: 1, unitPrice: 950, type: 'FIXED', isSelected: true }), item({ id: 'lumen-case', title: 'Шаблон страницы проекта', unit: 'страница', quantity: 1, unitPrice: 600, type: 'FIXED', isSelected: true })] },
        { id: 'lumen-dev', title: 'Разработка', items: [item({ id: 'lumen-build', title: 'Сборка и адаптация сайта', unit: 'час', quantity: 24, unitPrice: 45, type: 'FIXED', isSelected: true })] },
      ], discountType: 'FIXED', discountValue: 100,
      milestones: [{ id: 'milestone-lumen-1', title: 'Старт проекта', percentage: 40, dueNote: 'Оплачено', isPaid: true }, { id: 'milestone-lumen-2', title: 'Завершение', percentage: 60, dueNote: 'После передачи проекта', isPaid: false }],
      comments: [
        { id: 'comment-lumen-1', authorName: 'Илья Крылов', authorRole: 'CLIENT', text: 'Согласовано, начинаем с главной страницы.', createdAt: '2026-11-03T12:20:00.000Z' },
        { id: 'comment-lumen-2', authorName: 'Система', authorRole: 'SYSTEM', text: 'Смета согласована клиентом.', createdAt: '2026-11-03T12:20:00.000Z' },
      ],
    }),
    quote({
      id: 'quote-praktika', slug: 'praktika-course', title: 'Лендинг курса «Практика»', clientId: 'client-edu', status: 'DRAFT', currency: 'BYN',
      createdAt: '2026-11-16T08:15:00.000Z', updatedAt: '2026-11-17T11:45:00.000Z',
      sections: [
        { id: 'praktika-content', title: 'Подготовка', items: [item({ id: 'praktika-structure', title: 'Структура лендинга', unit: 'услуга', quantity: 1, unitPrice: 600, type: 'FIXED', isSelected: true })] },
        { id: 'praktika-build', title: 'Разработка', items: [item({ id: 'praktika-layout', title: 'Вёрстка лендинга', unit: 'страница', quantity: 1, unitPrice: 1250, type: 'FIXED', isSelected: true })] },
      ], discountType: 'NONE', discountValue: 0,
      milestones: [{ id: 'milestone-praktika-1', title: 'Предоплата', percentage: 50, isPaid: false }, { id: 'milestone-praktika-2', title: 'После запуска', percentage: 50, isPaid: false }], comments: [],
    }),
  ],
};

export function createSeedState(): DatabaseState {
  return JSON.parse(JSON.stringify(seed)) as DatabaseState;
}
