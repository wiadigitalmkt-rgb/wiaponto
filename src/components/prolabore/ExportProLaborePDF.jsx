import jsPDF from 'jspdf';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const fmtBRL = (v) => (isNaN(v) || v == null) ? 'R$ 0,00' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const toNum = (v) => { const n = parseFloat(typeof v === 'string' ? v.replace(',', '.') : v); return isNaN(n) ? 0 : n; };

function computeCarryover(socio, payments, targetMonth, targetYear) {
  const monthlyTarget = toNum(socio.valor_mensal);
  const myPayments = payments.filter(p => p.socio_email === socio.email);
  const monthMap = {};
  for (const p of myPayments) {
    const key = `${p.ano}-${p.mes}`;
    if (!monthMap[key]) monthMap[key] = { ano: p.ano, mes: p.mes, total: 0 };
    monthMap[key].total += toNum(p.valor_pago);
  }
  let carryover = 0;
  for (const key in monthMap) {
    const { ano, mes, total } = monthMap[key];
    if (ano < targetYear || (ano === targetYear && mes < targetMonth)) {
      const surplus = total - monthlyTarget;
      if (surplus > 0) carryover += surplus;
    }
  }
  return carryover;
}

export function exportProLaborePDF(payments, socio, month, year, allPayments) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const margin = 14;

  // Header
  doc.setFillColor(26, 44, 106);
  doc.rect(0, 0, W, 24, 'F');
  doc.setTextColor(255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE PRÓ-LABORE', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${MONTHS[month - 1]} / ${year}`, margin, 18);
  doc.text(`Sócio: ${socio?.nome || '—'}`, margin, 22);

  // Summary box
  const myPayments = payments.filter(p => p.socio_email === socio.email);
  const monthPayments = myPayments.filter(p => p.mes === month && p.ano === year).sort((a, b) => (a.data || '').localeCompare(b.data || ''));
  const totalPaid = monthPayments.reduce((s, p) => s + toNum(p.valor_pago), 0);
  const monthlyTarget = toNum(socio?.valor_mensal);
  const carryover = computeCarryover(socio, allPayments || payments, month, year);
  const available = monthlyTarget - carryover;
  const saldo = available - totalPaid;

  let y = 32;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, y, W - 2 * margin, 18, 'F');
  doc.setTextColor(30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Meta Mensal:', margin + 3, y + 6);
  doc.text('Superávit Anterior:', margin + 55, y + 6);
  doc.text('Total Pago:', margin + 115, y + 6);
  doc.text('Saldo:', margin + 160, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtBRL(monthlyTarget), margin + 3, y + 13);
  doc.text(fmtBRL(carryover), margin + 55, y + 13);
  doc.text(fmtBRL(totalPaid), margin + 115, y + 13);
  doc.setTextColor(saldo > 0 ? 200 : 30);
  doc.text(fmtBRL(saldo), margin + 160, y + 13);

  // Table header
  y += 24;
  const cols = ['Data', 'Descrição', 'Protocolo', 'Valor'];
  const colW = [28, 80, 50, 32];
  doc.setFillColor(26, 44, 106);
  doc.rect(margin, y, W - 2 * margin, 8, 'F');
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  let x = margin + 2;
  cols.forEach((c, i) => { doc.text(c, x, y + 5.5); x += colW[i]; });

  // Rows
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30);

  monthPayments.forEach((p, idx) => {
    if (y > H - 50) { doc.addPage(); y = 20; }

    if (idx % 2 === 0) {
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, W - 2 * margin, 7, 'F');
    }

    const dataStr = p.data ? new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR') : '—';
    const desc = (p.descricao || '—').substring(0, 48);
    const proto = (p.protocolo || p.descricao?.match(/Protocolo:\s*(\S+)/)?.[1] || '—').substring(0, 28);

    x = margin + 2;
    doc.text(dataStr, x, y + 5); x += colW[0];
    doc.text(desc, x, y + 5); x += colW[1];
    doc.text(proto, x, y + 5); x += colW[2];
    doc.text(fmtBRL(toNum(p.valor_pago)), x, y + 5);

    y += 7;
  });

  // Total row
  y += 2;
  doc.setFillColor(255, 139, 0);
  doc.rect(margin, y, W - 2 * margin, 9, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TOTAL GERAL:', margin + 2, y + 6);
  doc.text(fmtBRL(totalPaid), margin + 2 + colW[0] + colW[1] + colW[2], y + 6);

  // Signatures
  y += 30;
  doc.setTextColor(30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.line(margin, y, margin + 75, y);
  doc.text('Assinatura do Sócio', margin, y + 5);
  doc.line(W - margin - 75, y, W - margin, y);
  doc.text('Assinatura do Responsável', W - margin - 75, y + 5);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150);
  doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, H - 8);

  const fileName = `prolabore_${socio?.nome?.replace(/\s+/g, '_') || 'socio'}_${month}_${year}.pdf`;
  doc.save(fileName);
}