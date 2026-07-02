const fs = require('fs');

// HistoryModal.tsx
let hist = fs.readFileSync('src/components/modals/HistoryModal.tsx', 'utf8');
hist = hist.replace(/import \{ X, MessageSquare, Clock \} from "lucide-react";/g, 'import { X, MessageSquare, Clock } from "lucide-react";\nimport type { HistoryMessage } from "../../types";');
hist = hist.replace(/msg: any/g, 'msg: HistoryMessage');
fs.writeFileSync('src/components/modals/HistoryModal.tsx', hist);

// UserProfileModal.tsx
let up = fs.readFileSync('src/components/modals/UserProfileModal.tsx', 'utf8');
up = up.replace(/item: any/g, 'item: { label: string; field: keyof typeof userProfile; placeholder: string }');
fs.writeFileSync('src/components/modals/UserProfileModal.tsx', up);

// SettingsModal.tsx
let set = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');
set = set.replace(/approvalAudit: any\[\]/g, 'approvalAudit: unknown[]');
set = set.replace(/setApprovalAudit\(<any\[\]>\[\]\)/g, 'setApprovalAudit([])');
set = set.replace(/const \[approvalAudit, setApprovalAudit\] = useState<any\[\]>\(\[\]\);/g, 'const [approvalAudit, setApprovalAudit] = useState<unknown[]>([]);');
set = set.replace(/\(window as any\)\.electronAPI/g, 'window.electronAPI');
set = set.replace(/catch \(err: any\)/g, 'catch (err: unknown)');
set = set.replace(/err\.message/g, '(err as Error).message');
set = set.replace(/entries: any\[\]/g, 'entries: unknown[]');
fs.writeFileSync('src/components/modals/SettingsModal.tsx', set);
