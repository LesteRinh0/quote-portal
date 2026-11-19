import type { Quote } from '../../types/quote.types';
import { calculateItemTotal, formatMoney } from '../../utils/calcQuote';

interface QuoteItemsListProps {
  quote: Quote;
  locked: boolean;
  onChange: (quote: Quote) => void;
}

export default function QuoteItemsList({ quote, locked, onChange }: QuoteItemsListProps) {
  const updateItem = (sectionId: string, itemId: string, patch: { isSelected?: boolean; selectedChoiceId?: string }) => {
    if (locked) return;
    onChange({
      ...quote,
      updatedAt: new Date().toISOString(),
      sections: quote.sections.map((section) => section.id !== sectionId ? section : {
        ...section,
        items: section.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
      }),
    });
  };

  return <div className="space-y-5 print:space-y-4">
    {quote.sections.map((section, sectionIndex) => <section key={section.id} className="portal-card overflow-hidden print:break-inside-avoid">
      <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">Раздел {sectionIndex + 1}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{section.title}</h2>{section.description && <p className="mt-1 text-sm text-slate-500">{section.description}</p>}</div>
      <div className="divide-y divide-slate-100">{section.items.map((item) => {
        const total = calculateItemTotal(item);
        return <article key={item.id} className={`px-5 py-4 ${item.type === 'OPTIONAL' && !item.isSelected ? 'bg-slate-50/50' : ''}`}>
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex items-center gap-2">{item.type === 'OPTIONAL' && <input className="portal-checkbox no-print" aria-label={`Включить опцию: ${item.title}`} type="checkbox" checked={item.isSelected} disabled={locked} onChange={(event) => updateItem(section.id, item.id, { isSelected: event.target.checked })} />}<h3 className="font-semibold text-slate-800">{item.title}</h3>{item.type === 'OPTIONAL' && <span className="print-inline-tag">Опция</span>}</div>{item.description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{item.description}</p>}</div><div className="shrink-0 text-left sm:text-right"><p className="text-sm font-bold tabular-nums text-slate-900">{item.type === 'OPTIONAL' && !item.isSelected ? 'Не включено' : formatMoney(total, quote.currency)}</p><p className="mt-1 text-xs text-slate-400">{item.quantity} {item.unit}{item.type !== 'CHOICE' && ` × ${formatMoney(item.unitPrice, quote.currency)}`}</p></div></div>
          {item.type === 'CHOICE' && <fieldset className="mt-4 grid gap-2 sm:grid-cols-3" disabled={locked}><legend className="sr-only">Выберите вариант для «{item.title}»</legend>{(item.choices ?? []).map((choice) => <label key={choice.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-3 transition print:cursor-default ${item.selectedChoiceId === choice.id ? 'border-blue-300 bg-blue-50/70 ring-1 ring-blue-100 print:border-slate-300 print:bg-white print:ring-0' : 'border-slate-200 bg-white hover:border-slate-300'} ${locked ? 'cursor-not-allowed opacity-70' : ''}`}><input className="portal-radio no-print" type="radio" name={`${quote.id}-${item.id}`} value={choice.id} checked={item.selectedChoiceId === choice.id} disabled={locked} onChange={() => updateItem(section.id, item.id, { selectedChoiceId: choice.id })} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-700">{choice.label}{item.selectedChoiceId === choice.id && <span className="print:inline hidden"> · выбрано</span>}</span><span className="mt-1 block text-sm font-bold text-slate-900">{formatMoney(item.quantity * choice.unitPrice, quote.currency)}</span><span className="mt-0.5 block text-[11px] text-slate-400">{formatMoney(choice.unitPrice, quote.currency)} за {item.unit}</span></span></label>)}</fieldset>}
        </article>;
      })}</div>
    </section>)}
  </div>;
}
