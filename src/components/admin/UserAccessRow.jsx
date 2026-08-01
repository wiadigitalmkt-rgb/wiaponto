import { PAGES, DEFAULT_PAGES } from '@/lib/accessControl';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';

export default function UserAccessRow({ user, access, onToggle, onSave, saving }) {
  const allowedPages = access ? (access.allowed_pages || []) : DEFAULT_PAGES;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{user.full_name || '—'}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </td>
      {PAGES.map(p => (
        <td key={p.key} className="text-center px-2 py-3">
          <Switch
            checked={allowedPages.includes(p.key)}
            onCheckedChange={(v) => onToggle(user.email, p.key, v)}
          />
        </td>
      ))}
      <td className="px-4 py-3 text-right">
        <Button size="sm" variant="outline" onClick={() => onSave(user.email, user.full_name)} disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        </Button>
      </td>
    </tr>
  );
}