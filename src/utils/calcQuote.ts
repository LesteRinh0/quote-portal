import type {
  Currency,
  DiscountType,
  PaymentMilestone,
  Quote,
  QuoteItem,
} from '../types/quote.types';

export interface CalculatedPaymentMilestone extends PaymentMilestone {
  amount: number;
}

export interface MilestoneCalculation {
  milestones: CalculatedPaymentMilestone[];
  totalPercentage: number;
  isBalanced: boolean;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Math.sign(amount) * Number.EPSILON) * 100) / 100;
}

export function calculateItemTotal(item: QuoteItem): number {
  const base = item.quantity * item.unitPrice;

  switch (item.type) {
    case 'FIXED':
      return base;
    case 'OPTIONAL':
      return item.isSelected ? base : 0;
    case 'CHOICE': {
      const selectedChoice = item.choices?.find(
        (choice) => choice.id === item.selectedChoiceId,
      );
      return item.quantity * (selectedChoice?.unitPrice ?? item.unitPrice);
    }
  }
}

export function calculateSubtotal(quote: Quote): number {
  return quote.sections.reduce(
    (sectionTotal, section) =>
      sectionTotal +
      section.items.reduce((itemTotal, item) => itemTotal + calculateItemTotal(item), 0),
    0,
  );
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const base = Math.max(0, Number.isFinite(subtotal) ? subtotal : 0);
  switch (discountType) {
    case 'NONE':
      return 0;
    case 'PERCENT':
      return roundMoney((base * clamp(discountValue, 0, 100)) / 100);
    case 'FIXED':
      return roundMoney(clamp(discountValue, 0, base));
  }
}

export function calculateTotal(quote: Quote): number {
  const subtotal = calculateSubtotal(quote);
  return roundMoney(
    Math.max(0, subtotal - calculateDiscountAmount(subtotal, quote.discountType, quote.discountValue)),
  );
}

export function calculateMilestones(
  total: number,
  milestones: PaymentMilestone[],
): MilestoneCalculation {
  const calculatedMilestones = milestones.map((milestone) => ({
    ...milestone,
    amount: roundMoney((Math.max(0, Number.isFinite(total) ? total : 0) * clamp(milestone.percentage, 0, 100)) / 100),
  }));
  const totalPercentage = roundMoney(
    milestones.reduce((sum, milestone) => sum + clamp(milestone.percentage, 0, 100), 0),
  );

  return {
    milestones: calculatedMilestones,
    totalPercentage,
    isBalanced: Math.abs(totalPercentage - 100) < 0.01,
  };
}

export function formatMoney(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}
