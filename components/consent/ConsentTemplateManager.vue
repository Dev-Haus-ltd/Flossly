<template>
  <div class="consent-template-manager">
    <v-card class="rounded-lg" elevation="0" style="border: 1px solid #e0e0e0">
      <v-card-title class="d-flex justify-space-between align-center py-3">
        <span>Consent Form Templates</span>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
        >
          New Template
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="px-5 py-4">
        <!-- Templates Table -->
        <v-data-table
          :headers="headers"
          :items="templates"
          :loading="loading"
          sort-by="createdAt"
          class="templates-table"
          density="comfortable"
        >
          <template #item.category="{ item }">
            <v-chip
              v-if="item.category"
              size="small"
              variant="outlined"
            >
              {{ item.category }}
            </v-chip>
            <span v-else class="text-disabled">-</span>
          </template>

          <template #item.createdBy="{ item }">
            {{ item.creator?.fullName || item.creator?.email || '-' }}
          </template>

          <template #item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex gap-1">
              <v-btn
                variant="text"
                size="small"
                color="primary"
                icon="mdi-eye"
                title="Preview"
                @click="previewTemplate(item)"
              />
              <v-btn
                variant="text"
                size="small"
                color="primary"
                icon="mdi-pencil"
                title="Edit"
                @click="editTemplate(item)"
              />
              <v-btn
                variant="text"
                size="small"
                color="error"
                icon="mdi-delete"
                title="Delete"
                @click="confirmDelete(item)"
              />
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialogOpen" max-width="900px">
      <v-card>
        <v-card-title>
          {{ editingTemplate ? 'Edit Template' : 'Create New Template' }}
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-form ref="form" @submit.prevent="saveTemplate">
            <!-- Template Name -->
            <v-text-field
              v-model="formData.name"
              label="Template Name"
              placeholder="e.g., Orthodontics Consent"
              required
              class="mb-4"
            />

            <!-- Description -->
            <v-textarea
              v-model="formData.description"
              label="Description"
              placeholder="Brief description of the consent form"
              rows="3"
              class="mb-4"
            />

            <!-- Category -->
            <v-text-field
              v-model="formData.category"
              label="Category"
              placeholder="e.g., Orthodontics, Implants"
              class="mb-4"
            />

            <!-- HTML Content Editor -->
            <v-label class="mb-2">HTML Content</v-label>
            <div class="html-editor-wrapper mb-4">
              <textarea
                v-model="formData.htmlContent"
                class="html-editor"
                placeholder="<html><body>Your consent form HTML here...</body></html>"
              />
            </div>

            <!-- Signature Coordinates -->
            <v-expansion-panels class="mb-4">
              <v-expansion-panel title="Signature Placement Settings">
                <template #text>
                  <div class="coordinate-grid">
                    <div class="coord-item">
                      <v-text-field
                        v-model.number="formData.signatureCoordinates.x"
                        label="X Position"
                        type="number"
                        min="0"
                      />
                    </div>
                    <div class="coord-item">
                      <v-text-field
                        v-model.number="formData.signatureCoordinates.y"
                        label="Y Position"
                        type="number"
                        min="0"
                      />
                    </div>
                    <div class="coord-item">
                      <v-text-field
                        v-model.number="formData.signatureCoordinates.width"
                        label="Width"
                        type="number"
                        min="1"
                      />
                    </div>
                    <div class="coord-item">
                      <v-text-field
                        v-model.number="formData.signatureCoordinates.height"
                        label="Height"
                        type="number"
                        min="1"
                      />
                    </div>
                    <div class="coord-item">
                      <v-text-field
                        v-model.number="formData.signatureCoordinates.page"
                        label="Page Number"
                        type="number"
                        min="1"
                      />
                    </div>
                  </div>
                  <v-alert type="info" class="mt-4" variant="tonal">
                    Set precise coordinates for where the signature will be embedded on the PDF
                  </v-alert>
                </template>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- Actions -->
            <div class="d-flex gap-3 pt-4">
              <v-btn
                color="primary"
                variant="flat"
                type="submit"
              >
                {{ editingTemplate ? 'Update Template' : 'Create Template' }}
              </v-btn>
              <v-btn
                color="secondary"
                variant="outlined"
                @click="dialogOpen = false"
              >
                Cancel
              </v-btn>
            </div>
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialogOpen" max-width="800px">
      <v-card>
        <v-card-title>Template Preview</v-card-title>
        <v-divider />
        <v-card-text>
          <div class="preview-container" v-html="previewingTemplate?.htmlContent" />
          <v-alert type="info" class="mt-4" variant="tonal">
            <strong>Signature Placement:</strong>
            <br />
            X: {{ previewingTemplate?.signatureCoordinates.x }},
            Y: {{ previewingTemplate?.signatureCoordinates.y }},
            Width: {{ previewingTemplate?.signatureCoordinates.width }},
            Height: {{ previewingTemplate?.signatureCoordinates.height }},
            Page: {{ previewingTemplate?.signatureCoordinates.page }}
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialogOpen" max-width="400px">
      <v-card>
        <v-card-title>Delete Template?</v-card-title>
        <v-card-text class="py-4">
          Are you sure you want to delete <strong>{{ templateToDelete?.name }}</strong>?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="secondary"
            variant="outlined"
            @click="deleteDialogOpen = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="deleteTemplate"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useConsentStore } from '@/stores/consent'
