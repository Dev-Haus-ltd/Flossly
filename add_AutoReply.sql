ALTER TABLE "Organisations" ADD COLUMN "autoReplyConfig" JSONB;

ALTER TABLE "Organisations" 
ADD COLUMN "whatsappAutoReplyEnabled" BOOLEAN NOT NULL DEFAULT false;



ALTER TABLE "CrmDmConversations" 
ADD COLUMN "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CrmDmConversations" 
ADD COLUMN "autoReplyDisabledUntil" TIMESTAMP;


ALTER TABLE "CrmLeads" ADD COLUMN "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CrmLeads" ADD COLUMN "autoReplyDisabledUntil" TIMESTAMP;