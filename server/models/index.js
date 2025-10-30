import { DefaultPriority } from "./defaultPriorities";
import { DefaultStatus } from "./defaultStatuses";
import { OrganisationPriority } from "./organisations/organisationPriorities";
import { Organisation } from "./organisations/organisations";
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

import { Course } from "./cpd/course";
import { CourseQuestionaire } from "./cpd/courseQuestionaire";
import { UserCourseHistory } from "./cpd/userCourseHistory";
import { OrganisationPeople } from "./organisations/organisationPeople";
import { MetaPage } from "./crm/metaPages";
import { CrmLead } from "./crm/leads";
import { MetaUserToken } from "./crm/metaUserTokens";
import { ChatbotConfig } from "./crm/chatbotConfig";
import { CrmLeadTreatment } from "./crm/leadTreatments";
import { CrmLeadNote } from "./crm/leadNotes";
import { CrmOption } from "./crm/options";
import { CrmLeadCommunication } from "./crm/leadCommunications";

/* Relations and Associations */

TaskCategory.hasMany(Task, { foreignKey: "categoryId", as: "tasks" });

TaskCategory.hasMany(TaskCategory, {
  foreignKey: "parentId",
  as: "subcategories",
});

TaskCategory.belongsTo(TaskCategory, {
  foreignKey: "parentId",
  as: "parent",
});

Task.belongsTo(Role, { foreignKey: "roleId", as: "role" });
Task.belongsTo(TaskCategory, { foreignKey: "categoryId", as: "category" });

User.hasMany(UserTask, { foreignKey: "userId", as: "assignedTasks" });
UserTask.belongsTo(User, { foreignKey: "userId", as: "assignedUser" });

Task.hasMany(UserTask, { foreignKey: "taskId", as: "userTasks" });
UserTask.belongsTo(Task, { foreignKey: "taskId", as: "taskDetails" });

UserTask.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});

UserTask.belongsTo(OrganisationStatus, {
  foreignKey: "statusId",
  as: "status",
});

UserTask.belongsTo(OrganisationPriority, {
  foreignKey: "priorityId",
  as: "priority",
});

UserTask.hasMany(UserTaskAttachment, {
  foreignKey: "userTaskId",
  as: "attachments",
  onDelete: "CASCADE",
});

UserTaskAttachment.belongsTo(UserTask, {
  foreignKey: "userTaskId",
  as: "userTask",
});

// Task -> TaskChecklists
Task.hasMany(TaskChecklist, {
  foreignKey: "taskId",
  as: "taskChecklist",
  onDelete: "CASCADE",
});
TaskChecklist.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

// UserTask -> UserTaskChecklists
UserTask.hasMany(UserTaskChecklist, {
  foreignKey: "userTaskId",
  as: "userTaskChecklist",
  onDelete: "CASCADE",
});
UserTaskChecklist.belongsTo(UserTask, {
  foreignKey: "userTaskId",
  as: "userTask",
});

User.belongsTo(Role, { foreignKey: "roleId", as: "role" });

Role.hasMany(User, { foreignKey: "roleId", as: "users" });

// User -> Preference (1:1)
User.hasOne(UserPreference, { foreignKey: "userId", as: "preferences" });
UserPreference.belongsTo(User, { foreignKey: "userId", as: "user" });

// User -> UserOrganisations (1:M)
User.hasMany(UserOrganisation, {
  foreignKey: "userId",
  as: "userOrganisations",
});
UserOrganisation.belongsTo(User, { foreignKey: "userId", as: "user" });

// UserOrganisation -> Organisation (M:1)
UserOrganisation.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});
Organisation.hasMany(UserOrganisation, {
  foreignKey: "organisationId",
  as: "userOrganisations",
});

// User Subscriptions
UserSubscription.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// A subscription may belong to an organisation
UserSubscription.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});

UserDocument.belongsTo(UserDocumentFolder, {
  foreignKey: "folderId",
  as: "folder",
});

UserDocumentFolder.hasMany(UserDocument, {
  foreignKey: "folderId",
  as: "documents",
});

