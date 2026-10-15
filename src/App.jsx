import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import {
  Archive, CalendarDays, Check, ChevronDown,
  Clock3, Columns3, LayoutDashboard, Menu, MoreHorizontal, Plus, Search,
  Settings, SlidersHorizontal, Sparkles, Tag, Trash2, X,
} from 'lucide-react'

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#818895' },
  { id: 'next', title: 'Próximas', color: '#9c8cff' },
  { id: 'doing', title: 'Em andamento', color: '#ffb45c' },
  { id: 'done', title: 'Concluídas', color: '#b5ff36' },
]

const SEED_TASKS = [
  { id: 't1', title: 'Mapear fluxo de atendimento', description: 'Documentar as etapas atuais e identificar os maiores gargalos.', status: 'backlog', priority: 'Média', project: 'Operações', due: '18 out', tags: ['processo'] },
  { id: 't2', title: 'Revisar landing page', description: 'Ajustar copy e validar o formulário em dispositivos móveis.', status: 'next', priority: 'Alta', project: 'Website', due: '16 out', tags: ['frontend', 'ui'] },
  { id: 't3', title: 'Integração de novos clientes', description: 'Criar endpoint de importação e feedback de progresso.', status: 'doing', priority: 'Alta', project: 'Plataforma', due: 'Hoje', tags: ['api'] },
  { id: 't4', title: 'Painel de indicadores', description: 'Finalizar os cards de receita e volume mensal.', status: 'doing', priority: 'Média', project: 'Analytics', due: '17 out', tags: ['dados'] },
  { id: 't5', title: 'Corrigir sessão expirada', description: 'Melhorar retorno visual no redirecionamento para login.', status: 'done', priority: 'Baixa', project: 'Plataforma', due: '14 out', tags: ['bug'] },
]

const STORAGE_KEY = 'kanbam.tasks.v1'

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : SEED_TASKS
  } catch { return SEED_TASKS }
}

const priorityStyle = {
  Alta: 'bg-[#ff725c]/10 text-[#ff8f7d] border-[#ff725c]/20',
  Média: 'bg-[#ffb45c]/10 text-[#ffc274] border-[#ffb45c]/20',
  Baixa: 'bg-[#b5ff36]/8 text-[#b5ff36] border-[#b5ff36]/15',
}

