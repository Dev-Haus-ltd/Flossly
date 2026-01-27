import { template } from "./emailTemplate";
import { transporter } from "./nodeMailer";
import { formatDateDDMMYYYY } from "~/lib/dateFormatter.js";

const DEFAULT_FROM = "Flossly <helloflossly@gmail.com>";
const DEFAULT_PRICING = { drift: 149, glide: 249, soar: 449, currency: "£" };
const DEFAULT_IMPACT = {
  adminHours: 12,
  hoursSaved: 10,
  enquiryLoss: 15,
  revenueRecovered: 18000,
  noShowRate: 18,
  noShowRateAfter: 7,
  noShowSavings: 22000,
  searchHours: 2,
  totalAnnual: 47280,
  hoursReturned: 520,
};

const formatDate = (date) => formatDateDDMMYYYY(date);

const renderTokens = (text, ctx = {}) => {
  if (!text) return "";
  const tokens = {
    "Name": ctx.name || "there",
    "Practice Name": ctx.practiceName || "your practice",
    "Founder Name": ctx.founderName || "Saba",
    "Success Manager Name": ctx.successManagerName || "FlosslyOS Team",
    "email": ctx.email || "",
    "Trial End Date": ctx.trialEndDate || "",
    "Trial Days Remaining": ctx.trialDaysRemaining ?? "",
    "Trial Days Remaining Unit": ctx.trialDaysRemainingUnit || "",
    "Trial Days Used": ctx.trialDaysUsed ?? "",
    "Trial Days Used Unit": ctx.trialDaysUsedUnit || "",
    "Trial Total Days": ctx.trialTotalDays ?? "",
    "Trial Total Days Unit": ctx.trialTotalDaysUnit || "",
    "Plan Name": ctx.planName || "",
    "Plan Drift Price": ctx.planDriftPrice || "",
    "Plan Glide Price": ctx.planGlidePrice || "",
    "Plan Soar Price": ctx.planSoarPrice || "",
    "Pricing From Label": ctx.pricingFromLabel || "",
    "Pricing Currency": ctx.pricingCurrency || "",
    "Practice Snapshot": ctx.practiceSnapshot || "",
    "Impact Admin Hours": ctx.impactAdminHours ?? "",
    "Impact Hours Saved": ctx.impactHoursSaved ?? "",
    "Impact Enquiry Loss": ctx.impactEnquiryLoss ?? "",
    "Impact Revenue Recovered": ctx.impactRevenueRecovered ?? "",
    "Impact NoShow Rate": ctx.impactNoShowRate ?? "",
    "Impact NoShow Rate After": ctx.impactNoShowRateAfter ?? "",
    "Impact NoShow Savings": ctx.impactNoShowSavings ?? "",
    "Impact Search Hours": ctx.impactSearchHours ?? "",
    "Impact Total Annual": ctx.impactTotalAnnual ?? "",
    "Impact Hours Returned": ctx.impactHoursReturned ?? "",
    "Tasks Count": ctx.tasksCount || "0",
    "Leads Count": ctx.leadsCount || "0",
    "Automations Count": ctx.automationsCount || "0",
    "Documents Count": ctx.documentsCount || "0",
    "Hours Saved": ctx.hoursSaved || "0",
    "Value Created": ctx.valueCreated || "0",
    "Base URL": ctx.baseUrl || "",
    "Watch Video URL": ctx.watchVideoUrl || "",
    "Start Setup URL": ctx.startSetupUrl || "",
    "Schedule Call URL": ctx.scheduleCallUrl || "",
    "Connect Meta Ads URL": ctx.connectMetaAdsUrl || "",
    "Complete Setup URL": ctx.completeSetupUrl || "",
    "Automation Builder URL": ctx.automationBuilderUrl || "",
    "Set Up Diary URL": ctx.setUpDiaryUrl || "",
    "Recall Setup URL": ctx.recallSetupUrl || "",
    "Activate Automation URL": ctx.activateAutomationUrl || "",
    "Subscribe URL": ctx.subscribeUrl || "",
    "Export Data URL": ctx.exportDataUrl || "",
  };

  let out = String(text);
  Object.entries(tokens).forEach(([key, value]) => {
    const safe = value === undefined || value === null ? "" : String(value);
    out = out.replaceAll(`[${key}]`, safe);
  });
  return out;
};

