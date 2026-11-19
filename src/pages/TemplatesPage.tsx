import { useState, type FormEvent } from 'react';
import { useAppData } from '../components/layout/AppLayout';
import { Button, EmptyState, Input, PageHeading, Select } from '../components/ui';
import { quoteRepository } from '../storage/localStorageRepo';
import type { QuoteItemType, ServiceTemplate } from '../types/quote.types';

type TemplateForm = Omit<ServiceTemplate, 'id'>;
const blankTemplate: TemplateForm = { category: '', title: '', description: '', unit: 'услуга', defaultQuantity: 1, unitPrice: 0, defaultType: 'FIXED' };

export default function TemplatesPage() {
  const { state, refresh } = useAppData();
  const [editing, setEditing] = useState<ServiceTemplate | null>(null);
  const [form, setForm] = useState<TemplateForm>(blankTemplate);
  const [isOpen, setIsOpen] = useState(false);
  const categories = [...new Set(state.templates.map((template) => template.category))];
  const openNew = () => { setEditing(null); setForm(blankTemplate); setIsOpen(true); };
  const openEdit = (template: ServiceTemplate) => { setEditing(template); setForm({ category: template.category, title: template.title, description: template.description ?? '', unit: template.unit, defaultQuantity: template.defaultQuantity, unitPrice: template.unitPrice, defaultType: template.defaultType }); setIsOpen(true); };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const template: ServiceTemplate = { ...form, id: editing?.id ?? crypto.randomUUID(), description: form.description?.trim() || undefined };
    quoteRepository.saveTemplate(template);
    refresh();
    setIsOpen(false);
  };
  const remove = (template: ServiceTemplate) => {
    if (!window.confirm(`Удалить услугу «${template.title}»?`)) return;
    quoteRepository.deleteTemplate(template.id);
    refresh();
  };

  return <>
    <PageHeading eyebrow="Справочник" title="Услуги и шаблоны" description="Соберите каталог типовых работ, чтобы быстрее готовить новые сметы." action={<Button onClick={openNew}>＋ Добавить услугу</Button>} />
    {state.templates.length === 0 ? <EmptyState title="Каталог пока пуст" description="Добавьте первую услугу, чтобы начать формировать библиотеку шаблонов." /> : <div className="space-y-7">{categories.map((category) => <section key={category}><div className="mb-3 flex items-center gap-3"><h3 className="text-sm font-semibold text-slate-500">{category}</h3><span className="h-px flex-1 bg-slate-200" /></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{state.templates.filter((template) => template.category === category).map((template) => <article key={template.id} className="panel p-5 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-200/60"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-700">✧</span><div className="flex gap-1"><button className="table-action" title="Редактировать" onClick={() => openEdit(template)}>✎</button><button className="table-action text-rose-500" title="Удалить" onClick={() => remove(template)}>×</button></div></div><h4 className="mt-4 font-semibold text-slate-900">{template.title}</h4><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{template.description || `Типовая услуга: ${template.category.toLocaleLowerCase('ru-RU')}`}</p><div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-400">Цена за {template.unit}</p><p className="mt-0.5 font-semibold text-slate-800">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: state.profile.defaultCurrency, maximumFractionDigits: 2 }).format(template.unitPrice)}</p></div><span className={`status-pill ${template.defaultType === 'OPTIONAL' ? 'status-violet' : 'status-neutral'}`}>{template.defaultType === 'OPTIONAL' ? 'Опция' : template.defaultType === 'CHOICE' ? 'Вариант' : 'Обязательная'}</span></div></article>)}</div></section>)}</div>}
    {isOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}><form className="modal-card" onSubmit={save}><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Каталог услуг</p><h3 className="mt-1 text-xl font-bold text-slate-900">{editing ? 'Редактировать услугу' : 'Новая услуга'}</h3></div><button type="button" className="table-action" onClick={() => setIsOpen(false)}>×</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="form-label">Название<Input required autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Например, дизайн главной страницы" /></label><label className="form-label">Категория<Input required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Дизайн" list="template-categories" /><datalist id="template-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist></label><label className="form-label sm:col-span-2">Описание<Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Что входит в услугу" /></label><label className="form-label">Единица измерения<Input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="услуга" /></label><label className="form-label">Цена за единицу<Input required min="0" step="0.01" type="number" value={form.unitPrice} onChange={(event) => setForm({ ...form, unitPrice: Number(event.target.value) })} /></label><label className="form-label">Количество по умолчанию<Input required min="0" step="0.1" type="number" value={form.defaultQuantity} onChange={(event) => setForm({ ...form, defaultQuantity: Number(event.target.value) })} /></label><label className="form-label">Тип позиции<Select value={form.defaultType} onChange={(event) => setForm({ ...form, defaultType: event.target.value as QuoteItemType })}><option value="FIXED">Обязательная</option><option value="OPTIONAL">Опция</option><option value="CHOICE">Выбор варианта</option></Select></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={() => setIsOpen(false)}>Отмена</button><Button type="submit">Сохранить услугу</Button></div></form></div>}
  </>;
}