function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [query, setQuery] = useState('')
  const [priority, setPriority] = useState('Todas')
  const [modal, setModal] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const appRef = useRef(null)

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) }, [tasks])
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) {
      animate('.intro-item', { opacity: [0, 1], translateY: [14, 0], delay: stagger(65), duration: 520, ease: 'out(3)' })
      animate('.kanban-column', { opacity: [0, 1], translateX: [18, 0], delay: stagger(80, { start: 180 }), duration: 650, ease: 'out(3)' })
    }
  }, [])

  const filtered = useMemo(() => tasks.filter((task) => {
    const haystack = `${task.title} ${task.description} ${task.project} ${task.tags.join(' ')}`.toLowerCase()
    return haystack.includes(query.toLowerCase()) && (priority === 'Todas' || task.priority === priority)
  }), [tasks, query, priority])

  const progress = tasks.length ? Math.round((tasks.filter((t) => t.status === 'done').length / tasks.length) * 100) : 0

  function saveTask(data) {
    if (data.id) setTasks((current) => current.map((task) => task.id === data.id ? data : task))
    else setTasks((current) => [...current, { ...data, id: crypto.randomUUID() }])
    setModal(null)
  }

  function moveTask(id, status) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status } : task))
    setDraggedId(null)
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id))
    setModal(null)
  }

  return (
    <div ref={appRef} className="min-h-screen bg-[#080b10] text-[#f6f7f9] selection:bg-[#b5ff36] selection:text-black">
      <div className="noise" />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} taskCount={tasks.length} />

      <main className="lg:pl-[230px] min-h-screen">
        <Header onMenu={() => setSidebarOpen(true)} query={query} setQuery={setQuery} onNew={() => setModal({ status: 'backlog' })} />

        <div className="px-4 sm:px-7 lg:px-9 pt-7 pb-5">
          <section className="intro-item opacity-0 flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#7c8491] mb-3">
                <span className="size-1.5 rounded-full bg-[#b5ff36] pulse-soft" /> Visão geral
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-.045em]">Olá, Nicolas <span className="text-[#6e7580]">— vamos produzir.</span></h1>
              <p className="text-sm text-[#878e99] mt-2">Organize o que importa. Um passo de cada vez.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Stat label="Em andamento" value={tasks.filter((t) => t.status === 'doing').length} accent="#ffb45c" />
              <Stat label="Entregues" value={tasks.filter((t) => t.status === 'done').length} accent="#b5ff36" />
              <div className="min-w-[104px] sm:min-w-[132px] rounded-2xl border border-white/[.07] bg-white/[.025] p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs text-[#777f8b] mb-2">Progresso</p>
                <div className="flex items-end gap-2"><strong className="font-display text-xl">{progress}%</strong></div>
                <div className="h-1 bg-white/[.08] rounded-full mt-2 overflow-hidden"><div className="h-full bg-[#b5ff36] rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
          </section>

          <section className="intro-item opacity-0 flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[#69717d]" />
              <div className="relative">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="appearance-none rounded-xl border border-white/[.08] bg-[#11151b] py-2 pl-3 pr-8 text-xs text-[#c6cad0] outline-none focus:border-[#b5ff36]/40">
                  {['Todas', 'Alta', 'Média', 'Baixa'].map((item) => <option key={item}>{item}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-2.5 text-[#646c77]" />
              </div>
              {(query || priority !== 'Todas') && <button onClick={() => { setQuery(''); setPriority('Todas') }} className="text-xs text-[#747c87] hover:text-white">Limpar filtros</button>}
            </div>
            <p className="text-xs text-[#626a75]">{filtered.length} {filtered.length === 1 ? 'tarefa visível' : 'tarefas visíveis'}</p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 items-start pb-10">
            {COLUMNS.map((column) => (
              <KanbanColumn key={column.id} column={column} tasks={filtered.filter((task) => task.status === column.id)} draggedId={draggedId}
                onDragStart={setDraggedId} onDrop={moveTask} onNew={() => setModal({ status: column.id })} onEdit={setModal} />
            ))}
          </section>
        </div>
      </main>
      {modal && <TaskModal task={modal} onClose={() => setModal(null)} onSave={saveTask} onDelete={modal.id ? deleteTask : null} />}
    </div>
  )
}

function Sidebar({ open, onClose, taskCount }) {
  return <>
    {open && <button aria-label="Fechar menu" onClick={onClose} className="fixed inset-0 z-30 bg-black/70 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-[230px] border-r border-white/[.06] bg-[#0b0f14] px-4 py-5 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center justify-between px-2 mb-9">
        <div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-[10px] bg-[#b5ff36] text-black"><Columns3 size={18} strokeWidth={2.5}/></div><span className="font-display font-bold tracking-[-.04em] text-lg">kanbam<span className="text-[#b5ff36]">.</span></span></div>
        <button onClick={onClose} className="lg:hidden text-[#69717d]"><X size={18}/></button>
      </div>
      <nav className="space-y-1">
        <NavItem icon={LayoutDashboard} label="Meu quadro" active badge={taskCount} />
        <NavItem icon={CalendarDays} label="Agenda" />
        <NavItem icon={Archive} label="Arquivo" />
      </nav>
      <div className="mt-8 mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#4f5660]">Projetos</div>
      <nav className="space-y-1">
        {[['#9c8cff', 'Plataforma'], ['#5cd6ff', 'Website'], ['#ffb45c', 'Analytics'], ['#ff729d', 'Operações']].map(([color, label]) => (
          <button key={label} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#8b929c] hover:bg-white/[.04] hover:text-white"><span className="size-2 rounded-full" style={{ background: color }} />{label}</button>
        ))}
      </nav>
      <div className="absolute inset-x-4 bottom-4">
        <div className="rounded-2xl border border-[#b5ff36]/10 bg-[#b5ff36]/[.045] p-4 mb-3">
          <Sparkles size={16} className="text-[#b5ff36] mb-2" />
          <p className="text-xs font-semibold">Mantenha o fluxo</p><p className="mt-1 text-[11px] leading-relaxed text-[#717985]">Limite tarefas em andamento para terminar mais.</p>
        </div>
        <NavItem icon={Settings} label="Configurações" />
      </div>
    </aside>
  </>
}

function NavItem({ icon: Icon, label, active, badge }) {
  return <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? 'bg-white/[.065] text-white' : 'text-[#727a85] hover:bg-white/[.035] hover:text-white'}`}><Icon size={17}/><span>{label}</span>{badge != null && <span className="ml-auto rounded-md bg-[#b5ff36]/10 px-2 py-0.5 text-[10px] font-bold text-[#b5ff36]">{badge}</span>}</button>
}

function Header({ onMenu, query, setQuery, onNew }) {
  return <header className="glass sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-white/[.06] px-4 sm:px-7 lg:px-9">
    <button onClick={onMenu} className="grid size-9 place-items-center rounded-xl border border-white/[.08] lg:hidden"><Menu size={18}/></button>
    <div className="relative max-w-md flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666e79]"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tarefas..." className="w-full rounded-xl border border-transparent bg-white/[.035] py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-[#555d68] focus:border-white/[.08] focus:bg-white/[.05]" /></div>
    <div className="ml-auto hidden sm:flex items-center gap-2 text-xs text-[#69717d]"><Clock3 size={14}/><span>Atualizado agora</span></div>
    <button onClick={onNew} className="flex items-center gap-2 rounded-xl bg-[#b5ff36] px-3.5 py-2.5 text-sm font-bold text-[#10130c] transition hover:bg-[#c5ff63] active:scale-[.98]"><Plus size={17} strokeWidth={2.5}/><span className="hidden sm:inline">Nova tarefa</span></button>
  </header>
}

function Stat({ label, value, accent }) {
  return <div className="min-w-[104px] sm:min-w-[132px] rounded-2xl border border-white/[.07] bg-white/[.025] p-3 sm:p-4"><p className="text-[10px] sm:text-xs text-[#777f8b] mb-2">{label}</p><div className="flex items-center gap-2"><span className="size-1.5 rounded-full" style={{ background: accent }} /><strong className="font-display text-xl">{value}</strong></div></div>
}

function KanbanColumn({ column, tasks, draggedId, onDragStart, onDrop, onNew, onEdit }) {
  const [over, setOver] = useState(false)
  return <div className="kanban-column opacity-0 min-w-0 rounded-[20px] border border-white/[.06] bg-[#0d1117]/90 p-3"
    onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); if (draggedId) onDrop(draggedId, column.id); setOver(false) }}>
    <div className="flex items-center gap-2 px-1 py-2 mb-2"><span className="size-2 rounded-full" style={{ background: column.color }}/><h2 className="text-sm font-semibold">{column.title}</h2><span className="ml-auto rounded-md bg-white/[.055] px-2 py-0.5 text-[10px] text-[#8a929d]">{tasks.length}</span><button onClick={onNew} aria-label={`Adicionar em ${column.title}`} className="grid size-7 place-items-center rounded-lg text-[#68707b] hover:bg-white/[.06] hover:text-white"><Plus size={16}/></button></div>
    <div className={`min-h-[130px] space-y-2.5 rounded-xl transition-colors ${over ? 'bg-[#b5ff36]/[.035]' : ''}`}>
      {tasks.map((task) => <TaskCard key={task.id} task={task} onDragStart={onDragStart} onEdit={onEdit}/>) }
      {!tasks.length && <button onClick={onNew} className="flex min-h-[112px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/[.08] text-xs text-[#59616c] hover:border-[#b5ff36]/20 hover:text-[#8e976e]"><Plus size={17}/> Adicionar tarefa</button>}
    </div>
  </div>
}

function TaskCard({ task, onDragStart, onEdit }) {
  return <article draggable onDragStart={() => onDragStart(task.id)} onDragEnd={() => onDragStart(null)} onClick={() => onEdit(task)} className="card-shadow group cursor-grab rounded-2xl border border-white/[.065] bg-[#151a21] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/[.13] hover:bg-[#181e26] active:cursor-grabbing">
    <div className="mb-3 flex items-start justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#68717d]">{task.project}</span><button aria-label="Editar tarefa" className="-mr-1 -mt-1 grid size-7 place-items-center rounded-lg text-[#555e69] opacity-50 hover:bg-white/[.06] hover:text-white group-hover:opacity-100"><MoreHorizontal size={16}/></button></div>
    <h3 className="text-[14px] font-semibold leading-snug tracking-[-.015em] text-[#f1f3f5]">{task.title}</h3>
    <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#747d88]">{task.description}</p>
    {task.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{task.tags.map((tag) => <span key={tag} className="rounded-md bg-white/[.045] px-2 py-1 text-[9px] text-[#7f8893]">#{tag}</span>)}</div>}
    <div className="mt-4 flex items-center justify-between border-t border-white/[.055] pt-3"><span className={`rounded-lg border px-2 py-1 text-[9px] font-semibold ${priorityStyle[task.priority]}`}>{task.priority}</span><span className="flex items-center gap-1 text-[10px] text-[#69717d]"><CalendarDays size={12}/>{task.due}</span></div>
  </article>
}

function TaskModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Média', project: 'Plataforma', due: 'Hoje', tags: [], ...task })
  const modalRef = useRef(null)
  useEffect(() => {
    animate(modalRef.current, { opacity: [0, 1], translateY: [18, 0], scale: [.98, 1], duration: 320, ease: 'out(3)' })
  }, [])
  function submit(e) { e.preventDefault(); if (form.title.trim()) onSave({ ...form, title: form.title.trim(), tags: typeof form.tags === 'string' ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : form.tags }) }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <form ref={modalRef} onSubmit={submit} className="w-full max-w-lg rounded-[24px] border border-white/[.09] bg-[#11161d] p-5 sm:p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#b5ff36]">{task.id ? 'Editar' : 'Criar'}</p><h2 className="font-display text-xl font-semibold mt-1">{task.id ? 'Detalhes da tarefa' : 'Nova tarefa'}</h2></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-white/[.045] text-[#848c97] hover:text-white"><X size={17}/></button></div>
      <label className="block mb-4"><span className="mb-1.5 block text-xs text-[#7b8490]">Título</span><input autoFocus required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="O que precisa ser feito?" className="w-full rounded-xl border border-white/[.08] bg-[#0b0f14] px-3.5 py-3 text-sm outline-none placeholder:text-[#4d5560] focus:border-[#b5ff36]/35"/></label>
      <label className="block mb-4"><span className="mb-1.5 block text-xs text-[#7b8490]">Descrição</span><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contexto e critério de conclusão" className="w-full resize-none rounded-xl border border-white/[.08] bg-[#0b0f14] px-3.5 py-3 text-sm outline-none placeholder:text-[#4d5560] focus:border-[#b5ff36]/35"/></label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SelectField label="Coluna" value={form.status} onChange={(status) => setForm({ ...form, status })} options={COLUMNS.map((c) => [c.id, c.title])}/>
        <SelectField label="Prioridade" value={form.priority} onChange={(priority) => setForm({ ...form, priority })} options={['Alta', 'Média', 'Baixa'].map((x) => [x, x])}/>
        <label><span className="mb-1.5 block text-xs text-[#7b8490]">Projeto</span><div className="relative"><Tag size={14} className="absolute left-3 top-3 text-[#5f6873]"/><input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="w-full rounded-xl border border-white/[.08] bg-[#0b0f14] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#b5ff36]/35"/></div></label>
        <label><span className="mb-1.5 block text-xs text-[#7b8490]">Prazo</span><div className="relative"><CalendarDays size={14} className="absolute left-3 top-3 text-[#5f6873]"/><input value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="w-full rounded-xl border border-white/[.08] bg-[#0b0f14] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#b5ff36]/35"/></div></label>
      </div>
      <label className="block mb-6"><span className="mb-1.5 block text-xs text-[#7b8490]">Tags <em className="font-normal text-[#515965]">(separadas por vírgula)</em></span><input value={Array.isArray(form.tags) ? form.tags.join(', ') : form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="frontend, urgente" className="w-full rounded-xl border border-white/[.08] bg-[#0b0f14] px-3.5 py-2.5 text-xs outline-none placeholder:text-[#4d5560] focus:border-[#b5ff36]/35"/></label>
      <div className="flex items-center gap-2">{onDelete && <button type="button" onClick={() => onDelete(task.id)} className="grid size-10 place-items-center rounded-xl border border-[#ff725c]/15 text-[#ff7f6b] hover:bg-[#ff725c]/10"><Trash2 size={16}/></button>}<button type="button" onClick={onClose} className="ml-auto rounded-xl px-4 py-2.5 text-sm text-[#858e99] hover:text-white">Cancelar</button><button type="submit" className="flex items-center gap-2 rounded-xl bg-[#b5ff36] px-4 py-2.5 text-sm font-bold text-black hover:bg-[#c5ff63]"><Check size={16}/>{task.id ? 'Salvar alterações' : 'Criar tarefa'}</button></div>
    </form>
  </div>
}

function SelectField({ label, value, onChange, options }) {
  return <label><span className="mb-1.5 block text-xs text-[#7b8490]">{label}</span><div className="relative"><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-xl border border-white/[.08] bg-[#0b0f14] px-3 py-2.5 text-xs outline-none focus:border-[#b5ff36]/35">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select><ChevronDown size={13} className="pointer-events-none absolute right-3 top-3 text-[#646c77]"/></div></label>
}

export default App
