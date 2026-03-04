import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/toast-provider';
import { reportService } from '../services/dataService';
import { FileText, Download, FileSpreadsheet, Zap, Droplets, Factory, CalendarDays } from 'lucide-react';

interface ReportConfig {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  downloadFn: (params: Record<string, string>) => Promise<any>;
}

const reports: ReportConfig[] = [
  { key: 'electricity', label: 'Electricity Report', description: 'Daily energy consumption, costs, and peak demand data', icon: <Zap className="h-6 w-6" />, color: 'text-yellow-500', downloadFn: reportService.downloadElectricity },
  { key: 'water', label: 'Water Report', description: 'Water intake, meter readings, and consumption analysis', icon: <Droplets className="h-6 w-6" />, color: 'text-blue-500', downloadFn: reportService.downloadWater },
  { key: 'production', label: 'Production Report', description: 'Production targets, actuals, and efficiency metrics', icon: <Factory className="h-6 w-6" />, color: 'text-purple-500', downloadFn: reportService.downloadProduction },
  { key: 'schedule', label: 'Schedule Report', description: 'Work schedules, attendance, and holiday information', icon: <CalendarDays className="h-6 w-6" />, color: 'text-green-500', downloadFn: reportService.downloadSchedule },
];

export default function ReportsPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = today.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = async (report: ReportConfig, format: 'pdf' | 'excel') => {
    if (!startDate || !endDate) {
      toast({ type: 'error', title: 'Please select date range' });
      return;
    }
    const downloadKey = `${report.key}-${format}`;
    setDownloading(downloadKey);
    try {
      const response = await report.downloadFn({ startDate, endDate, format });
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.key}_report_${startDate}_${endDate}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({ type: 'success', title: `${report.label} downloaded` });
    } catch (err: any) {
      toast({ type: 'error', title: err.response?.data?.error || `Failed to download ${report.label}` });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-7 w-7 text-orange-500" /> Reports</h1>
        <p className="text-muted-foreground">Generate and download PDF or Excel reports</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Date Range</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-48" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-48" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map(report => (
          <motion.div key={report.key} whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 300 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className={report.color}>{report.icon}</span>
                  {report.label}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={downloading === `${report.key}-pdf`}
                    onClick={() => handleDownload(report, 'pdf')}
                  >
                    {downloading === `${report.key}-pdf` ? (
                      <span className="animate-spin mr-2">⟳</span>
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={downloading === `${report.key}-excel`}
                    onClick={() => handleDownload(report, 'excel')}
                  >
                    {downloading === `${report.key}-excel` ? (
                      <span className="animate-spin mr-2">⟳</span>
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                    )}
                    Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
