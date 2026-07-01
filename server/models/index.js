import { DefaultPriority } from "./defaultPriorities";
import { DefaultStatus } from "./defaultStatuses";
import { DictionaryScript } from "./dictionaryScripts";
import { OrganisationPriority } from "./organisations/organisationPriorities";
import { Organisation } from "./organisations/organisations";
import { OrganisationSmtp } from "./organisations/organisationSmtp";
import { OrganisationStatus } from "./organisations/organisationStatuses";
import { Role } from "./roles";
import { TaskCategory } from "./tasks/taskCategories";
import { Task } from "./tasks/tasks";
import { UserPreference } from "./auth/userPreferences";
import { UserDocumentFolder } from "./documents/userDocumentFolders";
import { UserDocument } from "./documents/userDocuments";
import { UserOrganisation } from "./auth/userOrganisations";
import { User } from "./auth/users";
import { UserTask } from "./tasks/userTasks";
import { Verification } from "./auth/verifications";
import { UserTaskAttachment } from "./tasks/userTaskAttachments";
import { TaskChecklist } from "./tasks/taskChecklist";
import { UserTaskChecklist } from "./tasks/userTaskChecklist";
import { UserTaskComment } from "./tasks/userTaskComments";
import { TaskCustomColumnDefinition } from "./tasks/taskCustomColumnDefinitions";
import { UserTaskCustomField } from "./tasks/userTaskCustomFields";
import { UserSubscription } from "./auth/userSubscriptions";
import { LoginHistory } from "./auth/loginHistory";
import { Rota } from "./rota/rota";
import { OrganisationSurgery } from "./organisations/organisationSurgeries";
import { RotaShift } from "./rota/rotaShifts";
import { RotaUser } from "./rota/rotaUsers";
import { EmailVerification } from "./auth/emailVerifications";
import { OrganisationContact } from "./organisations/orgnisationContacts";
import { OrganisationEquipment } from "./organisations/organisationEquipments";
import { OrganisationGroup } from "./organisations/organisationGroups";
import { OrganisationGroupUser } from "./organisations/organisationGroupUsers";
import { UserAccount } from "./auth/userAccounts";
import { LoyaltyPoint } from "./points/loyaltyPoints";
import { UserLoyaltyPoint } from "./points/userLoyaltyPoints";
import { UserPoint } from "./points/userPoints";
import { RewardPoint } from "./points/rewardPoints";
import { UserPointsHistory } from "./points/userPointHistory";
import { UserContract } from "./auth/userContracts";
import { SystemDocumentFolder } from "./documents/systemDocumentFolders";
import { SystemDocument } from "./documents/systemDocuments";
import { UserLeaveHistory } from "./leaves/userLeaveHistory";
import { UserLeaveEntitlement } from "./leaves/userLeaveEntitlements";
import { UserHrDocument } from "./auth/userHrDocuments";
import { OnboardingEvent } from "./auth/onboardingEvents";

import { Course } from "./cpd/course";
import { CourseQuestionaire } from "./cpd/courseQuestionaire";
import { UserCourseHistory } from "./cpd/userCourseHistory";
import { OrganisationPeople } from "./organisations/organisationPeople";
import { OrganisationScript } from "./organisations/organisationScripts";
import { MetaPage } from "./crm/metaPages";
import { CrmLead } from "./crm/leads";
import { MetaUserToken } from "./crm/metaUserTokens";
import { MetaWhatsAppConfig } from "./crm/metaWhatsAppConfigs";
import { CrmWhatsAppMessageLog } from "./crm/whatsappMessageLogs";
import { WhapiChannelConfig } from "./crm/whapiChannelConfigs";
import { CrmDmAccount } from "./crm/dmAccounts";
import { CrmDmConversation } from "./crm/dmConversations";
import { CrmDmMessage } from "./crm/dmMessages";
import { FcmToken } from "./notifications/fcmTokens";
import { UserNotification } from "./notifications/userNotifications";
import { ChatbotConfig } from "./crm/chatbotConfig";
import { MetaAdAccount } from "./crm/MetaAdAccount";
import { MetaCampaign } from "./crm/MetaCampaign";
import { MetaAdSet } from "./crm/MetaAdSet";
import { MetaAd } from "./crm/MetaAd";
import { MetaInsight } from "./crm/MetaInsights";
import { GoogleAdsAccount } from "./crm/google_Ads_analytics/googleAdsAccounts";
import { GoogleAdsCampaign } from "./crm/google_Ads_analytics/googleAdsCampaigns";
import { GoogleAdsAdGroup } from "./crm/google_Ads_analytics/googleAdsAdGroups";
import { GoogleAdsAd } from "./crm/google_Ads_analytics/googleAdsAds";
import { GoogleAdsInsight } from "./crm/google_Ads_analytics/googleAdsInsights";

// Chatbot Support
import { ChatbotConversation } from "./chatbot/chatbotConversations";
import { ChatbotMessage } from "./chatbot/chatbotMessages";
import { ChatbotMessageAttachment } from "./chatbot/chatbotMessageAttachments";

// Reporting Bot
import { ReportingBotConversation } from "./reportingBot/reportingBotConversations";
import { ReportingBotMessage } from "./reportingBot/reportingBotMessages";

// Google Analytics (GSC & Business Profile)
import { GoogleOAuthToken } from "./crm/google_analytics/googleOAuthTokens";
import { GoogleSearchConsoleSite } from "./crm/google_analytics/googleSearchConsoleSites";
import { GoogleSearchConsoleSitePage } from "./crm/google_analytics/googleSearchConsoleSitePages";
import { GoogleSearchConsolePerformance } from "./crm/google_analytics/googleSearchConsolePerformance";
import { GoogleBusinessProfile } from "./crm/google_business_analytics/googleBusinessProfiles";

