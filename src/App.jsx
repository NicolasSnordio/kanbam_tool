import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, stagger } from 'animejs'
import {
  Archive, CalendarDays, Check, ChevronDown,
  ChevronLeft, ChevronRight, Clock3, Columns3, LayoutDashboard, Menu, MoreHorizontal, Plus, Search,
  Settings, SlidersHorizontal, Sparkles, Tag, Trash2, X,
} from 'lucide-react'

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: '#818895' },
  { id: 'next', title: 'Próximas', color: '#9c8cff' },
  { id: 'doing', title: 'Em andamento', color: '#ffb45c' },
  { id: 'done', title: 'Concluídas', color: '#b5ff36' },
]

const SEED_TASKS = [
  { id: 't1', title: 'Mapear fluxo de atendimento', description: 'Documentar as etapas atuais e identificar os maiores gargalos.', status: 'backlog', priority: 'Média', project: 'Operações', dueDate: '2026-10-18', tags: ['processo'] },
  { id: 't2', title: 'Revisar landing page', description: 'Ajustar copy e validar o formulário em dispositivos móveis.', status: 'next', priority: 'Alta', project: 'Website', dueDate: '2026-10-16', tags: ['frontend', 'ui'] },
  { id: 't3', title: 'Integração de novos clientes', description: 'Criar endpoint de importação e feedback de progresso.', status: 'doing', priority: 'Alta', project: 'Plataforma', dueDate: '2026-10-14', tags: ['api'] },
  { id: 't4', title: 'Painel de indicadores', description: 'Finalizar os cards de receita e volume mensal.', status: 'doing', priority: 'Média', project: 'Analytics', dueDate: '2026-10-17', tags: ['dados'] },
  { id: 't5', title: 'Corrigir sessão expirada', description: 'Melhorar retorno visual no redirecionamento para login.', status: 'done', priority: 'Baixa', project: 'Plataforma', dueDate: '2026-10-14', tags: ['bug'] },
]

const STORAGE_KEY = 'kanbam.tasks.v1'

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : SEED_TASKS
    return parsed.map((task) => ({ ...task, dueDate: task.dueDate || migrateLegacyDate(task.due) }))
  } catch { return SEED_TASKS }
}

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function migrateLegacyDate(value) {
  if (!value || value === 'Hoje') return dateKey(new Date())
  const months = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 }
  const [day, month] = value.toLowerCase().split(/\s+/)
  return dateKey(new Date(new Date().getFullYear(), months[month] ?? new Date().getMonth(), Number(day) || new Date().getDate()))
}

function formatDue(value) {
  if (!value) return 'Sem prazo'
  if (value === dateKey(new Date())) return 'Hoje'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)).replace('.', '')
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
  const [view, setView] = useState('board')
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
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} taskCount={tasks.length} view={view} onView={setView} />

      <main className="lg:pl-[230px] min-h-screen">
        <Header onMenu={() => setSidebarOpen(true)} query={query} setQuery={setQuery} onNew={() => setModal({ status: 'backlog' })} />

        {view === 'board' ? <div className="px-4 pb-5 pt-5 sm:px-6 lg:px-7">
          <section className="intro-item mb-5 flex flex-col gap-4 opacity-0 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#7c8491]">
                <span className="size-1.5 rounded-full bg-[#b5ff36] pulse-soft" /> Visão geral
              </div>
              <h1 className="font-display text-2xl font-semibold tracking-[-.045em] sm:text-3xl">Olá, Nicolas <span className="text-[#6e7580]">— vamos produzir.</span></h1>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Em andamento" value={tasks.filter((t) => t.status === 'doing').length} accent="#ffb45c" />
              <Stat label="Entregues" value={tasks.filter((t) => t.status === 'done').length} accent="#b5ff36" />
              <div className="min-w-[96px] rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5 sm:min-w-[116px]">
                <div className="flex items-center justify-between gap-2"><p className="text-[9px] text-[#777f8b] sm:text-[10px]">Progresso</p><strong className="font-display text-base">{progress}%</strong></div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[.08]"><div className="h-full rounded-full bg-[#b5ff36] transition-all" style={{ width: `${progress}%` }} /></div>
              </div>
            </div>
          </section>

          <section className="intro-item mb-3 flex flex-wrap items-center justify-between gap-3 opacity-0">
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

          <div className="scrollbar-hidden overflow-x-auto pb-10">
            <section className="grid min-w-[760px] grid-cols-4 items-start gap-3">
              {COLUMNS.map((column) => (
                <KanbanColumn key={column.id} column={column} tasks={filtered.filter((task) => task.status === column.id)} draggedId={draggedId}
                  onDragStart={setDraggedId} onDrop={moveTask} onNew={() => setModal({ status: column.id })} onEdit={setModal} />
              ))}
            </section>
          </div>
        </div> : <CalendarView tasks={filtered} priority={priority} setPriority={setPriority} onEdit={setModal} onNew={(dueDate) => setModal({ status: 'backlog', dueDate })} />}
      </main>
      {modal && <TaskModal task={modal} onClose={() => setModal(null)} onSave={saveTask} onDelete={modal.id ? deleteTask : null} />}
    </div>
  )
}

