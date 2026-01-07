<template>
  <v-dialog v-model="model" max-width="900px" persistent>
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Upload Checklist (Dev)</span>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>
      <v-card-text>
        <div class="mb-6">
          <h4 class="text-subtitle-2 mb-2">Upload CSV or XLSX (one row per checklist item)</h4>
          <p class="text-body-2">Required headers: taskTitle, itemTitle, showRadio, defaultComment (optional)</p>
          <pre class="sample">taskTitle,itemTitle,showRadio,defaultComment
Fire Safety Check,Check fire alarm,TRUE,
Fire Safety Check,Check extinguishers,TRUE,Last serviced this month
Surgery Prep,Sterilize tools,TRUE,
Surgery Prep,Prep chair,TRUE,</pre>
          <v-file-input
            v-model="inputFile"
            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            label="Upload CSV or Excel (.xlsx/.xls)"
            prepend-icon="mdi-file"
            clearable
            @change="onFileChange"
            class="mt-3"
          />
        </div>

        <div class="mt-2 d-flex align-center" v-if="error">
          <v-icon color="error" class="mr-2">mdi-alert-circle</v-icon>
          <span class="text-error">{{ error }}</span>
        </div>

        <div v-if="preview.length" class="mt-4">
          <h4 class="text-subtitle-2 mb-2">Preview (grouped by task)</h4>
          <ul>
            <li v-for="(row, i) in preview" :key="i">
              <strong>{{ row.taskTitle }}</strong> — {{ row.items?.length || 0 }} item(s)
            </li>
          </ul>
        </div>
      </v-card-text>
      <v-card-actions class="px-4 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submit">Upload</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import * as XLSX from 'xlsx';

const props = defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue", "uploaded"]);
const taskStore = useTaskStore();
const mainStore = useMainStore();
const model = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) });

const inputFile = ref(null);
const preview = ref([]);
const groupedRows = ref([]);
const error = ref("");
const submitting = ref(false);

function close() { emit('update:modelValue', false); reset(); }
function reset() {
  inputFile.value = null;
  preview.value = [];
  groupedRows.value = [];
  error.value = "";
}

function normalizeBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (val == null) return false;
  const s = String(val).trim().toLowerCase();
  return ['true','yes','1','y'].includes(s);
}

function onFileChange() {
  error.value = "";
  const fileModel = inputFile.value;
  const file = Array.isArray(fileModel) ? fileModel[0] : fileModel;
  if (!file) { groupedRows.value = []; preview.value = []; return; }
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const rows = normalizeSheetRows(json);
        const grouped = groupRows(rows);
        groupedRows.value = grouped;
        preview.value = grouped;
      } catch (err) {
        error.value = err.message || 'Failed to parse Excel file';
        groupedRows.value = [];
        preview.value = [];
      }
    };
    reader.onerror = () => { error.value = 'Unable to read Excel file'; };
    reader.readAsBinaryString(file);
  } else {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result || '';
        const rows = parseCsv(text);
        const grouped = groupRows(rows);
        groupedRows.value = grouped;
        preview.value = grouped;
      } catch (err) {
        error.value = err.message || 'Failed to parse CSV';
        groupedRows.value = [];
        preview.value = [];
      }
    };
    reader.onerror = () => { error.value = 'Unable to read CSV file'; };
    reader.readAsText(file);
  }
}

function normalizeSheetRows(list) {
  return list.map((r) => {
    const get = (k) => r[k] ?? r[k?.toLowerCase?.()] ?? r[k?.toUpperCase?.()];
    const taskTitle = String(get('taskTitle') ?? get('Task Title') ?? '').trim();
    const itemTitle = String(get('itemTitle') ?? get('Item Title') ?? '').trim();
    const showRadio = get('showRadio') ?? get('Show Radio');
    const defaultComment = String(get('defaultComment') ?? get('Default Comment') ?? '').trim();
    return { taskTitle, itemTitle, showRadio: normalizeBoolean(showRadio), defaultComment };
  }).filter(r => r.taskTitle && r.itemTitle);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) return [];
  const header = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  const idx = {
    taskTitle: header.indexOf('tasktitle'),
    itemTitle: header.indexOf('itemtitle'),
    showRadio: header.indexOf('showradio'),
    defaultComment: header.indexOf('defaultcomment'),
  };
  if (idx.taskTitle < 0 || idx.itemTitle < 0 || idx.showRadio < 0) {
    throw new Error('Headers required: taskTitle, itemTitle, showRadio');
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) { // i is 1-based for data rows, header is line 0
    const lineNumber = i + 1; // human friendly line number
    const cols = splitCsvLine(lines[i]);
    const taskTitle = (cols[idx.taskTitle] || '').trim();
    const itemTitle = (cols[idx.itemTitle] || '').trim();
    const showRadio = normalizeBoolean(cols[idx.showRadio]);
    const defaultComment = idx.defaultComment >= 0 ? (cols[idx.defaultComment] || '').trim() : '';
    if (!taskTitle || !itemTitle) {
      continue;
    }
    rows.push({ taskTitle, itemTitle, showRadio, defaultComment });
  }
  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function groupRows(rows) {
  const map = new Map();
  rows.forEach(r => {
    const key = r.taskTitle.toLowerCase();
    if (!map.has(key)) map.set(key, { taskTitle: r.taskTitle, items: [] });
    map.get(key).items.push({
      question: r.itemTitle,
      showRadio: normalizeBoolean(r.showRadio),
      fieldOneTitle: 'Comments',
      defaultComment: r.defaultComment || '',
    });
  });
  return Array.from(map.values());
}

async function submit() {
  error.value = "";
  const rowsPayload = groupedRows.value;
  if (!rowsPayload.length) {
    error.value = 'Please upload a CSV or Excel file with checklist rows';
    return;
  }
  submitting.value = true;
  try {
    const meta = preview.value.reduce((acc, r) => acc + (r.items?.length || 0), 0);
    const res = await taskStore.bulkAddChecklists({ rows: rowsPayload, _clientMeta: { totalRows: meta } });
    if (res.code === 0) {
      mainStore.setSnackbar({ title: res.message || 'Uploaded', type: 'success' });
      emit('uploaded', res);
      close();
    } else {
      mainStore.setSnackbar({ title: res.message || 'Upload failed', type: 'error' });
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e.message || 'Upload failed', type: 'error' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.sample { background: #f8f8f8; padding: 8px; border-radius: 8px; white-space: pre-wrap; }
.input-bordered :deep(.v-field) { border: 1px solid #dfdfdf !important; border-radius: 8px !important; background-color: white !important; }
</style>
