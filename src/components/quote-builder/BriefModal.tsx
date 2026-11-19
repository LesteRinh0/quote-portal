import { useMemo, useState } from 'react';
import { generateSectionsFromBrief } from '../../utils/briefGenerator';
import type { QuoteSection } from '../../types/quote.types';

interface BriefModalProps {
  onClose: () => void;
  onInsert: (sections: QuoteSection[]) => void;
}

export default function BriefModal({ onClose, onInsert }: BriefModalProps) {
  const [brief, setBrief] = useState('');
  const generated = useMemo(() => brief.trim() ? generateSectionsFromBrief(brief) : [], [brief]);
  const optionalCount = generated.flatMap((section) => section.items).filter((item) => item.type === 'OPTIONAL').length;

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="modal-card max-w-3xl" role="dialog" aria-modal="true" aria-labelledby="brief-modal-title">
      <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Локальная генерация</p><h2 id="brief-modal-title" className="mt-1 text-xl font-bold text-slate-900">Черновик из брифа</h2><p className="mt-1 text-sm text-slate-500">Текст анализируется прямо в браузере и никуда не отправляется.</p></div><button type="button" className="table-action" onClick={onClose} aria-label="Закрыть">×</button></div>
      <label className="form-label">Описание проекта<textarea className="field min-h-36 resize-y" autoFocus value={brief} onChange={(event) => setBrief(event.target.value)} placeholder="Например: нужен адаптивный сайт с дизайном, интеграцией CRM и настройкой аналитики…" /></label>
      {generated.length > 0 ? <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-800">Предлагаемые разделы · {generated.length}</p><span className="text-xs text-slate-500">{optionalCount} опции</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{generated.map((section) => <div key={section.id} className="rounded-lg border border-white bg-white/80 px-3 py-2.5"><p className="text-sm font-semibold text-slate-800">{section.title}</p><p className="mt-1 text-xs text-slate-500">{section.items.length} {section.items.length === 1 ? 'позиция' : 'позиции'}</p></div>)}</div><p className="mt-3 text-xs leading-5 text-slate-500">Сгенерированные разделы добавятся в конец сметы. Количество и цены можно изменить после вставки.</p></div> : <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Упомяните разработку, дизайн, вёрстку, интеграции, SEO, аналитику или поддержку, чтобы подобрать подходящие позиции.</div>}
      <div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={onClose}>Отмена</button><button type="button" disabled={generated.length === 0} className="button-primary disabled:cursor-not-allowed disabled:opacity-45" onClick={() => onInsert(generated)}>＋ Вставить разделы</button></div>
    </section>
  </div>;
}
