import jsPDF from 'jspdf';
import { calculateDayMetrics, minutesToHHMM, PUNCH_LABELS } from '@/lib/clockUtils';

export function exportMirrorPDF(records, month, year, employeeName, settings, satRef) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;
  const margin = 10;

  // Header
  doc.setFillColor(26, 44, 106);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ESPELHO DE PONTO ELETRÔNICO', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  doc.text(`${monthNames[month - 1]} / ${year}  |  Colaborador: ${employeeName}`, margin, 20);

  // Table header
  const cols = ['Dia', 'Sem', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Trabalhado', 'Atraso', 'HE 50%', 'HE 100%', 'Noturno'];
  const colW = [12, 12, 20, 20, 20, 20, 22, 18, 18, 18, 18];
  let y = 28;

  doc.setFillColor(26, 44, 106);
  doc.rect(margin, y, W - 2 * margin, 7, 'F');
  doc.setTextColor(255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  let x = margin + 1;
  cols.forEach((c, i) => { doc.text(c, x, y + 5); x += colW[i]; });

  y += 8;
  doc.setTextColor(30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  let totals = { worked: 0, late: 0, ot50: 0, ot100: 0, night: 0 };
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dt = new Date(dateStr + 'T12:00:00');
    const dow = dt.getDay();
    const rec = records.find(r => r.date === dateStr) || {};
    const metrics = calculateDayMetrics(rec, settings, satRef);

    totals.worked += metrics.totalWorked;
    totals.late += metrics.lateness;
    totals.ot50 += metrics.overtime50;
    totals.ot100 += metrics.overtime100;
    totals.night += metrics.nightMinutes;

    if (dow === 0 || metrics.isHoliday) doc.setTextColor(200, 50, 50);
    else doc.setTextColor(30);

    x = margin + 1;
    const row = [
      String(d).padStart(2, '0'),
      weekDays[dow],
      rec.entry_time || '-',
      rec.break_time || '-',
      rec.return_time || '-',
      rec.exit_time || '-',
      metrics.totalWorked ? minutesToHHMM(metrics.totalWorked) : '-',
      metrics.lateness ? minutesToHHMM(metrics.lateness) : '-',
      metrics.overtime50 ? minutesToHHMM(metrics.overtime50) : '-',
      metrics.overtime100 ? minutesToHHMM(metrics.overtime100) : '-',
      metrics.nightMinutes ? minutesToHHMM(metrics.nightMinutes) : '-',
    ];
    row.forEach((val, i) => { doc.text(val, x, y + 4); x += colW[i]; });

    if (d % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, W - 2 * margin, 6, 'F');
      doc.setTextColor(30);
      x = margin + 1;
      row.forEach((val, i) => { doc.text(val, x, y + 4); x += colW[i]; });
    }

    y += 6;
    if (y > H - 40) { doc.addPage(); y = 15; }
  }

  // Totals
  y += 4;
  doc.setFillColor(255, 139, 0);
  doc.rect(margin, y, W - 2 * margin, 8, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAIS:', margin + 2, y + 6);
  doc.text(`Trabalhado: ${minutesToHHMM(totals.worked)}`, margin + 50, y + 6);
  doc.text(`Atrasos: ${minutesToHHMM(totals.late)}`, margin + 95, y + 6);
  doc.text(`HE 50%: ${minutesToHHMM(totals.ot50)}`, margin + 135, y + 6);
  doc.text(`HE 100%: ${minutesToHHMM(totals.ot100)}`, margin + 170, y + 6);
  doc.text(`Noturno: ${minutesToHHMM(totals.night)}`, margin + 210, y + 6);

  // Signatures
  y += 20;
  doc.setTextColor(30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.line(margin, y, margin + 80, y);
  doc.text('Assinatura do Colaborador', margin, y + 5);
  doc.line(W - margin - 80, y, W - margin, y);
  doc.text('Assinatura do Responsável', W - margin - 80, y + 5);

  doc.save(`espelho_ponto_${month}_${year}.pdf`);
}