// Cálculos CLT para sistema de ponto
// Regras: Art. 58, §1º CLT + Súmula 366 TST + Adicional Noturno (CLT Art. 73)

export function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function getBrazilianHolidays(year) {
  const fixed = [
    `${year}-01-01`, `${year}-04-21`, `${year}-05-01`,
    `${year}-09-07`, `${year}-10-12`, `${year}-11-02`,
    `${year}-11-15`, `${year}-12-25`,
  ];
  try {
    const easter = calculateEaster(year);
    if (!easter || isNaN(easter.getTime())) return fixed;
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
    const fmt = (d) => {
      if (!d || isNaN(d.getTime())) return null;
      return d.toISOString().split('T')[0];
    };
    const mobile = [
      fmt(addDays(easter, -48)),
      fmt(addDays(easter, -47)),
      fmt(addDays(easter, -2)),
      fmt(addDays(easter, 60)),
    ].filter(Boolean);
    return [...fixed, ...mobile];
  } catch {
    return fixed;
  }
}

export function isHoliday(dateStr, year) {
  return getBrazilianHolidays(year).includes(dateStr);
}

export function isScheduledSaturday(dateStr, referenceDate) {
  if (!referenceDate) return false;
  const d = new Date(dateStr + 'T12:00:00');
  const ref = new Date(referenceDate + 'T12:00:00');
  if (d.getDay() !== 6) return false;
  const diffTime = d.getTime() - ref.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  return diffWeeks % 2 === 0;
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function minutesToHHMM(totalMin) {
  const abs = Math.abs(Math.round(totalMin));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Resolve absolute minutes for each punch time, handling cross-midnight.
 * Returns { entryAbs, breakAbs, returnAbs, exitAbs } in absolute minutes
 * (may exceed 1440 if the shift crossed midnight).
 */
function resolveAbsoluteTimes(record) {
  const entry = timeToMinutes(record.entry_time);
  if (entry === null) return null;

  let breakAbs = record.break_time ? timeToMinutes(record.break_time) : null;
  let returnAbs = record.return_time ? timeToMinutes(record.return_time) : null;
  let exitAbs = record.exit_time ? timeToMinutes(record.exit_time) : null;

  // Resolve cross-midnight for break
  if (breakAbs !== null && breakAbs < entry) breakAbs += 1440;

  // Resolve cross-midnight for return (must be after break or after entry)
  if (returnAbs !== null) {
    const prevBreak = breakAbs ?? entry;
    if (returnAbs < (prevBreak % 1440)) returnAbs += 1440;
    // Align with absolute timeline
    const baseDay = Math.floor(prevBreak / 1440) * 1440;
    returnAbs = baseDay + (returnAbs % 1440);
    if (returnAbs < prevBreak) returnAbs += 1440;
  }

  // Resolve cross-midnight for exit
  if (exitAbs !== null) {
    const prevPoint = returnAbs ?? breakAbs ?? entry;
    const baseDay = Math.floor(prevPoint / 1440) * 1440;
    exitAbs = baseDay + (exitAbs % 1440);
    if (exitAbs < prevPoint) exitAbs += 1440;
  }

  return { entry, breakAbs, returnAbs, exitAbs };
}

/**
 * Count real night minutes (22:00–05:00) in an absolute-minute segment.
 */
function nightMinutesInSegment(startAbs, endAbs) {
  let night = 0;
  for (let m = Math.round(startAbs); m < Math.round(endAbs); m++) {
    const mod = m % 1440;
    if (mod >= 1320 || mod < 300) night++;
  }
  return night;
}

/**
 * Calculates all daily metrics following CLT rules.
 *
 * Tolerance rule (Súmula 366 / Art. 58 §1º):
 *   netBalance = totalWorked - 480
 *   |netBalance| <= tolerance  →  zeroed (no lateness, no overtime)
 *   |netBalance| > tolerance   →  full netBalance is counted (not just excess)
 *
 * HE 50%  → positive balance on weekdays and Saturdays
 * HE 100% → all worked time on Sundays and holidays
 * Night   → raw night minutes × (8/7) = "hora reduzida" conversion
 */
export function calculateDayMetrics(record, settings, satRef) {
  const JOURNEY = 480; // 8h = 480 min
  const tolerance = settings?.tolerance_minutes ?? 10;

  const date = record.date;
  const d = new Date(date + 'T12:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun … 6=Sat
  const year = d.getFullYear();
  const holiday = isHoliday(date, year);

  const result = {
    totalWorked: 0,
    lateness: 0,
    overtime50: 0,
    overtime100: 0,
    nightMinutes: 0, // already converted (hora reduzida)
    isSunday: dayOfWeek === 0,
    isHoliday: holiday,
    isSaturday: dayOfWeek === 6,
    isScheduledSat: dayOfWeek === 6 && isScheduledSaturday(date, satRef),
  };

  if (!record.entry_time) return result;

  const times = resolveAbsoluteTimes(record);
  if (!times) return result;

  const { entry, breakAbs, returnAbs, exitAbs } = times;

  // ── Total worked ──────────────────────────────────────────────────────────
  let worked = 0;
  let rawNight = 0;

  if (breakAbs !== null) {
    // Segment 1: entry → break
    const seg1 = breakAbs - entry;
    worked += seg1;
    rawNight += nightMinutesInSegment(entry, breakAbs);
  }

  if (returnAbs !== null && exitAbs !== null) {
    // Segment 2: return → exit
    const seg2 = exitAbs - returnAbs;
    worked += seg2;
    rawNight += nightMinutesInSegment(returnAbs, exitAbs);
  } else if (breakAbs === null && exitAbs !== null) {
    // No break: single segment entry → exit
    worked = exitAbs - entry;
    rawNight = nightMinutesInSegment(entry, exitAbs);
  }

  result.totalWorked = Math.max(0, worked);

  // Night hours: apply "hora reduzida noturna" conversion factor (60/52.5 = 8/7 ≈ 1.142857)
  result.nightMinutes = Math.round(rawNight * (8 / 7));

  // ── Sunday / Holiday: ALL worked time → HE 100% ───────────────────────────
  const isOT100Day = holiday || dayOfWeek === 0;
  if (isOT100Day) {
    result.overtime100 = result.totalWorked;
    return result;
  }

  // ── Weekday / Saturday: CLT tolerance → lateness or HE 50% ───────────────
  if (!record.exit_time) return result; // incomplete day, skip balance calc

  const netBalance = result.totalWorked - JOURNEY; // positive = extra, negative = short

  if (Math.abs(netBalance) <= tolerance) {
    // Within tolerance → zero out both lateness and overtime
    result.lateness = 0;
    result.overtime50 = 0;
  } else if (netBalance < 0) {
    // Short day: full negative balance → lateness (never just the excess)
    result.lateness = Math.abs(netBalance);
    result.overtime50 = 0;
  } else {
    // Extra time: full positive balance → HE 50%
    result.overtime50 = netBalance;
    result.lateness = 0;
  }

  return result;
}

export function getNextPunchType(record) {
  if (!record) return 'entry';
  if (!record.entry_time) return 'entry';
  if (!record.break_time) return 'break';
  if (!record.return_time) return 'return';
  if (!record.exit_time) return 'exit';
  return 'done';
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export const PUNCH_LABELS = {
  entry: 'Entrada',
  break: 'Intervalo',
  return: 'Retorno',
  exit: 'Saída',
  done: 'Completo',
};