// Diary
import { DiaryPatient } from "./diary/patients";
import { DiaryAppointment } from "./diary/appointments";
import { PatientInvoice } from "./diary/patientInvoices";
import { PatientInvoiceItem } from "./diary/patientInvoiceItems";
import { PatientPayment } from "./diary/patientPayments";
import { PatientPaymentAllocation } from "./diary/patientPaymentAllocations";
import { DiaryNote } from "./diary/notes";
import { DiaryPatientComfort } from "./diary/patientComfort";
import { DiaryPatientSurvey } from "./diary/patientSurvey";
import { DiaryPatientForm } from "./diary/patientForm";
import { DiaryPatientChart } from "./diary/patientCharts";
import { DiaryTreatmentPlan } from "./diary/treatmentPlans";
import { DiaryTreatmentPlanItem } from "./diary/treatmentPlanItems";
import { ClinicalNoteTemplate } from "./diary/clinicalNoteTemplates";
import { ClinicalNoteTemplateVersion } from "./diary/clinicalNoteTemplateVersions";
import { ConsentFormTemplate } from "./diary/consentFormTemplate";
import { ConsentFormDocument } from "./diary/consentFormDocument";
import { ConsentFormSignatureAudit } from "./diary/consentFormSignatureAudit";
import { DiaryZone } from "./diary/diaryZones";
import { DiaryPatientCommunicationLogs } from "./diary/patientCommunicationLogs";
import { DiaryGoogleCalendarEvent } from "./diary/googleCalendarEvent";
import { DiaryDentistGoogleCalendar } from "./diary/dentistGoogleCalendar";
import { GCMandate } from "./diary/gcMandates";
import { GCPayment } from "./diary/gcPayments";
import { GCWebhookLog } from "./diary/gcWebhookLogs";
import { OrganisationTreatment } from "./organisations/organisationTreatments";
import { CrmLeadTreatment } from "./crm/leadTreatments";
import { CrmLeadNote } from "./crm/leadNotes";
import { CrmOption } from "./crm/options";
import { CrmLeadCommunication } from "./crm/leadCommunications";
import { CrmLeadAssignee } from "./crm/leadAssignees";
import { CrmAutomationTemplate } from "./crm/automationTemplates";
import { CrmAutomationGroup } from "./crm/automationGroups";
import { CrmAutomationGroupTemplate } from "./crm/automationGroupTemplates";
import { CrmAutomationDictionaryGroup } from "./crm/crmAutomationDictionaryGroups";
import { CrmAutomationDictionaryTemplate } from "./crm/crmAutomationDictionaryTemplates";
import { FormConfig } from "./crm/formConfig";
import { CrmCustomColumnDefinition } from "./crm/crmCustomColumnDefinition";
import { LeadCustomField } from "./crm/leadCustomField";
import { PatientAutomationDictionary } from "./patientJourney/patientAutomationDictionary";
import { PatientAutomationTemplate } from "./patientJourney/patientAutomationTemplates";
import { OrganisationReferral } from "./organisationReferrals";

/*
  Cascade Policy chosen:
  USER_DELETE = Delete all user-related records
  ORG_DELETE  = Delete all organisation-related records

  Implementation notes:
  - onDelete: 'CASCADE' and hooks: true are applied on the child side (belongsTo) where the foreign key lives.
  - For convenience some hasMany also include onDelete where appropriate, but the DB constraint is created by belongsTo side.
  - Review your migrations/schema to ensure FK constraints get created; Sequelize will only add constraints when creating tables.
*/

// --------------------------
// TaskCategory -> Task
// --------------------------
TaskCategory.hasMany(Task, { foreignKey: "categoryId", as: "tasks" });
Task.belongsTo(TaskCategory, { foreignKey: "categoryId", as: "category", onDelete: "SET NULL" });

// Hierarchical categories
TaskCategory.hasMany(TaskCategory, { foreignKey: "parentId", as: "subcategories" });
TaskCategory.belongsTo(TaskCategory, { foreignKey: "parentId", as: "parent", onDelete: "CASCADE", hooks: true });

// Task -> Role
Task.belongsTo(Role, { foreignKey: "roleId", as: "role", onDelete: "SET NULL" });
Role.hasMany(Task, { foreignKey: "roleId", as: "tasks" });

// Task -> UserTask
Task.hasMany(UserTask, { foreignKey: "taskId", as: "userTasks" });
UserTask.belongsTo(Task, { foreignKey: "taskId", as: "taskDetails", onDelete: "CASCADE", hooks: true });

// User -> UserTask (USER_DELETE)
User.hasMany(UserTask, { foreignKey: "userId", as: "assignedTasks" });
UserTask.belongsTo(User, { foreignKey: "userId", as: "assignedUser", onDelete: "CASCADE", hooks: true });
UserTask.belongsTo(User, { foreignKey: "assignedBy", as: "assigner", onDelete: "SET NULL" });

// UserTask -> Organisation / Status / Priority (ORG_DELETE for organisation FK)
UserTask.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });
UserTask.belongsTo(OrganisationStatus, { foreignKey: "statusId", as: "status", onDelete: "SET NULL" });
UserTask.belongsTo(OrganisationPriority, { foreignKey: "priorityId", as: "priority", onDelete: "SET NULL" });

// UserTask -> Comments, Attachments, Checklists (cascade on delete of UserTask)
UserTask.hasMany(UserTaskComment, { foreignKey: "userTaskId", as: "taskComments" });
UserTaskComment.belongsTo(UserTask, { foreignKey: "userTaskId", as: "userTask", onDelete: "CASCADE", hooks: true });
UserTaskComment.belongsTo(User, { foreignKey: "userId", as: "author", onDelete: "SET NULL" });

UserTask.hasMany(UserTaskAttachment, { foreignKey: "userTaskId", as: "attachments" });
UserTaskAttachment.belongsTo(UserTask, { foreignKey: "userTaskId", as: "userTask", onDelete: "CASCADE", hooks: true });

Task.hasMany(TaskChecklist, { foreignKey: "taskId", as: "taskChecklist" });
TaskChecklist.belongsTo(Task, { foreignKey: "taskId", as: "task", onDelete: "CASCADE", hooks: true });

UserTask.hasMany(UserTaskChecklist, { foreignKey: "userTaskId", as: "userTaskChecklist" });
UserTaskChecklist.belongsTo(UserTask, { foreignKey: "userTaskId", as: "userTask", onDelete: "CASCADE", hooks: true });

// TaskCustomColumnDefinition -> User (ORG_DELETE)
User.hasMany(TaskCustomColumnDefinition, {
  foreignKey: "createdBy",
  as: "taskCustomColumns",
  onDelete: "CASCADE",
  hooks: true,
});

TaskCustomColumnDefinition.belongsTo(User, {
  foreignKey: "createdBy",
  as: "creator",
  onDelete: "CASCADE",
  hooks: true,
});

