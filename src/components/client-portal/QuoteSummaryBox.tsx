import { useState, type FormEvent } from 'react';
import type { Quote } from '../../types/quote.types';
import { calculateDiscountAmount, calculateMilestones, calculateSubtotal, calculateTotal, formatMoney } from '../../utils/calcQuote';

interface QuoteSummaryBoxProps {
  quote: Quote;
  locked: boolean;
  onApprove: (clientName: string) => void;
}

export default function QuoteSummaryBox({ quote, locked, onApprove }: QuoteSummaryBoxProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [error, setError] = useState('');
  const subtotal = calculateSubtotal(quote);
  const discount = calculateDiscountAmount(subtotal, quote.discountType, quote.discountValue);
  const total = calculateTotal(quote);
  const milestones = calculateMilestones(total, quote.milestones);

  const approve = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = clientName.trim();
    if (!name) {
      setError('Введите имя, чтобы подтвердить согласование.');
      return;
    }
    onApprove(name);
    setIsModalOpen(false);
  };

  return <>
    <aside className="space-y-4 xl:sticky xl:top-6 print:static">
      <section className="portal-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">Итог предложения</p><h2 className="mt-1 text-lg font-bold text-slate-900">Стоимость проекта</h2></div>
        <div className="space-y-3 px-5 py-4 text-sm"><div className="flex justify-between gap-3 text-slate-500"><span>Подытог</span><span className="tabular-nums">{formatMoney(subtotal, quote.currency)}</span></div>{discount > 0 && <div className="flex justify-between gap-3 text-emerald-700"><span>Скидка{quote.discountType === 'PERCENT' ? ` · ${quote.discountValue}%` : ''}</span><span className="tabular-nums">−{formatMoney(discount, quote.currency)}</span></div>}<div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3"><span className="font-semibold text-slate-700">Итого</span><span className="text-2xl font-bold tracking-tight text-slate-950">{formatMoney(total, quote.currency)}</span></div></div>
        {quote.milestones.length > 0 && <div className="border-t border-slate-100 px-5 py-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-800">Этапы оплаты</h3><span className={`text-xs font-bold ${milestones.isBalanced ? 'text-emerald-700' : 'text-amber-700'}`}>{milestones.totalPercentage}%</span></div><div className="space-y-3">{milestones.milestones.map((milestone, index) => <div key={milestone.id} className="flex gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${milestone.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{milestone.isPaid ? '✓' : index + 1}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-slate-700">{milestone.title}</p><p className="shrink-0 text-xs font-bold tabular-nums text-slate-800">{formatMoney(milestone.amount, quote.currency)}</p></div><p className="mt-1 text-[11px] text-slate-400">{milestone.percentage}%{milestone.dueNote ? ` · ${milestone.dueNote}` : ''}{milestone.isPaid ? ' · Оплачено' : ''}</p></div></div>)}</div>{!milestones.isBalanced && <p className="mt-3 text-[11px] leading-5 text-amber-700">Проценты этапов сейчас составляют {milestones.totalPercentage}%.</p>}</div>}
        <div className="space-y-2 border-t border-slate-100 bg-slate-50/60 p-4 no-print">{locked ? <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-center text-xs font-semibold text-emerald-800">Смета согласована{quote.approvedByName ? ` · ${quote.approvedByName}` : ''}</div> : <button type="button" className="button-primary w-full" onClick={() => { setError(''); setIsModalOpen(true); }}>✓ Согласовать смету</button>}<button type="button" className="button-secondary w-full" onClick={() => window.print()}>▧ Скачать / Распечатать PDF</button></div>
      </section>
    </aside>
    {isModalOpen && <div className="modal-backdrop no-print" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsModalOpen(false); }}><form className="modal-card max-w-md" role="dialog" aria-modal="true" aria-labelledby="approve-title" onSubmit={approve}><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Подтверждение</p><h2 id="approve-title" className="mt-1 text-xl font-bold text-slate-900">Согласовать смету?</h2></div><button type="button" className="table-action" aria-label="Закрыть" onClick={() => setIsModalOpen(false)}>×</button></div><p className="mb-4 text-sm leading-6 text-slate-500">Подтверждая смету, вы фиксируете согласованный объём работ и выбранные опции.</p><label className="form-label">Ваше имя<input className="field" autoFocus required value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Имя и фамилия" /></label>{error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={() => setIsModalOpen(false)}>Отмена</button><button type="submit" className="button-primary">Подтвердить</button></div></form></div>}
  </>;
}
