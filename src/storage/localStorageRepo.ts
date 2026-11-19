import { createSeedState } from '../data/seed';
import type {
  Client,
  CompanyProfile,
  DatabaseState,
  PaymentMilestone,
  Quote,
  QuoteChoiceOption,
  QuoteComment,
  QuoteCommentRole,
  QuoteItem,
  QuoteItemType,
  QuoteRepository,
  QuoteSection,
  QuoteStatus,
  ServiceTemplate,
  Currency,
  DiscountType,
} from '../types/quote.types';

const STORAGE_KEY = 'quote-portal:database:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'string';
}

function hasFiniteNumber(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === 'number' && Number.isFinite(value[key]);
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}

const currencies: readonly Currency[] = ['USD', 'EUR', 'BYN', 'RUB'];
const statuses: readonly QuoteStatus[] = ['DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const discounts: readonly DiscountType[] = ['NONE', 'PERCENT', 'FIXED'];
const itemTypes: readonly QuoteItemType[] = ['FIXED', 'OPTIONAL', 'CHOICE'];
const commentRoles: readonly QuoteCommentRole[] = ['FREELANCER', 'CLIENT', 'SYSTEM'];

function fail(path: string): never {
  throw new Error(`Некорректный формат базы данных: поле «${path}» отсутствует или имеет неверный тип.`);
}

function validateChoice(value: unknown, path: string): value is QuoteChoiceOption {
  if (!isRecord(value) || !hasString(value, 'id') || !hasString(value, 'label') || !hasFiniteNumber(value, 'unitPrice')) fail(path);
  return true;
}

function validateItem(value: unknown, path: string): value is QuoteItem {
  if (!isRecord(value)) fail(path);
  for (const key of ['id', 'title', 'unit']) if (!hasString(value, key)) fail(`${path}.${key}`);
  for (const key of ['quantity', 'unitPrice']) if (!hasFiniteNumber(value, key)) fail(`${path}.${key}`);
  if (!isOneOf(value.type, itemTypes)) fail(`${path}.type`);
  if (typeof value.isSelected !== 'boolean') fail(`${path}.isSelected`);
  if (value.description !== undefined && typeof value.description !== 'string') fail(`${path}.description`);
  if (value.selectedChoiceId !== undefined && typeof value.selectedChoiceId !== 'string') fail(`${path}.selectedChoiceId`);
  if (value.choices !== undefined) {
    if (!Array.isArray(value.choices)) fail(`${path}.choices`);
    value.choices.forEach((choice, index) => validateChoice(choice, `${path}.choices[${index}]`));
  }
  return true;
}

function validateSection(value: unknown, path: string): value is QuoteSection {
  if (!isRecord(value) || !hasString(value, 'id') || !hasString(value, 'title') || !Array.isArray(value.items)) fail(path);
  if (value.description !== undefined && typeof value.description !== 'string') fail(`${path}.description`);
  value.items.forEach((itemValue, index) => validateItem(itemValue, `${path}.items[${index}]`));
  return true;
}

function validateMilestone(value: unknown, path: string): value is PaymentMilestone {
  if (!isRecord(value) || !hasString(value, 'id') || !hasString(value, 'title') || !hasFiniteNumber(value, 'percentage') || typeof value.isPaid !== 'boolean') fail(path);
  if (value.dueNote !== undefined && typeof value.dueNote !== 'string') fail(`${path}.dueNote`);
  return true;
}

function validateComment(value: unknown, path: string): value is QuoteComment {
  if (!isRecord(value) || !hasString(value, 'id') || !hasString(value, 'authorName') || !hasString(value, 'text') || !hasString(value, 'createdAt')) fail(path);
  if (!isOneOf(value.authorRole, commentRoles)) fail(`${path}.authorRole`);
  return true;
}

function validateQuote(value: unknown, path: string): value is Quote {
  if (!isRecord(value)) fail(path);
  for (const key of ['id', 'slug', 'title', 'clientId', 'createdAt', 'updatedAt']) if (!hasString(value, key)) fail(`${path}.${key}`);
  if (!isOneOf(value.status, statuses)) fail(`${path}.status`);
  if (!isOneOf(value.currency, currencies)) fail(`${path}.currency`);
  if (!isOneOf(value.discountType, discounts)) fail(`${path}.discountType`);
  if (!hasFiniteNumber(value, 'discountValue')) fail(`${path}.discountValue`);
  for (const key of ['validUntil', 'approvedAt', 'approvedByName']) if (value[key] !== undefined && typeof value[key] !== 'string') fail(`${path}.${key}`);
  if (!Array.isArray(value.sections) || !Array.isArray(value.milestones) || !Array.isArray(value.comments)) fail(`${path}.sections/milestones/comments`);
  value.sections.forEach((section, index) => validateSection(section, `${path}.sections[${index}]`));
  value.milestones.forEach((milestone, index) => validateMilestone(milestone, `${path}.milestones[${index}]`));
  value.comments.forEach((comment, index) => validateComment(comment, `${path}.comments[${index}]`));
  return true;
}

function validateClient(value: unknown, path: string): value is Client {
  if (!isRecord(value) || !hasString(value, 'id') || !hasString(value, 'name')) fail(path);
  for (const key of ['company', 'email', 'telegram', 'notes']) if (value[key] !== undefined && typeof value[key] !== 'string') fail(`${path}.${key}`);
  return true;
}

function validateTemplate(value: unknown, path: string): value is ServiceTemplate {
  if (!isRecord(value)) fail(path);
  for (const key of ['id', 'category', 'title', 'unit']) if (!hasString(value, key)) fail(`${path}.${key}`);
  for (const key of ['defaultQuantity', 'unitPrice']) if (!hasFiniteNumber(value, key)) fail(`${path}.${key}`);
  if (!isOneOf(value.defaultType, itemTypes)) fail(`${path}.defaultType`);
  if (value.description !== undefined && typeof value.description !== 'string') fail(`${path}.description`);
  return true;
}

function validateDatabaseState(value: unknown): asserts value is DatabaseState {
  if (!isRecord(value) || !isRecord(value.profile)) fail('profile');
  const profile = value.profile;
  if (!hasString(profile, 'companyName') || !hasString(profile, 'contactName') || !hasString(profile, 'accentColor')) fail('profile');
  if (!isOneOf(profile.defaultCurrency, currencies)) fail('profile.defaultCurrency');
  for (const key of ['email', 'telegram']) if (profile[key] !== undefined && typeof profile[key] !== 'string') fail(`profile.${key}`);
  if (!Array.isArray(value.clients) || !Array.isArray(value.templates) || !Array.isArray(value.quotes)) fail('clients/templates/quotes');
  value.clients.forEach((client, index) => validateClient(client, `clients[${index}]`));
  value.templates.forEach((template, index) => validateTemplate(template, `templates[${index}]`));
  value.quotes.forEach((quoteValue, index) => validateQuote(quoteValue, `quotes[${index}]`));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createId(prefix: string): string {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function getBrowserStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export class LocalStorageQuoteRepository implements QuoteRepository {
  private memoryState: DatabaseState;
  private readonly storage: Storage | null;

  constructor(storage: Storage | null = getBrowserStorage()) {
    this.storage = storage;
    const storedValue = this.storage?.getItem(STORAGE_KEY);
    if (storedValue === null || storedValue === undefined) {
      this.memoryState = createSeedState();
      this.persist();
    } else {
      try {
        const parsed: unknown = JSON.parse(storedValue);
        validateDatabaseState(parsed);
        this.memoryState = clone(parsed);
      } catch {
        this.memoryState = createSeedState();
        this.persist();
      }
    }
  }

  getState(): DatabaseState {
    return clone(this.memoryState);
  }

  saveQuote(quote: Quote): Quote {
    const value = clone(quote);
    const index = this.memoryState.quotes.findIndex((existing) => existing.id === value.id);
    if (index < 0) this.memoryState.quotes.push(value);
    else this.memoryState.quotes[index] = value;
    this.persist();
    return clone(value);
  }

  deleteQuote(quoteId: string): void {
    this.memoryState.quotes = this.memoryState.quotes.filter((quote) => quote.id !== quoteId);
    this.persist();
  }

  saveClient(client: Client): Client {
    const value = clone(client);
    const index = this.memoryState.clients.findIndex((existing) => existing.id === value.id);
    if (index < 0) this.memoryState.clients.push(value);
    else this.memoryState.clients[index] = value;
    this.persist();
    return clone(value);
  }

  deleteClient(clientId: string): void {
    this.memoryState.clients = this.memoryState.clients.filter((client) => client.id !== clientId);
    this.persist();
  }

  saveTemplate(template: ServiceTemplate): ServiceTemplate {
    const value = clone(template);
    const index = this.memoryState.templates.findIndex((existing) => existing.id === value.id);
    if (index < 0) this.memoryState.templates.push(value);
    else this.memoryState.templates[index] = value;
    this.persist();
    return clone(value);
  }

  deleteTemplate(templateId: string): void {
    this.memoryState.templates = this.memoryState.templates.filter((template) => template.id !== templateId);
    this.persist();
  }

  updateProfile(profile: CompanyProfile): CompanyProfile {
    this.memoryState.profile = clone(profile);
    this.persist();
    return clone(profile);
  }

  addComment(quoteId: string, comment: Omit<QuoteComment, 'id' | 'createdAt'>): Quote | null {
    const quote = this.memoryState.quotes.find((entry) => entry.id === quoteId);
    if (!quote) return null;
    quote.comments.push({ ...clone(comment), id: createId('comment'), createdAt: new Date().toISOString() });
    quote.updatedAt = new Date().toISOString();
    this.persist();
    return clone(quote);
  }

  approveQuote(quoteId: string, clientName: string): Quote | null {
    const quote = this.memoryState.quotes.find((entry) => entry.id === quoteId);
    const approver = clientName.trim();
    if (!quote || !approver) return null;
    const now = new Date().toISOString();
    quote.status = 'APPROVED';
    quote.approvedAt = now;
    quote.approvedByName = approver;
    quote.updatedAt = now;
    quote.comments.push({ id: createId('comment'), authorName: 'Система', authorRole: 'SYSTEM', text: `Смета согласована: ${approver}.`, createdAt: now });
    this.persist();
    return clone(quote);
  }

  markQuoteViewed(slug: string): Quote | null {
    const quote = this.memoryState.quotes.find((entry) => entry.slug === slug);
    if (!quote) return null;
    if (quote.status === 'SENT') {
      const now = new Date().toISOString();
      quote.status = 'VIEWED';
      quote.updatedAt = now;
      quote.comments.push({ id: createId('comment'), authorName: 'Система', authorRole: 'SYSTEM', text: 'Клиент открыл смету.', createdAt: now });
      this.persist();
    }
    return clone(quote);
  }

  resetToSeed(): DatabaseState {
    this.memoryState = createSeedState();
    this.persist();
    return this.getState();
  }

  exportJson(): string {
    return JSON.stringify(this.memoryState, null, 2);
  }

  importJson(rawJson: string): DatabaseState {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson) as unknown;
    } catch {
      throw new Error('Не удалось импортировать базу: файл содержит некорректный JSON. Проверьте файл и попробуйте снова.');
    }
    try {
      validateDatabaseState(parsed);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'структура данных не соответствует приложению';
      throw new Error(`Не удалось импортировать базу: ${detail}`);
    }
    this.memoryState = clone(parsed);
    this.persist();
    return this.getState();
  }

  private persist(): void {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.memoryState));
  }
}

export const quoteRepository: QuoteRepository = new LocalStorageQuoteRepository();