function Sidebar({ open, onClose, taskCount, view, onView }) {
  return <>
    {open && <button aria-label="Fechar menu" onClick={onClose} className="fixed inset-0 z-30 bg-black/70 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-40 w-[230px] border-r border-white/[.06] bg-[#0b0f14] px-4 py-5 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      <div className="flex items-center justify-between px-2 mb-9">
        <div className="flex items-center gap-2.5"><div className="grid size-8 place-items-center rounded-[10px] bg-[#b5ff36] text-black"><Columns3 size={18} strokeWidth={2.5}/></div><span className="font-display font-bold tracking-[-.04em] text-lg">kanbam<span className="text-[#b5ff36]">.</span></span></div>
        <button onClick={onClose} className="lg:hidden text-[#69717d]"><X size={18}/></button>
      </div>
      <nav className="space-y-1">
        <NavItem icon={LayoutDashboard} label="Meu quadro" active={view === 'board'} badge={taskCount} onClick={() => { onView('board'); onClose() }} />
        <NavItem icon={CalendarDays} label="Agenda" active={view === 'calendar'} onClick={() => { onView('calendar'); onClose() }} />
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

function NavItem({ icon: Icon, label, active, badge, onClick }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${active ? 'bg-white/[.065] text-white' : 'text-[#727a85] hover:bg-white/[.035] hover:text-white'}`}><Icon size={17}/><span>{label}</span>{badge != null && <span className="ml-auto rounded-md bg-[#b5ff36]/10 px-2 py-0.5 text-[10px] font-bold text-[#b5ff36]">{badge}</span>}</button>
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
  return <div className="min-w-[96px] rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5 sm:min-w-[116px]"><p className="mb-1 text-[9px] text-[#777f8b] sm:text-[10px]">{label}</p><div className="flex items-center gap-2"><span className="size-1.5 rounded-full" style={{ background: accent }} /><strong className="font-display text-base">{value}</strong></div></div>
}

function KanbanColumn({ column, tasks, draggedId, onDragStart, onDrop, onNew, onEdit }) {
  const [over, setOver] = useState(false)
  return <div className="kanban-column min-w-0 rounded-2xl border border-white/[.06] bg-[#0d1117]/90 p-2.5 opacity-0"
    onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); if (draggedId) onDrop(draggedId, column.id); setOver(false) }}>
    <div className="mb-1.5 flex items-center gap-2 px-1 py-1.5"><span className="size-2 rounded-full" style={{ background: column.color }}/><h2 className="text-xs font-semibold">{column.title}</h2><span className="ml-auto rounded-md bg-white/[.055] px-1.5 py-0.5 text-[9px] text-[#8a929d]">{tasks.length}</span><button onClick={onNew} aria-label={`Adicionar em ${column.title}`} className="grid size-6 place-items-center rounded-lg text-[#68707b] hover:bg-white/[.06] hover:text-white"><Plus size={14}/></button></div>
    <div className={`min-h-[100px] space-y-1.5 rounded-xl transition-colors ${over ? 'bg-[#b5ff36]/[.035]' : ''}`}>
      {tasks.map((task) => <TaskCard key={task.id} task={task} onDragStart={onDragStart} onEdit={onEdit}/>) }
      {!tasks.length && <button onClick={onNew} className="flex min-h-[86px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[.08] text-[10px] text-[#59616c] hover:border-[#b5ff36]/20 hover:text-[#8e976e]"><Plus size={15}/> Adicionar tarefa</button>}
    </div>
  </div>
}

function TaskCard({ task, onDragStart, onEdit }) {
  return <article draggable onDragStart={() => onDragStart(task.id)} onDragEnd={() => onDragStart(null)} onClick={() => onEdit(task)} className="group cursor-grab rounded-xl border border-white/[.065] bg-[#151a21] px-3 py-2.5 shadow-[0_8px_20px_rgba(0,0,0,.16)] transition duration-200 hover:-translate-y-px hover:border-white/[.13] hover:bg-[#181e26] active:cursor-grabbing">
    <div className="mb-1.5 flex items-center gap-1.5"><span className={`size-1.5 shrink-0 rounded-full ${task.priority === 'Alta' ? 'bg-[#ff725c]' : task.priority === 'Média' ? 'bg-[#ffb45c]' : 'bg-[#b5ff36]'}`}/><span className="truncate text-[8px] font-bold uppercase tracking-[.09em] text-[#68717d]">{task.project}</span><button aria-label="Editar tarefa" className="ml-auto -mr-1 grid size-5 place-items-center rounded-md text-[#555e69] opacity-40 hover:bg-white/[.06] hover:text-white group-hover:opacity-100"><MoreHorizontal size={13}/></button></div>
    <h3 className="truncate text-[12px] font-semibold leading-snug tracking-[-.01em] text-[#f1f3f5]" title={task.title}>{task.title}</h3>
    {task.description && <p className="mt-1 truncate text-[9px] leading-relaxed text-[#68717d]">{task.description}</p>}
    <div className="mt-2 flex min-w-0 items-center gap-1.5">
      <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[8px] font-semibold ${priorityStyle[task.priority]}`}>{task.priority}</span>
      {task.tags.slice(0, 1).map((tag) => <span key={tag} className="min-w-0 truncate rounded-md bg-white/[.045] px-1.5 py-0.5 text-[8px] text-[#7f8893]">#{tag}</span>)}
      <span className="ml-auto flex shrink-0 items-center gap-1 text-[8px] text-[#69717d]"><CalendarDays size={10}/>{formatDue(task.dueDate)}</span>
    </div>
  </article>
}

function CalendarView({ tasks, priority, setPriority, onEdit, onNew }) {
  const [month, setMonth] = useState(() => new Date())
  const today = dateKey(new Date())
  const rawMonthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)
  const monthLabel = `${rawMonthLabel.charAt(0).toUpperCase()}${rawMonthLabel.slice(1)}`
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const calendarStart = new Date(month.getFullYear(), month.getMonth(), 1 - firstDay.getDay())
  const days = Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index))
  const tasksByDate = useMemo(() => tasks.reduce((grouped, task) => {
    if (!task.dueDate) return grouped
    if (!grouped[task.dueDate]) grouped[task.dueDate] = []
    grouped[task.dueDate].push(task)
    return grouped
  }, {}), [tasks])

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.calendar-shell', { opacity: [0, 1], translateY: [12, 0], duration: 480, ease: 'out(3)' })
    }
  }, [])

  function changeMonth(offset) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return <div className="calendar-shell opacity-0 px-4 py-7 sm:px-7 lg:px-9">
    <section className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-[#7c8491]"><span className="size-1.5 rounded-full bg-[#9c8cff]"/> Agenda</div>
        <h1 className="font-display text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Planeje com clareza.</h1>
        <p className="mt-2 text-sm text-[#878e99]">Visualize prazos e distribua melhor as demandas ao longo do mês.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select aria-label="Filtrar prioridade" value={priority} onChange={(e) => setPriority(e.target.value)} className="appearance-none rounded-xl border border-white/[.08] bg-[#11151b] py-2.5 pl-3 pr-8 text-xs text-[#c6cad0] outline-none focus:border-[#b5ff36]/40">
            {['Todas', 'Alta', 'Média', 'Baixa'].map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-3 text-[#646c77]"/>
        </div>
        <button onClick={() => setMonth(new Date())} className="rounded-xl border border-white/[.08] px-3 py-2.5 text-xs text-[#a3aab3] hover:bg-white/[.04] hover:text-white">Hoje</button>
        <div className="flex rounded-xl border border-white/[.08] bg-[#11151b] p-1">
          <button aria-label="Mês anterior" onClick={() => changeMonth(-1)} className="grid size-8 place-items-center rounded-lg text-[#747d88] hover:bg-white/[.06] hover:text-white"><ChevronLeft size={16}/></button>
          <button aria-label="Próximo mês" onClick={() => changeMonth(1)} className="grid size-8 place-items-center rounded-lg text-[#747d88] hover:bg-white/[.06] hover:text-white"><ChevronRight size={16}/></button>
        </div>
      </div>
    </section>

    <section className="overflow-hidden rounded-[22px] border border-white/[.07] bg-[#0d1117]/90">
      <div className="flex flex-col gap-3 border-b border-white/[.07] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h2 className="font-display text-lg font-semibold tracking-[-.025em]">{monthLabel}</h2>
        <div className="flex flex-wrap gap-3">
          {COLUMNS.map((column) => <span key={column.id} className="flex items-center gap-1.5 text-[10px] text-[#737c87]"><span className="size-1.5 rounded-full" style={{ background: column.color }}/>{column.title}</span>)}
        </div>
      </div>
      <div className="scrollbar-hidden overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 border-b border-white/[.06] bg-white/[.015]">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => <div key={day} className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-[.12em] text-[#59616c]">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = dateKey(day)
              const dayTasks = tasksByDate[key] || []
              const outside = day.getMonth() !== month.getMonth()
              return <div key={key} className={`group/day min-h-[132px] border-b border-r border-white/[.055] p-2 transition-colors hover:bg-white/[.018] ${outside ? 'bg-black/[.08]' : ''}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`grid size-7 place-items-center rounded-full text-xs ${key === today ? 'bg-[#b5ff36] font-bold text-black' : outside ? 'text-[#424a55]' : 'text-[#8d96a1]'}`}>{day.getDate()}</span>
                  <button aria-label={`Adicionar tarefa em ${day.toLocaleDateString('pt-BR')}`} onClick={() => onNew(key)} className="grid size-6 place-items-center rounded-lg text-[#59616c] opacity-0 transition hover:bg-white/[.07] hover:text-white group-hover/day:opacity-100 focus:opacity-100"><Plus size={13}/></button>
                </div>
                <div className="space-y-1.5">
                  {dayTasks.slice(0, 3).map((task) => {
                    const column = COLUMNS.find((item) => item.id === task.status) || COLUMNS[0]
                    return <button key={task.id} onClick={() => onEdit(task)} className="block w-full truncate rounded-lg border border-white/[.055] bg-[#171c23] px-2 py-1.5 text-left text-[10px] font-medium text-[#c7ccd2] transition hover:border-white/[.13] hover:bg-[#1c222b]" style={{ borderLeftColor: column.color, borderLeftWidth: 2 }}>{task.title}</button>
                  })}
                  {dayTasks.length > 3 && <button className="px-2 text-[10px] text-[#69727d]">+{dayTasks.length - 3} tarefas</button>}
                </div>
              </div>
            })}
          </div>
        </div>
      </div>
    </section>
    <p className="mt-3 text-xs text-[#59616c]">Passe o cursor sobre um dia para adicionar uma tarefa diretamente na data.</p>
  </div>
}

function TaskModal({ task, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Média', project: 'Plataforma', dueDate: dateKey(new Date()), tags: [], ...task })
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
        <label><span className="mb-1.5 block text-xs text-[#7b8490]">Prazo</span><div className="relative"><CalendarDays size={14} className="absolute left-3 top-3 text-[#5f6873]"/><input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-xl border border-white/[.08] bg-[#0b0f14] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#b5ff36]/35 [color-scheme:dark]"/></div></label>
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
