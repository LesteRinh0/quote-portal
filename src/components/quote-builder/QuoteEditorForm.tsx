import { useState, type FormEvent } from 'react';
import { useAppData } from '../layout/AppLayout';
import { Button, Input, Select } from '../ui';
import { quoteRepository } from '../../storage/localStorageRepo';
import type { Client, Currency, DiscountType, PaymentMilestone, Quote, QuoteChoiceOption, QuoteItem, QuoteItemType, QuoteSection, QuoteStatus, ServiceTemplate } from '../../types/quote.types';

interface QuoteEditorFormProps {
  quote: Quote;
  onChange: (quote: Quote) => void;
  onGenerateBrief: () => void;
}

const currencies: Currency[] = ['RUB', 'BYN', 'USD', 'EUR'];
const statuses: QuoteStatus[] = ['DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const statusLabels: Record<QuoteStatus, string> = { DRAFT: 'Черновик', SENT: 'Отправлена', VIEWED: 'Просмотрена', APPROVED: 'Согласована', IN_PROGRESS: 'В работе', COMPLETED: 'Завершена', REJECTED: 'Отклонена' };
const discountLabels: Record<DiscountType, string> = { NONE: 'Без скидки', PERCENT: 'Процент', FIXED: 'Фиксированная сумма' };
const itemTypeLabels: Record<QuoteItemType, string> = { FIXED: 'Обязательная позиция', OPTIONAL: 'Дополнительная опция', CHOICE: 'Выбор варианта' };

function makeId(prefix: string): string { return `${prefix}-${crypto.randomUUID()}`; }

function newItem(): QuoteItem {
  return { id: makeId('item'), title: '', description: '', unit: 'услуга', quantity: 1, unitPrice: 0, type: 'FIXED', isSelected: true };
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`form-label ${className}`}>{label}{children}</label>;
}

