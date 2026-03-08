import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '../components/ui/alert-dialog';
import { useToast } from '../components/ui/toast-provider';
import { productionService } from '../services/dataService';
import type { ProductionTarget } from '../models/types';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Factory, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  line_id: z.string().min(1, 'Line ID required'),
  product_group: z.string().min(1, 'Product group required'),
  production_unit: z.string().min(1, 'Production unit required'),
  date: z.string().min(1, 'Date required'),
  target: z.coerce.number().min(0),
  actual: z.coerce.number().min(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProductionPage() {
  const [records, setRecords] = useState<ProductionTarget[]>([]);
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
      if (search) params.filter = `product_group:${search}`;
      const res = await productionService.getAll(params);
      setRecords(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const onSubmit = async (data: FormData) => {
    try {
      if (editId) {
        await productionService.update(editId, data);
        toast({ type: 'success', title: 'Production record updated' });
      } else {
        await productionService.create(data);
        toast({ type: 'success', title: 'Production record created' });
      }
      setShowForm(false); setEditId(null); reset(); loadData();
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.error || 'Error saving record' });
    }
  };

  const handleEdit = (rec: ProductionTarget) => {
    setEditId(rec.id);
    setValue('line_id', rec.line_id);
    setValue('product_group', rec.product_group);
    setValue('production_unit', rec.production_unit);
    if (rec.date) setValue('date', new Date(rec.date).toISOString().split('T')[0]);
    setValue('target', rec.target);
    setValue('actual', rec.actual);
    setValue('notes', rec.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try { await productionService.delete(id); toast({ type: 'success', title: 'Record deleted' }); loadData(); }
    catch { toast({ type: 'error', title: 'Delete failed' }); }
  };

  const efficiencyColor = (eff: number | undefined) => {
    if (!eff) return '';
    if (eff >= 95) return 'text-green-600';
    if (eff >= 80) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Factory className="h-7 w-7 text-purple-500" /> Production Targets</h1>
          <p className="text-muted-foreground">Manage daily production targets and actuals</p>
        </div>
        <Button onClick={() => { setEditId(null); reset(); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" /> Add Record</Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Card>
            <CardHeader><CardTitle>{editId ? 'Edit' : 'New'} Production Record</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
                </div>
                <div>
                  <Label>Line ID</Label>
                  <Input {...register('line_id')} placeholder="e.g. LINE-01" />
                  {errors.line_id && <p className="text-xs text-red-500 mt-1">{errors.line_id.message}</p>}
                </div>
                <div>
                  <Label>Product Group</Label>
                  <Input {...register('product_group')} placeholder="e.g. Group A" />
                  {errors.product_group && <p className="text-xs text-red-500 mt-1">{errors.product_group.message}</p>}
                </div>
                <div>
                  <Label>Production Unit</Label>
                  <Input {...register('production_unit')} placeholder="e.g. PPU" />
                  {errors.production_unit && <p className="text-xs text-red-500 mt-1">{errors.production_unit.message}</p>}
                </div>
                <div>
                  <Label>Target</Label>
                  <Input type="number" {...register('target')} placeholder="0" />
                </div>
                <div>
                  <Label>Actual</Label>
                  <Input type="number" {...register('actual')} placeholder="0" />
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
        <Input placeholder="Filter by product group" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Line ID</TableHead>
                <TableHead>Product Group</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Target</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Efficiency</TableHead>
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
                  <TableCell className="font-medium">{rec.line_id}</TableCell>
                  <TableCell>{rec.product_group}</TableCell>
                  <TableCell>{rec.production_unit}</TableCell>
                  <TableCell className="text-right">{rec.target.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{rec.actual.toLocaleString()}</TableCell>
                  <TableCell className={`text-right font-semibold ${efficiencyColor(rec.efficiency)}`}>
                    {rec.efficiency != null ? `${rec.efficiency.toFixed(1)}%` : '—'}
                  </TableCell>
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
