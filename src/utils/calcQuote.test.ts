import { describe, expect, it } from 'vitest';
import type { PaymentMilestone, Quote, QuoteItem } from '../types/quote.types';
import {
  calculateDiscountAmount,
  calculateItemTotal,
  calculateMilestones,
  calculateSubtotal,
  calculateTotal,
  formatMoney,
  roundMoney,
} from './calcQuote';

const item = (overrides: Partial<QuoteItem> & Pick<QuoteItem, 'type'>): QuoteItem => ({
  id: 'item-1',
  title: 'Работа',
  unit: 'услуга',
  quantity: 2,
  unitPrice: 125,
  isSelected: true,
  ...overrides,
});

const quote = (overrides: Partial<Quote> = {}): Quote => ({
  id: 'quote-1',
  slug: 'quote-1',
  title: 'Смета',
  clientId: 'client-1',
  status: 'DRAFT',
  currency: 'RUB',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sections: [],
  discountType: 'NONE',
  discountValue: 0,
  milestones: [],
  comments: [],
  ...overrides,
});

const milestone = (id: string, percentage: number): PaymentMilestone => ({
  id,
  title: id,
  percentage,
  isPaid: false,
});

describe('calculateItemTotal', () => {
  it('always includes FIXED items', () => {
    expect(calculateItemTotal(item({ type: 'FIXED', isSelected: false }))).toBe(250);
  });

  it('includes OPTIONAL items only when selected', () => {
    expect(calculateItemTotal(item({ type: 'OPTIONAL', isSelected: true }))).toBe(250);
    expect(calculateItemTotal(item({ type: 'OPTIONAL', isSelected: false }))).toBe(0);
  });

  it('uses the selected CHOICE price and falls back when it is missing', () => {
    const choices = [
      { id: 'basic', label: 'Базовый', unitPrice: 80 },
      { id: 'pro', label: 'Расширенный', unitPrice: 175 },
    ];
    expect(calculateItemTotal(item({ type: 'CHOICE', choices, selectedChoiceId: 'pro' }))).toBe(350);
    expect(calculateItemTotal(item({ type: 'CHOICE', choices, selectedChoiceId: 'unknown' }))).toBe(250);
    expect(calculateItemTotal(item({ type: 'CHOICE', choices: [], selectedChoiceId: 'pro' }))).toBe(250);
  });

  it('handles zero quantity and zero price', () => {
    expect(calculateItemTotal(item({ type: 'FIXED', quantity: 0 }))).toBe(0);
    expect(calculateItemTotal(item({ type: 'FIXED', unitPrice: 0 }))).toBe(0);
  });
});

describe('quote totals and discounts', () => {
  it('sums all items in all sections', () => {
    const value = quote({ sections: [
      { id: 's1', title: 'Первый', items: [item({ type: 'FIXED' }), item({ type: 'OPTIONAL', isSelected: false })] },
      { id: 's2', title: 'Второй', items: [item({ type: 'CHOICE', quantity: 1, unitPrice: 30 })] },
    ] });
    expect(calculateSubtotal(value)).toBe(280);
  });

  it('calculates NONE, percent and fixed discounts with boundaries', () => {
    expect(calculateDiscountAmount(1000, 'NONE', 80)).toBe(0);
    expect(calculateDiscountAmount(1000, 'PERCENT', 15)).toBe(150);
    expect(calculateDiscountAmount(1000, 'PERCENT', -10)).toBe(0);
    expect(calculateDiscountAmount(1000, 'PERCENT', 150)).toBe(1000);
    expect(calculateDiscountAmount(1000, 'FIXED', 250)).toBe(250);
    expect(calculateDiscountAmount(1000, 'FIXED', -1)).toBe(0);
    expect(calculateDiscountAmount(1000, 'FIXED', 1500)).toBe(1000);
    expect(calculateDiscountAmount(0, 'FIXED', 20)).toBe(0);
    expect(calculateDiscountAmount(-100, 'PERCENT', 50)).toBe(0);
  });

  it('rounds the final total and never returns a negative amount', () => {
    const value = quote({
      sections: [{ id: 's1', title: 'Раздел', items: [item({ type: 'FIXED', quantity: 1, unitPrice: 99.999 })] }],
      discountType: 'PERCENT',
      discountValue: 10,
    });
    expect(calculateTotal(value)).toBe(90);
    expect(calculateTotal(quote({ discountType: 'FIXED', discountValue: 99, sections: [
      { id: 's1', title: 'Раздел', items: [item({ type: 'FIXED', quantity: 1, unitPrice: 10 })] },
    ] }))).toBe(0);
  });
});

describe('payment milestones and money formatting', () => {
  it('rounds milestone amounts, sums percentages, and reports balance', () => {
    const balanced = calculateMilestones(100.01, [milestone('deposit', 50), milestone('final', 50)]);
    expect(balanced.milestones.map(({ amount }) => amount)).toEqual([50.01, 50.01]);
    expect(balanced.totalPercentage).toBe(100);
    expect(balanced.isBalanced).toBe(true);

    const unbalanced = calculateMilestones(100, [milestone('deposit', 40)]);
    expect(unbalanced.milestones[0]?.amount).toBe(40);
    expect(unbalanced.totalPercentage).toBe(40);
    expect(unbalanced.isBalanced).toBe(false);
  });

  it('handles empty milestones and clamps invalid percentages', () => {
    expect(calculateMilestones(100, []).isBalanced).toBe(false);
    const result = calculateMilestones(100, [milestone('too-large', 120), milestone('negative', -10)]);
    expect(result.milestones.map(({ amount }) => amount)).toEqual([100, 0]);
    expect(result.totalPercentage).toBe(100);
    expect(result.isBalanced).toBe(true);
  });

  it('formats supported currencies and rounds money', () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(formatMoney(1234.5, 'RUB')).toContain('1 234,50');
    expect(formatMoney(10, 'USD')).toContain('$');
    expect(formatMoney(Number.NaN, 'EUR')).toContain('0,00');
  });
});
