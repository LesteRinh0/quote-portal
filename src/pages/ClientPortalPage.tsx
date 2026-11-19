import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import QuoteComments from '../components/client-portal/QuoteComments';
import QuoteItemsList from '../components/client-portal/QuoteItemsList';
import QuoteSummaryBox from '../components/client-portal/QuoteSummaryBox';
import { quoteRepository } from '../storage/localStorageRepo';
import type { Quote, QuoteComment } from '../types/quote.types';
import { calculateTotal, formatMoney } from '../utils/calcQuote';

const statusLabels: Record<Quote['status'], string> = { DRAFT: 'Черновик', SENT: 'Отправлена клиенту', VIEWED: 'На рассмотрении', APPROVED: 'Согласована', IN_PROGRESS: 'В работе', COMPLETED: 'Завершена', REJECTED: 'Отклонена' };
const statusStyles: Record<Quote['status'], string> = { DRAFT: 'status-neutral', SENT: 'status-blue', VIEWED: 'status-violet', APPROVED: 'status-green', IN_PROGRESS: 'status-amber', COMPLETED: 'status-green', REJECTED: 'status-red' };
const lockedStatuses: Quote['status'][] = ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];

export default function ClientPortalPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [profile, setProfile] = useState(() => quoteRepository.getState().profile);
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    const database = quoteRepository.getState();
    const found = database.quotes.find((entry) => entry.slug === slug);
    setProfile(database.profile);
    const client = found ? database.clients.find((entry) => entry.id === found.clientId) : undefined;
    setClientName(client?.name ?? '');
    setQuote(found?.status === 'SENT' ? quoteRepository.markQuoteViewed(slug) : found ?? null);
  }, [slug]);

  const persistQuote = (nextQuote: Quote) => {
    setQuote(quoteRepository.saveQuote(nextQuote));
  };

  const approve = (approver: string) => {
    if (!quote) return;
    const updated = quoteRepository.approveQuote(quote.id, approver);
    if (updated) setQuote(updated);
  };

  const addComment = (comment: Omit<QuoteComment, 'id' | 'createdAt'>) => {
    if (!quote) return;
    const updated = quoteRepository.addComment(quote.id, comment);
    if (updated) setQuote(updated);
  };

  if (!quote) return <main className="portal-page min-h-screen px-5 py-12 sm:px-8"><div className="mx-auto max-w-xl text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-500">?</div><h1 className="mt-5 text-2xl font-bold text-slate-950">Смета не найдена</h1><p className="mt-2 text-sm leading-6 text-slate-500">Проверьте ссылку или свяжитесь с исполнителем, чтобы получить актуальное предложение.</p><Link className="mt-6 inline-flex text-sm font-semibold text-blue-700 hover:underline" to="/">Вернуться на главную</Link></div></main>;

  const database = quoteRepository.getState();
  const client = database.clients.find((entry) => entry.id === quote.clientId);
  const locked = lockedStatuses.includes(quote.status);

  return <main className="portal-page min-h-screen px-4 py-6 sm:px-6 sm:py-10 print:min-h-0 print:bg-white print:p-0">
    <div className="mx-auto max-w-6xl">
      <header className="portal-card mb-6 overflow-hidden print:mb-5 print:rounded-none print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: profile.accentColor }}>{profile.companyName.slice(0, 1)}</span><div><p className="text-sm font-bold text-slate-900">{profile.companyName}</p><p className="text-xs text-slate-500">Коммерческое предложение</p></div></div><span className={`status-pill ${statusStyles[quote.status]}`}>{statusLabels[quote.status]}</span></div>
        <div className="px-5 py-6 sm:px-7 sm:py-8"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">Предложение для {client?.company ?? client?.name ?? 'вас'}</p><h1 className="mt-2 max-w-4xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{quote.title}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span>Подготовила: <strong className="font-semibold text-slate-700">{profile.contactName}</strong></span>{profile.email && <a className="no-print hover:text-blue-700" href={`mailto:${profile.email}`}>{profile.email}</a>}{quote.validUntil && <span>Действительно до <strong className="font-semibold text-slate-700">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${quote.validUntil}T00:00:00`))}</strong></span>}</div></div>
      </header>

      {locked && <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 print:hidden">Смета согласована. Выбор опций и вариантов зафиксирован.</div>}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] print:block">
        <div className="space-y-6"><section><div className="mb-4 flex items-end justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 print:text-slate-500">Состав предложения</p><h2 className="mt-1 text-xl font-bold text-slate-900">Работы и услуги</h2></div><p className="text-xs font-medium text-slate-400">{quote.sections.reduce((sum, section) => sum + section.items.length, 0)} позиций</p></div><QuoteItemsList quote={quote} locked={locked} onChange={persistQuote} /></section>
          <QuoteComments quote={quote} clientName={client?.name ?? clientName} onAddComment={addComment} />
        </div>
        <QuoteSummaryBox quote={quote} locked={locked} onApprove={approve} />
      </div>
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400 print:mt-5 print:border-slate-300"><span>{profile.companyName} · {profile.contactName}</span><span>Итого: <strong className="font-semibold text-slate-600">{formatMoney(calculateTotal(quote), quote.currency)}</strong></span></footer>
    </div>
  </main>;
}
