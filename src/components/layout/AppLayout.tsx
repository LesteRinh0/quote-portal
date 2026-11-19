import { createContext, useContext, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { quoteRepository } from '../../storage/localStorageRepo';
import type { DatabaseState } from '../../types/quote.types';

interface AppDataContextValue {
  state: DatabaseState;
  refresh: () => void;
  replaceState: (nextState: DatabaseState) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData должен вызываться внутри AppLayout.');
  return context;
}

const navigation = [
  { label: 'Дашборд', path: '/dashboard', icon: '◫' },
  { label: 'Сметы', path: '/quotes', icon: '▤' },
  { label: 'Новая смета', path: '/quotes/new', icon: '+' },
  { label: 'Услуги и шаблоны', path: '/templates', icon: '▦' },
  { label: 'Клиенты', path: '/clients', icon: '♧' },
];

function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function IconButton({ children, onClick, title }: { children: ReactNode; onClick: () => void; title: string }) {
  return <button type="button" title={title} onClick={onClick} className="toolbar-button">{children}</button>;
}

export default function AppLayout() {
  const [state, setState] = useState(() => quoteRepository.getState());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const context = useMemo<AppDataContextValue>(() => ({
    state,
    refresh: () => setState(quoteRepository.getState()),
    replaceState: setState,
  }), [state]);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      setState(quoteRepository.importJson(await file.text()));
      window.alert('База успешно импортирована.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось импортировать файл.');
    }
  };

  const resetDemo = () => {
    if (window.confirm('Сбросить данные и восстановить демо-базу?')) setState(quoteRepository.resetToSeed());
  };

  const pageTitle = navigation.find((item) => item.path === location.pathname)?.label
    ?? (location.pathname.includes('/edit') ? 'Редактор сметы' : location.pathname.includes('/p/') ? 'Клиентский портал' : 'Рабочее пространство');

  return <AppDataContext.Provider value={context}>
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:w-[260px] lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-6 py-5"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-bold text-white shadow-sm shadow-blue-200">Q</div><div><p className="text-sm font-bold tracking-tight text-slate-950">Quote Portal</p><p className="text-xs text-slate-500">Рабочее пространство</p></div></div>
        <div className="mx-4 mb-4 hidden rounded-xl bg-slate-50 px-3 py-3 lg:block"><p className="truncate text-sm font-semibold text-slate-800">{state.profile.companyName}</p><p className="mt-0.5 text-xs text-slate-500">{state.profile.contactName}</p></div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">{navigation.map(({ label, path, icon }) => <NavLink key={path} to={path} end={path === '/dashboard'} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}><span className="flex h-6 w-6 items-center justify-center text-base">{icon}</span><span className="whitespace-nowrap">{label}</span></NavLink>)}</nav>
        <div className="mt-auto hidden px-4 pb-5 lg:block"><div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4"><p className="text-sm font-semibold text-slate-800">Демо-режим</p><p className="mt-1 text-xs leading-5 text-slate-500">Данные хранятся в этом браузере. Экспортируйте резервную копию, чтобы сохранить изменения.</p></div><p className="mt-4 px-1 text-[11px] text-slate-400">QUOTE PORTAL · 0.1.0</p></div>
      </aside>
      <div className="min-w-0 flex-1 lg:ml-[260px]">
        <header className="sticky top-0 z-20 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-5 py-3 backdrop-blur sm:px-8">
          <div><p className="text-xs font-medium text-slate-400">{state.profile.companyName}</p><h1 className="text-lg font-semibold tracking-tight text-slate-900">{pageTitle}</h1></div>
          <div className="flex items-center gap-2"><IconButton title="Экспорт JSON" onClick={() => downloadJson('quote-portal-backup.json', quoteRepository.exportJson())}>⇧ <span className="hidden sm:inline">Экспорт</span></IconButton><IconButton title="Импорт JSON" onClick={() => fileInputRef.current?.click()}>⇩ <span className="hidden sm:inline">Импорт</span></IconButton><button type="button" onClick={resetDemo} className="toolbar-button text-rose-600 hover:border-rose-200 hover:bg-rose-50">Сброс демо</button><input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} /><div className="ml-1 hidden h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 sm:flex">{state.profile.contactName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div></div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9"><Outlet /></main>
      </div>
    </div>
  </AppDataContext.Provider>;
}
