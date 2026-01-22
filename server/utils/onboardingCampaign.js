import { template } from "./emailTemplate";
import { transporter } from "./nodeMailer";
import { formatDateDDMMYYYY } from "~/lib/dateFormatter.js";

const DEFAULT_FROM = "Flossly <helloflossly@gmail.com>";

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
    subject: "Welcome to FlosslyOS â€” your 2-minute setup starts now",
    body: `
      <p>Hi [Name],</p>
      <p>Welcome to FlosslyOSâ€”the UK's #1 productivity platform for dental practices.</p>
      <p>You just took the first step toward running a practice that works FOR you, not against you.</p>
      <p><strong>Here's what happens next:</strong></p>
      <p><strong>Right Now (2 minutes)</strong><br/>
      â†’ Watch this quick welcome video from our founder<br/>
      â†’ See how FlosslyOS eliminates your biggest time-waster<br/>
      <a class="btn" href="[Watch Video URL]" target="_blank">Watch Video â†’</a></p>
      <p><strong>Today (10 minutes)</strong><br/>
      â†’ Complete your personalized setup<br/>
      â†’ Capture your first automated lead<br/>
      â†’ Set up appointment reminders that cut no-shows by 40%<br/>
      <a class="btn" href="[Start Setup URL]" target="_blank">Start Setup â†’</a></p>
      <p><strong>This Week</strong><br/>
      â†’ Connect your team (they'll love you for it)<br/>
      â†’ Automate 3 workflows that currently waste 6 hours<br/>
      â†’ Book your free 1:1 onboarding call with our team<br/>
      <a class="btn" href="[Schedule Call URL]" target="_blank">Schedule Call â†’</a></p>
      <p><strong>Your login details:</strong><br/>
      Dashboard: app.flosslyos.com<br/>
      Email: [email]<br/>
      Password: [Set on signup]</p>
      <p>One practice owner told us:<br/>
      "I wish I'd found FlosslyOS 3 years ago. The time I've wasted..."<br/>
      â€” Dr. Sarah Mitchell, Manchester Dental Clinic</p>
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
      Based on practices like yours (3 chairs, mixed NHS/private, 8 staff):</p>
      <p>
        12 hours/week on admin chaos â†’ 10 hours back<br/>
        15% of enquiries never followed up â†’ Â£18,000/year recovered<br/>
        18% no-show rate â†’ Cut to 7% (Â£22K saved)<br/>
        2 hours/day searching for info â†’ Instant access, zero searching
      </p>
      <p><strong>Total Annual Impact:</strong> Â£47,280 saved + 520 hours back</p>
      <p>That's like hiring a full-time admin assistantâ€”without the payroll.</p>
      <p><strong>Quick win for today:</strong> Set up automated appointment reminders in 3 minutes.<br/>
      Cut no-shows by 40% starting this afternoon.<br/>
      <a class="btn" href="[Complete Setup URL]" target="_blank">Complete 3-Minute Setup â†’</a></p>
      <p>Already done it? Legend. Here's what's next:<br/>
      <a class="btn" href="[Connect Meta Ads URL]" target="_blank">Connect Your Meta Leads â†’</a></p>
      <p>Cheering you on,<br/>[Success Manager Name]<br/>Customer Success, FlosslyOS</p>
      <p>P.S. - 87% of practices who complete this step in Week 1 subscribe by Day 14. Just saying. ðŸ˜‰</p>
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
      <a class="btn" href="[Connect Meta Ads URL]" target="_blank">View Leads â†’</a><br/><br/>
      Approve staff rota - Emma requested next Friday off<br/>
      <a class="btn" href="[Base URL]/teams/rota" target="_blank">Quick Approve â†’</a><br/><br/>
      15-minute power task - Set up your first task template (save 2 hours/week)<br/>
      <a class="btn" href="[Base URL]/tasks" target="_blank">Start Template â†’</a></p>
      <p><strong>Today's Challenge:</strong><br/>
      Invite 2 team members by 5 PM â†’ Get entered to win 3 months free<br/>
      <a class="btn" href="[Base URL]/teams" target="_blank">Invite Team â†’</a></p>
      <p>Keep crushing it,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day3",
    offsetDays: 3,
    subject: "Day 3: The 2-minute rule that triples conversions",
    body: `
      <p>Hi [Name],</p>
      <p>If you don't respond to a lead within 5 minutes, your conversion rate drops by 400%.</p>
      <p>But you're busy treating patients. You can't drop everything to reply to a Facebook message.</p>
      <p>That's why 60% of dental leads never convert.</p>
      <p><strong>Today's Focus: FlosslyCRM Automation</strong><br/>
      Yesterday you captured leads. Today we make them convert 3x fasterâ€”automatically.</p>
      <p><strong>How FlosslyAutomation Works:</strong><br/>
      Instant Auto-Response (2 Minutes)<br/>
      Smart Lead Pipeline<br/>
      Team Notifications<br/>
      Automated Follow-Ups</p>
      <p><strong>Your 5-Minute Automation Setup:</strong><br/>
      Step 1: Choose your auto-response template (or customize)<br/>
      Step 2: Set your lead pipeline stages<br/>
      Step 3: Turn on automated follow-ups<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Build Your First Automation â†’</a></p>
      <p><strong>Today's Challenge:</strong><br/>
      Create your first automated follow-up sequence by end of day.<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Start Automation Builder â†’</a></p>
      <p>Tomorrow: We tackle the Â£22,000 no-show problem with FlosslyDiary.</p>
      <p>You're crushing it,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day4",
    offsetDays: 4,
    subject: "Day 4: Why 18% of your appointments are no-shows (and how to cut it to 5%)",
    body: `
      <p>Good morning [Name],</p>
      <p>Let's talk about the silent revenue killer: no-shows.</p>
      <p>Industry average: 15-20% no-show rate<br/>
      If you see 30 patients/day:<br/>
      5 patients don't show up<br/>
      Average appointment value: Â£120<br/>
      Daily loss: Â£600<br/>
      Annual loss: Â£156,000</p>
      <p><strong>Today's Focus: FlosslyDiary</strong><br/>
      FlosslyDiary is your intelligent appointment system that cuts no-shows by 40% (from 18% to 7%).</p>
      <p><strong>Your 3-Minute Setup:</strong><br/>
      Step 1: Connect your calendar (Google/Outlook)<br/>
      Step 2: Set your reminder preferences (48hr + 24hr)<br/>
      Step 3: Turn on automated waitlist<br/>
      <a class="btn" href="[Set Up Diary URL]" target="_blank">Set Up FlosslyDiary â†’</a></p>
      <p>Bonus: Enable online booking and embed on your website<br/>
      <a class="btn" href="[Base URL]/diary" target="_blank">Get Booking Widget â†’</a></p>
      <p><strong>Today's Challenge:</strong> Set up your first automated reminder sequence.<br/>
      <a class="btn" href="[Set Up Diary URL]" target="_blank">Configure Reminders Now â†’</a></p>
      <p>Tomorrow: We'll show you the Â£30,000 recall system most practices are missing.</p>
      <p>Keep going,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day5",
    offsetDays: 5,
    subject: "Day 5: The Â£30K sitting in your database right now",
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
      <a class="btn" href="[Recall Setup URL]" target="_blank">Activate Recall System â†’</a></p>
      <p><strong>Today's Challenge:</strong> Run your first batch recall campaign for overdue patients.<br/>
      <a class="btn" href="[Recall Setup URL]" target="_blank">Find Overdue Patients â†’</a></p>
      <p>Tomorrow: We fix the "Who's doing what?" chaos with FlosslyTasks.</p>
      <p>You're halfway to transformation,<br/>The FlosslyOS Team</p>
    `,
  },
  {
    key: "onboarding_email_day6",
    offsetDays: 6,
    subject: "Day 6: The automation that runs your practice while you sleep",
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
      <a class="btn" href="[Activate Automation URL]" target="_blank">Activate First Automation â†’</a></p>
      <p>Bonus: Build a custom automation with the visual builder<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Open Automation Builder â†’</a></p>
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
      <p>Just checking inâ€”how's your FlosslyOS experience been so far?</p>
      <p>We'd genuinely love to hear: what's working well for you, any features you're loving, anything we can help with.</p>
      <p><a class="btn" href="[Base URL]/support" target="_blank">Quick Feedback - 30 Seconds â†’</a></p>
      <p><strong>Your Trial Snapshot:</strong><br/>
      âœ… [Tasks Count] tasks created and assigned to your team<br/>
      âœ… [Leads Count] leads captured and followed up automatically<br/>
      âœ… [Automations Count] automations running<br/>
      âœ… [Documents Count] documents uploaded and organized<br/>
      âœ… [Hours Saved] hours saved through automation<br/>
      Estimated value created: Â£[Value Created]</p>
      <p><strong>Quick Reminder:</strong> Your 14-day trial ends in 2 days (on [Trial End Date] at midnight).</p>
      <p><strong>Ready to keep going?</strong><br/>
      Subscribe now and get our trial-exclusive bonus:</p>
      <p>ðŸŽ 3 months of implementation support (Â£1,500 value)<br/>
      ðŸŽ Free productivity audit (Â£500 value)<br/>
      ðŸŽ Dedicated account manager</p>
      <p><a class="btn" href="[Subscribe URL]" target="_blank">Subscribe Now - Keep Everything â†’</a></p>
      <p>Pricing:<br/>
      Starter: Â£149/month (1 location, 5 users)<br/>
      Growth: Â£249/month (3 locations, 15 users)<br/>
      Enterprise: Â£449/month (unlimited)</p>
      <p>Still have questions? Just reply to this emailâ€”we're here to help.</p>
      <p>Thanks for trying FlosslyOS. We hope you decide to stay!<br/>The FlosslyOS Team</p>
      <p>P.S. - 87% of practices who complete their trial subscribe. Don't let 12 days of work go to waste.</p>
    `,
  },
  {
    key: "onboarding_email_day13",
    offsetDays: 13,
    subject: "Your trial ends tomorrow - don't lose your work",
    body: `
      <p>Hi [Name],</p>
      <p>This is urgent. Your FlosslyOS trial ends tomorrow at midnight ([Trial End Date], 11:59 PM).</p>
      <p>If you don't subscribe before then, you'll lose everything you've built over the past 13 days.</p>
      <p><strong>What you'll lose:</strong><br/>
      âŒ All your tasks - [Tasks Count] tasks created, all deleted<br/>
      âŒ All your leads - [Leads Count] enquiries in your CRM, gone<br/>
      âŒ All your automations - Every workflow you set up, erased<br/>
      âŒ All your documents - [Documents Count] files uploaded, permanently removed<br/>
      âŒ Your team's access</p>
      <p>This cannot be undone.</p>
      <p><strong>But you can keep everything</strong><br/>
      Subscribe now and: keep all your work, keep your team, keep automations running, and get a 60-day money-back guarantee.</p>
      <p><a class="btn" href="[Subscribe URL]" target="_blank">Subscribe Now - Don't Lose Your Data â†’</a></p>
      <p>Need more time? Reply "EXTEND" and we'll give you 7 extra days.</p>
      <p>Don't let 13 days of work disappear tomorrow.</p>
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
      "Right now, leads from your Meta ads are probably sitting in Facebook... while you're here in FlosslyOS. Connect them in 60 seconds: every Facebook enquiry flows straight into your CRM dashboard, auto-reply in 2 minutes, never lose another Aœ2,000 treatment plan.",
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
    title: "Day 4: Cut No-Shows by 40% (Save Aœ103K/Year)",
    message:
      "Every no-show = Aœ125-Aœ350 lost revenue. FlosslyDiary sends automatic reminders: 48 hours before (SMS + Email), 24 hours before, 3 hours before (high-value only). Result: no-show rate drops from 18% ƒ+' 7%.",
    primaryLabel: "Set Up Reminders (3 Min)",
    primaryLink: "[Set Up Diary URL]",
    secondaryLabel: "See How It Works",
    secondaryLink: "[Set Up Diary URL]",
  },
  {
    key: "onboarding_inapp_day5_recalls",
    offsetDays: 5,
    title: "Day 5: Recover Aœ30K in Overdue Recalls",
    message:
      "You have patients overdue for check-ups right now. FlosslyRecalls sends automatic reminders and recovers an average Aœ30,000/year.",
    primaryLabel: "Run First Recall Campaign",
    primaryLink: "[Recall Setup URL]",
    secondaryLabel: "See Overdue List",
    secondaryLink: "[Recall Setup URL]",
  },
  {
    key: "onboarding_inapp_day6_automation",
    offsetDays: 6,
    title: "Day 6: Eliminate 90% of Manual Work",
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
      "You've built [Tasks Count] tasks, [Leads Count] leads, [Automations Count] automations in 12 days. Your trial ends in 2 days. Subscribe to keep everything and continue saving 10+ hours/week.",
    primaryLabel: "Subscribe Now - From GBP 99/month",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "View Plans",
    secondaryLink: "[Subscribe URL]",
  },
  {
    key: "onboarding_inapp_day13_trial",
    offsetDays: 13,
    title: "Urgent: Trial Ends Tomorrow - Your Data Will Be Deleted",
    message:
      "You have 24 hours to save your work. Tasks: [Tasks Count]. Leads: [Leads Count]. Automations and documents will be deleted. Subscribe now to keep everything.",
    primaryLabel: "Subscribe Now - From GBP 99/month",
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

export const buildOnboardingContext = ({ user, organisation, userPreference, metrics, config }) => {
  const baseUrlRaw = config?.public?.BASE_URL || "";
  const baseUrl = baseUrlRaw.endsWith("/") ? baseUrlRaw.slice(0, -1) : baseUrlRaw;
  const trialEndDate = formatDate(userPreference?.licenseRenewalDate);
  const watchVideoUrl =
    config?.public?.ONBOARDING_WELCOME_VIDEO_URL ||
    "https://youtu.be/gEuICxXisnw?si=1L-7jdiwwnr_VpDC";

  return {
    name: user?.fullName || "there",
    practiceName: organisation?.name || "your practice",
    email: user?.email || "",
    founderName: config?.public?.ONBOARDING_FOUNDER_NAME || "Saba",
    successManagerName: config?.public?.ONBOARDING_SUCCESS_MANAGER_NAME || "FlosslyOS Team",
    trialEndDate,
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