export default function QuoteEditorForm({ quote, onChange, onGenerateBrief }: QuoteEditorFormProps) {
  const { state, refresh } = useAppData();
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({ name: '', company: '', email: '' });
  const update = (patch: Partial<Quote>) => onChange({ ...quote, ...patch });

  const addSection = () => update({ sections: [...quote.sections, { id: makeId('section'), title: 'Новый раздел', description: '', items: [] }] });
  const updateSection = (sectionId: string, patch: Partial<QuoteSection>) => update({ sections: quote.sections.map((section) => section.id === sectionId ? { ...section, ...patch } : section) });
  const removeSection = (sectionId: string) => update({ sections: quote.sections.filter((section) => section.id !== sectionId) });
  const addItem = (section: QuoteSection, item: QuoteItem = newItem()) => updateSection(section.id, { items: [...section.items, item] });
  const updateItem = (section: QuoteSection, itemId: string, patch: Partial<QuoteItem>) => updateSection(section.id, { items: section.items.map((item) => item.id === itemId ? { ...item, ...patch } : item) });
  const removeItem = (section: QuoteSection, itemId: string) => updateSection(section.id, { items: section.items.filter((item) => item.id !== itemId) });

  const addTemplate = (section: QuoteSection, template: ServiceTemplate) => {
    const choices = template.defaultType === 'CHOICE' ? [
      { id: makeId('choice'), label: 'Базовый', unitPrice: template.unitPrice },
      { id: makeId('choice'), label: 'Оптимальный', unitPrice: Math.round(template.unitPrice * 1.35) },
      { id: makeId('choice'), label: 'Расширенный', unitPrice: Math.round(template.unitPrice * 1.8) },
    ] : undefined;
    addItem(section, {
      id: makeId('item'), title: template.title, description: template.description ?? '', unit: template.unit,
      quantity: template.defaultQuantity, unitPrice: template.unitPrice, type: template.defaultType,
      isSelected: true, choices, selectedChoiceId: choices?.[0]?.id,
    });
  };

  const addMilestone = () => {
    const milestone: PaymentMilestone = { id: makeId('payment'), title: `Этап ${quote.milestones.length + 1}`, percentage: 0, dueNote: '', isPaid: false };
    update({ milestones: [...quote.milestones, milestone] });
  };
  const updateMilestone = (id: string, patch: Partial<PaymentMilestone>) => update({ milestones: quote.milestones.map((milestone) => milestone.id === id ? { ...milestone, ...patch } : milestone) });

  const createClient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client: Client = { id: makeId('client'), name: clientForm.name.trim(), company: clientForm.company.trim() || undefined, email: clientForm.email.trim() || undefined };
    quoteRepository.saveClient(client);
    refresh();
    update({ clientId: client.id });
    setClientForm({ name: '', company: '', email: '' });
    setShowClientForm(false);
  };

  const changeItemType = (section: QuoteSection, item: QuoteItem, type: QuoteItemType) => {
    const choices: QuoteChoiceOption[] | undefined = type === 'CHOICE'
      ? item.choices?.length ? item.choices : [
        { id: makeId('choice'), label: 'Базовый', unitPrice: item.unitPrice },
        { id: makeId('choice'), label: 'Оптимальный', unitPrice: Math.round(item.unitPrice * 1.35) },
      ]
      : item.choices;
    updateItem(section, item.id, { type, choices, selectedChoiceId: type === 'CHOICE' ? item.selectedChoiceId ?? choices?.[0]?.id : item.selectedChoiceId });
  };

  return <div className="space-y-5">
    <section className="panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Основное</p><h2 className="mt-1 font-semibold text-slate-900">Информация о предложении</h2></div><button type="button" className="button-secondary text-xs" onClick={onGenerateBrief}>✧ Сгенерировать из брифа</button></div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Название сметы" className="sm:col-span-2"><Input required value={quote.title} onChange={(event) => update({ title: event.target.value })} placeholder="Например, сайт кофейни" /></Field>
        <Field label="Клиент"><div className="flex gap-2"><Select required value={quote.clientId} onChange={(event) => update({ clientId: event.target.value })}><option value="">Выберите клиента</option>{state.clients.map((client) => <option key={client.id} value={client.id}>{client.company ? `${client.company} — ${client.name}` : client.name}</option>)}</Select><button type="button" className="button-secondary mt-1.5 shrink-0 px-3" title="Быстро добавить клиента" onClick={() => setShowClientForm(true)}>＋</button></div></Field>
        <Field label="Статус"><Select value={quote.status} onChange={(event) => update({ status: event.target.value as QuoteStatus })}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</Select></Field>
        <Field label="Валюта"><Select value={quote.currency} onChange={(event) => update({ currency: event.target.value as Currency })}>{currencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}</Select></Field>
        <Field label="Действительна до"><Input type="date" value={quote.validUntil ?? ''} onChange={(event) => update({ validUntil: event.target.value || undefined })} /></Field>
      </div>
    </section>

    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Состав работ</p><h2 className="mt-1 font-semibold text-slate-900">Разделы и позиции</h2></div><Button onClick={addSection}>＋ Раздел</Button></div>
      {quote.sections.length === 0 && <div className="panel border-dashed px-5 py-8 text-center"><p className="text-sm font-semibold text-slate-700">Начните со структуры сметы</p><p className="mt-1 text-xs text-slate-500">Добавьте раздел вручную или составьте черновик из брифа.</p><button type="button" className="mt-4 text-sm font-semibold text-blue-700 hover:underline" onClick={onGenerateBrief}>Сгенерировать из брифа →</button></div>}
      {quote.sections.map((section, sectionIndex) => (
        <article key={section.id} className="panel overflow-hidden">
          <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:p-5">
            <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-slate-500 shadow-sm">{String(sectionIndex + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <Input aria-label="Название раздела" className="mt-0 border-transparent bg-transparent px-2 py-1 text-base font-semibold shadow-none focus:border-blue-300 focus:bg-white" value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} placeholder="Название раздела" />
              <Input aria-label="Описание раздела" className="mt-1 border-transparent bg-transparent px-2 py-1 text-xs shadow-none focus:border-blue-300 focus:bg-white" value={section.description ?? ''} onChange={(event) => updateSection(section.id, { description: event.target.value })} placeholder="Короткое описание, необязательно" />
            </div>
            <button type="button" className="table-action mt-1 text-rose-500 hover:bg-rose-50" title="Удалить раздел" onClick={() => removeSection(section.id)}>×</button>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            {section.items.map((item, itemIndex) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-slate-500">Позиция {itemIndex + 1}</p><button type="button" className="text-xs font-medium text-rose-600 hover:text-rose-700" onClick={() => removeItem(section, item.id)}>Удалить</button></div>
                <div className="grid gap-3 sm:grid-cols-6"><Field label="Название" className="sm:col-span-3"><Input value={item.title} onChange={(event) => updateItem(section, item.id, { title: event.target.value })} placeholder="Название работы" /></Field><Field label="Тип позиции" className="sm:col-span-3"><Select value={item.type} onChange={(event) => changeItemType(section, item, event.target.value as QuoteItemType)}>{Object.entries(itemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
            <Field label="Описание" className="sm:col-span-6"><Input value={item.description ?? ''} onChange={(event) => updateItem(section, item.id, { description: event.target.value })} placeholder="Кратко опишите работу" /></Field>
            <Field label="Единица"><Input value={item.unit} onChange={(event) => updateItem(section, item.id, { unit: event.target.value })} placeholder="час" /></Field><Field label="Количество"><Input min="0" step="0.1" type="number" value={item.quantity} onChange={(event) => updateItem(section, item.id, { quantity: Number(event.target.value) })} /></Field><Field label={item.type === 'CHOICE' ? 'Базовая цена' : 'Цена за единицу'} className="sm:col-span-2"><Input min="0" step="0.01" type="number" value={item.unitPrice} onChange={(event) => updateItem(section, item.id, { unitPrice: Number(event.target.value) })} /></Field>
            {item.type === 'OPTIONAL' && <label className="flex items-center gap-2 self-end pb-2 text-xs font-medium text-slate-600 sm:col-span-2"><input className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" type="checkbox" checked={item.isSelected} onChange={(event) => updateItem(section, item.id, { isSelected: event.target.checked })} />Включена в расчёт</label>}
          </div>
                {item.type === 'CHOICE' && <div className="mt-4 rounded-lg bg-blue-50/60 p-3"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-slate-700">Варианты для клиента</p><button type="button" className="text-xs font-semibold text-blue-700 hover:underline" onClick={() => updateItem(section, item.id, { choices: [...(item.choices ?? []), { id: makeId('choice'), label: `Вариант ${(item.choices?.length ?? 0) + 1}`, unitPrice: item.unitPrice }] })}>＋ Добавить вариант</button></div><div className="space-y-2">{(item.choices ?? []).map((choice) => <div key={choice.id} className="grid grid-cols-[minmax(0,1fr)_120px_32px] items-center gap-2"><Input aria-label="Название варианта" className="mt-0 bg-white" value={choice.label} onChange={(event) => updateItem(section, item.id, { choices: item.choices?.map((entry) => entry.id === choice.id ? { ...entry, label: event.target.value } : entry) })} placeholder="Название" /><Input aria-label="Цена варианта" className="mt-0 bg-white" min="0" step="0.01" type="number" value={choice.unitPrice} onChange={(event) => updateItem(section, item.id, { choices: item.choices?.map((entry) => entry.id === choice.id ? { ...entry, unitPrice: Number(event.target.value) } : entry) })} /><button type="button" className="table-action text-rose-500" aria-label="Удалить вариант" onClick={() => updateItem(section, item.id, { choices: item.choices?.filter((entry) => entry.id !== choice.id), selectedChoiceId: item.selectedChoiceId === choice.id ? item.choices?.find((entry) => entry.id !== choice.id)?.id : item.selectedChoiceId })}>×</button></div>)}</div><p className="mt-2 text-[11px] text-slate-500">Клиент сможет выбрать один вариант в портале.</p></div>}
              </div>
            ))}
          </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-5"><button type="button" className="text-xs font-semibold text-blue-700 hover:underline" onClick={() => addItem(section)}>＋ Добавить позицию</button><div className="flex items-center gap-2"><span className="text-[11px] text-slate-400">Из шаблона</span><Select aria-label={`Добавить позицию из шаблона в ${section.title}`} className="mt-0 w-auto max-w-52 py-1.5 text-xs" value="" onChange={(event) => { const template = state.templates.find((entry) => entry.id === event.target.value); if (template) addTemplate(section, template); }}><option value="">Выбрать услугу…</option>{state.templates.map((template) => <option key={template.id} value={template.id}>{template.category} · {template.title}</option>)}</Select></div></div>
        </article>
      ))}
    </section>

    <section className="panel p-5 sm:p-6"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Условия</p><h2 className="mt-1 font-semibold text-slate-900">Скидка и оплата</h2></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Тип скидки"><Select value={quote.discountType} onChange={(event) => update({ discountType: event.target.value as DiscountType, discountValue: event.target.value === 'NONE' ? 0 : quote.discountValue })}>{Object.entries(discountLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>{quote.discountType !== 'NONE' && <Field label={quote.discountType === 'PERCENT' ? 'Размер скидки, %' : `Размер скидки, ${quote.currency}`}><Input min="0" step="0.01" type="number" max={quote.discountType === 'PERCENT' ? 100 : undefined} value={quote.discountValue} onChange={(event) => update({ discountValue: Number(event.target.value) })} /></Field>}</div>
      <div className="mt-6 border-t border-slate-100 pt-5"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-800">Этапы оплаты</h3><p className="mt-1 text-xs text-slate-500">Разбейте оплату на удобные этапы.</p></div><button type="button" className="button-secondary text-xs" onClick={addMilestone}>＋ Этап</button></div>
        {quote.milestones.length > 0 && <div className="mb-3 flex items-center justify-between rounded-lg px-3 py-2 text-xs"><span className="font-medium text-slate-600">Всего по этапам</span><span className={`font-bold ${Math.abs(quote.milestones.reduce((sum, milestone) => sum + milestone.percentage, 0) - 100) < 0.01 ? 'text-emerald-700' : 'text-amber-700'}`}>{quote.milestones.reduce((sum, milestone) => sum + milestone.percentage, 0)}% {Math.abs(quote.milestones.reduce((sum, milestone) => sum + milestone.percentage, 0) - 100) < 0.01 ? '· сбалансировано' : '· сумма должна составлять 100%'}</span></div>}
        <div className="space-y-2">{quote.milestones.map((milestone, index) => <div key={milestone.id} className="grid items-center gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-[minmax(0,1fr)_90px_minmax(0,1fr)_auto_auto]"><Input aria-label={`Название этапа ${index + 1}`} className="mt-0" value={milestone.title} onChange={(event) => updateMilestone(milestone.id, { title: event.target.value })} placeholder="Название этапа" /><div className="relative"><Input aria-label={`Процент этапа ${index + 1}`} className="mt-0 pr-7 text-right" min="0" max="100" step="1" type="number" value={milestone.percentage} onChange={(event) => updateMilestone(milestone.id, { percentage: Number(event.target.value) })} /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div><Input aria-label={`Срок этапа ${index + 1}`} className="mt-0" value={milestone.dueNote ?? ''} onChange={(event) => updateMilestone(milestone.id, { dueNote: event.target.value })} placeholder="Срок / условие" /><label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-500"><input className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500" type="checkbox" checked={milestone.isPaid} onChange={(event) => updateMilestone(milestone.id, { isPaid: event.target.checked })} />Оплачено</label><button type="button" className="table-action text-rose-500" title="Удалить этап" onClick={() => update({ milestones: quote.milestones.filter((entry) => entry.id !== milestone.id) })}>×</button></div>)}</div>
      </div>
    </section>

    {showClientForm && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowClientForm(false); }}><form className="modal-card max-w-lg" onSubmit={createClient}><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Быстрое добавление</p><h2 className="mt-1 text-xl font-bold text-slate-900">Новый клиент</h2></div><button type="button" className="table-action" aria-label="Закрыть" onClick={() => setShowClientForm(false)}>×</button></div><div className="space-y-3"><Field label="Имя и фамилия"><Input autoFocus required value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} placeholder="Имя клиента" /></Field><Field label="Компания"><Input value={clientForm.company} onChange={(event) => setClientForm({ ...clientForm, company: event.target.value })} placeholder="Название компании" /></Field><Field label="Электронная почта"><Input type="email" value={clientForm.email} onChange={(event) => setClientForm({ ...clientForm, email: event.target.value })} placeholder="name@example.com" /></Field></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={() => setShowClientForm(false)}>Отмена</button><Button type="submit">Добавить клиента</Button></div></form></div>}
  </div>;
}
