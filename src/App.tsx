import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ClientsPage from './pages/ClientsPage';
import ClientPortalPage from './pages/ClientPortalPage';
import DashboardPage from './pages/DashboardPage';
import QuoteEditorPage from './pages/QuoteEditorPage';
import QuotesListPage from './pages/QuotesListPage';
import TemplatesPage from './pages/TemplatesPage';

function ComingSoonPage({ title }: { title: string }) {
  return <section className="panel mx-auto max-w-3xl px-8 py-12 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">✦</span><h1 className="mt-5 text-2xl font-bold text-slate-950">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-500">Этот экран будет добавлен на следующем этапе реализации.</p></section>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/p/:slug" element={<ClientPortalPage />} />
      <Route element={<AppLayout />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="quotes" element={<QuotesListPage />} />
      <Route path="quotes/new" element={<QuoteEditorPage />} />
      <Route path="quotes/:id/edit" element={<QuoteEditorPage />} />
      <Route path="templates" element={<TemplatesPage />} />
      <Route path="clients" element={<ClientsPage />} />
      <Route path="*" element={<ComingSoonPage title="Страница не найдена" />} />
      </Route>
    </Routes>
  );
}
