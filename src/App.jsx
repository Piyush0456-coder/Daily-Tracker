import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, CalendarDays, Check,
  ChevronDown, CircleHelp, Clock3, Flame, LayoutDashboard, ListChecks,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Target,
  TrendingUp, X, Zap
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip,
  Bar, BarChart, XAxis, YAxis
} from 'recharts'
import { isSupabaseConfigured, supabase } from './lib/supabase.js'

const initialTasks = [
  { id: 1, title: 'Morning workout', category: 'Health', priority: 'High', days: [1, 2, 3, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 18, 19, 20, 21, 23, 24, 25, 27, 28, 29] },
  { id: 2, title: 'Read 20 pages', category: 'Learning', priority: 'Medium', days: [1, 2, 4, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 22, 23, 25, 26, 28] },
  { id: 3, title: 'Deep work session', category: 'Work', priority: 'High', days: [1, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14, 16, 17, 19, 20, 21, 23, 24, 26, 27, 28, 29] },
  { id: 4, title: 'Journal & reflect', category: 'Mindfulness', priority: 'Low', days: [1, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29] },
  { id: 5, title: 'Drink 2L water', category: 'Health', priority: 'Medium', days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29] },
]
const days = Array.from({ length: 30 }, (_, i) => i + 1)
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth()
const currentMonthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const currentDay = Math.min(currentDate.getDate(), 30)
const dateForDay = (day) => `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
const weeklyData = [
  { day: 'Mon', done: 6, goal: 8 }, { day: 'Tue', done: 7, goal: 8 },
  { day: 'Wed', done: 5, goal: 8 }, { day: 'Thu', done: 8, goal: 8 },
  { day: 'Fri', done: 6, goal: 8 }, { day: 'Sat', done: 4, goal: 6 },
  { day: 'Sun', done: 7, goal: 8 },
]
const trendData = [
  { date: 'Sep 23', value: 42 }, { date: 'Sep 24', value: 54 },
  { date: 'Sep 25', value: 48 }, { date: 'Sep 26', value: 67 },
  { date: 'Sep 27', value: 59 }, { date: 'Sep 28', value: 76 },
  { date: 'Sep 29', value: 71 }, { date: 'Sep 30', value: 83 },
  { date: 'Oct 1', value: 78 }, { date: 'Oct 2', value: 88 },
  { date: 'Oct 3', value: 82 }, { date: 'Oct 4', value: 92 },
]
const categories = [
  { name: 'Health', color: '#34d399', value: 84, count: '2 habits' },
  { name: 'Learning', color: '#60a5fa', value: 72, count: '1 habit' },
  { name: 'Work', color: '#c084fc', value: 91, count: '1 habit' },
  { name: 'Mindfulness', color: '#fbbf24', value: 68, count: '1 habit' },
]
const navItems = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Habit matrix', icon: CalendarDays },
  { name: 'Analytics', icon: TrendingUp },
]

function StatCard({ icon: Icon, label, value, change, tone = 'green', detail }) {
  return <article className="stat-card panel">
    <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value-row"><strong>{value}</strong>{change && <span className="stat-change"><ArrowUpRight size={14} />{change}</span>}</div>
    <div className="stat-detail">{detail}</div>
  </article>
}
function ProgressRing({ value }) {
  return <div className="ring" style={{ '--progress': `${value * 3.6}deg` }}><div className="ring-inner"><strong>{value}%</strong><span>completed</span></div></div>
}
function DashboardApp({ session, onSignOut }) {
  const [tasks, setTasks] = useState(session && supabase ? [] : initialTasks)
  const [dataLoading, setDataLoading] = useState(Boolean(session && supabase))
  const [busy, setBusy] = useState(false)
  const [activeNav, setActiveNav] = useState('Overview')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Health', priority: 'Medium' })
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!session?.user?.id || !supabase) {
      setDataLoading(false)
      return
    }
    let active = true
    async function loadWorkspace() {
      setDataLoading(true)
      try {
        const { data: habitRows, error: habitError } = await supabase
          .from('habits')
          .select('id, title, category, priority, is_active, created_at')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: true })
        if (habitError) throw habitError

        const firstDate = dateForDay(1)
        const lastDate = dateForDay(30)
        const { data: logRows, error: logError } = await supabase
          .from('habit_logs')
          .select('habit_id, completion_date, is_completed')
          .eq('user_id', session.user.id)
          .gte('completion_date', firstDate)
          .lte('completion_date', lastDate)
        if (logError) throw logError

        const logsByHabit = new Map()
        for (const log of (logRows || [])) {
          if (!log.is_completed) continue
          const dayNumber = Number(String(log.completion_date).slice(-2))
          if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, [])
          logsByHabit.get(log.habit_id).push(dayNumber)
        }
        if (active) setTasks((habitRows || []).map(habit => ({
          id: habit.id,
          title: habit.title,
          category: habit.category,
          priority: habit.priority,
          days: logsByHabit.get(habit.id) || [],
        })))
      } catch (err) {
        if (active) setNotice(`Could not load your saved habits: ${err?.message || 'Please try again.'}`)
      } finally {
        if (active) setDataLoading(false)
      }
    }
    loadWorkspace()
    return () => { active = false }
  }, [session?.user?.id])

  const filteredTasks = useMemo(() => tasks.filter(t =>
    (categoryFilter === 'All categories' || t.category === categoryFilter) &&
    t.title.toLowerCase().includes(search.toLowerCase())
  ), [tasks, categoryFilter, search])
  const totalChecks = tasks.length * 30
  const doneChecks = tasks.reduce((sum, t) => sum + t.days.length, 0)
  const overall = totalChecks ? Math.round(doneChecks / totalChecks * 100) : 0
  const todayDone = tasks.filter(t => t.days.includes(currentDay)).length
  const streakFor = (task) => {
    const completed = new Set(task.days)
    let streak = 0
    let day = currentDay
    while (day >= 1 && completed.has(day)) { streak++; day-- }
    return streak
  }
  const currentStreak = tasks.length ? Math.max(0, ...tasks.map(streakFor)) : 0
  const longestStreak = tasks.reduce((best, task) => {
    const completed = [...new Set(task.days)].sort((a, b) => a - b)
    let run = 0, previous = 0, taskBest = 0
    for (const day of completed) { run = day === previous + 1 ? run + 1 : 1; taskBest = Math.max(taskBest, run); previous = day }
    return Math.max(best, taskBest)
  }, 0)
  const bestCategory = [...new Set(tasks.map(task => task.category))].map(name => {
    const matching = tasks.filter(task => task.category === name)
    const possible = matching.length * 30
    const completed = matching.reduce((sum, task) => sum + task.days.length, 0)
    return { name, rate: possible ? Math.round(completed / possible * 100) : 0 }
  }).sort((a, b) => b.rate - a.rate)[0]
  const categoriesAvailable = ['All categories', ...new Set(tasks.map(t => t.category))]
  const matrixLabel = activeNav === 'Overview' ? '30-day habit matrix' : activeNav === 'Habit matrix' ? 'Your habit matrix' : 'Category performance'
  const monthlyTrend = days.map(day => {
    const completed = tasks.reduce((sum, task) => sum + (task.days.includes(day) ? 1 : 0), 0)
    return { date: String(day), value: tasks.length ? Math.round(completed / tasks.length * 100) : 0 }
  })
  const thisWeekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + i)
    return { date, day: date.toLocaleDateString('en-US', { weekday: 'short' }), dayNumber: date.getDate() }
  })
  const liveWeeklyData = thisWeekDays.map(item => ({
    day: item.day,
    done: tasks.reduce((sum, task) => sum + (item.date.getMonth() === currentMonth && item.dayNumber <= 30 && task.days.includes(item.dayNumber) ? 1 : 0), 0),
    goal: tasks.length,
  }))
  const weeklyDone = liveWeeklyData.reduce((sum, item) => sum + item.done, 0)
  const weeklyGoal = liveWeeklyData.reduce((sum, item) => sum + item.goal, 0)

  function exportMonthlyReport() {
    const rows = [['Habit', 'Category', 'Priority', 'Month', 'Completed days', 'Days tracked', 'Completion rate']]
    for (const task of tasks) {
      const completedDays = [...new Set(task.days)].sort((a, b) => a - b)
      const rate = days.length ? Math.round(completedDays.length / days.length * 100) : 0
      rows.push([task.title, task.category, task.priority, currentMonthLabel, completedDays.join('; '), days.length, `${rate}%`])
    }
    rows.push([])
    rows.push(['Summary', 'Value'])
    rows.push(['Total habits', tasks.length])
    rows.push(['Completed check-ins', doneChecks])
    rows.push(['Overall completion rate', `${overall}%`])
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `daily-tracker-report-${currentYear}-${String(currentMonth + 1).padStart(2, '0')}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    showNotice('Monthly report exported as CSV.')
  }

  function showNotice(message) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3000)
  }

  async function toggleDay(taskId, day) {
    const task = tasks.find(item => item.id === taskId)
    if (!task) return
    const wasCompleted = task.days.includes(day)
    const nextDays = wasCompleted ? task.days.filter(d => d !== day) : [...task.days, day]
    if (session && supabase) {
      const { error } = await supabase.from('habit_logs').upsert({
        user_id: session.user.id,
        habit_id: taskId,
        completion_date: dateForDay(day),
        is_completed: !wasCompleted,
      }, { onConflict: 'habit_id,completion_date' })
      if (error) { showNotice(`Could not save check-in: ${error.message}`); return }
    }
    setTasks(current => current.map(item => item.id === taskId ? { ...item, days: nextDays } : item))
  }

  async function addTask(e) {
    e.preventDefault()
    if (!form.title.trim() || busy) return
    setBusy(true)
    try {
      let newTask
      if (session && supabase) {
        const { data, error } = await supabase.from('habits').insert({
          user_id: session.user.id,
          title: form.title.trim(),
          category: form.category,
          priority: form.priority,
        }).select('id, title, category, priority').single()
        if (error) throw error
        newTask = { id: data.id, title: data.title, category: data.category, priority: data.priority, days: [] }
      } else {
        newTask = { id: Date.now(), title: form.title.trim(), category: form.category, priority: form.priority, days: [] }
      }
      setTasks(current => [...current, newTask])
      setForm({ title: '', category: 'Health', priority: 'Medium' })
      setShowAdd(false)
      showNotice('Habit added to your matrix.')
    } catch (err) {
      showNotice(`Could not add habit: ${err?.message || 'Please try again.'}`)
    } finally { setBusy(false) }
  }

  async function deleteTask(id) {
    if (session && supabase) {
      const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', session.user.id)
      if (error) { showNotice(`Could not delete habit: ${error.message}`); return }
    }
    setTasks(current => current.filter(t => t.id !== id))
    showNotice('Habit removed.')
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={22} strokeWidth={2.5} /></div><div><strong>daily<span>tracker</span></strong><small>PERSONAL WORKSPACE</small></div><button className="icon-button close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="main-nav">{navItems.map(item => <button key={item.name} className={`nav-item ${activeNav === item.name ? 'active' : ''}`} onClick={() => { setActiveNav(item.name); setMobileNav(false) }}><item.icon size={18}/><span>{item.name}</span>{item.name === 'Habit matrix' && <span className="nav-count">{tasks.length}</span>}</button>)}</nav>
      <div className="sidebar-section">
        <div className="section-heading">YOUR FOCUS <button className="tiny-add" onClick={() => setShowAdd(true)} aria-label="Add habit"><Plus size={15}/></button></div>
        {categories.slice(0, 4).map(cat => <button key={cat.name} className="focus-item" onClick={() => { setCategoryFilter(cat.name); setActiveNav('Habit matrix'); setMobileNav(false) }}><i style={{ background: cat.color }}/><span>{cat.name}</span><span className="focus-number">{tasks.filter(t => t.category === cat.name).length}</span></button>)}
      </div>
      <div className="sidebar-bottom">
        <div className="streak-mini"><div className="streak-fire"><Flame size={19}/></div><div><strong>{currentStreak} day streak</strong><small>Longest run: {longestStreak} days</small></div></div>
        <button className="nav-item"><Settings size={18}/><span>Settings</span></button>
        <button className="nav-item"><CircleHelp size={18}/><span>Help & support</span></button>
        <div className="profile-row"><div className="avatar">{session?.user?.email ? session.user.email.slice(0, 2).toUpperCase() : 'DT'}</div><div className="profile-text"><strong>{session?.user?.email ? session.user.email.split('@')[0] : 'Daily Tracker'}</strong><small>{isSupabaseConfigured ? (session ? 'Signed in' : 'Preview workspace') : 'Preview workspace'}</small></div>{session && <button className="profile-logout" onClick={onSignOut} title="Sign out" aria-label="Sign out"><LogOut size={15}/></button>}</div>
      </div>
    </aside>
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{activeNav}</strong></div></div>
        <div className="topbar-actions"><div className="date-chip"><CalendarDays size={15}/><span>{currentMonthLabel}</span></div><button className="icon-button notification-button" aria-label="Notifications"><Bell size={18}/><i/></button><div className="top-avatar">DT</div></div>
      </header>
      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR PERSONAL GROWTH SPACE</div><h1>{activeNav === 'Overview' ? 'Good afternoon.' : activeNav === 'Habit matrix' ? 'Your habits, your pace.' : 'Small steps. Big progress.'}</h1><p>{activeNav === 'Overview' ? "Every small action compounds. Here's how you're doing." : activeNav === 'Habit matrix' ? 'Build consistency by showing up one day at a time.' : 'Understand your patterns and celebrate your progress.'}</p></div><div className="welcome-actions"><button className="secondary-button" onClick={exportMonthlyReport}><ArrowDownRight size={16}/> Export report</button><button className="primary-button" onClick={() => setShowAdd(true)}><Plus size={17}/> Add a habit</button></div></section>

        {notice && <div className="toast"><Check size={16}/>{notice}</div>}
        {dataLoading && <div className="preview-banner"><div className="preview-icon"><Activity size={17}/></div><div><strong>Loading your workspace</strong><span>Fetching your habits and check-ins from Supabase…</span></div></div>}
        {!isSupabaseConfigured && <div className="preview-banner"><div className="preview-icon"><ShieldCheck size={17}/></div><div><strong>Preview mode</strong><span>You're exploring sample data. Add your Supabase URL and publishable key to enable secure accounts and database saving.</span></div><span className="preview-tag">DEMO DATA</span></div>}

        <section className="stats-grid">
          <StatCard icon={Target} label="Overall completion" value={`${overall}%`} detail="Across your 30-day plan" />
          <StatCard icon={Check} label="Completed today" value={`${todayDone}/${tasks.length}`} tone="blue" detail="Habits checked off today" />
          <StatCard icon={Flame} label="Current streak" value={`${currentStreak} days`} tone="orange" detail="Consecutive completed days" />
          <StatCard icon={Zap} label="Longest streak" value={`${longestStreak} days`} tone="purple" detail="Best consecutive run this month" />
        </section>

        <section className="insights-grid">
          <article className="panel trend-panel">
            <div className="panel-heading"><div><h2>Consistency over time</h2><p>Daily completion rate this month</p></div><span className="select-button">{currentMonthLabel}</span></div>
            <div className="trend-legend"><span><i/> Completion rate</span><span className="trend-highlight">{doneChecks} total check-ins</span></div>
            <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyTrend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}><defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity={0.24}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#25332f" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="date" tick={{ fill: '#82918b', fontSize: 10 }} tickLine={false} axisLine={false} interval={4}/><YAxis domain={[0, 100]} tick={{ fill: '#82918b', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`}/><Tooltip contentStyle={{ background: '#101c18', border: '1px solid #2b4037', borderRadius: 10, color: '#effaf4' }} formatter={v => [`${v}%`, 'Completion']}/><Area type="monotone" dataKey="value" stroke="#34d399" strokeWidth={2.5} fill="url(#trendFill)" activeDot={{ r: 5, fill: '#34d399', stroke: '#10251c', strokeWidth: 3 }}/></AreaChart></ResponsiveContainer></div>
          </article>
          <article className="panel weekly-panel">
            <div className="panel-heading"><div><h2>This week</h2><p>Daily habit check-ins</p></div><button className="icon-button"><ArrowDownRight size={17}/></button></div>
            <div className="weekly-summary"><strong>{weeklyDone} <span>/ {weeklyGoal}</span></strong><span className="weekly-rate">{weeklyGoal ? Math.round(weeklyDone / weeklyGoal * 100) : 0}%</span></div>
            <div className="bar-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={liveWeeklyData} barSize={17} margin={{ top: 6, right: 0, left: -26, bottom: 0 }}><CartesianGrid stroke="#25332f" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="day" tick={{ fill: '#82918b', fontSize: 10 }} tickLine={false} axisLine={false}/><YAxis hide domain={[0, 10]}/><Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ background: '#101c18', border: '1px solid #2b4037', borderRadius: 10, color: '#effaf4' }}/><Bar dataKey="done" name="Completed" fill="#34d399" radius={[5,5,2,2]}/><Bar dataKey="goal" name="Goal" fill="#263a31" radius={[5,5,2,2]} /></BarChart></ResponsiveContainer></div>
            <div className="weekly-footer"><span><i className="legend-dot green-dot"/> Completed</span><span><i className="legend-dot gray-dot"/> Goal</span></div>
          </article>
        </section>

        <section className="lower-grid">
          <article className="panel matrix-panel">
            <div className="panel-heading matrix-heading"><div><div className="heading-title-row"><h2>{matrixLabel}</h2><span className="live-pill"><i/> LIVE</span></div><p>Track your daily habits for the month</p></div><button className="text-button" onClick={() => setActiveNav(activeNav === 'Habit matrix' ? 'Overview' : 'Habit matrix')}>{activeNav === 'Habit matrix' ? 'Back to overview' : 'View matrix'} <span>→</span></button></div>
            <div className="matrix-toolbar"><div className="search-field"><Search size={15}/><input placeholder="Search habits..." value={search} onChange={e => setSearch(e.target.value)}/>{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={13}/></button>}</div><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} aria-label="Filter category">{categoriesAvailable.map(c => <option key={c}>{c}</option>)}</select></div>
            <div className="matrix-wrap"><table className="habit-table"><thead><tr><th className="habit-name-head">HABIT / ROUTINE</th>{days.map(d => <th key={d} className={d === currentDay ? 'today-col' : ''}>{d}</th>)}<th className="completion-head">DONE</th><th></th></tr></thead><tbody>{filteredTasks.map(task => <tr key={task.id}><td className="habit-name-cell"><div className="habit-title">{task.title}</div><div className="habit-meta"><span className={`category-dot ${task.category.toLowerCase()}`}/>{task.category}<span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span></div></td>{days.map(d => <td key={d} className={d === currentDay ? 'today-col' : ''}><button className={`day-check ${task.days.includes(d) ? 'checked' : ''}`} onClick={() => toggleDay(task.id, d)} aria-label={`${task.title}, day ${d}, ${task.days.includes(d) ? 'completed' : 'not completed'}`}>{task.days.includes(d) && <Check size={11} strokeWidth={3}/>}</button></td>)}<td className="completion-cell"><span>{Math.round(task.days.length / 30 * 100)}%</span></td><td><button className="delete-button" onClick={() => deleteTask(task.id)} title="Delete habit" aria-label={`Delete ${task.title}`}><X size={14}/></button></td></tr>)}</tbody></table>{filteredTasks.length === 0 && <div className="empty-state">No habits yet (or none match your search). Add a habit to get started.</div>}</div>
            <div className="matrix-footer"><span>Showing <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> habits</span><span><i className="legend-dot green-dot"/> Completed <i className="legend-dot gray-dot"/> Not completed</span></div>
          </article>
          <article className="panel category-panel">
            <div className="panel-heading"><div><h2>Category breakdown</h2><p>Where your energy goes</p></div><button className="icon-button"><TrendingUp size={17}/></button></div>
            <div className="category-progress"><ProgressRing value={overall}/><div className="category-center-copy"><strong>Overall</strong><span>completion</span></div></div>
            <div className="category-list">{[...new Set(tasks.map(task => task.category))].map(name => { const matching = tasks.filter(task => task.category === name); const checks = matching.reduce((sum, task) => sum + task.days.length, 0); const possible = matching.length * 30; const value = possible ? Math.round(checks / possible * 100) : 0; const palette = categories.find(cat => cat.name === name)?.color || '#34d399'; return <div className="category-row" key={name}><div className="category-top"><span><i style={{ background: palette }}/>{name}</span><strong>{value}%</strong></div><div className="progress-track"><div style={{ width: `${value}%`, background: palette }}/></div><small>{matching.length} {matching.length === 1 ? 'habit' : 'habits'}</small></div>})}</div>
            <div className="insight-note"><div><Sparkles size={15}/></div><p><strong>{bestCategory ? `Top category: ${bestCategory.name}` : 'Start your first habit'}</strong>{bestCategory ? `${bestCategory.rate}% completion rate this month. Keep building consistency in your strongest area.` : 'Add a habit and mark daily progress to start seeing your analytics.'}</p></div>
          </article>
        </section>
        <footer className="page-footer"><span>Made for progress, not perfection <span className="heart">♥</span></span><span><i/> All systems {isSupabaseConfigured ? 'connected' : 'running in preview'}</span><span>DAILY TRACKER · 2026</span></footer>
      </div>
    </main>

    {showAdd && <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowAdd(false)}><form className="add-modal" onSubmit={addTask}><div className="modal-head"><div><div className="eyebrow"><Sparkles size={13}/> BUILD YOUR ROUTINE</div><h2>Add a new habit</h2><p>Small, repeatable actions create lasting change.</p></div><button type="button" className="icon-button" onClick={() => setShowAdd(false)} aria-label="Close"><X size={18}/></button></div><label>Habit name<input autoFocus maxLength={80} required placeholder="e.g. Practice coding for 30 minutes" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label><div className="form-two"><label>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{['Health','Learning','Work','Mindfulness','Personal','Finance'].map(c => <option key={c}>{c}</option>)}</select></label><label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{['Low','Medium','High'].map(p => <option key={p}>{p}</option>)}</select></label></div><div className="modal-note"><CalendarDays size={16}/> This habit will be added to your 30-day matrix.</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="primary-button" disabled={busy}><Plus size={16}/> {busy ? 'Saving…' : 'Create habit'}</button></div></form></div>}
  </div>
}