export const ONBOARDING_EMAIL_TEMPLATES = [
  {
    key: "onboarding_email_day0",
    offsetDays: 0,
    subject: "Welcome to FlosslyOS — your 2-minute setup starts now",
    body: `
      <p>Hi [Name],</p>
      <p>Welcome to FlosslyOS—the UK's #1 productivity platform for dental practices.</p>
      <p>You just took the first step toward running a practice that works FOR you, not against you.</p>
      <p><strong>Here's what happens next:</strong></p>
      <p><strong>Right Now (2 minutes)</strong><br/>
      → Watch this quick welcome video from our founder<br/>
      → See how FlosslyOS eliminates your biggest time-waster<br/>
      <a class="btn" href="[Watch Video URL]" target="_blank">Watch Video →</a></p>
      <p><strong>Today (10 minutes)</strong><br/>
      → Complete your personalized setup<br/>
      → Capture your first automated lead<br/>
      → Set up appointment reminders that cut no-shows by 40%<br/>
      <a class="btn" href="[Start Setup URL]" target="_blank">Start Setup →</a></p>
      <p><strong>This Week</strong><br/>
      → Connect your team (they'll love you for it)<br/>
      → Automate 3 workflows that currently waste 6 hours<br/>
      → Book your free 1:1 onboarding call with our team<br/>
      <a class="btn" href="[Schedule Call URL]" target="_blank">Schedule Call →</a></p>
      <p><strong>Your login details:</strong><br/>
      Dashboard: app.flosslyos.com<br/>
      Email: [email]<br/>
      Password: [Set on signup]</p>
      <p>One practice owner told us:<br/>
      "I wish I'd found FlosslyOS 3 years ago. The time I've wasted..."<br/>
      — Dr. Sarah Mitchell, Manchester Dental Clinic</p>
      <p>Let's make sure you don't waste another minute.</p>
      <p>See you inside,<br/>[Founder Name]<br/>Founder, FlosslyOS</p>
      <p>P.S. - Need help? Just reply to this email. I read every single one.</p>
    `,
  },
  {
    key: "onboarding_email_day2",
    offsetDays: 2,
    subject: "Your first 24 hours in FlosslyOS",
    body: `
      <p>Morning [Name],</p>
      <p>You're officially 24 hours into FlosslyOS. Here's what that means for [Practice Name]:</p>
      <p><strong>Your Personalized Impact Forecast</strong><br/>
      Based on practices like yours ([Practice Snapshot]):</p>
      <p>
        [Impact Admin Hours] hours/week on admin chaos → [Impact Hours Saved] hours back<br/>
        [Impact Enquiry Loss]% of enquiries never followed up → [Pricing Currency][Impact Revenue Recovered]/year recovered<br/>
        [Impact NoShow Rate]% no-show rate → Cut to [Impact NoShow Rate After]% ([Pricing Currency][Impact NoShow Savings] saved)<br/>
        [Impact Search Hours] hours/day searching for info → Instant access, zero searching
      </p>
      <p><strong>Total Annual Impact:</strong> [Pricing Currency][Impact Total Annual] saved + [Impact Hours Returned] hours back</p>
      <p>That's like hiring a full-time admin assistant—without the payroll.</p>
      <p><strong>Quick win for today:</strong> Set up automated appointment reminders in 3 minutes.<br/>
      Cut no-shows by 40% starting this afternoon.<br/>
      <a class="btn" href="[Complete Setup URL]" target="_blank">Complete 3-Minute Setup →</a></p>
      <p>Already done it? Legend. Here's what's next:<br/>
      <a class="btn" href="[Connect Meta Ads URL]" target="_blank">Connect Your Meta Leads →</a></p>
      <p>Cheering you on,<br/>[Success Manager Name]<br/>Customer Success, FlosslyOS</p>
      <p>P.S. - 87% of practices who complete this step in Week 1 subscribe by Day 14. Just saying. 😉</p>
    `,
  },
  {
    key: "onboarding_email_day2b",
    offsetDays: 2,
    subject: "Your Priority Actions Today",
    body: `
      <p>Good morning [Name],</p>
      <p><strong>Your Priority Actions Today:</strong><br/>
      Review 2 new Meta leads - Responded automatically, but need treatment plan<br/>
      <a class="btn" href="[Connect Meta Ads URL]" target="_blank">View Leads →</a><br/><br/>
      Approve staff rota - Emma requested next Friday off<br/>
      <a class="btn" href="[Base URL]/teams/rota" target="_blank">Quick Approve →</a><br/><br/>
      15-minute power task - Set up your first task template (save 2 hours/week)<br/>
      <a class="btn" href="[Base URL]/tasks" target="_blank">Start Template →</a></p>
      <p><strong>Today's Challenge:</strong><br/>
      Invite 2 team members by 5 PM → Get entered to win 3 months free<br/>
      <a class="btn" href="[Base URL]/teams" target="_blank">Invite Team →</a></p>
      <p>Keep crushing it,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day3",
    offsetDays: 3,
    subject: "The 2-minute rule that triples conversions",
    body: `
      <p>Hi [Name],</p>
      <p>If you don't respond to a lead within 5 minutes, your conversion rate drops by 400%.</p>
      <p>But you're busy treating patients. You can't drop everything to reply to a Facebook message.</p>
      <p>That's why 60% of dental leads never convert.</p>
      <p><strong>Today's Focus: FlosslyCRM Automation</strong><br/>
      Yesterday you captured leads. Today we make them convert 3x faster—automatically.</p>
      <p><strong>How FlosslyAutomation Works:</strong><br/>
      Instant Auto-Response (2 Minutes)<br/>
      Smart Lead Pipeline<br/>
      Team Notifications<br/>
      Automated Follow-Ups</p>
      <p><strong>Your 5-Minute Automation Setup:</strong><br/>
      Step 1: Choose your auto-response template (or customize)<br/>
      Step 2: Set your lead pipeline stages<br/>
      Step 3: Turn on automated follow-ups<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Build Your First Automation →</a></p>
      <p><strong>Today's Challenge:</strong><br/>
      Create your first automated follow-up sequence by end of day.<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Start Automation Builder →</a></p>
      <p>Tomorrow: We tackle the £22,000 no-show problem with FlosslyDiary.</p>
      <p>You're crushing it,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day4",
    offsetDays: 4,
    subject: "Why 18% of your appointments are no-shows (and how to cut it to 5%)",
    body: `
      <p>Good morning [Name],</p>
      <p>Let's talk about the silent revenue killer: no-shows.</p>
      <p>Industry average: 15-20% no-show rate<br/>
      If you see 30 patients/day:<br/>
      5 patients don't show up<br/>
      Average appointment value: £120<br/>
      Daily loss: £600<br/>
      Annual loss: £156,000</p>
      <p><strong>Today's Focus: FlosslyDiary</strong><br/>
      FlosslyDiary is your intelligent appointment system that cuts no-shows by 40% (from 18% to 7%).</p>
      <p><strong>Your 3-Minute Setup:</strong><br/>
      Step 1: Connect your calendar (Google/Outlook)<br/>
      Step 2: Set your reminder preferences (48hr + 24hr)<br/>
      Step 3: Turn on automated waitlist<br/>
      <a class="btn" href="[Set Up Diary URL]" target="_blank">Set Up FlosslyDiary →</a></p>
      <p>Bonus: Enable online booking and embed on your website<br/>
      <a class="btn" href="[Base URL]/diary" target="_blank">Get Booking Widget →</a></p>
      <p><strong>Today's Challenge:</strong> Set up your first automated reminder sequence.<br/>
      <a class="btn" href="[Set Up Diary URL]" target="_blank">Configure Reminders Now →</a></p>
      <p>Tomorrow: We'll show you the £30,000 recall system most practices are missing.</p>
      <p>Keep going,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day5",
    offsetDays: 5,
    subject: "The £30K sitting in your database right now",
    body: `
      <p>Hi [Name],</p>
      <p>Pop quiz: How many of your patients are overdue for their 6-month check-up right now?</p>
      <p>Most practice owners guess: "Maybe 20-30?"<br/>
      The real answer: 100-200+ patients.</p>
      <p><strong>Today's Focus: FlosslyDiary Recalls System</strong><br/>
      FlosslyDiary automatically tracks every patient's recall date and sends reminders without you lifting a finger.</p>
      <p><strong>Your 4-Minute Setup:</strong><br/>
      Step 1: Set your default recall periods (6 months for check-ups, 3 months for hygiene, etc.)<br/>
      Step 2: Customize your recall message templates<br/>
      Step 3: Turn on automated campaigns<br/>
      <a class="btn" href="[Recall Setup URL]" target="_blank">Activate Recall System →</a></p>
      <p><strong>Today's Challenge:</strong> Run your first batch recall campaign for overdue patients.<br/>
      <a class="btn" href="[Recall Setup URL]" target="_blank">Find Overdue Patients →</a></p>
      <p>Tomorrow: We fix the "Who's doing what?" chaos with FlosslyTasks.</p>
      <p>You're halfway to transformation,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day6",
    offsetDays: 6,
    subject: "The automation that runs your practice while you sleep",
    body: `
      <p>Hi [Name],</p>
      <p>Here's what your practice does every single day: reminders, lead follow-ups, tasks, invoices, recalls, reviews.</p>
      <p>What if 90% of it happened automatically while you were sleeping?</p>
      <p><strong>Today's Focus: FlosslyAutomation</strong><br/>
      FlosslyAutomation is the brain that connects all your modules and makes your practice run itself.</p>
      <p><strong>Your 10-Minute Challenge:</strong><br/>
      Step 1: Browse automation templates<br/>
      Step 2: Activate "Appointment Reminder Sequence"<br/>
      Step 3: Watch it run automatically<br/>
      <a class="btn" href="[Activate Automation URL]" target="_blank">Activate First Automation →</a></p>
      <p>Bonus: Build a custom automation with the visual builder<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Open Automation Builder →</a></p>
      <p>Tomorrow: We connect all your tools with FlosslyToolbox.</p>
      <p>The finish line is close,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day7",
    offsetDays: 7,
    subject: "How's your FlosslyOS experience going, [Name]?",
    body: `
      <p>Hi [Name],</p>
      <p>Just checking in—how's your FlosslyOS experience been so far?</p>
      <p>We'd genuinely love to hear: what's working well for you, any features you're loving, anything we can help with.</p>
      <p><a class="btn" href="[Base URL]/support" target="_blank">Quick Feedback - 30 Seconds →</a></p>
      <p><strong>Your Trial Snapshot:</strong><br/>
      ✅ [Tasks Count] tasks created and assigned to your team<br/>
      ✅ [Leads Count] leads captured and followed up automatically<br/>
      ✅ [Automations Count] automations running<br/>
      ✅ [Documents Count] documents uploaded and organized<br/>
      ✅ [Hours Saved] hours saved through automation<br/>
      Estimated value created: £[Value Created]</p>
      <p><strong>Quick Reminder:</strong> Your trial ends in [Trial Days Remaining] [Trial Days Remaining Unit] (on [Trial End Date] at midnight).</p>
      <p><strong>Ready to keep going?</strong><br/>
      Subscribe now and get our trial-exclusive bonus:</p>
      <p>🎁 3 months of implementation support (£1,500 value)<br/>
      🎁 Free productivity audit (£500 value)<br/>
      🎁 Dedicated account manager</p>
      <p><a class="btn" href="[Subscribe URL]" target="_blank">Subscribe Now - Keep Everything →</a></p>
      <p>Pricing:<br/>
      Drift: [Pricing Currency][Plan Drift Price]/month<br/>
      Glide: [Pricing Currency][Plan Glide Price]/month<br/>
      Soar: [Pricing Currency][Plan Soar Price]/month</p>
      <p>Still have questions? Just reply to this email—we're here to help.</p>
      <p>Thanks for trying FlosslyOS. We hope you decide to stay!<br/>The FlosslyOS Team</p>
      <p>P.S. - 87% of practices who complete their trial subscribe. Don't let [Trial Days Used] [Trial Days Used Unit] of work go to waste.</p>
    `,
  },
  {
    key: "onboarding_email_day13",
    offsetDays: 13,
    subject: "Your trial ends on [Trial End Date] - don't lose your work",
    body: `
      <p>Hi [Name],</p>
      <p>This is urgent. Your FlosslyOS trial ends on [Trial End Date] at midnight (11:59 PM).</p>
      <p>If you don't subscribe before then, you'll lose everything you've built over the past [Trial Days Used] [Trial Days Used Unit].</p>
      <p><strong>What you'll lose:</strong><br/>
      ❌ All your tasks - [Tasks Count] tasks created, all deleted<br/>
      ❌ All your leads - [Leads Count] enquiries in your CRM, gone<br/>
      ❌ All your automations - Every workflow you set up, erased<br/>
      ❌ All your documents - [Documents Count] files uploaded, permanently removed<br/>
      ❌ Your team's access</p>
      <p>This cannot be undone.</p>
      <p><strong>But you can keep everything</strong><br/>
      Subscribe now and: keep all your work, keep your team, keep automations running, and get a 60-day money-back guarantee.</p>
      <p><a class="btn" href="[Subscribe URL]" target="_blank">Subscribe Now - Don't Lose Your Data →</a></p>
      <p>Need more time? Reply "EXTEND" and we'll give you 7 extra days.</p>
      <p>Don't let [Trial Days Used] [Trial Days Used Unit] of work disappear tomorrow.</p>
      <p>The FlosslyOS Team</p>
    `,
  },
];

export const ONBOARDING_INAPP_MESSAGES = [
  {
    key: "onboarding_inapp_day2_meta",
    offsetDays: 2,
    title: "Pro Tip: Turn Facebook Leads Into Booked Appointments",
    message:
      "Right now, leads from your Meta ads are probably sitting in Facebook... while you're here in FlosslyOS. Connect them in 60 seconds: every Facebook enquiry flows straight into your CRM dashboard, auto-reply in 2 minutes, never lose another £2,000 treatment plan.",
    primaryLabel: "Connect Meta Ads",
    primaryLink: "[Connect Meta Ads URL]",
    secondaryLabel: "Maybe Later",
  },
  {
    key: "onboarding_inapp_day3_automation",
    offsetDays: 3,
    title: "Leads that get 2-minute responses convert 300% better",
    message:
      "FlosslyAutomation sends instant SMS + email, auto-follow-ups (Day 1, 2, 4, 7), and team alerts. Your new conversion rate: 60% (up from 20%).",
    primaryLabel: "Build First Automation",
    primaryLink: "[Automation Builder URL]",
    secondaryLabel: "See Template Library",
    secondaryLink: "[Automation Builder URL]",
  },
  {
    key: "onboarding_inapp_day4_noshows",
    offsetDays: 4,
    title: "Cut No-Shows by 40% (Save £103K/Year)",
    message:
      "Every no-show = £125-£350 lost revenue. FlosslyDiary sends automatic reminders: 48 hours before (SMS + Email), 24 hours before, 3 hours before (high-value only). Result: no-show rate drops from 18% → 7%.",
    primaryLabel: "Set Up Reminders (3 Min)",
    primaryLink: "[Set Up Diary URL]",
    secondaryLabel: "See How It Works",
    secondaryLink: "[Set Up Diary URL]",
  },
  {
    key: "onboarding_inapp_day5_recalls",
    offsetDays: 5,
    title: "Recover £30K in Overdue Recalls",
    message:
      "You have patients overdue for check-ups right now. FlosslyRecalls sends automatic reminders and recovers an average £30,000/year.",
    primaryLabel: "Run First Recall Campaign",
    primaryLink: "[Recall Setup URL]",
    secondaryLabel: "See Overdue List",
    secondaryLink: "[Recall Setup URL]",
  },
  {
    key: "onboarding_inapp_day6_automation",
    offsetDays: 6,
    title: "Eliminate 90% of Manual Work",
    message:
      "Your practice can run itself. FlosslyAutomation handles appointment reminders, lead follow-ups, task creation, and payment reminders. Save 14+ hours/week on manual work.",
    primaryLabel: "Activate First Automation",
    primaryLink: "[Activate Automation URL]",
    secondaryLabel: "See Templates",
    secondaryLink: "[Automation Builder URL]",
  },
  {
    key: "onboarding_inapp_day7_trial",
    offsetDays: 7,
    title: "How's your FlosslyOS experience, [Name]?",
    message:
      "You've built [Tasks Count] tasks, [Leads Count] leads, [Automations Count] automations in [Trial Days Used] [Trial Days Used Unit]. Your trial ends in [Trial Days Remaining] [Trial Days Remaining Unit] (on [Trial End Date]). Subscribe to keep your [Plan Name] access and continue saving 10+ hours/week.",
    primaryLabel: "Subscribe Now - [Pricing From Label]",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "View Plans",
    secondaryLink: "[Subscribe URL]",
  },
  {
    key: "onboarding_inapp_day13_trial",
    offsetDays: 13,
    title: "Urgent: Trial Ends [Trial End Date] - Your Data Will Be Deleted",
    message:
      "Your trial ends on [Trial End Date]. Tasks: [Tasks Count]. Leads: [Leads Count]. Automations and documents will be deleted. Subscribe now to keep everything.",
    primaryLabel: "Subscribe Now - [Pricing From Label]",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "Export Data Instead",
    secondaryLink: "[Export Data URL]",
  },
];

export const getOnboardingEmailTemplate = (key) =>
  ONBOARDING_EMAIL_TEMPLATES.find((tpl) => tpl.key === key);

export const buildOnboardingEmail = ({ key, ctx }) => {
  const tpl = getOnboardingEmailTemplate(key);
  if (!tpl) return null;
  const subject = renderTokens(tpl.subject, ctx);
  const body = renderTokens(tpl.body, ctx);
  const html = template.replaceAll("{subject}", subject).replace("{content}", body);
  return { subject, html };
};

export const sendOnboardingEmail = async ({ key, to, ctx, from }) => {
  const built = buildOnboardingEmail({ key, ctx });
  if (!built) return false;
  await transporter.sendMail({
    from: from || DEFAULT_FROM,
    to,
    subject: built.subject,
    html: built.html,
  });
  return true;
};

export const buildOnboardingInAppMessages = ({
  startAt,
  now = new Date(),
  ctx,
  seenKeys = new Set(),
}) => {
  if (!startAt) return [];
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) return [];
  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today - startDay) / (24 * 60 * 60 * 1000));
  if (!Number.isFinite(diffDays)) return [];

  return ONBOARDING_INAPP_MESSAGES.filter((msg) => msg.offsetDays === diffDays)
    .filter((msg) => !seenKeys.has(msg.key))
    .map((msg) => ({
      ...msg,
      title: renderTokens(msg.title, ctx),
      message: renderTokens(msg.message, ctx),
      primaryLink: renderTokens(msg.primaryLink, ctx),
      secondaryLink: msg.secondaryLink ? renderTokens(msg.secondaryLink, ctx) : "",
    }));
};

export const buildOnboardingContext = ({
  user,
  organisation,
  userPreference,
  metrics,
  config,
  startAt,
  now = new Date(),
}) => {
  const baseUrlRaw = config?.public?.BASE_URL || "";
  const baseUrl = baseUrlRaw.endsWith("/") ? baseUrlRaw.slice(0, -1) : baseUrlRaw;
  const trialEndDate = formatDate(userPreference?.licenseRenewalDate);
  const watchVideoUrl =
    config?.public?.ONBOARDING_WELCOME_VIDEO_URL ||
    "https://youtu.be/gEuICxXisnw?si=1L-7jdiwwnr_VpDC";
  const licenseType = String(userPreference?.licenseType || "").trim();
  const planName = ["Drift", "Glide", "Soar"].includes(licenseType) ? licenseType : "Trial";

  const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const msPerDay = 24 * 60 * 60 * 1000;
  const today = normalizeDate(now);
  const startDay = normalizeDate(startAt || userPreference?.createdAt || user?.createdAt);
  const endDay = normalizeDate(userPreference?.licenseRenewalDate);

  let trialDaysRemaining = "";
  let trialDaysUsed = "";
  let trialTotalDays = "";

  if (endDay && today) {
    trialDaysRemaining = Math.max(0, Math.ceil((endDay - today) / msPerDay));
  }
  if (startDay && today) {
    trialDaysUsed = Math.max(0, Math.floor((today - startDay) / msPerDay));
  }
  if (startDay && endDay) {
    trialTotalDays = Math.max(0, Math.ceil((endDay - startDay) / msPerDay));
  }

  const unitLabel = (value) => (Number(value) === 1 ? "day" : "days");
  const trialDaysRemainingUnit = trialDaysRemaining !== "" ? unitLabel(trialDaysRemaining) : "";
  const trialDaysUsedUnit = trialDaysUsed !== "" ? unitLabel(trialDaysUsed) : "";
  const trialTotalDaysUnit = trialTotalDays !== "" ? unitLabel(trialTotalDays) : "";

  const toNumber = (value, fallback) => {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
    if (typeof value === "string") {
      const cleaned = value.replace(/[^0-9.]/g, "");
      const parsed = Number(cleaned);
      if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatNumber = (value) =>
    Number.isFinite(Number(value)) ? Number(value).toLocaleString("en-GB") : "";

  const teamCountRaw = toNumber(organisation?.teamCount, null);
  const chairCountRaw = toNumber(organisation?.surgeryCount, null);
  const baseTeam = 8;
  const baseChairs = 3;
  const scale =
    teamCountRaw || chairCountRaw
      ? clamp(
          (teamCountRaw ? teamCountRaw / baseTeam : 1) *
            (chairCountRaw ? chairCountRaw / baseChairs : 1),
          0.6,
          2.5
        )
      : 1;

  const impactDefaults = DEFAULT_IMPACT;

  const impactAdminHours = Math.round(impactDefaults.adminHours * scale);
  const impactHoursSaved = Math.round(impactDefaults.hoursSaved * scale);
  const impactRevenueRecovered = Math.round(impactDefaults.revenueRecovered * scale);
  const impactNoShowSavings = Math.round(impactDefaults.noShowSavings * scale);
  const impactSearchHours = Math.round(impactDefaults.searchHours);
  const impactTotalAnnual = Math.round(
    (impactDefaults.totalAnnual * scale + impactRevenueRecovered + impactNoShowSavings) / 2
  );
  const impactHoursReturned = Math.round(impactDefaults.hoursReturned * scale);
  const practiceSnapshot = chairCountRaw || teamCountRaw
    ? `${chairCountRaw || baseChairs} chairs, ${teamCountRaw || baseTeam} staff`
    : "your practice";

  const planDriftPrice = formatNumber(DEFAULT_PRICING.drift);
  const planGlidePrice = formatNumber(DEFAULT_PRICING.glide);
  const planSoarPrice = formatNumber(DEFAULT_PRICING.soar);
  const pricingCurrency = DEFAULT_PRICING.currency;
  const pricingFromLabel = `From ${pricingCurrency}${Math.min(
    DEFAULT_PRICING.drift,
    DEFAULT_PRICING.glide,
    DEFAULT_PRICING.soar
  )}/month`;

  return {
    name: user?.fullName || "there",
    practiceName: organisation?.name || "your practice",
    email: user?.email || "",
    founderName: config?.public?.ONBOARDING_FOUNDER_NAME || "Saba",
    successManagerName: config?.public?.ONBOARDING_SUCCESS_MANAGER_NAME || "FlosslyOS Team",
    trialEndDate,
    planName,
    trialDaysRemaining,
    trialDaysRemainingUnit,
    trialDaysUsed,
    trialDaysUsedUnit,
    trialTotalDays,
    trialTotalDaysUnit,
    planDriftPrice,
    planGlidePrice,
    planSoarPrice,
    pricingCurrency,
    pricingFromLabel,
    practiceSnapshot,
    impactAdminHours: formatNumber(impactAdminHours),
    impactHoursSaved: formatNumber(impactHoursSaved),
    impactEnquiryLoss: formatNumber(impactDefaults.enquiryLoss),
    impactRevenueRecovered: formatNumber(impactRevenueRecovered),
    impactNoShowRate: formatNumber(impactDefaults.noShowRate),
    impactNoShowRateAfter: formatNumber(impactDefaults.noShowRateAfter),
    impactNoShowSavings: formatNumber(impactNoShowSavings),
    impactSearchHours: formatNumber(impactSearchHours),
    impactTotalAnnual: formatNumber(impactTotalAnnual),
    impactHoursReturned: formatNumber(impactHoursReturned),
    tasksCount: metrics?.tasksCount ?? "0",
    leadsCount: metrics?.leadsCount ?? "0",
    automationsCount: metrics?.automationsCount ?? "0",
    documentsCount: metrics?.documentsCount ?? "0",
    hoursSaved: metrics?.hoursSaved ?? "0",
    valueCreated: metrics?.valueCreated ?? "0",
    baseUrl,
    watchVideoUrl,
    startSetupUrl: `${baseUrl}/onboarding`,
    completeSetupUrl: `${baseUrl}/onboarding`,
    scheduleCallUrl: "https://calendly.com/helloflossly/flossly-training",
    connectMetaAdsUrl: `${baseUrl}/crm`,
    automationBuilderUrl: `${baseUrl}/crm`,
    setUpDiaryUrl: `${baseUrl}/diary`,
    recallSetupUrl: `${baseUrl}/diary`,
    activateAutomationUrl: `${baseUrl}/crm`,
    subscribeUrl: `${baseUrl}/subscription`,
    exportDataUrl: `${baseUrl}/settings`,
  };
};

