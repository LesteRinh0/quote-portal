import type { QuoteItem, QuoteSection } from '../types/quote.types';

type TaskKind = 'design' | 'development' | 'layout' | 'integration' | 'seo' | 'analytics' | 'support';

interface TaskDefinition {
  kind: TaskKind;
  keywords: string[];
  title: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
}

const taskDefinitions: TaskDefinition[] = [
  {
    kind: 'design', keywords: ['дизайн', 'макет', 'figma', 'интерфейс', 'ux', 'ui'],
    title: 'Дизайн интерфейса', description: 'Проработка визуальной системы и ключевых экранов', unit: 'экран', quantity: 5, price: 9000,
  },
  {
    kind: 'development', keywords: ['разработ', 'сайт', 'приложен', 'личный кабинет', 'frontend', 'фронтенд'],
    title: 'Разработка функциональности', description: 'Реализация страниц и пользовательских сценариев', unit: 'час', quantity: 40, price: 2500,
  },
  {
    kind: 'layout', keywords: ['верст', 'адаптив', 'html', 'css', 'лендинг'],
    title: 'Адаптивная вёрстка', description: 'Вёрстка для мобильных устройств и компьютеров', unit: 'страница', quantity: 4, price: 12000,
  },
  {
    kind: 'integration', keywords: ['интеграц', 'api', 'платёж', 'оплат', 'crm', 'подключ'],
    title: 'Интеграция сервисов', description: 'Подключение внешнего сервиса и проверка обмена данными', unit: 'интеграция', quantity: 1, price: 28000,
  },
  {
    kind: 'seo', keywords: ['seo', 'поисков', 'продвижен', 'мета-тег', 'метатег'],
    title: 'Базовая SEO-настройка', description: 'Метаданные, индексация и техническая проверка', unit: 'проект', quantity: 1, price: 18000,
  },
  {
    kind: 'analytics', keywords: ['аналитик', 'метрик', 'счётчик', 'счетчик', 'событи'],
    title: 'Настройка аналитики', description: 'Счётчики и отслеживание ключевых событий', unit: 'сервис', quantity: 1, price: 12000,
  },
  {
    kind: 'support', keywords: ['поддерж', 'сопровожд', 'обслужив', 'обновлен'],
    title: 'Техническая поддержка', description: 'Плановое обслуживание и консультации', unit: 'месяц', quantity: 1, price: 15000,
  },
];

const makeItem = (
  id: string,
  title: string,
  description: string,
  unit: string,
  quantity: number,
  unitPrice: number,
  type: QuoteItem['type'] = 'FIXED',
): QuoteItem => ({ id, title, description, unit, quantity, unitPrice, type, isSelected: type !== 'OPTIONAL' });

/** Builds an editable, offline quote draft from Russian or English brief keywords. */
export function generateSectionsFromBrief(briefText: string): QuoteSection[] {
  const normalizedBrief = briefText.trim().toLocaleLowerCase('ru-RU');
  const matchedTasks = taskDefinitions.filter((task) =>
    task.keywords.some((keyword) => normalizedBrief.includes(keyword)),
  );
  const selectedTasks = (matchedTasks.length > 0 ? matchedTasks : taskDefinitions.slice(0, 3)).slice(0, 3);
  const sections: QuoteSection[] = selectedTasks.map((task) => ({
    id: `brief-section-${task.kind}`,
    title: task.title,
    description: task.description,
    items: [makeItem(`brief-item-${task.kind}`, task.title, task.description, task.unit, task.quantity, task.price)],
  }));

  sections.push({
    id: 'brief-section-extras',
    title: 'Дополнительные работы',
    description: 'Опции, которые можно включить в смету по желанию клиента',
    items: [
      makeItem('brief-item-seo-extra', 'Дополнительная SEO-оптимизация', 'Расширенная проработка поисковой видимости', 'час', 6, 2500, 'OPTIONAL'),
      makeItem('brief-item-support-extra', 'Сопровождение после запуска', 'Поддержка проекта в первый месяц', 'месяц', 1, 15000, 'OPTIONAL'),
    ],
  });

  return sections.slice(0, 4);
}
