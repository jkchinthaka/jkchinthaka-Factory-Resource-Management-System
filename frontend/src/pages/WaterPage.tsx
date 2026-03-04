import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { useToast } from '../components/ui/toast-provider';
import { waterService } from '../services/dataService';
import type { WaterMeterData } from '../models/types';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Droplets, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  date: z.string().min(1, 'Date required'),
  intake: z.coerce.number().min(0),
  ppu_reading: z.coerce.number().min(0).optional(),
  fpu_reading: z.coerce.number().min(0).optional(),
  chiller: z.coerce.number().min(0).optional(),
  cooling_tower: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function WaterPage() {
  const [records, setRecords] = useState<WaterMeterData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const loadData = useCallback(async () => {
    try {
      const params: Record<string, string | number> = { page, limit: 15, sort: 'date', order: 'DESC' };
      if (search) params.filter = `date:${search}`;
      const res = await waterService.getAll(params);
      setRecords(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editId) {
        await waterService.update(editId, data);
        toast({ type: 'success', title: 'Record updated' });
      } else {
        await waterService.create(data);
        toast({ type: 'success', title: 'Record created' });
      }
      setShowForm(false); setEditId(null); reset(); loadData();
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.error || 'Error saving record' });
    }
  };

  const handleEdit = (rec: WaterMeterData) => {
    setEditId(rec.id);
    setValue('intake', rec.intake);
    setValue('ppu_reading', rec.ppu_reading || 0);
    setValue('fpu_reading', rec.fpu_reading || 0);
    setValue('chiller', rec.chiller || 0);
    setValue('cooling_tower', rec.cooling_tower || 0);
    setValue('cost', rec.cost || 0);
    setValue('notes', rec.notes || '');
    if (rec.date) setValue('date', new Date(rec.date).toISOString().split('T')[0]);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try { await waterService.delete(id); toast({ type: 'success', title: 'Record deleted' }); loadData(); }
    catch { toast({ type: 'error', title: 'Delete failed' }); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Droplets className="h-7 w-7 text-blue-500" /> Water Meter Data</h1>
          <p className="text-muted-foreground">Manage daily water consumption records</p>
        </div>
        <Button onClick={() => { setEditId(null); reset(); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Add Record</Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card>
            <CardHeader><CardTitle>{editId ? 'Edit' : 'New'} Water Record</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
                </div>
                <div>
                  <Label>Water Intake (m³)</Label>
                  <Input type="number" step="0.01" {...register('intake')} placeholder="0.00" />
                </div>
                <div>
                  <Label>PPU Reading</Label>
                  <Input type="number" step="0.01" {...register('ppu_reading')} placeholder="0.00" />
                </div>
                <div>
                  <Label>FPU Reading</Label>
                  <Input type="number" step="0.01" {...register('fpu_reading')} placeholder="0.00" />
                </div>
                <div>
                  <Label>Chiller</Label>
                  <Input type="number" step="0.01" {...register('chiller')} placeholder="0.00" />
                </div>
                <div>
                  <Label>Cooling Tower</Label>
                  <Input type="number" step="0.01" {...register('cooling_tower')} placeholder="0.00" />
                </div>
                <div>
                  <Label>Cost ($)</Label>
                  <Input type="number" step="0.01" {...register('cost')} placeholder="0.00" />
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
        <Input placeholder="Filter by date (YYYY-MM-DD)" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Intake (m³)</TableHead>
                <TableHead className="text-right">PPU</TableHead>
                <TableHead className="text-right">FPU</TableHead>
                <TableHead className="text-right">Chiller</TableHead>
                <TableHead className="text-right">Cooling Tower</TableHead>
                <TableHead className="text-right">Cost ($)</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : records.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
              ) : records.map(rec => (
                <TableRow key={rec.id}>
                  <TableCell>{new Date(rec.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-medium">{rec.intake.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{rec.ppu_reading?.toFixed(2) ?? '—'}</TableCell>
                  <TableCell className="text-right">{rec.fpu_reading?.toFixed(2) ?? '—'}</TableCell>
                  <TableCell className="text-right">{rec.chiller?.toFixed(2) ?? '—'}</TableCell>
                  <TableCell className="text-right">{rec.cooling_tower?.toFixed(2) ?? '—'}</TableCell>
                  <TableCell className="text-right">{rec.cost != null ? `$${rec.cost.toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{rec.notes || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(rec)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
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