import { useMainStore } from '@/stores/index'

const consentStore = useConsentStore()
const mainStore = useMainStore()

const templates = computed(() => consentStore.templates)
const loading = computed(() => consentStore.templatesLoading)

const dialogOpen = ref(false)
const previewDialogOpen = ref(false)
const deleteDialogOpen = ref(false)

const editingTemplate = ref(null)
const previewingTemplate = ref(null)
const templateToDelete = ref(null)
const form = ref(null)

const formData = ref({
  name: '',
  description: '',
  category: '',
  htmlContent: '',
  signatureCoordinates: {
    x: 50,
    y: 100,
    width: 100,
    height: 50,
    page: 1,
  },
  initialCoordinates: null,
  dateCoordinates: null,
})

const headers = [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Created By', key: 'createdBy', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
]

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-GB')
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    category: '',
    htmlContent: '',
    signatureCoordinates: {
      x: 50,
      y: 100,
      width: 100,
      height: 50,
      page: 1,
    },
  }
  editingTemplate.value = null
}

const openCreateDialog = () => {
  resetForm()
  dialogOpen.value = true
}

const editTemplate = (template) => {
  editingTemplate.value = template
  formData.value = {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    htmlContent: template.htmlContent,
    signatureCoordinates: { ...template.signatureCoordinates },
    initialCoordinates: template.initialCoordinates,
    dateCoordinates: template.dateCoordinates,
  }
  dialogOpen.value = true
}

const previewTemplate = (template) => {
  previewingTemplate.value = template
  previewDialogOpen.value = true
}


const confirmDelete = (template) => {
  templateToDelete.value = template
  deleteDialogOpen.value = true
}

const saveTemplate = async () => {
  if (!form.value?.$el) return

  try {
    if (editingTemplate.value) {
      await consentStore.updateTemplate(formData.value)
    } else {
      await consentStore.createTemplate(formData.value)
    }
    // Close dialog and reset form after successful save
    dialogOpen.value = false
    resetForm()
  } catch (error) {
    console.error('Error saving template:', error)
  }
}

const deleteTemplate = async () => {
  if (!templateToDelete.value) return
  
  try {
    await consentStore.deleteTemplate(templateToDelete.value.id)
    // Close confirmation dialog after successful delete
    deleteDialogOpen.value = false
    templateToDelete.value = null
  } catch (error) {
    console.error('Error deleting template:', error)
  }
}

onMounted(() => {
  consentStore.fetchTemplates()
})
</script>

<style scoped>
.consent-template-manager {
  width: 100%;
}

.templates-table {
  background: transparent;
}

.html-editor-wrapper {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.html-editor {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  border: none;
  outline: none;
  resize: vertical;
}

.coordinate-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.coord-item {
  display: flex;
  flex-direction: column;
}

.preview-container {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
}
</style>
