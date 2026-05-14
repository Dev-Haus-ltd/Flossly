<template>
  <template v-if="printMode">
    <div class="invoice-dialog invoice-print-mode">
      <v-card class="invoice-modal" rounded="xl">
        <!-- Header -->
        <div class="dialog-header no-print">
          <div class="dialog-title">Invoice</div>
        </div>

        <!-- Body -->
        <v-card-text class="invoice-wrapper">
          <div v-if="invoice" id="invoice-print-area" class="invoice-paper">
            <!-- Top -->
            <div class="invoice-top">
              <!-- Left -->
              <div>
                <div class="brand-section">
                  <img :src="logo" alt="logo" class="brand-logo" />

                  <div class="brand-name">flossly <span>OS</span></div>
                </div>

                <div class="invoice-meta">
                  <div>
                    <strong>Invoice N°:</strong>
                    <strong> {{ invoice.invoiceNumber || "-" }} </strong>
                  </div>

                  <div>
                    <strong>Date:</strong>
                    <strong> {{ formattedDate(invoice.invoiceDate) }} </strong>
                  </div>

                  <div>
                    <strong>Amount due:</strong>
                    <strong> {{ fmtGbp(invoice.balance) }} </strong>
                  </div>
                </div>
              </div>

              <!-- Right -->
              <div class="top-right">
                <div class="address-block">
                  <div class="heading">Invoice from:</div>

                  <div>FlosslyOS</div>
                  <div>London, UK</div>
                  <div>Ph# 0123456789</div>
                  <div>www.flosslyos.uk</div>
                </div>

                <div class="address-block mt-10">
                  <div class="heading">Invoice to:</div>

                  <div class="patient-name">
                    {{ invoice.patientName || patientName }}
                  </div>

                  <div>{{ address }}</div>
                  <!-- <div>LS14 6BH</div> -->
                </div>
              </div>
            </div>

            <!-- Table -->
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Location</th>
                  <th>Unit Price</th>
                  <th>Qty.</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="item in invoice.items || []" :key="item.id">
                  <td>{{ item.description }}</td>

                  <td>
                    {{
                      item.fdi
                        ? `${item.fdi}${item.surface ? "/" + item.surface : ""}`
                        : "-"
                    }}
                  </td>

                  <td>{{ fmtGbp(item.unitPrice) }}</td>

                  <td>{{ item.quantity }}</td>

                  <td>{{ fmtGbp(item.total) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Total -->
            <div class="invoice-total">
              <span>Total:</span>
              <strong>{{ fmtGbp(invoice.total) }}</strong>
            </div>

            <!-- Payment -->
            <!-- <div class="payment-box">
              <div>Payment Method:</div>

              <div>
                {{ invoice.method || "CARD ************1234" }}
              </div>
            </div> -->

            <!-- Due -->
            <div class="amount-summary">
              <div class="summary-row">
                <span>{{ fmtGbp(invoice.amountPaid || 0) }}</span>
              </div>

              <div class="summary-row due">
                <span>Due:</span>

                <strong>{{ fmtGbp(invoice.balance) }}</strong>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">No invoice selected.</div>
        </v-card-text>
      </v-card>
    </div>
  </template>

  <v-dialog v-else v-model="visible" max-width="900" class="invoice-dialog">
    <v-card class="invoice-modal" rounded="xl">
      <!-- Header -->
      <div class="dialog-header no-print">
        <div class="dialog-title">Invoice</div>

        <!-- <div class="header-actions">
          <v-btn class="action-btn mail-btn" flat @click="handleMail">
            Mail
          </v-btn>

          <v-btn class="action-btn print-btn" flat @click="handlePrint">
            Print
          </v-btn>

          <v-btn class="action-btn download-btn" flat @click="handleDownload">
            Download
          </v-btn>

          <v-btn icon variant="text" size="small" @click="close">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div> -->
      </div>

      <v-divider />

      <v-card-text class="invoice-wrapper">
        <div v-if="invoice" id="invoice-print-area" class="invoice-paper">
          <!-- Top -->
          <div class="invoice-top">
            <!-- Left -->
            <div>
              <div class="brand-section">
                <img :src="logo" alt="logo" class="brand-logo" />

                <div class="brand-name">flossly <span>OS</span></div>
              </div>

              <div class="invoice-meta">
                <div>
                  <strong>Invoice N°:</strong>
                  <strong> {{ invoice.invoiceNumber || "-" }} </strong>
                </div>

                <div>
                  <strong>Date:</strong>
                  <strong> {{ formattedDate(invoice.invoiceDate) }} </strong>
                </div>

                <div>
                  <strong>Amount due:</strong>
                  <strong> {{ fmtGbp(invoice.balance) }} </strong>
                </div>
              </div>
            </div>

            <!-- Right -->
            <div class="top-right">
              <div class="address-block">
                <div class="heading">Invoice from:</div>

                <div>FlosslyOS</div>
                <div>London, UK</div>
                <div>Ph# 0123456789</div>
                <div>www.flosslyos.uk</div>
              </div>

              <div class="address-block mt-10">
                <div class="heading">Invoice to:</div>

                <div class="patient-name">
                  {{ invoice.patientName || patientName }}
                </div>

                <div>{{ address }}</div>
                <div>LS14 6BH</div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <table class="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Location</th>
                <th>Unit Price</th>
                <th>Qty.</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="item in invoice.items || []" :key="item.id">
                <td>{{ item.description }}</td>

                <td>
                  {{
                    item.fdi
                      ? `${item.fdi}${item.surface ? "/" + item.surface : ""}`
                      : "-"
                  }}
                </td>

                <td>{{ fmtGbp(item.unitPrice) }}</td>

                <td>{{ item.quantity }}</td>

                <td>{{ fmtGbp(item.total) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Total -->
          <div class="invoice-total">
            <span>Total:</span>
            <strong>{{ fmtGbp(invoice.total) }}</strong>
          </div>

          <!-- Payment -->
          <div class="payment-box">
            <div>Payment Method:</div>

            <div>
              {{ invoice.method || "CARD ************1234" }}
            </div>
          </div>

          <!-- Due -->
          <div class="amount-summary">
            <div class="summary-row">
              <span>{{ fmtGbp(invoice.amountPaid || 0) }}</span>
            </div>

            <div class="summary-row due">
              <span>Due:</span>

              <strong>{{ fmtGbp(invoice.balance) }}</strong>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">No invoice selected.</div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import html2pdf from "html2pdf.js";
import logo from "@/assets/logos/Logoicon2.svg";

const props = defineProps({
  patient: { type: Object, default: null },
  printMode: { type: Boolean, default: false },

  modelValue: {
    type: Boolean,
    default: false,
  },

  invoice: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "take-payment"]);

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const close = () => {
  visible.value = false;
};

const generateInvoicePdfBlob = async () => {
  const element = document.getElementById("invoice-print-area");
  if (!element) {
    throw new Error("Invoice print area not found");
  }

  const options = {
    margin: 0.3,
    image: {
      type: "jpeg",
      quality: 1,
    },
    html2canvas: {
      scale: 2,
      useCORS: true,
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait",
    },
  };

  const worker = html2pdf().set(options).from(element);
  const blob = await worker.outputPdf("blob");
  return blob;
};

defineExpose({
  generateInvoicePdfBlob,
});

const patientName = computed(() => {
  if (props.patient) {
    return `${props.patient.firstName} ${props.patient.lastName}`;
  }

  return "Patient Name";
});

const address = computed(() => {
  if (props.patient) {
    const addr =
      props.patient.address1 ||
      props.patient.address2 ||
      props.patient.address3;
    return `${addr}`;
  }

  return "Address not available";
});

const formattedDate = (date) => {
  if (!date) return "08/08/2024";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtGbp = (value) => {
  return `£${Number(value || 0).toFixed(2)}`;
};

const takePayment = () => {
  emit("take-payment", props.invoice);
  close();
};

const handleMail = () => {
  console.log("Mail Invoice");
};

const handlePrint = () => {
  const printContents = document.getElementById("invoice-print-area").innerHTML;

  const printWindow = window.open("", "", "width=900,height=900");

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice</title>

        <style>
          body {
            margin: 0;
            padding: 30px;
            background: white;
            font-family: Arial, sans-serif;
          }

          .invoice-paper {
            width: 100%;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            border: 1px solid #5b5fc7;
            padding: 12px;
            text-align: left;
            font-size: 13px;
          }

          td {
            padding: 14px 12px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
          }
        </style>
      </head>

      <body>
        <div class="invoice-paper">
          ${printContents}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

const handleDownload = async () => {
  const blob = await generateInvoicePdfBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Invoice-${props.invoice?.invoiceNumber || "invoice"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
</script>

<style scoped lang="scss">
.invoice-modal {
  overflow: hidden;
  background: #fff;
}

/* HEADER */

.dialog-header {
  height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 22px;
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-btn {
  text-transform: none !important;
  border-radius: 10px !important;
  min-width: 92px;
  height: 40px;
  
  color: white !important;
}

.mail-btn {
  background: #8b7cff;
}

.print-btn {
  background: #1565ff;
}

.download-btn {
  background: #1e2f97;
}

/* BODY */

.invoice-wrapper {
  background: #f4f4f4;
  padding: 28px;
}

.invoice-paper {
  background: white;
  width: 100%;
  max-width: 560px;
  margin: auto;
  padding: 42px;
  min-height: 790px;
  border: 1px solid #e5e7eb;
}

/* TOP */

.invoice-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 44px;
}

.brand-section {
  display: flex;
  flex-direction: column;
}

.brand-logo {
  width: 74px;
  margin-bottom: 8px;
}

.brand-name {
  font-size: 30px;
  font-weight: 700;
  color: #27348b;
  line-height: 1;
}

.brand-name span {
  font-weight: 500;
}

.invoice-meta {
  margin-top:28px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #222;
}

.top-right {
  text-align: right;
}

.heading {
  font-weight: 700;
  margin-bottom: 2px;
}

.address-block {
  font-size: 14px;
  color: #444;
  line-height: 1.35;
}

.patient-name {
  font-weight: 600;
}

/* TABLE */

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}

.invoice-table thead tr {
  border: 1px solid #5b5fc7;
}

.invoice-table th {
  padding: 12px;
  text-align: left;
  font-size: 10px;
  color: #333;
}

.invoice-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #d8d8d8;
  font-size: 11px;
  color: #333;
}

.invoice-table td:nth-child(3),
.invoice-table td:nth-child(4),
.invoice-table td:nth-child(5) {
  text-align: center;
}

/* TOTAL */

.invoice-total {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding-top: 18px;
  font-size: 14px;
  margin-bottom: 30px;
}

/* PAYMENT */

.payment-box {
  width: fit-content;
  background: #f3f5fb;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 12px;
  color: #444;
  margin-bottom: 40px;
}

/* SUMMARY */

.amount-summary {
  width: 180px;
  margin-left: auto;
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  color: #555;
}

.summary-row.due {
  justify-content: space-between;
  font-size: 14px;
  color: #111;
}

/* FOOTER */

.dialog-footer {
  display: flex;
  gap: 14px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.footer-btn {
  flex: 1;
  height: 46px;
  border-radius: 12px;
  text-transform: none;
  font-weight: 600;
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
  color: #64748b;
}

/* PRINT */

@media print {
  body * {
    visibility: hidden !important;
  }

  #invoice-print-area,
  #invoice-print-area * {
    visibility: visible !important;
  }

  #invoice-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
    padding: 20px;
  }

  .no-print {
    display: none !important;
  }

  .invoice-paper {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

@media (max-width: 768px) {
  .invoice-paper {
    padding: 24px;
  }

  .invoice-top {
    flex-direction: column;
    gap: 30px;
  }

  .top-right {
    text-align: left;
  }

  .dialog-header {
    flex-wrap: wrap;
    height: auto;
    padding: 18px;
    gap: 14px;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
