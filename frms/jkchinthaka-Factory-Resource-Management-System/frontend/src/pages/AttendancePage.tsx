import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/toast-provider';
import { attendanceService } from '../services/dataService';
import type { AttendanceDateResponse, AttendanceEntry, AttendanceSummary } from '../models/types';
import {
  UserCheck, UserX, RefreshCw, CheckCircle2, XCircle,
  Clock, Users, ChevronRight, ChevronLeft, Loader2,
  CalendarDays, CheckCheck
} from 'lucide-react';

const SWIPE_THRESHOLD = 110;

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function roleBadgeColor(role: string) {
  if (role === 'Admin') return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
  if (role === 'Manager') return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

type Filter = 'all' | 'pending' | 'active' | 'deactive';

// ── individual swipe card ────────────────────────────────────────────────────
function SwipeCard({
  entry,
  saving,
  onMark,
}: {
  entry: AttendanceEntry;
  saving: boolean;
  onMark: (entry: AttendanceEntry, status: 'active' | 'deactive') => void;
}) {
  const x = useMotionValue(0);
  const dragRef = useRef(false);

  // background colour while dragging
  const bgOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD], [1, 0, 1]);
  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const redOpacity   = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  // label opacity / scale
  const activeLabelOpacity  = useTransform(x, [40, SWIPE_THRESHOLD], [0, 1]);
  const deactiveLabelOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40], [1, 0]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    dragRef.current = false;
    if (saving) { animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 }); return; }
    if (info.offset.x > SWIPE_THRESHOLD) {
      onMark(entry, 'active');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onMark(entry, 'deactive');
    }
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
  };

  const isActive   = entry.status === 'active';
  const isDeactive = entry.status === 'deactive';
  const isPending  = !entry.status;

  return (
    <div className="relative select-none touch-pan-y">
      {/* background hint – green right */}
      <motion.div
        style={{ opacity: greenOpacity }}
        className="absolute inset-0 rounded-xl bg-emerald-500 flex items-center justify-start pl-6 overflow-hidden"
      >
        <div className="flex flex-col items-center text-white font-bold">
          <CheckCircle2 className="h-8 w-8 mb-1" />
          <span className="text-sm tracking-wide uppercase">Active</span>
        </div>
      </motion.div>

      {/* background hint – red left */}
      <motion.div
        style={{ opacity: redOpacity }}
        className="absolute inset-0 rounded-xl bg-red-500 flex items-center justify-end pr-6 overflow-hidden"
      >
        <div className="flex flex-col items-center text-white font-bold">
          <XCircle className="h-8 w-8 mb-1" />
          <span className="text-sm tracking-wide uppercase">Deactive</span>
        </div>
      </motion.div>

      {/* draggable card */}
      <motion.div
        style={{ x }}
        drag={saving ? false : 'x'}
        dragConstraints={{ left: -160, right: 160 }}
        dragElastic={0.15}
        onDragStart={() => { dragRef.current = true; }}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}
        className="relative z-10 cursor-grab active:cursor-grabbing rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm"
      >
        {/* coloured left accent based on status */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
          isActive ? 'bg-emerald-500' : isDeactive ? 'bg-red-500' : 'bg-slate-300'
        }`} />

        <div className="p-4 flex items-center gap-4">
          {/* avatar */}
          <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 ${avatarColor(entry.user_name)}`}>
            {saving
              ? <Loader2 className="h-5 w-5 animate-spin text-white" />
              : getInitials(entry.user_name)
            }
          </div>

          {/* info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{entry.user_name}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${roleBadgeColor(entry.role)}`}>
                {entry.role}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{entry.user_email}</p>
            {entry.marked_at && (
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(entry.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>

          {/* status badge + quick buttons */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isActive   ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200' :
              isDeactive ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' :
                           'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200'
            }`}>
              {isActive ? 'Active' : isDeactive ? 'Deactive' : 'Pending'}
            </span>

            <div className="flex gap-1.5">
              <button
                onClick={() => !saving && onMark(entry, 'active')}
                disabled={saving || isActive}
                title="Mark Active"
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors
                  ${isActive
                    ? 'bg-emerald-500 text-white cursor-default'
                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
                  }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => !saving && onMark(entry, 'deactive')}
                disabled={saving || isDeactive}
                title="Mark Deactive"
                className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors
                  ${isDeactive
                    ? 'bg-red-500 text-white cursor-default'
                    : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white border border-red-200 dark:bg-red-950 dark:border-red-800'
                  }`}
              >
                <UserX className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* swipe direction labels overlaid on the card */}
        <motion.div
          style={{ opacity: activeLabelOpacity }}
          className="absolute inset-0 flex items-center justify-start pl-5 pointer-events-none rounded-xl"
        >
          <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-lg">
            <ChevronRight className="h-6 w-6" /> ACTIVE
          </div>
        </motion.div>
        <motion.div
          style={{ opacity: deactiveLabelOpacity }}
          className="absolute inset-0 flex items-center justify-end pr-5 pointer-events-none rounded-xl"
        >
          <div className="flex items-center gap-1 text-red-600 font-extrabold text-lg">
            DEACTIVE <ChevronLeft className="h-6 w-6" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── main page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [selectedDate, setSelectedDate]   = useState(todayString());
  const [entries, setEntries]             = useState<AttendanceEntry[]>([]);
  const [summary, setSummary]             = useState<AttendanceSummary>({
    date: todayString(), total_marked: 0, total_active: 0, total_deactive: 0,
  });
  const [loading, setLoading]             = useState(true);
  const [savingUserId, setSavingUserId]   = useState<number | null>(null);
  const [filter, setFilter]               = useState<Filter>('all');
  const [bulkSaving, setBulkSaving]       = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([
        attendanceService.getByDate(selectedDate) as Promise<AttendanceDateResponse>,
        attendanceService.getSummary(selectedDate) as Promise<AttendanceSummary>,
      ]);
      setEntries(list.data || []);
      setSummary(sum || { date: selectedDate, total_marked: 0, total_active: 0, total_deactive: 0 });
    } catch {
      toast({ type: 'error', title: 'Failed to load attendance data' });
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedDate]);

  const markAttendance = async (entry: AttendanceEntry, status: 'active' | 'deactive') => {
    if (savingUserId) return;
    setSavingUserId(entry.user_id);
    try {
      await attendanceService.mark({ attendance_date: selectedDate, user_id: entry.user_id, status });
      setEntries(prev => prev.map(e => e.user_id === entry.user_id ? { ...e, status, marked_at: new Date().toISOString() } : e));
      setSummary(prev => {
        const wasActive   = entry.status === 'active';
        const wasDeactive = entry.status === 'deactive';
        const wasPending  = !entry.status;
        const nowActive   = status === 'active';
        const delta = wasPending ? 1 : 0;
        return {
          ...prev,
          total_marked:   prev.total_marked + delta,
          total_active:   prev.total_active   + (nowActive ? 1 : 0) - (wasActive ? 1 : 0),
          total_deactive: prev.total_deactive + (!nowActive ? 1 : 0) - (wasDeactive ? 1 : 0),
        };
      });
      toast({
        type: 'success',
        title: `${entry.user_name} → ${status === 'active' ? '✓ Active' : '✗ Deactive'}`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.error || 'Failed to mark attendance' });
    } finally {
      setSavingUserId(null);
    }
  };

  const markAllActive = async () => {
    const pending = entries.filter(e => !e.status);
    if (!pending.length) return;
    setBulkSaving(true);
    let ok = 0;
    for (const e of pending) {
      try {
        await attendanceService.mark({ attendance_date: selectedDate, user_id: e.user_id, status: 'active' });
        ok++;
      } catch { /* skip */ }
    }
    await loadData();
    setBulkSaving(false);
    toast({ type: 'success', title: `Marked ${ok} pending users as Active` });
  };

  const total    = entries.length;
  const pending  = entries.filter(e => !e.status).length;
  const progress = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

  const filtered = entries.filter(e => {
    if (filter === 'pending')  return !e.status;
    if (filter === 'active')   return e.status === 'active';
    if (filter === 'deactive') return e.status === 'deactive';
    return true;
  });

  const filterTabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: total },
    { key: 'pending',  label: 'Pending',  count: pending },
    { key: 'active',   label: 'Active',   count: summary.total_active },
    { key: 'deactive', label: 'Deactive', count: summary.total_deactive },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-8">

      {/* ── header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-emerald-500" />
            Attendance Marking
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600">
              <ChevronRight className="h-4 w-4" /> Swipe right → Active
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <ChevronLeft className="h-4 w-4" /> Swipe left → Deactive
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-[175px]"
          />
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {pending > 0 && (
            <Button size="sm" onClick={markAllActive} disabled={bulkSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {bulkSaving
                ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                : <CheckCheck className="h-4 w-4 mr-1.5" />}
              Mark All Active
            </Button>
          )}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: total,                  icon: <Users className="h-5 w-5" />,        color: 'text-slate-600',    bg: 'bg-slate-50 dark:bg-slate-800' },
          { label: 'Marked',      value: summary.total_marked,   icon: <CheckCircle2 className="h-5 w-5" />, color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Active',      value: summary.total_active,   icon: <UserCheck className="h-5 w-5" />,    color: 'text-emerald-600',  bg: 'bg-emerald-50 dark:bg-emerald-950' },
          { label: 'Pending',     value: pending,                 icon: <Clock className="h-5 w-5" />,        color: 'text-amber-600',    bg: 'bg-amber-50 dark:bg-amber-950' },
        ].map(k => (
          <Card key={k.label} className={`border-0 shadow-sm ${k.bg}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <span className={k.color}>{k.icon}</span>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── progress bar ── */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Attendance Progress</span>
            <span className="font-semibold text-emerald-600">{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{total - pending} of {total} users marked</p>
        </div>
      )}

      {/* ── filter tabs ── */}
      <div className="flex gap-1.5 border-b pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              filter === tab.key ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── card list ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm">Loading attendance...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Users className="h-10 w-10 opacity-30" />
          <p className="text-sm">No users in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map(entry => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <SwipeCard
                entry={entry}
                saving={savingUserId === entry.user_id}
                onMark={markAttendance}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
