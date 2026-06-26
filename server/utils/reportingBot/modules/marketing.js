export const marketingModule = {
  name: 'marketing',
  description: 'Meta ads, Google ads, campaign performance, spend, cost-per-lead, impressions, clicks',
  schema: `
## Marketing / Ads Module

### Tables

**MetaInsights** — daily Meta (Facebook/Instagram) ad performance
- id, organisationId, entityType (campaign/adset/ad), entityId, date (DATEONLY), impressions, clicks, spend (INTEGER in PENCE — divide by 100 for £), leads, reach, cpc (FLOAT), ctr (FLOAT), cpm (FLOAT)

**MetaCampaigns** — Meta campaign list
- id, organisationId, campaignId (string Meta ID), name, status (ACTIVE/PAUSED/ARCHIVED), dailyBudget (pence), lifetimeBudget (pence)

**MetaAdSets** — Meta ad sets
- id, organisationId, campaignId, adSetId, name, status, optimizationGoal

**MetaAds** — individual Meta ads
- id, organisationId, adSetId, adId, name, status, platform

**GoogleAdsInsights** — daily Google Ads performance
- id, organisationId, entityType (account/campaign/adgroup/ad), entityId, date, impressions, clicks, costMicros (BIGINT in micros — divide by 1,000,000 for £), conversions

**GoogleAdsCampaigns** — Google campaign list
- campaignId (PK string), organisationId, name, status, advertisingChannelType, amountMicros (budget in micros)

### Key Queries

Meta campaign performance (last 90 days):
\`\`\`sql
SELECT
  mc.name AS campaign,
  mc.status,
  SUM(mi.leads) AS total_leads,
  ROUND(SUM(mi.spend) / 100.0, 2) AS total_spend_gbp,
  CASE WHEN SUM(mi.leads) > 0
    THEN ROUND(SUM(mi.spend)::numeric / SUM(mi.leads) / 100, 2) END AS cpl_gbp
FROM "MetaInsights" mi
JOIN "MetaCampaigns" mc ON mc."campaignId" = mi."entityId" AND mc."organisationId" = mi."organisationId"
WHERE mi."organisationId" = <orgId>
  AND mi."entityType" = 'campaign'
  AND mi.date >= NOW() - INTERVAL '90 days'
GROUP BY mc.name, mc.status
ORDER BY total_leads DESC NULLS LAST
\`\`\`

Meta leads attributed to CRM (join to CrmLeads):
\`\`\`sql
SELECT mc.name AS campaign, COUNT(l.id) AS crm_leads
FROM "CrmLeads" l
JOIN "MetaCampaigns" mc ON mc."campaignId" = l."campaignId" AND mc."organisationId" = l."organisationId"
WHERE l."organisationId" = <orgId> AND l."softDeleted" = false
GROUP BY mc.name ORDER BY crm_leads DESC
\`\`\`

Google Ads performance (last 90 days):
\`\`\`sql
SELECT
  gc.name AS campaign,
  SUM(gi.impressions) AS impressions,
  SUM(gi.clicks) AS clicks,
  ROUND(SUM(gi."costMicros") / 1000000.0, 2) AS spend_gbp,
  SUM(gi.conversions) AS conversions
FROM "GoogleAdsInsights" gi
JOIN "GoogleAdsCampaigns" gc ON gc."campaignId" = gi."entityId"
WHERE gi."organisationId" = <orgId>
  AND gi."entityType" = 'campaign'
  AND gi.date >= NOW() - INTERVAL '90 days'
GROUP BY gc.name ORDER BY spend_gbp DESC
\`\`\`
`
}
