export type Currency = 'USD' | 'EUR' | 'BYN' | 'RUB';

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED';

export type DiscountType = 'NONE' | 'PERCENT' | 'FIXED';
export type QuoteItemType = 'FIXED' | 'OPTIONAL' | 'CHOICE';

export interface QuoteChoiceOption {
  id: string;
  label: string;
  unitPrice: number;
}

export interface QuoteItem {
  id: string;
  title: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  type: QuoteItemType;
  isSelected: boolean;
  choices?: QuoteChoiceOption[];
  selectedChoiceId?: string;
}

export interface QuoteSection {
  id: string;
  title: string;
  description?: string;
  items: QuoteItem[];
}

export interface PaymentMilestone {
  id: string;
  title: string;
  percentage: number;
  dueNote?: string;
  isPaid: boolean;
}

export type QuoteCommentRole = 'FREELANCER' | 'CLIENT' | 'SYSTEM';

export interface QuoteComment {
  id: string;
  authorName: string;
  authorRole: QuoteCommentRole;
  text: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  slug: string;
  title: string;
  clientId: string;
  status: QuoteStatus;
  currency: Currency;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedByName?: string;
  sections: QuoteSection[];
  discountType: DiscountType;
  discountValue: number;
  milestones: PaymentMilestone[];
  comments: QuoteComment[];
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  telegram?: string;
  notes?: string;
}

export interface ServiceTemplate {
  id: string;
  category: string;
  title: string;
  description?: string;
  unit: string;
  defaultQuantity: number;
  unitPrice: number;
  defaultType: QuoteItemType;
}

export interface CompanyProfile {
  companyName: string;
  contactName: string;
  email?: string;
  telegram?: string;
  accentColor: string;
  defaultCurrency: Currency;
}

export interface DatabaseState {
  profile: CompanyProfile;
  clients: Client[];
  templates: ServiceTemplate[];
  quotes: Quote[];
}

export interface QuoteRepository {
  getState(): DatabaseState;
  saveQuote(quote: Quote): Quote;
  deleteQuote(quoteId: string): void;
  saveClient(client: Client): Client;
  deleteClient(clientId: string): void;
  saveTemplate(template: ServiceTemplate): ServiceTemplate;
  deleteTemplate(templateId: string): void;
  updateProfile(profile: CompanyProfile): CompanyProfile;
  addComment(
    quoteId: string,
    comment: Omit<QuoteComment, 'id' | 'createdAt'>,
  ): Quote | null;
  approveQuote(quoteId: string, clientName: string): Quote | null;
  markQuoteViewed(slug: string): Quote | null;
  resetToSeed(): DatabaseState;
  exportJson(): string;
  importJson(rawJson: string): DatabaseState;
}