// UserTaskCustomField -> UserTask / TaskCustomColumnDefinition (cascade on delete of UserTask)
UserTask.hasMany(UserTaskCustomField, { foreignKey: "userTaskId", as: "customFields" });
UserTaskCustomField.belongsTo(UserTask, { foreignKey: "userTaskId", as: "userTask", onDelete: "CASCADE", hooks: true });
TaskCustomColumnDefinition.hasMany(UserTaskCustomField, { foreignKey: "columnDefinitionId", as: "customFieldValues" });
UserTaskCustomField.belongsTo(TaskCustomColumnDefinition, { foreignKey: "columnDefinitionId", as: "columnDefinition", onDelete: "CASCADE", hooks: true });

// Role -> Users
Role.hasMany(User, { foreignKey: "roleId", as: "users" });
User.belongsTo(Role, { foreignKey: "roleId", as: "role", onDelete: "SET NULL" });

// User -> Preference (USER_DELETE)
User.hasMany(UserPreference, { foreignKey: "userId", as: "preferences" });
UserPreference.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
UserPreference.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

// User -> OnboardingEvents (USER_DELETE)
User.hasMany(OnboardingEvent, { foreignKey: "userId", as: "onboardingEvents" });
OnboardingEvent.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });

// User -> UserOrganisations (USER_DELETE)
User.hasMany(UserOrganisation, { foreignKey: "userId", as: "userOrganisations" });
UserOrganisation.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });

// UserOrganisation -> Organisation (ORG_DELETE)
UserOrganisation.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });
Organisation.hasMany(UserOrganisation, { foreignKey: "organisationId", as: "userOrganisations" });

// UserSubscription -> User / Organisation
UserSubscription.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
UserSubscription.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

// UserDocumentFolder -> UserDocument (USER_DELETE)
UserDocument.belongsTo(UserDocumentFolder, { foreignKey: "folderId", as: "folder" });
UserDocumentFolder.hasMany(UserDocument, { foreignKey: "folderId", as: "documents", onDelete: "CASCADE", hooks: true });

// UserDocumentFolder -> Self-referencing for nested folders (max 2 levels)
UserDocumentFolder.hasMany(UserDocumentFolder, { foreignKey: "parentId", as: "subfolders", onDelete: "CASCADE", hooks: true });
UserDocumentFolder.belongsTo(UserDocumentFolder, { foreignKey: "parentId", as: "parent", onDelete: "CASCADE", hooks: true });

// LoginHistory (USER_DELETE)
LoginHistory.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE", hooks: true });
User.hasMany(LoginHistory, { foreignKey: "userId", onDelete: "CASCADE", hooks: true });

// Rota -> Organisation / Users / Shifts (ORG_DELETE)
Rota.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });
Rota.hasMany(RotaUser, { foreignKey: "rotaId", as: "users" });
Rota.hasMany(RotaShift, { foreignKey: "rotaId", as: "shifts" });

// RotaUser -> Rota / User / Shifts / Role
RotaUser.belongsTo(Rota, { foreignKey: "rotaId", as: "rota", onDelete: "CASCADE", hooks: true });
RotaUser.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
RotaUser.hasMany(RotaShift, { foreignKey: "rotaUserId", as: "shifts" });
RotaUser.belongsTo(Role, { foreignKey: "tempUserRoleId", as: "role" });

// RotaShift -> Rota / RotaUser / User
RotaShift.belongsTo(Rota, { foreignKey: "rotaId", as: "rota", onDelete: "CASCADE", hooks: true });
RotaShift.belongsTo(RotaUser, { foreignKey: "rotaUserId", as: "rotaUser", onDelete: "CASCADE", hooks: true });
RotaShift.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });

// Diary associations (ORG_DELETE / USER_DELETE)
DiaryPatient.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryPatient.hasMany(DiaryAppointment, { foreignKey: 'patientId', as: 'appointments', onDelete: 'CASCADE', hooks: true });

DiaryAppointment.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryAppointment.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryAppointment.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist', onDelete: 'CASCADE', hooks: true });

DiaryGoogleCalendarEvent.belongsTo(DiaryAppointment, { foreignKey: 'appointmentId', as: 'appointment', onDelete: 'CASCADE', hooks: true });
DiaryAppointment.hasOne(DiaryGoogleCalendarEvent, { foreignKey: 'appointmentId', as: 'googleCalendarEvent', onDelete: 'CASCADE', hooks: true });

DiaryDentistGoogleCalendar.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist', onDelete: 'CASCADE', hooks: true });
DiaryDentistGoogleCalendar.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

DiaryNote.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryNote.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist', onDelete: 'CASCADE', hooks: true });
User.hasMany(DiaryNote, { foreignKey: 'dentistId', as: 'diaryNotes', onDelete: 'CASCADE', hooks: true });

DiaryPatient.hasOne(DiaryPatientComfort, { foreignKey: 'patientId', as: 'comfort', onDelete: 'CASCADE', hooks: true });
DiaryPatientComfort.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryPatientComfort.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

DiaryPatient.hasOne(DiaryPatientSurvey, { foreignKey: 'patientId', as: 'survey', onDelete: 'CASCADE', hooks: true });
DiaryPatientSurvey.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryPatientSurvey.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

DiaryPatient.hasMany(DiaryPatientForm, { foreignKey: 'patientId', as: 'forms', onDelete: 'CASCADE', hooks: true });
DiaryPatientForm.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryPatientForm.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryPatientForm.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'CASCADE', hooks: true });
User.hasMany(DiaryPatientForm, { foreignKey: 'createdBy', as: 'createdForms', onDelete: 'CASCADE', hooks: true });

DiaryPatient.hasOne(DiaryPatientChart, { foreignKey: 'patientId', as: 'chart', onDelete: 'CASCADE', hooks: true });
DiaryPatientChart.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryPatientChart.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

DiaryPatient.hasMany(DiaryTreatmentPlanItem, { foreignKey: 'patientId', as: 'treatmentPlanItems', onDelete: 'CASCADE', hooks: true });

// Patient Accounts — invoices, payments
DiaryPatient.hasMany(PatientInvoice, { foreignKey: 'patientId', as: 'invoices', onDelete: 'CASCADE', hooks: true });
PatientInvoice.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
PatientInvoice.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
PatientInvoice.hasMany(PatientInvoiceItem, { foreignKey: 'invoiceId', as: 'items', onDelete: 'CASCADE', hooks: true });
PatientInvoiceItem.belongsTo(PatientInvoice, { foreignKey: 'invoiceId', as: 'invoice', onDelete: 'CASCADE', hooks: true });
PatientInvoiceItem.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

