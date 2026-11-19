import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppData } from '../components/layout/AppLayout';
import { Button, EmptyState, Input, PageHeading, Select } from '../components/ui';
import { quoteRepository } from '../storage/localStorageRepo';
import { calculateTotal, formatMoney } from '../utils/calcQuote';
import type { Quote, QuoteStatus } from '../types/quote.types';

const statuses: Array<QuoteStatus | 'ALL'> = ['ALL', 'DRAFT', 'SENT', 'VIEWED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
const statusLabels: Record<QuoteStatus | 'ALL', string> = { ALL: 'Все статусы', DRAFT: 'Черновик', SENT: 'Отправлена', VIEWED: 'Просмотрена', APPROVED: 'Согласована', IN_PROGRESS: 'В работе', COMPLETED: 'Завершена', REJECTED: 'Отклонена' };
const statusStyles: Record<QuoteStatus, string> = { DRAFT: 'status-neutral', SENT: 'status-blue', VIEWED: 'status-violet', APPROVED: 'status-green', IN_PROGRESS: 'status-amber', COMPLETED: 'status-green', REJECTED: 'status-red' };

export default function QuotesListPage() {
  const { state, refresh } = useAppData();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<QuoteStatus | 'ALL'>('ALL');
  const filteredQuotes = useMemo(() => state.quotes.filter((quote) => {
    const client = state.clients.find((entry) => entry.id === quote.clientId);
    const searchTarget = `${quote.title} ${client?.name ?? ''} ${client?.company ?? ''}`.toLocaleLowerCase('ru-RU');
    return searchTarget.includes(query.trim().toLocaleLowerCase('ru-RU')) && (!clientId || quote.clientId === clientId) && (status === 'ALL' || quote.status === status);
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [state, query, status, clientId]);

  const duplicate = (quote: Quote) => {
    const copy: Quote = JSON.parse(JSON.stringify(quote)) as Quote;
    const id = crypto.randomUUID();
    copy.id = id;
    copy.slug = `${quote.slug}-copy-${id.slice(0, 6)}`;
    copy.title = `${quote.title} — копия`;
    copy.status = 'DRAFT';
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = copy.createdAt;
    delete copy.approvedAt;
    delete copy.approvedByName;
    copy.comments = [];
    quoteRepository.saveQuote(copy);
    refresh();
  };

  const remove = (quote: Quote) => {
    if (!window.confirm(`Удалить смету «${quote.title}»?`)) return;
    quoteRepository.deleteQuote(quote.id);
    refresh();
  };

  return <>
    <PageHeading eyebrow="Рабочее пространство" title="Сметы" description={`${state.quotes.length} предложений в вашем рабочем пространстве`} action={<Link className="button-primary" to="/quotes/new">＋ Новая смета</Link>} />
    <section className="panel p-4 sm:p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span><Input aria-label="Поиск смет" className="pl-9" placeholder="Поиск по названию или клиенту…" value={query} onChange={(event) => setQuery(event.target.value)} /></div><Select aria-label="Фильтр по статусу" className="sm:w-52" value={status} onChange={(event) => setStatus(event.target.value as QuoteStatus | 'ALL')}>{statuses.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</Select></div>
      {filteredQuotes.length === 0 ? <EmptyState title="Ничего не найдено" description="Измените запрос или фильтр, чтобы увидеть сметы." /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-400"><th className="px-3 pb-3">Название / клиент</th><th className="px-3 pb-3">Статус</th><th className="px-3 pb-3">Обновлена</th><th className="px-3 pb-3 text-right">Сумма</th><th className="px-3 pb-3 text-right">Действия</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredQuotes.map((quote) => {
        const client = state.clients.find((entry) => entry.id === quote.clientId);
        return <tr key={quote.id} className="group hover:bg-slate-50/70"><td className="px-3 py-4"><Link className="font-semibold text-slate-800 hover:text-blue-700" to={`/quotes/${quote.id}/edit`}>{quote.title}</Link><p className="mt-1 text-xs text-slate-500">{client?.company ?? client?.name ?? 'Клиент удалён'}</p></td><td className="px-3 py-4"><span className={`status-pill ${statusStyles[quote.status]}`}>{statusLabels[quote.status]}</span></td><td className="px-3 py-4 text-sm text-slate-500">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(quote.updatedAt))}</td><td className="px-3 py-4 text-right text-sm font-semibold tabular-nums text-slate-800">{formatMoney(calculateTotal(quote), quote.currency)}</td><td className="px-3 py-4"><div className="flex justify-end gap-1"><Link className="table-action" title="Открыть портал" to={`/p/${quote.slug}`}>↗</Link><Link className="table-action" title="Редактировать" to={`/quotes/${quote.id}/edit`}>✎</Link><button className="table-action" title="Дублировать" onClick={() => duplicate(quote)}>⧉</button><Button className="button-danger" title="Удалить" onClick={() => remove(quote)}>×</Button></div></td></tr>;
      })}</tbody></table></div>}
    </section>
  </>;
}
