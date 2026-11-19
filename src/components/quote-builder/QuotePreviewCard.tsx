import type { Quote } from '../../types/quote.types';
import { calculateDiscountAmount, calculateMilestones, calculateSubtotal, calculateTotal, formatMoney } from '../../utils/calcQuote';

interface QuotePreviewCardProps {
  quote: Quote;
  clientName: string;
  onSave: () => void;
  isSaved: boolean;
  saveLabel?: string;
  onCopyLink: () => void;
  copyLabel: string;
}

export default function QuotePreviewCard({ quote, clientName, onSave, isSaved, saveLabel = 'Сохранить смету', onCopyLink, copyLabel }: QuotePreviewCardProps) {
  const subtotal = calculateSubtotal(quote);
  const discount = calculateDiscountAmount(subtotal, quote.discountType, quote.discountValue);
  const total = calculateTotal(quote);
  const milestones = calculateMilestones(total, quote.milestones);

  return <aside className="space-y-4 lg:sticky lg:top-[96px]">
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4"><div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-blue-700">Предпросмотр</p><h2 className="mt-1 text-base font-bold text-slate-900">{quote.title || 'Новая смета'}</h2></div><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">◉</span></div><p className="mt-1 text-xs text-slate-500">Для {clientName || 'вашего клиента'}</p></div>
      <div className="max-h-[52vh] space-y-4 overflow-y-auto px-5 py-4">
        {quote.sections.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">Добавьте раздел, чтобы увидеть его здесь.</p> : quote.sections.map((section) => <div key={section.id}><p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">{section.title || 'Раздел без названия'}</p><div className="space-y-2">{section.items.map((item) => {
          const choice = item.choices?.find((entry) => entry.id === item.selectedChoiceId);
          const active = item.type !== 'OPTIONAL' || item.isSelected;
          const lineTotal = item.quantity * (item.type === 'CHOICE' ? choice?.unitPrice ?? item.unitPrice : item.unitPrice);
          return <div key={item.id} className={`flex items-start justify-between gap-2 text-xs ${active ? '' : 'opacity-45'}`}><div className="min-w-0"><p className="truncate font-medium text-slate-700">{item.title || 'Новая позиция'}</p><p className="mt-0.5 text-[11px] text-slate-400">{item.quantity} {item.unit}{choice ? ` · ${choice.label}` : item.type === 'OPTIONAL' ? ' · опция' : ''}</p></div><span className="shrink-0 font-semibold tabular-nums text-slate-700">{active ? formatMoney(lineTotal, quote.currency) : '—'}</span></div>;
        })}</div></div>)}
      </div>
      <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4"><div className="space-y-2 text-xs"><div className="flex justify-between text-slate-500"><span>Подытог</span><span>{formatMoney(subtotal, quote.currency)}</span></div>{discount > 0 && <div className="flex justify-between text-emerald-700"><span>Скидка</span><span>−{formatMoney(discount, quote.currency)}</span></div>}<div className="flex items-end justify-between border-t border-slate-200 pt-3"><span className="font-semibold text-slate-700">Итого</span><span className="text-xl font-bold tracking-tight text-slate-950">{formatMoney(total, quote.currency)}</span></div></div>
        {quote.milestones.length > 0 && <div className="mt-4 border-t border-slate-200 pt-3"><div className="mb-2 flex justify-between"><p className="text-xs font-semibold text-slate-700">Этапы оплаты</p><span className={`text-[11px] font-semibold ${milestones.isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>{milestones.totalPercentage}%</span></div><div className="space-y-1.5">{milestones.milestones.map((milestone) => <div key={milestone.id} className="flex justify-between gap-2 text-[11px] text-slate-500"><span className="truncate">{milestone.title} · {milestone.percentage}%</span><span className="shrink-0 font-medium text-slate-700">{formatMoney(milestone.amount, quote.currency)}</span></div>)}</div></div>}
      </div>
      <div className="space-y-2 p-4"><button type="button" onClick={onSave} className="button-primary w-full">{isSaved ? '✓ Смета сохранена' : saveLabel}</button><button type="button" onClick={onCopyLink} className="button-secondary w-full">⧉ {copyLabel}</button><p className="text-center text-[10px] text-slate-400">Изменения сохраняются в браузере</p></div>
    </section>
  </aside>;
}