DiaryPatient.hasMany(PatientPayment, { foreignKey: 'patientId', as: 'payments', onDelete: 'CASCADE', hooks: true });
PatientPayment.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
PatientPayment.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
PatientPayment.hasMany(PatientPaymentAllocation, { foreignKey: 'paymentId', as: 'allocations', onDelete: 'CASCADE', hooks: true });
PatientPaymentAllocation.belongsTo(PatientPayment, { foreignKey: 'paymentId', as: 'payment', onDelete: 'CASCADE', hooks: true });
PatientPaymentAllocation.belongsTo(PatientInvoice, { foreignKey: 'invoiceId', as: 'invoice', onDelete: 'CASCADE', hooks: true });
PatientPaymentAllocation.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

// Patient Communication Logs
DiaryPatient.hasMany(DiaryPatientCommunicationLogs, { foreignKey: 'patientId', as: 'communicationLogs', onDelete: 'CASCADE', hooks: true });
DiaryPatientCommunicationLogs.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryPatientCommunicationLogs.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryPatientCommunicationLogs.belongsTo(User, { foreignKey: 'practitionerId', as: 'practitioner', onDelete: 'SET NULL', hooks: true });
User.hasMany(DiaryPatientCommunicationLogs, { foreignKey: 'practitionerId', as: 'communicationLogs', onDelete: 'SET NULL', hooks: true });
DiaryTreatmentPlanItem.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryTreatmentPlanItem.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryTreatmentPlanItem.belongsTo(DiaryAppointment, { foreignKey: 'appointmentId', as: 'appointment', onDelete: 'SET NULL' });
DiaryTreatmentPlanItem.belongsTo(ClinicalNoteTemplate, { foreignKey: 'templateId', as: 'clinicalNoteTemplate', onDelete: 'SET NULL' });
DiaryAppointment.hasMany(DiaryTreatmentPlanItem, { foreignKey: 'appointmentId', as: 'treatmentPlanItems' });
DiaryPatient.hasMany(DiaryTreatmentPlan, { foreignKey: 'patientId', as: 'treatmentPlans', onDelete: 'CASCADE', hooks: true });
DiaryTreatmentPlan.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
DiaryTreatmentPlan.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(ClinicalNoteTemplate, { foreignKey: 'organisationId', as: 'clinicalNoteTemplates', onDelete: 'CASCADE', hooks: true });
ClinicalNoteTemplate.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
ClinicalNoteTemplate.belongsTo(ClinicalNoteTemplate, { foreignKey: 'sourceTemplateId', as: 'sourceTemplate', onDelete: 'SET NULL' });
ClinicalNoteTemplate.hasMany(ClinicalNoteTemplate, { foreignKey: 'sourceTemplateId', as: 'derivedTemplates' });
ClinicalNoteTemplate.hasMany(ClinicalNoteTemplateVersion, { foreignKey: 'templateId', as: 'versions', onDelete: 'CASCADE', hooks: true });
ClinicalNoteTemplate.belongsTo(ClinicalNoteTemplateVersion, { foreignKey: 'currentVersionId', as: 'currentVersion', onDelete: 'SET NULL' });
ClinicalNoteTemplateVersion.belongsTo(ClinicalNoteTemplate, { foreignKey: 'templateId', as: 'template', onDelete: 'CASCADE', hooks: true });
User.hasMany(ClinicalNoteTemplate, { foreignKey: 'createdBy', as: 'createdClinicalNoteTemplates', onDelete: 'SET NULL' });
User.hasMany(ClinicalNoteTemplate, { foreignKey: 'updatedBy', as: 'updatedClinicalNoteTemplates', onDelete: 'SET NULL' });
User.hasMany(ClinicalNoteTemplateVersion, { foreignKey: 'createdBy', as: 'clinicalNoteTemplateVersions', onDelete: 'SET NULL' });
ClinicalNoteTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });
ClinicalNoteTemplate.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater', onDelete: 'SET NULL' });
ClinicalNoteTemplateVersion.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });

// Consent Form Associations
ConsentFormTemplate.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
ConsentFormTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });
ConsentFormTemplate.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater', onDelete: 'SET NULL' });
Organisation.hasMany(ConsentFormTemplate, { foreignKey: 'organisationId', as: 'consentFormTemplates', onDelete: 'CASCADE', hooks: true });
User.hasMany(ConsentFormTemplate, { foreignKey: 'createdBy', as: 'createdConsentTemplates', onDelete: 'SET NULL' });

ConsentFormDocument.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
ConsentFormDocument.belongsTo(ConsentFormTemplate, { foreignKey: 'templateId', as: 'template', onDelete: 'RESTRICT' });
ConsentFormDocument.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
ConsentFormDocument.belongsTo(User, { foreignKey: 'sentBy', as: 'sentByUser', onDelete: 'SET NULL' });
ConsentFormDocument.belongsTo(User, { foreignKey: 'voidedBy', as: 'voidedByUser', onDelete: 'SET NULL' });
DiaryPatient.hasMany(ConsentFormDocument, { foreignKey: 'patientId', as: 'consentDocuments', onDelete: 'CASCADE', hooks: true });
ConsentFormTemplate.hasMany(ConsentFormDocument, { foreignKey: 'templateId', as: 'documents' });
Organisation.hasMany(ConsentFormDocument, { foreignKey: 'organisationId', as: 'consentDocuments', onDelete: 'CASCADE', hooks: true });
User.hasMany(ConsentFormDocument, { foreignKey: 'sentBy', as: 'sentConsentDocuments', onDelete: 'SET NULL' });

ConsentFormSignatureAudit.belongsTo(ConsentFormDocument, { foreignKey: 'documentId', as: 'document', onDelete: 'CASCADE', hooks: true });
ConsentFormSignatureAudit.belongsTo(DiaryPatient, { foreignKey: 'patientId', as: 'patient', onDelete: 'CASCADE', hooks: true });
ConsentFormSignatureAudit.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
ConsentFormSignatureAudit.belongsTo(User, { foreignKey: 'performedBy', as: 'performedByUser', onDelete: 'SET NULL' });
ConsentFormDocument.hasMany(ConsentFormSignatureAudit, { foreignKey: 'documentId', as: 'signatureAudit', onDelete: 'CASCADE', hooks: true });
User.hasMany(ConsentFormSignatureAudit, { foreignKey: 'performedBy', as: 'signatureAuditTrail', onDelete: 'SET NULL' });