function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage(''); setError('')
    try {
      if (!supabase) throw new Error('Supabase is not configured. Add your project URL and anon/publishable key to .env.local.')
      if (mode === 'register') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
        if (authError) throw authError
        setMessage(data.session ? 'Account created. You are signed in.' : 'Account created. Check your email for a confirmation link if confirmation is enabled in Supabase.')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
      }
    } catch (err) { setError(err?.message || 'Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }
  return <div className="auth-shell"><div className="auth-card">
    <div className="auth-brand"><div className="brand-mark"><Activity size={22}/></div><div><strong>daily<span>tracker</span></strong><small>PERSONAL WORKSPACE</small></div></div>
    <div className="auth-eyebrow"><ShieldCheck size={14}/> YOUR SPACE, YOUR PROGRESS</div>
    <h1>{mode === 'login' ? 'Welcome back.' : 'Start your journey.'}</h1>
    <p className="auth-subtitle">{mode === 'login' ? 'Sign in to pick up where you left off.' : 'Create your account and build better routines.'}</p>
    {error && <div className="auth-error" role="alert">{error}</div>}{message && <div className="auth-success" role="status">{message}</div>}
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<input type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label>
      <label>Password<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={6} required placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)}/></label>
      <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>→</span></button>
    </form>
    <div className="auth-switch">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={() => {setMode(mode === 'login' ? 'register' : 'login');setError('');setMessage('')}}>{mode === 'login' ? 'Create account' : 'Sign in'}</button></div>
    <div className="auth-security"><ShieldCheck size={14}/> Email/password authentication powered by Supabase</div>
  </div><div className="auth-footer">Made for progress, not perfection <span>♥</span></div></div>
}

export default function App() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    if (!supabase) { setChecking(false); return undefined }
    let alive = true
    supabase.auth.getSession().then(({data}) => { if (alive) { setSession(data.session); setChecking(false) } }).catch(() => { if (alive) setChecking(false) })
    const {data: listener} = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setChecking(false) })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])
  async function signOut() { if (supabase) await supabase.auth.signOut(); setSession(null) }
  if (!isSupabaseConfigured) return <DashboardApp session={null} onSignOut={signOut}/>
  if (checking) return <div className="auth-loading"><div className="loading-mark"><Activity size={22}/></div><span>Opening your workspace…</span></div>
  return session ? <DashboardApp session={session} onSignOut={signOut}/> : <AuthScreen/>
}
