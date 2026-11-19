import { useState, type FormEvent } from 'react';
import type { Quote, QuoteComment } from '../../types/quote.types';

interface QuoteCommentsProps {
  quote: Quote;
  clientName: string;
  onAddComment: (comment: Omit<QuoteComment, 'id' | 'createdAt'>) => void;
}

export default function QuoteComments({ quote, clientName, onAddComment }: QuoteCommentsProps) {
  const [text, setText] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;
    onAddComment({ authorName: clientName || 'Клиент', authorRole: 'CLIENT', text: message });
    setText('');
  };
  const orderedComments = [...quote.comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return <section className="portal-card p-5 sm:p-6 print:break-inside-avoid">
    <div className="mb-5 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">Обсуждение</p><h2 className="mt-1 text-lg font-bold text-slate-900">Сообщения и события</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{orderedComments.length}</span></div>
    {orderedComments.length === 0 ? <p className="rounded-lg bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">Пока нет сообщений по этой смете.</p> : <div className="space-y-5">{orderedComments.map((comment) => {
      const isSystem = comment.authorRole === 'SYSTEM';
      const isClient = comment.authorRole === 'CLIENT';
      return <article key={comment.id} className={`flex gap-3 ${isClient ? 'flex-row-reverse text-right' : ''}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isSystem ? 'bg-slate-100 text-slate-500' : isClient ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>{isSystem ? '•' : comment.authorName.slice(0, 1).toLocaleUpperCase('ru-RU')}</span><div className={`min-w-0 max-w-[90%] ${isClient ? 'text-right' : ''}`}><div className={`flex items-baseline gap-2 ${isClient ? 'justify-end' : ''}`}><p className="text-xs font-semibold text-slate-700">{comment.authorName}</p><span className="text-[10px] text-slate-400">{isSystem ? 'Событие' : isClient ? 'Клиент' : 'Исполнитель'}</span></div><p className={`mt-1 inline-block rounded-xl px-3 py-2 text-sm leading-5 ${isSystem ? 'bg-slate-50 text-slate-500' : 'bg-blue-50/70 text-slate-700'}`}>{comment.text}</p><p className="mt-1 text-[10px] text-slate-400">{new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(comment.createdAt))}</p></div></article>;
    })}</div>}
    <form className="mt-6 border-t border-slate-100 pt-5 no-print" onSubmit={submit}><label className="form-label">Написать исполнителю<textarea className="field min-h-20 resize-y" value={text} onChange={(event) => setText(event.target.value)} placeholder="Задайте вопрос или оставьте комментарий…" /></label><div className="mt-3 flex justify-end"><button type="submit" disabled={!text.trim()} className="button-primary disabled:cursor-not-allowed disabled:opacity-45">Отправить сообщение →</button></div></form>
  </section>;
}