// Diary Zones Associations
DiaryZone.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
DiaryZone.belongsTo(User, { foreignKey: 'dentistId', as: 'dentist', onDelete: 'CASCADE', hooks: true });
DiaryZone.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });
DiaryZone.belongsTo(User, { foreignKey: 'updatedBy', as: 'updater', onDelete: 'SET NULL' });
Organisation.hasMany(DiaryZone, { foreignKey: 'organisationId', as: 'zones', onDelete: 'CASCADE', hooks: true });
User.hasMany(DiaryZone, { foreignKey: 'dentistId', as: 'diaryZones', onDelete: 'CASCADE', hooks: true });

// OrganisationTreatment
OrganisationTreatment.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(OrganisationTreatment, { foreignKey: 'organisationId', as: 'organisationTreatments', onDelete: 'CASCADE', hooks: true });

// Organisation Contacts / Equipment / Surgeries / Groups / Scripts (ORG_DELETE)
Organisation.hasMany(OrganisationContact, { foreignKey: "organisationId", as: "contacts" });
OrganisationContact.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

Organisation.hasMany(OrganisationEquipment, { foreignKey: "organisationId", as: "equipments" });
OrganisationEquipment.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

Organisation.hasMany(OrganisationSurgery, { foreignKey: "organisationId", as: "surgeries" });
OrganisationSurgery.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

Organisation.hasMany(OrganisationGroup, { foreignKey: "organisationId", as: "groups" });
OrganisationGroup.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

Organisation.hasOne(OrganisationSmtp, { foreignKey: "organisationId", as: "smtpConfig" });
OrganisationSmtp.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });

OrganisationGroup.hasMany(OrganisationGroupUser, { foreignKey: "groupId", as: "groupUsers" });
OrganisationGroupUser.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", hooks: true });
OrganisationGroupUser.belongsTo(OrganisationGroup, { foreignKey: "groupId", as: "group", onDelete: "CASCADE", hooks: true });
OrganisationGroupUser.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasMany(OrganisationGroupUser, { foreignKey: "userId", as: "groupMemberships", onDelete: "CASCADE", hooks: true });

// Loyalty points / user points (USER_DELETE)
UserLoyaltyPoint.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasMany(UserLoyaltyPoint, { foreignKey: "userId", as: "userLoyaltyPoints", onDelete: "CASCADE", hooks: true });
UserLoyaltyPoint.belongsTo(LoyaltyPoint, { foreignKey: "loyaltyPointId", as: "loyaltyPoint" });
LoyaltyPoint.hasMany(UserLoyaltyPoint, { foreignKey: "loyaltyPointId", as: "userLoyaltyPoints" });

UserPoint.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasOne(UserPoint, { foreignKey: "userId", as: "userPoints", onDelete: "CASCADE", hooks: true });

UserPointsHistory.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasMany(UserPointsHistory, { foreignKey: "userId", as: "pointsHistory", onDelete: "CASCADE", hooks: true });
UserPointsHistory.belongsTo(RewardPoint, { foreignKey: "rewardPointId", as: "rewardPoint" });
RewardPoint.hasMany(UserPointsHistory, { foreignKey: "rewardPointId", as: "history" });

// User Contract
UserContract.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasOne(UserContract, { foreignKey: "userId", as: "contract", onDelete: "CASCADE", hooks: true });
UserContract.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });
Organisation.hasMany(UserContract, { foreignKey: "organisationId", as: "userContracts", onDelete: "CASCADE", hooks: true });

// User Account
UserAccount.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasOne(UserAccount, { foreignKey: "userId", as: "account", onDelete: "CASCADE", hooks: true });

// Leave / HR Documents
UserLeaveHistory.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasMany(UserLeaveHistory, { foreignKey: "userId", as: "leaveHistory", onDelete: "CASCADE", hooks: true });

// Association for the approver (the user who approved the leave)
UserLeaveHistory.belongsTo(User, { foreignKey: "approvedBy", as: "approver", onDelete: "SET NULL" });
User.hasMany(UserLeaveHistory, { foreignKey: "approvedBy", as: "approvedLeaves", onDelete: "SET NULL" });

UserLeaveEntitlement.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
User.hasOne(UserLeaveEntitlement, { foreignKey: "userId", as: "leaveEntitlement", onDelete: "CASCADE", hooks: true });

UserHrDocument.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });

// System Documents
SystemDocument.belongsTo(SystemDocumentFolder, { foreignKey: "folderId", as: "folder", onDelete: "SET NULL" });
SystemDocumentFolder.hasMany(SystemDocument, { foreignKey: "folderId", as: "documents", onDelete: "CASCADE", hooks: true });
SystemDocument.belongsTo(TaskCategory, { foreignKey: "categoryId", as: "category", onDelete: "SET NULL" });
TaskCategory.hasMany(SystemDocument, { foreignKey: "categoryId", as: "documents", onDelete: "CASCADE", hooks: true });

// Important people
OrganisationPeople.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });
Organisation.hasOne(OrganisationPeople, { foreignKey: "organisationId", as: "importantPeople", onDelete: "CASCADE", hooks: true });

// CRM associations
MetaPage.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
MetaPage.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(MetaPage, { foreignKey: 'organisationId', as: 'metaPages', onDelete: 'CASCADE', hooks: true });

CrmLead.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(CrmLead, { foreignKey: 'organisationId', as: 'crmLeads', onDelete: 'CASCADE', hooks: true });

// CRM Custom Columns
Organisation.hasMany(CrmCustomColumnDefinition, { foreignKey: 'organisationId', as: 'crmCustomColumns', onDelete: 'CASCADE', hooks: true });
CrmCustomColumnDefinition.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
CrmCustomColumnDefinition.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });
User.hasMany(CrmCustomColumnDefinition, { foreignKey: 'createdBy', as: 'crmCustomColumns', onDelete: 'SET NULL' });

CrmLead.hasMany(LeadCustomField, { foreignKey: 'leadId', as: 'customFields', onDelete: 'CASCADE', hooks: true });
LeadCustomField.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead', onDelete: 'CASCADE', hooks: true });
CrmCustomColumnDefinition.hasMany(LeadCustomField, { foreignKey: 'columnDefinitionId', as: 'fieldValues', onDelete: 'CASCADE', hooks: true });
LeadCustomField.belongsTo(CrmCustomColumnDefinition, { foreignKey: 'columnDefinitionId', as: 'columnDefinition', onDelete: 'CASCADE', hooks: true });

MetaUserToken.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
MetaUserToken.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(MetaUserToken, { foreignKey: 'organisationId', as: 'metaUserTokens', onDelete: 'CASCADE', hooks: true });

