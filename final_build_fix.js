const fs = require('fs');

// HistoryModal.tsx
let hist = fs.readFileSync('src/components/modals/HistoryModal.tsx', 'utf8');
hist = hist.replace(/import \{ Database, X \} from "lucide-react";\nimport React from "react";\n\nimport \{ useAudio \} from "\.\.\/\.\.\/hooks\/useAudio";/g, 'import { Database, X } from "lucide-react";\nimport React from "react";\n\nimport { useAudio } from "../../hooks/useAudio";\nimport type { HistoryMessage } from "../../types/index";');
fs.writeFileSync('src/components/modals/HistoryModal.tsx', hist);

// SettingsModal.tsx
let set = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');
set = set.replace(/\(key: string\) =>/g, '(key: string | null) =>');
const interfaceDef = `interface ApprovalAuditEntry {
  requestId?: string;
  action: string;
  risk?: string;
  detail?: string;
  approvedAt?: number;
  requestedAt?: number;
}
`;
if (!set.includes('interface ApprovalAuditEntry')) {
  set = set.replace(/const SettingsModal: React\.FC<SettingsModalProps> = \(\{ isOpen, onClose \}\) => \{/g, interfaceDef + '\nconst SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {');
}
set = set.replace(/entry\.action/g, '(entry as ApprovalAuditEntry).action');
set = set.replace(/entry\.risk/g, '(entry as ApprovalAuditEntry).risk');
set = set.replace(/entry\.detail/g, '(entry as ApprovalAuditEntry).detail');
set = set.replace(/entry\.approvedAt/g, '(entry as ApprovalAuditEntry).approvedAt');
set = set.replace(/entry\.requestedAt/g, '(entry as ApprovalAuditEntry).requestedAt');
set = set.replace(/entry\.requestId/g, '(entry as ApprovalAuditEntry).requestId');
fs.writeFileSync('src/components/modals/SettingsModal.tsx', set);

// UserProfileModal.tsx
let up = fs.readFileSync('src/components/modals/UserProfileModal.tsx', 'utf8');
up = up.replace(/handleUpdateProfile\(item\.field, e\.target\.value\)/g, 'handleUpdateProfile(item.field as string, e.target.value)');
fs.writeFileSync('src/components/modals/UserProfileModal.tsx', up);

