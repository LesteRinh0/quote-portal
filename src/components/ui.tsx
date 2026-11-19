import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div>{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{eyebrow}</p>}<h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h2>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}</div>{action}</div>;
}
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button {...props} className={`button-primary ${className}`} />; }
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`field ${props.className ?? ''}`} />; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`field ${props.className ?? ''}`} />; }
export function EmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><p className="font-semibold text-slate-800">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p></div>; }
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) { return <div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-slate-900">{children}</h3>{aside}</div>; }
