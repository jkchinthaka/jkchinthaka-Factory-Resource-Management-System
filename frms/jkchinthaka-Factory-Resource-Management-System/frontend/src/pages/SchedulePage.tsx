import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { useToast } from '../components/ui/toast-provider';
import { scheduleService } from '../services/dataService';
import type { WorkSchedule } from '../models/types';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, CalendarDays, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  day: z.string().min(1, 'Day/date required'),
  is_holiday: z.boolean().optional(),
  holiday_name: z.string().optional(),
  ppu_planned: z.coerce.number().min(0).default(0),
  ppu_actual: z.coerce.number().min(0).default(0),
  fpu_planned: z.coerce.number().min(0).default(0),
  fpu_actual: z.coerce.number().min(0).default(0),
  fmu_planned: z.coerce.number().min(0).default(0),
  fmu_actual: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function SchedulePage() {
  const [records, setRecords] = useState<WorkSchedule[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_holiday: false },
  });

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page, limit: 15, sort: 'day', order: 'DESC' };
      if (search) params.filter = `day:${search}`;
      const res = await scheduleService.getAll(params);
      setRecords(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editId) {
        await scheduleService.update(editId, data);
        toast({ type: 'success', title: 'Schedule updated' });
      } else {
        await scheduleService.create(data);
        toast({ type: 'success', title: 'Schedule created' });
      }
      setShowForm(false); setEditId(null); reset(); loadData();
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.error || 'Error saving schedule' });
    }
  };

  const handleEdit = (rec: WorkSchedule) => {
    setEditId(rec.id);
    if (rec.day) setValue('day', new Date(rec.day).toISOString().split('T')[0]);
    setValue('is_holiday', rec.is_holiday);
    setValue('holiday_name', rec.holiday_name || '');
    setValue('ppu_planned', rec.ppu_planned);
    setValue('ppu_actual', rec.ppu_actual);
    setValue('fpu_planned', rec.fpu_planned);
    setValue('fpu_actual', rec.fpu_actual);
    setValue('fmu_planned', rec.fmu_planned);
    setValue('fmu_actual', rec.fmu_actual);
    setValue('notes', rec.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try { await scheduleService.delete(id); toast({ type: 'success', title: 'Schedule deleted' }); loadData(); }
    catch { toast({ type: 'error', title: 'Delete failed' }); }
  };

  const totalPlanned = (rec: WorkSchedule) => rec.ppu_planned + rec.fpu_planned + rec.fmu_planned;
  const totalActual = (rec: WorkSchedule) => rec.ppu_actual + rec.fpu_actual + rec.fmu_actual;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays className="h-7 w-7 text-green-500" /> Work Schedule</h1>
          <p className="text-muted-foreground">Manage daily work schedules and attendance</p>
        </div>
        <Button onClick={() => { setEditId(null); reset(); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Add Schedule</Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card>
            <CardHeader><CardTitle>{editId ? 'Edit' : 'New'} Schedule</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Day (Date)</Label>
                  <Input type="date" {...register('day')} />
                  {errors.day && <p className="text-xs text-red-500 mt-1">{errors.day.message}</p>}
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" {...register('is_holiday')} id="is_holiday" className="h-4 w-4" />
                  <Label htmlFor="is_holiday">Holiday</Label>
                </div>
                <div>
                  <Label>Holiday Name</Label>
                  <Input {...register('holiday_name')} placeholder="If holiday" />
                </div>
                <div>
                  <Label>PPU Planned</Label>
                  <Input type="number" {...register('ppu_planned')} />
                </div>
                <div>
                  <Label>PPU Actual</Label>
                  <Input type="number" {...register('ppu_actual')} />
                </div>
                <div>
                  <Label>FPU Planned</Label>
                  <Input type="number" {...register('fpu_planned')} />
                </div>
                <div>
                  <Label>FPU Actual</Label>
                  <Input type="number" {...register('fpu_actual')} />
                </div>
                <div>
                  <Label>FMU Planned</Label>
                  <Input type="number" {...register('fmu_planned')} />
                </div>
                <div>
                  <Label>FMU Actual</Label>
                  <Input type="number" {...register('fmu_actual')} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input {...register('notes')} placeholder="Optional" />
                </div>
                <div className="md:col-span-2 lg:col-span-4 flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); reset(); }}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Filter by day (YYYY-MM-DD)" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Holiday</TableHead>
                <TableHead className="text-right">PPU P</TableHead>
                <TableHead className="text-right">PPU A</TableHead>
                <TableHead className="text-right">FPU P</TableHead>
                <TableHead className="text-right">FPU A</TableHead>
                <TableHead className="text-right">FMU P</TableHead>
                <TableHead className="text-right">FMU A</TableHead>
                <TableHead className="text-right">Total P</TableHead>
                <TableHead className="text-right">Total A</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={12} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : records.map(rec => (
                <TableRow key={rec.id} className={rec.is_holiday ? 'bg-amber-50 dark:bg-amber-900/20' : ''}>
                  <TableCell>{new Date(rec.day).toLocaleDateString()}</TableCell>
                  <TableCell>{rec.is_holiday ? <span className="text-amber-600 font-medium">{rec.holiday_name || 'Yes'}</span> : '—'}</TableCell>
                  <TableCell className="text-right">{rec.ppu_planned}</TableCell>
                  <TableCell className="text-right">{rec.ppu_actual}</TableCell>
                  <TableCell className="text-right">{rec.fpu_planned}</TableCell>
                  <TableCell className="text-right">{rec.fpu_actual}</TableCell>
                  <TableCell className="text-right">{rec.fmu_planned}</TableCell>
                  <TableCell className="text-right">{rec.fmu_actual}</TableCell>
                  <TableCell className="text-right font-medium">{totalPlanned(rec)}</TableCell>
                  <TableCell className="text-right font-medium">{totalActual(rec)}</TableCell>
                  <TableCell className="max-w-[120px] truncate">{rec.notes || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rec)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(rec.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /> Prev</Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </motion.div>
  );
}
