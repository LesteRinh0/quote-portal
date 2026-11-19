import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BriefModal from '../components/quote-builder/BriefModal';
import QuoteEditorForm from '../components/quote-builder/QuoteEditorForm';
import QuotePreviewCard from '../components/quote-builder/QuotePreviewCard';
import { useAppData } from '../components/layout/AppLayout';
import { quoteRepository } from '../storage/localStorageRepo';
import type { Quote, QuoteSection } from '../types/quote.types';

function createBlankQuote(currency: Quote['currency']): Quote {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), slug: 'novaya-smeta', title: '', clientId: '', status: 'DRAFT', currency,
    createdAt: now, updatedAt: now, sections: [], discountType: 'NONE', discountValue: 0, milestones: [], comments: [],
  };
}

function createSlug(title: string, quoteId: string): string {
  const normalized = title.trim().toLocaleLowerCase('ru-RU')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42);
  return `${normalized || 'smeta'}-${quoteId.slice(0, 6)}`;
}

export default function QuoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { state, refresh } = useAppData();
  const [quote, setQuote] = useState<Quote>(() => createBlankQuote(state.profile.defaultCurrency));
  const [isSaved, setIsSaved] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [notice, setNotice] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      const existingQuote = quoteRepository.getState().quotes.find((entry) => entry.id === id);
      if (existingQuote) {
        setQuote(existingQuote);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setIsSaved(Boolean(existingQuote));
    } else {
      setQuote(createBlankQuote(quoteRepository.getState().profile.defaultCurrency));
      setNotFound(false);
      setIsSaved(false);
    }
  }, [id]);

  const handleChange = (nextQuote: Quote) => {
    setQuote(nextQuote);
    setIsSaved(false);
    setNotice('');
  };

  const saveQuote = () => {
    if (!quote.title.trim()) {
      setNotice('Укажите название сметы перед сохранением.');
      return;
    }
    if (!quote.clientId) {
      setNotice('Выберите клиента для этой сметы.');
      return;
    }
    const now = new Date().toISOString();
    const saved = quoteRepository.saveQuote({
      ...quote,
      slug: createSlug(quote.title, quote.id),
      title: quote.title.trim(),
      updatedAt: now,
    });
    setQuote(saved);
    refresh();
    setIsSaved(true);
    setNotice('Смета сохранена в этом браузере.');
  };

  const copyLink = async () => {
    const slug = createSlug(quote.title, quote.id);
    const link = `${window.location.origin}/p/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice('Ссылка клиента скопирована в буфер обмена.');
    } catch {
      setNotice(`Ссылка клиента: ${link}`);
    }
  };

  const insertBriefSections = (sections: QuoteSection[]) => {
    const preparedSections = sections.map((section) => ({
      ...section,
      id: crypto.randomUUID(),
      items: section.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        choices: item.choices?.map((choice) => ({ ...choice, id: crypto.randomUUID() })),
      })),
    }));
    handleChange({ ...quote, sections: [...quote.sections, ...preparedSections] });
    setShowBrief(false);
  };

  if (notFound) return <section className="panel mx-auto max-w-2xl p-8 text-center"><div className="text-sm font-semibold text-rose-600">Смета не найдена</div><p className="mt-2 text-sm text-slate-500">Она могла быть удалена или ещё не сохранена.</p><Link className="button-primary mt-5" to="/quotes">К списку смет</Link></section>;

  const clientName = state.clients.find((client) => client.id === quote.clientId)?.company
    ?? state.clients.find((client) => client.id === quote.clientId)?.name
    ?? '';

  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><Link className="text-xs font-semibold text-slate-400 hover:text-blue-700" to="/quotes">← Все сметы</Link><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{id ? 'Редактирование сметы' : 'Новая смета'}</h2><p className="mt-1 text-sm text-slate-500">Соберите предложение и сразу проверьте итоговую стоимость.</p></div><div className="flex items-center gap-2"><button type="button" className="button-secondary" onClick={copyLink}>⧉ Скопировать ссылку</button><button type="button" className="button-primary lg:hidden" onClick={saveQuote}>Сохранить смету</button></div></div>
    {notice && <div role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${notice.includes('Укажите') || notice.includes('Выберите') ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-blue-100 bg-blue-50 text-blue-800'}`}>{notice}</div>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)]">
      <QuoteEditorForm quote={quote} onChange={handleChange} onGenerateBrief={() => setShowBrief(true)} />
      <QuotePreviewCard quote={quote} clientName={clientName} onSave={saveQuote} isSaved={isSaved} onCopyLink={copyLink} copyLabel="Скопировать ссылку клиента" />
    </div>
    {showBrief && <BriefModal onClose={() => setShowBrief(false)} onInsert={insertBriefSections} />}
  </>;
}
