export const PAGES = [
  { key: 'inicio', label: 'Início', path: '/' },
  { key: 'ponto', label: 'Bate-Ponto', path: '/ponto' },
  { key: 'espelho', label: 'Espelho', path: '/espelho' },
  { key: 'solicitacoes', label: 'Solicitações', path: '/solicitacoes' },
  { key: 'contracheque', label: 'Contra-Cheque', path: '/contracheque' },
  { key: 'prolabore', label: 'Pró-Labore', path: '/prolabore' },
];

export const DEFAULT_PAGES = ['inicio', 'ponto', 'espelho', 'solicitacoes', 'contracheque'];

export function getAllowedPages(user, access) {
  if (user?.role === 'admin') return PAGES.map(p => p.key);
  if (!access) return DEFAULT_PAGES;
  return access.allowed_pages || [];
}

export function hasPageAccess(user, access, pageKey) {
  return getAllowedPages(user, access).includes(pageKey);
}