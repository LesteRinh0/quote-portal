import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../components/layout/AppLayout';
import { Button, EmptyState, Input, PageHeading } from '../components/ui';
import { quoteRepository } from '../storage/localStorageRepo';
import { calculateTotal, formatMoney } from '../utils/calcQuote';
import type { Client } from '../types/quote.types';

type ClientForm = Omit<Client, 'id'>;
const blankClient: ClientForm = { name: '', company: '', email: '', telegram: '', notes: '' };

export default function ClientsPage() {
  const { state, refresh } = useAppData();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(blankClient);
  const [isOpen, setIsOpen] = useState(false);
  const clients = useMemo(() => state.clients.filter((client) => `${client.name} ${client.company ?? ''} ${client.email ?? ''}`.toLocaleLowerCase('ru-RU').includes(query.toLocaleLowerCase('ru-RU'))), [state.clients, query]);
  const openNew = () => { setEditing(null); setForm(blankClient); setIsOpen(true); };
  const openEdit = (client: Client) => { setEditing(client); setForm({ name: client.name, company: client.company ?? '', email: client.email ?? '', telegram: client.telegram ?? '', notes: client.notes ?? '' }); setIsOpen(true); };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client: Client = { ...form, id: editing?.id ?? crypto.randomUUID() };
    for (const key of ['company', 'email', 'telegram', 'notes'] as const) if (!client[key]?.trim()) delete client[key];
    quoteRepository.saveClient(client);
    refresh();
    setIsOpen(false);
  };
  const remove = (client: Client) => {
    const linkedQuotes = state.quotes.filter((quote) => quote.clientId === client.id).length;
    if (!window.confirm(linkedQuotes > 0 ? `У клиента есть сметы (${linkedQuotes}). Удалить контакт?` : `Удалить клиента «${client.name}»?`)) return;
    quoteRepository.deleteClient(client.id);
    refresh();
  };

  return <>
    <PageHeading eyebrow="Контакты" title="Клиенты" description="История предложений, контакты и выручка по каждому клиенту." action={<Button onClick={openNew}>＋ Добавить клиента</Button>} />
    <section className="panel p-4 sm:p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-slate-900">Клиентская база</h3><p className="mt-1 text-xs text-slate-500">{state.clients.length} контактов</p></div><Input className="sm:max-w-xs" aria-label="Поиск клиентов" placeholder="Поиск клиента…" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      {clients.length === 0 ? <EmptyState title="Клиенты не найдены" description="Попробуйте изменить поиск или добавьте нового клиента." /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{clients.map((client) => {
        const quotes = state.quotes.filter((quote) => quote.clientId === client.id);
        const approved = quotes.filter((quote) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(quote.status));
        const revenue = approved.reduce((sum, quote) => sum + calculateTotal(quote), 0);
        const currency = approved[0]?.currency ?? state.profile.defaultCurrency;
        return <article key={client.id} className="panel p-5"><div className="flex items-start justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-800">{client.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0"><h4 className="truncate font-semibold text-slate-900">{client.name}</h4><p className="truncate text-xs text-slate-500">{client.company || 'Частный клиент'}</p></div></div><div className="flex gap-1"><button className="table-action" title="Редактировать" onClick={() => openEdit(client)}>✎</button><button className="table-action text-rose-500" title="Удалить" onClick={() => remove(client)}>×</button></div></div>
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">{client.email && <a className="block truncate text-slate-600 hover:text-blue-700" href={`mailto:${client.email}`}>✉ <span className="ml-1">{client.email}</span></a>}{client.telegram && <p className="truncate text-slate-600">↗ <span className="ml-1">{client.telegram}</span></p>}{!client.email && !client.telegram && <p className="text-slate-400">Контактные данные не указаны</p>}</div>
          {client.notes && <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{client.notes}</p>}
          <div className="mt-5 flex items-end justify-between rounded-lg bg-slate-50 px-3 py-3"><div><p className="text-[11px] text-slate-400">Сметы · {quotes.length}</p><p className="mt-1 text-sm font-bold text-slate-800">{formatMoney(revenue, currency)}</p></div><Link className="text-xs font-semibold text-blue-700 hover:underline" to={`/quotes?client=${client.id}`}>Сметы клиента →</Link></div>
        </article>;
      })}</div>}
    </section>
    {isOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}><form className="modal-card" onSubmit={save}><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Клиентская база</p><h3 className="mt-1 text-xl font-bold text-slate-900">{editing ? 'Редактировать клиента' : 'Новый клиент'}</h3></div><button type="button" className="table-action" onClick={() => setIsOpen(false)}>×</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="form-label">Имя и фамилия<Input autoFocus required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Мария Волкова" /></label><label className="form-label">Компания<Input value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} placeholder="Название компании" /></label><label className="form-label">Электронная почта<Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@example.com" /></label><label className="form-label">Telegram<Input value={form.telegram} onChange={(event) => setForm({ ...form, telegram: event.target.value })} placeholder="@username" /></label><label className="form-label sm:col-span-2">Заметки<Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Контекст проекта, предпочтения…" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="button-secondary" onClick={() => setIsOpen(false)}>Отмена</button><Button type="submit">Сохранить клиента</Button></div></form></div>}
  </>;
}
