// Giao diện lưu trữ: xuất tệp, nhập tiến trình, khôi phục bản lưu hỏng.
import { icon } from '../art/icons.js';
import { exportText, importText } from '../core/save.js';
import { getState, setState, flushSave } from '../core/store.js';
import { refreshQuests } from '../core/quests.js';
import { openModal, closeAllModals, closeModal, confirmDialog, toast } from './kit.js';
import { ACT, go, ui } from './app.js';
import { esc } from './util.js';

export function downloadText(text, name) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSave() {
  const s = getState();
  if (!s) return;
  flushSave();
  downloadText(exportText(s), `so-tay-thuc-than-ngay-${s.day}.json`);
  toast('Đã xuất tiến trình ra tệp.', 'good');
}

export function openImportDialog() {
  openModal({
    cls: 'import', label: 'Nhập tiến trình',
    html: `<h2>Nhập tiến trình</h2><p>Chọn tệp .json đã xuất trước đó, hoặc dán nội dung vào ô bên dưới.</p>
    <label class="file-btn btn ghost">${icon('upload', 18)}<span>Chọn tệp</span><input type="file" accept=".json,.txt,application/json" data-change="imp-file" hidden></label>
    <textarea id="imp-text" rows="6" placeholder="Dán nội dung tệp lưu vào đây" aria-label="Nội dung tệp lưu"></textarea>
    <div id="imp-msg" class="note" hidden></div>
    <div class="row end"><button type="button" class="btn ghost" data-act="modal-close">Hủy</button><button type="button" class="btn primary" data-act="imp-go">Nhập</button></div>`,
  });
}
ACT['change:imp-file'] = (el) => {
  const f = el.files && el.files[0];
  if (!f) return;
  const rd = new FileReader();
  rd.onload = () => { const t = document.getElementById('imp-text'); if (t) t.value = String(rd.result || ''); };
  rd.onerror = () => toast('Không đọc được tệp.', 'bad');
  rd.readAsText(f);
};
ACT['imp-go'] = async () => {
  const text = document.getElementById('imp-text')?.value || '';
  const msg = document.getElementById('imp-msg');
  const r = importText(text);
  if (!r.ok) { if (msg) { msg.hidden = false; msg.className = 'note warn'; msg.textContent = r.error; } return; }
  if (getState()) {
    const ok = await confirmDialog({ title: 'Ghi đè tiến trình hiện tại?', text: 'Tiến trình đang chơi sẽ được thay bằng bản nhập vào.', ok: 'Ghi đè', danger: true });
    if (!ok) return;
  }
  adopt(r.state, r.repaired);
};

export function adopt(state, repaired = false) {
  refreshQuests(state);
  setState(state);
  flushSave();
  closeAllModals();
  go('home');
  toast(repaired ? 'Đã nhập (dữ liệu có chỗ được sửa tự động).' : 'Đã nhập tiến trình.', 'good');
}
export { esc, closeModal, ui };