MetaWhatsAppConfig.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
MetaWhatsAppConfig.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(MetaWhatsAppConfig, { foreignKey: 'organisationId', as: 'metaWhatsAppConfigs', onDelete: 'CASCADE', hooks: true });
WhapiChannelConfig.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
WhapiChannelConfig.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(WhapiChannelConfig, { foreignKey: 'organisationId', as: 'whapiChannelConfigs', onDelete: 'CASCADE', hooks: true });
CrmWhatsAppMessageLog.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(CrmWhatsAppMessageLog, { foreignKey: 'organisationId', as: 'whatsappMessageLogs', onDelete: 'CASCADE', hooks: true });
CrmWhatsAppMessageLog.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead', onDelete: 'SET NULL', hooks: true });
CrmLead.hasMany(CrmWhatsAppMessageLog, { foreignKey: 'leadId', as: 'whatsappMessageLogs', onDelete: 'SET NULL', hooks: true });

// CRM DMs
CrmDmAccount.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
CrmDmAccount.belongsTo(User, { foreignKey: 'connectedByUserId', as: 'connectedBy', onDelete: 'SET NULL' });
Organisation.hasMany(CrmDmAccount, { foreignKey: 'organisationId', as: 'dmAccounts', onDelete: 'CASCADE', hooks: true });

CrmDmConversation.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(CrmDmConversation, { foreignKey: 'organisationId', as: 'dmConversations', onDelete: 'CASCADE', hooks: true });

CrmDmConversation.hasMany(CrmDmMessage, { foreignKey: 'conversationId', as: 'messages' });
CrmDmMessage.belongsTo(CrmDmConversation, { foreignKey: 'conversationId', as: 'conversation', onDelete: 'CASCADE', hooks: true });
CrmDmMessage.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

CrmLead.hasOne(CrmLeadTreatment, { foreignKey: 'leadId', as: 'treatmentInfo' });
CrmLeadTreatment.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead', onDelete: 'CASCADE', hooks: true });

CrmLead.hasMany(CrmLeadNote, { foreignKey: 'leadId', as: 'notes' });
CrmLeadNote.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead', onDelete: 'CASCADE', hooks: true });

CrmLead.hasOne(CrmLeadCommunication, { foreignKey: 'leadId', as: 'communication' });
CrmLeadCommunication.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead', onDelete: 'CASCADE', hooks: true });

CrmLead.hasMany(CrmLeadAssignee, { foreignKey: 'leadId', as: 'assignees' });

// FCM Token relationships
FcmToken.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
User.hasMany(FcmToken, { foreignKey: 'userId', as: 'fcmTokens', onDelete: 'CASCADE', hooks: true });

// User Notification relationships
UserNotification.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
User.hasMany(UserNotification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE', hooks: true });
CrmLeadAssignee.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead', onDelete: 'CASCADE', hooks: true });
CrmLeadAssignee.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });

Organisation.hasMany(CrmAutomationTemplate, { foreignKey: 'organisationId', as: 'crmAutomationTemplates' });
CrmAutomationTemplate.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

Organisation.hasMany(CrmAutomationGroup, { foreignKey: 'organisationId', as: 'crmAutomationGroups' });
CrmAutomationGroup.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

CrmAutomationGroup.hasMany(CrmAutomationGroupTemplate, { foreignKey: 'groupId', as: 'templates' });
CrmAutomationGroupTemplate.belongsTo(CrmAutomationGroup, { foreignKey: 'groupId', as: 'group', onDelete: 'CASCADE', hooks: true });
CrmAutomationGroupTemplate.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(CrmAutomationGroupTemplate, { foreignKey: 'organisationId', as: 'crmAutomationGroupTemplates' });

Organisation.hasMany(PatientAutomationTemplate, { foreignKey: 'organisationId', as: 'patientAutomationTemplates' });
PatientAutomationTemplate.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });

ChatbotConfig.belongsTo(Organisation, { foreignKey: 'organizationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
ChatbotConfig.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
Organisation.hasOne(ChatbotConfig, { foreignKey: 'organizationId', as: 'chatbotConfig', onDelete: 'CASCADE', hooks: true });
User.hasMany(ChatbotConfig, { foreignKey: 'userId', as: 'chatbotConfigs', onDelete: 'CASCADE', hooks: true });

//Organisation-level
Organisation.hasMany(MetaAdAccount, { foreignKey: 'organisationId' })
MetaAdAccount.belongsTo(Organisation, { foreignKey: 'organisationId' })

Organisation.hasMany(MetaCampaign, { foreignKey: 'organisationId' })
Organisation.hasMany(MetaAdSet, { foreignKey: 'organisationId' })
Organisation.hasMany(MetaAd, { foreignKey: 'organisationId' })
Organisation.hasMany(MetaInsight, { foreignKey: 'organisationId' })

//Ad Account → Campaign
MetaAdAccount.hasMany(MetaCampaign, {
  foreignKey: 'adAccountId',
  sourceKey: 'adAccountId',
})

MetaCampaign.belongsTo(MetaAdAccount, {
  foreignKey: 'adAccountId',
  targetKey: 'adAccountId',
})

//Campaign → Ad Set
MetaCampaign.hasMany(MetaAdSet, {
  foreignKey: 'campaignId',
  sourceKey: 'campaignId',
})

MetaAdSet.belongsTo(MetaCampaign, {
  foreignKey: 'campaignId',
  targetKey: 'campaignId',
})

//Ad Set → Ad
MetaAdSet.hasMany(MetaAd, {
  foreignKey: 'adSetId',
  sourceKey: 'adSetId',
})

MetaAd.belongsTo(MetaAdSet, {
  foreignKey: 'adSetId',
  targetKey: 'adSetId',
})

//Leads Attribution
CrmLead.belongsTo(MetaCampaign, {
  foreignKey: 'campaignId',
  targetKey: 'campaignId',
})

CrmLead.belongsTo(MetaAdSet, {
  foreignKey: 'adSetId',
  targetKey: 'adSetId',
})

CrmLead.belongsTo(MetaAd, {
  foreignKey: 'adId',
  targetKey: 'adId',
})

//Insights (Polymorphic-style, no FK constraints)
MetaCampaign.hasMany(MetaInsight, {
  foreignKey: 'entityId',
  sourceKey: 'campaignId',
  constraints: false,
  scope: { entityType: 'campaign' },
})

MetaAdSet.hasMany(MetaInsight, {
  foreignKey: 'entityId',
  sourceKey: 'adSetId',
  constraints: false,
  scope: { entityType: 'adset' },
})

MetaAd.hasMany(MetaInsight, {
  foreignKey: 'entityId',
  sourceKey: 'adId',
  constraints: false,
  scope: { entityType: 'ad' },
})


// Google Ads Associations
Organisation.hasOne(GoogleAdsAccount, { foreignKey: 'organisationId', as: 'googleAdsAccounts' })
GoogleAdsAccount.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true })

