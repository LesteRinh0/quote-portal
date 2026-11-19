import { Link } from 'react-router-dom';
import { useAppData } from '../components/layout/AppLayout';
import { EmptyState, PageHeading, SectionTitle, Select } from '../components/ui';
import { quoteRepository } from '../storage/localStorageRepo';
import type { QuoteStatus } from '../types/quote.types';
import { calculateTotal, formatMoney } from '../utils/calcQuote';

const statusLabels: Record<QuoteStatus, string> = { DRAFT: 'Черновик', SENT: 'Отправлена', VIEWED: 'Просмотрена', APPROVED: 'Согласована', IN_PROGRESS: 'В работе', COMPLETED: 'Завершена', REJECTED: 'Отклонена' };
const statusStyles: Record<QuoteStatus, string> = { DRAFT: 'status-neutral', SENT: 'status-blue', VIEWED: 'status-violet', APPROVED: 'status-green', IN_PROGRESS: 'status-amber', COMPLETED: 'status-green', REJECTED: 'status-red' };
const statuses = Object.keys(statusLabels) as QuoteStatus[];

export default function DashboardPage() {
  const { state, refresh } = useAppData();
  const pending = state.quotes.filter(({ status }) => status === 'SENT' || status === 'VIEWED');
  const accepted = state.quotes.filter(({ status }) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(status));
  const acceptedTotalByCurrency = accepted.reduce<Partial<Record<(typeof state.profile.defaultCurrency), number>>>((totals, quote) => {
    totals[quote.currency] = (totals[quote.currency] ?? 0) + calculateTotal(quote);
    return totals;
  }, {});
  const acceptedTotal = Object.entries(acceptedTotalByCurrency)
    .map(([currency, amount]) => formatMoney(amount ?? 0, currency as typeof state.profile.defaultCurrency))
    .join(' · ') || formatMoney(0, state.profile.defaultCurrency);
  const recentQuotes = [...state.quotes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const events = state.quotes.flatMap((quote) => quote.comments.map((comment) => ({ quote, comment })))
    .sort((a, b) => b.comment.createdAt.localeCompare(a.comment.createdAt)).slice(0, 5);
  const metrics = [
    { label: 'Всего смет', value: state.quotes.length.toString(), detail: 'Во всём рабочем пространстве', icon: '▤', tone: 'blue' },
    { label: 'На согласовании', value: pending.length.toString(), detail: 'Ожидают ответа клиента', icon: '◷', tone: 'violet' },
    { label: 'Согласовано и в работе', value: accepted.length.toString(), detail: 'Успешные проекты', icon: '✓', tone: 'green' },
    { label: 'Сумма согласованных', value: acceptedTotal, detail: 'Суммы в валютах смет', icon: '↗', tone: 'amber' },
  ];

  const updateStatus = (quoteId: string, status: QuoteStatus) => {
    const quote = state.quotes.find((entry) => entry.id === quoteId);
    if (!quote) return;
    quoteRepository.saveQuote({ ...quote, status, updatedAt: new Date().toISOString() });
    refresh();
  };

  return <>
    <PageHeading eyebrow="Обзор" title="Добро пожаловать" description="Следите за предложениями и поддерживайте проекты в движении." action={<Link className="button-primary" to="/quotes/new">＋ Новая смета</Link>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className="panel p-5"><div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{metric.label}</p><span className={`metric-icon metric-${metric.tone}`}>{metric.icon}</span></div><p className="mt-4 truncate text-2xl font-bold tracking-tight text-slate-950">{metric.value}</p><p className="mt-1 text-xs text-slate-400">{metric.detail}</p></article>)}</div>
    <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.85fr)]">
      <section className="panel p-5 sm:p-6"><SectionTitle aside={<Link to="/quotes" className="text-sm font-semibold text-blue-700 hover:text-blue-800">Все сметы →</Link>}>Последние сметы</SectionTitle>
        {recentQuotes.length === 0 ? <EmptyState title="Смет пока нет" description="Создайте первое предложение для клиента." /> : <div className="divide-y divide-slate-100">{recentQuotes.map((quote) => {
          const client = state.clients.find((entry) => entry.id === quote.clientId);
          return <div key={quote.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"><div className="min-w-0"><Link to={`/quotes/${quote.id}/edit`} className="truncate font-semibold text-slate-800 hover:text-blue-700">{quote.title}</Link><p className="mt-1 truncate text-xs text-slate-500">{client?.company ?? client?.name ?? 'Клиент не указан'} · {new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(quote.updatedAt))}</p></div><div className="flex items-center gap-3"><span className={`status-pill ${statusStyles[quote.status]}`}>{statusLabels[quote.status]}</span><Select aria-label={`Статус сметы ${quote.title}`} className="w-auto py-1.5 text-xs" value={quote.status} onChange={(event) => updateStatus(quote.id, event.target.value as QuoteStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</Select></div><div className="flex items-center justify-between gap-4 md:justify-end"><span className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(calculateTotal(quote), quote.currency)}</span><Link aria-label="Открыть портал клиента" className="text-slate-400 hover:text-blue-700" to={`/p/${quote.slug}`}>↗</Link></div></div>;
        })}</div>}
      </section>
      <section className="panel p-5 sm:p-6"><SectionTitle>Последние события</SectionTitle>
        {events.length === 0 ? <EmptyState title="Событий пока нет" description="Комментарии по сметам появятся здесь." /> : <div className="space-y-5">{events.map(({ quote, comment }) => <div key={comment.id} className="flex gap-3"><span className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${comment.authorRole === 'SYSTEM' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'}`}>{comment.authorRole === 'SYSTEM' ? '•' : comment.authorName.slice(0, 1)}</span><div className="min-w-0"><p className="text-sm leading-5 text-slate-700"><span className="font-semibold">{comment.authorName}</span> {comment.text}</p><Link to={`/quotes/${quote.id}/edit`} className="mt-1 block truncate text-xs font-medium text-blue-700 hover:underline">{quote.title}</Link><p className="mt-1 text-[11px] text-slate-400">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(comment.createdAt))}</p></div></div>)}</div>}
      </section>
    </div>
  </>;
}