LoginHistory.belongsTo(User, { foreignKey: "userId", onDelete: "CASCADE" });
User.hasMany(LoginHistory, { foreignKey: "userId", onDelete: "CASCADE" });

// Rota Associations
Rota.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});
Rota.hasMany(RotaUser, { foreignKey: "rotaId", as: "users" });
Rota.hasMany(RotaShift, { foreignKey: "rotaId", as: "shifts" });

RotaUser.belongsTo(Rota, { foreignKey: "rotaId", as: "rota" });
RotaUser.belongsTo(User, { foreignKey: "userId", as: "user" });
RotaUser.hasMany(RotaShift, { foreignKey: "rotaUserId", as: "shifts" });

RotaShift.belongsTo(Rota, { foreignKey: "rotaId", as: "rota" });
RotaShift.belongsTo(RotaUser, { foreignKey: "rotaUserId", as: "rotaUser" });
RotaShift.belongsTo(User, { foreignKey: "userId", as: "user" });

// Orgnisation Contacts
Organisation.hasMany(OrganisationContact, {
  foreignKey: "organisationId",
  as: "contacts",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrganisationContact.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Orgnisation Equipment

Organisation.hasMany(OrganisationEquipment, {
  foreignKey: "organisationId",
  as: "equipments",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrganisationEquipment.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Orgnisation Surgeries

Organisation.hasMany(OrganisationSurgery, {
  foreignKey: "organisationId",
  as: "surgeries",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrganisationSurgery.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Organisation Groups

Organisation.hasMany(OrganisationGroup, {
  foreignKey: "organisationId",
  as: "groups",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Organisation.hasMany(OrganisationGroupUser, {
  foreignKey: "organisationId",
  as: "groupUsers",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrganisationGroup.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrganisationGroup.hasMany(OrganisationGroupUser, {
  foreignKey: "groupId",
  as: "groupUsers",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

User.hasMany(OrganisationGroupUser, {
  foreignKey: "userId",
  as: "groupMemberships",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrganisationGroupUser.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

OrganisationGroupUser.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});

OrganisationGroupUser.belongsTo(OrganisationGroup, {
  foreignKey: "groupId",
  as: "group",
});

// UserLoyaltyPoints belongs to a User
UserLoyaltyPoint.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// A User can have many loyalty points entries (for each type)
User.hasMany(UserLoyaltyPoint, {
  foreignKey: "userId",
  as: "userLoyaltyPoints",
});

// UserLoyaltyPoints belongs to a LoyaltyPoint definition
UserLoyaltyPoint.belongsTo(LoyaltyPoint, {
  foreignKey: "loyaltyPointId",
  as: "loyaltyPoint",
});

// A LoyaltyPoint definition can have many user assignments
LoyaltyPoint.hasMany(UserLoyaltyPoint, {
  foreignKey: "loyaltyPointId",
  as: "userLoyaltyPoints",
});

// 1. UserPoints ↔ Users
UserPoint.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});
User.hasOne(UserPoint, {
  foreignKey: "userId",
  as: "userPoints",
});

// UserPointsHistory ↔ User
UserPointsHistory.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});
User.hasMany(UserPointsHistory, {
  foreignKey: "userId",
  as: "pointsHistory",
});

// UserPointsHistory ↔ RewardPoints
UserPointsHistory.belongsTo(RewardPoint, {
  foreignKey: "rewardPointId",
  as: "rewardPoint",
});
RewardPoint.hasMany(UserPointsHistory, {
  foreignKey: "rewardPointId",
  as: "history",
});

// User Contract

UserContract.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserContract, { foreignKey: "userId", as: "contract" });

UserContract.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});
Organisation.hasMany(UserContract, {
  foreignKey: "organisationId",
  as: "userContracts",
});

// Accounts

UserAccount.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasOne(UserAccount, { foreignKey: "userId", as: "account" });

// system documents

User.hasMany(UserLeaveHistory, { foreignKey: "userId", as: "leaveHistory" });
UserLeaveHistory.belongsTo(User, { foreignKey: "userId", as: "user" });

// A user has one entitlement record
User.hasOne(UserLeaveEntitlement, {
  foreignKey: "userId",
  as: "leaveEntitlement",
});
UserLeaveEntitlement.belongsTo(User, { foreignKey: "userId", as: "user" });

UserLeaveHistory.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });

// SystemDocument ↔ SystemDocumentFolder
SystemDocument.belongsTo(SystemDocumentFolder, {
  foreignKey: "folderId",
  as: "folder",
});
SystemDocumentFolder.hasMany(SystemDocument, {
  foreignKey: "folderId",
  as: "documents",
});

SystemDocument.belongsTo(TaskCategory, {
  foreignKey: "categoryId",
  as: "category",
});
TaskCategory.hasMany(SystemDocument, {
  foreignKey: "categoryId",
  as: "documents",
});

//Important people

Organisation.hasOne(OrganisationPeople, {
  foreignKey: "organisationId",
  as: "importantPeople",
});
OrganisationPeople.belongsTo(Organisation, {
  foreignKey: "organisationId",
  as: "organisation",
});

// CRM (Meta Integration) - basic associations
MetaPage.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation' })
MetaPage.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Organisation.hasMany(MetaPage, { foreignKey: 'organisationId', as: 'metaPages' })

CrmLead.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation' })
Organisation.hasMany(CrmLead, { foreignKey: 'organisationId', as: 'crmLeads' })
MetaUserToken.belongsTo(Organisation, { foreignKey: 'organisationId', as: 'organisation' })
MetaUserToken.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Organisation.hasMany(MetaUserToken, { foreignKey: 'organisationId', as: 'metaUserTokens' })

// CRM Lead Treatment association
CrmLead.hasOne(CrmLeadTreatment, { foreignKey: 'leadId', as: 'treatmentInfo' })
CrmLeadTreatment.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead' })

// CRM Lead Notes association
CrmLead.hasMany(CrmLeadNote, { foreignKey: 'leadId', as: 'notes' })
CrmLeadNote.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead' })

// CRM Lead Communication association
CrmLead.hasOne(CrmLeadCommunication, { foreignKey: 'leadId', as: 'communication' })
CrmLeadCommunication.belongsTo(CrmLead, { foreignKey: 'leadId', as: 'lead' })

// Chatbot Configuration associations
ChatbotConfig.belongsTo(Organisation, { foreignKey: 'organizationId', as: 'organisation' })
ChatbotConfig.belongsTo(User, { foreignKey: 'userId', as: 'user' })
Organisation.hasOne(ChatbotConfig, { foreignKey: 'organizationId', as: 'chatbotConfig' })
User.hasMany(ChatbotConfig, { foreignKey: 'userId', as: 'chatbotConfigs' })

// CPD Associations
Course.hasMany(CourseQuestionaire, { foreignKey: "courseId", as: "questions" });
CourseQuestionaire.belongsTo(Course, { foreignKey: "courseId", as: "course" });

Course.hasMany(UserCourseHistory, {
  foreignKey: "courseId",
  as: "userHistories",
});
UserCourseHistory.belongsTo(Course, { foreignKey: "courseId", as: "course" });
UserCourseHistory.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(UserCourseHistory, {
  foreignKey: "userId",
  as: "courseHistories",
});
// User ↔ UserHrDocuments
User.hasMany(UserHrDocument, { foreignKey: "userId", as: "hrDocuments" });
UserHrDocument.belongsTo(User, { foreignKey: "userId", as: "user" });


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
  UserLeaveEntitlement,
  UserLeaveHistory,
  UserHrDocument,
  TaskChecklist,
  Role,
  Organisation,
  OrganisationPriority,
  OrganisationStatus,
  OrganisationContact,
  OrganisationPeople,
  OrganisationEquipment,
  OrganisationGroup,
  OrganisationGroupUser,
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
  MetaPage,
  CrmLead,
  CrmLeadTreatment,
  CrmLeadNote,
  CrmOption,
  CrmLeadCommunication,
  MetaUserToken,
  ChatbotConfig,
};