GoogleAdsAccount.hasMany(GoogleAdsCampaign, { foreignKey: 'googleCustomerId', sourceKey: 'googleCustomerId', as: 'campaigns' })
GoogleAdsCampaign.belongsTo(GoogleAdsAccount, { foreignKey: 'googleCustomerId', targetKey: 'googleCustomerId', as: 'account', onDelete: 'CASCADE', hooks: true })

GoogleAdsCampaign.hasMany(GoogleAdsAdGroup, { foreignKey: 'campaignId', as: 'adGroups' })
GoogleAdsAdGroup.belongsTo(GoogleAdsCampaign, { foreignKey: 'campaignId', as: 'campaign', onDelete: 'CASCADE', hooks: true })

GoogleAdsAdGroup.hasMany(GoogleAdsAd, { foreignKey: 'adGroupId', as: 'ads' })
GoogleAdsAd.belongsTo(GoogleAdsAdGroup, { foreignKey: 'adGroupId', as: 'adGroup', onDelete: 'CASCADE', hooks: true })

// Insights (Polymorphic-style, no FK constraints)
GoogleAdsAccount.hasMany(GoogleAdsInsight, {
  foreignKey: 'entityId',
  sourceKey: 'googleCustomerId',
  constraints: false,
  scope: { entityType: 'account' },
})

GoogleAdsCampaign.hasMany(GoogleAdsInsight, {
  foreignKey: 'entityId',
  sourceKey: 'campaignId',
  constraints: false,
  scope: { entityType: 'campaign' },
})

GoogleAdsAdGroup.hasMany(GoogleAdsInsight, {
  foreignKey: 'entityId',
  sourceKey: 'adGroupId',
  constraints: false,
  scope: { entityType: 'adgroup' },
})

GoogleAdsAd.hasMany(GoogleAdsInsight, {
  foreignKey: 'entityId',
  sourceKey: 'adId',
  constraints: false,
  scope: { entityType: 'ad' },
})


// CPD Associations
Course.hasMany(CourseQuestionaire, { foreignKey: "courseId", as: "questions" });
CourseQuestionaire.belongsTo(Course, { foreignKey: "courseId", as: "course", onDelete: 'CASCADE', hooks: true });

Course.hasMany(UserCourseHistory, { foreignKey: "courseId", as: "userHistories" });
UserCourseHistory.belongsTo(Course, { foreignKey: "courseId", as: "course", onDelete: 'CASCADE', hooks: true });
UserCourseHistory.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: 'CASCADE', hooks: true });
User.hasMany(UserCourseHistory, { foreignKey: "userId", as: "courseHistories", onDelete: 'CASCADE', hooks: true });

// UserHrDocuments
User.hasMany(UserHrDocument, { foreignKey: "userId", as: "hrDocuments", onDelete: 'CASCADE', hooks: true });

// Organisation Scripts
Organisation.hasMany(OrganisationScript, { foreignKey: "organisationId", as: "scripts" });
OrganisationScript.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: 'CASCADE', hooks: true });


OrganisationReferral.belongsTo(User, {
  foreignKey: "referredBy",
  as: "referrer",
  onDelete: "CASCADE",
});

User.hasMany(OrganisationReferral, {
  foreignKey: "referredBy",
  as: "organisationReferrals",
});

// Google Analytics (GSC & Business Profile) Associations
GoogleOAuthToken.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
GoogleOAuthToken.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE', hooks: true });
Organisation.hasOne(GoogleOAuthToken, { foreignKey: 'organisationId', as: 'googleOAuthToken', onDelete: 'CASCADE', hooks: true });
User.hasMany(GoogleOAuthToken, { foreignKey: 'userId', as: 'googleOAuthTokens', onDelete: 'CASCADE', hooks: true });

GoogleSearchConsoleSite.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
GoogleSearchConsoleSite.belongsTo(GoogleOAuthToken, { foreignKey: 'googleOAuthTokenId', as: 'oauthToken', onDelete: 'CASCADE', hooks: true });
Organisation.hasOne(GoogleSearchConsoleSite, { foreignKey: 'organisationId', as: 'googleSearchConsoleSite', onDelete: 'CASCADE', hooks: true });
GoogleOAuthToken.hasOne(GoogleSearchConsoleSite, { foreignKey: 'googleOAuthTokenId', as: 'searchConsoleSite', onDelete: 'CASCADE', hooks: true });

GoogleSearchConsoleSitePage.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
GoogleSearchConsoleSitePage.belongsTo(GoogleSearchConsoleSite, { foreignKey: 'siteId', as: 'site', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(GoogleSearchConsoleSitePage, { foreignKey: 'organisationId', as: 'googleSearchConsoleSitePages', onDelete: 'CASCADE', hooks: true });
GoogleSearchConsoleSite.hasMany(GoogleSearchConsoleSitePage, { foreignKey: 'siteId', as: 'pages', onDelete: 'CASCADE', hooks: true });

GoogleSearchConsolePerformance.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
GoogleSearchConsolePerformance.belongsTo(GoogleSearchConsoleSite, { foreignKey: 'siteId', as: 'site', onDelete: 'CASCADE', hooks: true });
Organisation.hasMany(GoogleSearchConsolePerformance, { foreignKey: 'organisationId', as: 'googleSearchConsolePerformance', onDelete: 'CASCADE', hooks: true });
GoogleSearchConsoleSite.hasMany(GoogleSearchConsolePerformance, { foreignKey: 'siteId', as: 'performanceData', onDelete: 'CASCADE', hooks: true });

GoogleBusinessProfile.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
GoogleBusinessProfile.belongsTo(GoogleOAuthToken, { foreignKey: 'googleOAuthTokenId', as: 'oauthToken', onDelete: 'CASCADE', hooks: true });
Organisation.hasOne(GoogleBusinessProfile, { foreignKey: 'organisationId', as: 'googleBusinessProfile', onDelete: 'CASCADE', hooks: true });
GoogleOAuthToken.hasOne(GoogleBusinessProfile, { foreignKey: 'googleOAuthTokenId', as: 'businessProfile', onDelete: 'CASCADE', hooks: true });

// Export models
export {
  User,
  UserAccount,
  UserDocument,
  UserDocumentFolder,
  UserOrganisation,
  UserSubscription,
  UserContract,
  UserPreference,
  UserTask,
  UserTaskChecklist,
  UserTaskAttachment,
  UserTaskComment,
  TaskCustomColumnDefinition,
  UserTaskCustomField,
  UserLeaveEntitlement,
  UserLeaveHistory,
  UserHrDocument,
  OnboardingEvent,
  TaskChecklist,
  Role,
  Organisation,
  OrganisationPriority,
  OrganisationStatus,
  OrganisationSmtp,
  OrganisationContact,
  OrganisationPeople,
  OrganisationEquipment,
  OrganisationGroup,
  OrganisationGroupUser,
  OrganisationReferral,
  EmailVerification,
  DefaultPriority,
  DefaultStatus,
  Verification,
  TaskCategory,
  Task,
  Rota,
  RotaShift,
  RotaUser,
  OrganisationSurgery,
  LoginHistory,
  RewardPoint,
  LoyaltyPoint,
  UserPoint,
  UserPointsHistory,
  UserLoyaltyPoint,
  SystemDocument,
  SystemDocumentFolder,
  Course,
  CourseQuestionaire,
  UserCourseHistory,
  // CRM
  CrmDmAccount,
  MetaPage,
  CrmLead,
  CrmLeadTreatment,
  CrmLeadNote,
  CrmOption,
  CrmLeadCommunication,
  CrmLeadAssignee,
  CrmAutomationTemplate,
  CrmAutomationGroup,
  CrmAutomationGroupTemplate,
  CrmAutomationDictionaryGroup,
  CrmAutomationDictionaryTemplate,
  FormConfig,
  CrmCustomColumnDefinition,
  LeadCustomField,
  CrmWhatsAppMessageLog,
  CrmDmConversation,
  CrmDmMessage,
  MetaUserToken,
  MetaWhatsAppConfig,
  WhapiChannelConfig,
  ChatbotConfig,
  MetaAdAccount,
  MetaCampaign,
  MetaAdSet,
  MetaAd,
  MetaInsight,
  GoogleAdsAccount,
  GoogleAdsCampaign,
  GoogleAdsAdGroup,
  GoogleAdsAd,
  GoogleAdsInsight,
  // Chatbot Support
  ChatbotConversation,
  ChatbotMessage,
  ChatbotMessageAttachment,
  // Reporting Bot
  ReportingBotConversation,
  ReportingBotMessage,
  // Google Analytics (GSC & Business Profile)
  GoogleOAuthToken,
  GoogleSearchConsoleSite,
  GoogleSearchConsoleSitePage,
  GoogleSearchConsolePerformance,
  GoogleBusinessProfile,
  // Diary
  DiaryPatient,
  DiaryAppointment,
  DiaryNote,
  DiaryPatientComfort,
  DiaryPatientSurvey,
  DiaryPatientForm,
  DiaryPatientChart,
  DiaryTreatmentPlan,
  DiaryTreatmentPlanItem,
  ClinicalNoteTemplate,
  ClinicalNoteTemplateVersion,
  ConsentFormTemplate,
  ConsentFormDocument,
  ConsentFormSignatureAudit,
  DiaryZone,
  DiaryPatientCommunicationLogs,
  DiaryGoogleCalendarEvent,
  DiaryDentistGoogleCalendar,
  GCMandate,
  GCPayment,
  GCWebhookLog,
  OrganisationTreatment,
  PatientInvoice,
  PatientInvoiceItem,
  PatientPayment,
  PatientPaymentAllocation,
  DictionaryScript,
  OrganisationScript,
  PatientAutomationDictionary,
  PatientAutomationTemplate,
  // Notifications
  FcmToken,
  UserNotification
};

// --------------------------
// Chatbot Support Associations
// --------------------------
// ChatbotConversation -> User, Organisation
ChatbotConversation.belongsTo(User, { foreignKey: "userId", as: "user", onDelete: "CASCADE", hooks: true });
ChatbotConversation.belongsTo(Organisation, { foreignKey: "organisationId", as: "organisation", onDelete: "CASCADE", hooks: true });
ChatbotConversation.belongsTo(User, { foreignKey: "resolvedBy", as: "resolver", onDelete: "SET NULL" });

// ChatbotConversation -> ChatbotMessages
ChatbotConversation.hasMany(ChatbotMessage, { foreignKey: "conversationId", as: "messages" });
ChatbotMessage.belongsTo(ChatbotConversation, { foreignKey: "conversationId", as: "conversation", onDelete: "CASCADE", hooks: true });

// ChatbotMessage -> User
ChatbotMessage.belongsTo(User, { foreignKey: "senderId", as: "sender", onDelete: "SET NULL" });

// ChatbotMessage -> Attachments
ChatbotMessage.hasMany(ChatbotMessageAttachment, { foreignKey: "messageId", as: "attachments" });
ChatbotMessageAttachment.belongsTo(ChatbotMessage, { foreignKey: "messageId", as: "message", onDelete: "CASCADE", hooks: true });
ChatbotMessageAttachment.belongsTo(ChatbotConversation, { foreignKey: "conversationId", as: "conversation", onDelete: "CASCADE", hooks: true });
ChatbotMessageAttachment.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader", onDelete: "SET NULL" });

// Bug reports and feature requests removed - using conversation metadata instead

// --------------------------
// Reporting Bot Associations
// --------------------------
ReportingBotConversation.belongsTo(User, { foreignKey: "userId", as: "rbUser", onDelete: "CASCADE", hooks: true });
ReportingBotConversation.belongsTo(Organisation, { foreignKey: "organisationId", as: "rbOrganisation", onDelete: "CASCADE", hooks: true });
ReportingBotConversation.hasMany(ReportingBotMessage, { foreignKey: "conversationId", as: "messages" });
ReportingBotMessage.belongsTo(ReportingBotConversation, { foreignKey: "conversationId", as: "conversation", onDelete: "CASCADE", hooks: true });

// --------------------------
// FormConfig -> Organisation
// --------------------------
Organisation.hasMany(FormConfig, { foreignKey: 'organisationId', as: 'formConfigs', onDelete: 'CASCADE', hooks: true });
FormConfig.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation', onDelete: 'CASCADE', hooks: true });
