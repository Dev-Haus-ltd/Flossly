export const ONBOARDING_EMAIL_TEMPLATES = [
  {
    key: "onboarding_email_day0",
    offsetDays: 0,
    subject: "Welcome to Flossy — you're in",
    body: `
      <p>Hi [Name],</p>
      <p>Welcome to Flossy — the UK's practice management platform built for dental teams like yours.</p>
      <p>You're now on <strong>Flossy Lite</strong> — free forever, no card required. You can capture leads, manage tasks, and run your practice from one place, starting today.</p>
      <p><strong>Get started in 10 minutes:</strong></p>
      <p><strong>Step 1 — Finish your setup</strong><br/>
      Complete your practice profile and invite your team.<br/>
      <a class="btn" href="[Start Setup URL]" target="_blank">Complete Setup →</a></p>
      <p><strong>Step 2 — Watch the welcome video</strong><br/>
      See how practices like yours use Flossy to win back hours every week.<br/>
      <a class="btn" href="[Watch Video URL]" target="_blank">Watch Video (3 min) →</a></p>
      <p><strong>Step 3 — Book a free onboarding call</strong><br/>
      Our team will walk you through the setup that fits your practice best.<br/>
      <a class="btn" href="[Schedule Call URL]" target="_blank">Book Free Call →</a></p>
      <p><strong>Your login:</strong><br/>
      Dashboard: [Base URL]<br/>
      Email: [Email]</p>
      <p>Questions? Just reply to this email — we read every single one.</p>
      <p>See you inside,<br/>[Founder Name]<br/>Founder, Flossy</p>
    `,
  },
  {
    key: "onboarding_email_day2",
    offsetDays: 2,
    subject: "Quick win for [Practice Name] — takes 3 minutes",
    body: `
      <p>Morning [Name],</p>
      <p>Two days in — here's a snapshot of what Flossy can do for [Practice Name]:</p>
      <p><strong>Estimated annual impact for a practice like yours:</strong><br/>
      → [Impact Admin Hours] hours/week on admin → [Impact Hours Saved] hours back in your week<br/>
      → [Impact Enquiry Loss]% of enquiries not followed up → £[Impact Revenue Recovered]/year recovered<br/>
      → [Impact NoShow Rate]% no-show rate → cut to [Impact NoShow Rate After]% (£[Impact NoShow Savings] saved)<br/>
      → [Impact Search Hours] hours/day chasing information → instant access</p>
      <p><strong>Estimated total annual impact: £[Impact Total Annual] + [Impact Hours Returned] hours back</strong></p>
      <p><strong>Quick win for today — 3 minutes:</strong><br/>
      Set up automated appointment reminders and cut no-shows starting this afternoon.<br/>
      <a class="btn" href="[Complete Setup URL]" target="_blank">Set Up Reminders →</a></p>
      <p>Already done? Here's what's next:<br/>
      <a class="btn" href="[Connect Meta Ads URL]" target="_blank">Connect Your Meta Leads →</a></p>
      <p>Cheering you on,<br/>[Success Manager Name]<br/>Customer Success, Flossy</p>
    `,
  },
  {
    key: "onboarding_email_day2b",
    offsetDays: 2,
    subject: "Your priority actions today",
    body: `
      <p>Good morning [Name],</p>
      <p><strong>Your priority actions today:</strong></p>
      <p>→ Review new Meta leads — responded automatically, but check if they need a treatment plan<br/>
      <a class="btn" href="[Connect Meta Ads URL]" target="_blank">View Leads →</a></p>
      <p>→ 15-minute power task — set up your first task template and save 2 hours/week<br/>
      <a class="btn" href="[Base URL]/tasks" target="_blank">Start Template →</a></p>
      <p>→ Invite your team — get everyone set up so tasks and leads can be assigned<br/>
      <a class="btn" href="[Base URL]/teams" target="_blank">Invite Team →</a></p>
      <p>Keep going,<br/>The Flossy Team</p>
    `,
  },
  {
    key: "onboarding_email_day3",
    offsetDays: 3,
    subject: "The 2-minute rule that triples lead conversions",
    body: `
      <p>Hi [Name],</p>
      <p>If you don't respond to a lead within 5 minutes, your conversion rate drops by 400%.</p>
      <p>But you're busy treating patients. You can't drop everything to reply to a Facebook message.</p>
      <p>That's why 60% of dental leads never convert.</p>
      <p><strong>Today's focus: Flossy Automations</strong><br/>
      Capture leads and make them convert 3x faster — automatically.</p>
      <p><strong>How automation works:</strong><br/>
      → Instant auto-response the moment a lead comes in<br/>
      → Smart lead pipeline with team notifications<br/>
      → Automated follow-ups on Day 1, 2, 4, and 7</p>
      <p><strong>Your 5-minute setup:</strong><br/>
      Step 1 — Choose your auto-response template (or customise)<br/>
      Step 2 — Set your lead pipeline stages<br/>
      Step 3 — Turn on automated follow-ups<br/>
      <a class="btn" href="[Automation Builder URL]" target="_blank">Build Your First Automation →</a></p>
      <p><strong>Unlock WhatsApp + full automations:</strong> Flossy CRM — £199/mo. Upgrade anytime from your dashboard.</p>
      <p>You're building something great,<br/>The Flossy Team</p>
    `,
  },
  {
    key: "onboarding_email_day4",
    offsetDays: 4,
    subject: "Why 18% of your appointments are no-shows (and how to cut it to 5%)",
    body: `
      <p>Good morning [Name],</p>
      <p>Let's talk about the silent revenue killer: no-shows.</p>
      <p>Industry average: 15–20% no-show rate<br/>
      If you see 30 patients/day, 5 don't show up.<br/>
      Average appointment value: £120<br/>
      Daily loss: £600 → Annual loss: £156,000</p>
      <p><strong>Today's focus: Flossy Diary</strong><br/>
      Flossy Diary cuts no-shows by 40% (from 18% to 7%) with intelligent automated reminders.</p>
      <p><strong>Your 3-minute setup:</strong><br/>
      Step 1 — Set your reminder preferences (48 hr + 24 hr)<br/>
      Step 2 — Turn on automated waitlist<br/>
      Step 3 — Enable online booking and embed on your website<br/>
      <a class="btn" href="[Set Up Diary URL]" target="_blank">Set Up Flossy Diary →</a></p>
      <p><strong>Today's challenge:</strong> Set up your first automated reminder sequence.<br/>
      <a class="btn" href="[Set Up Diary URL]" target="_blank">Configure Reminders Now →</a></p>
      <p>Tomorrow: The £30,000 recall system most practices are missing.</p>
      <p>Keep going,<br/>The Flossy Team</p>
    `,
  },
  {
    key: "onboarding_email_day5",
    offsetDays: 5,
    subject: "The £30K sitting in your database right now",
    body: `
      <p>Hi [Name],</p>
      <p>Quick question: how many of your patients are overdue for their 6-month check-up right now?</p>
      <p>Most practice owners guess: "Maybe 20–30?"<br/>
      The real answer: 100–200+ patients.</p>
      <p><strong>Today's focus: Flossy Recalls</strong><br/>
      Flossy Diary automatically tracks every patient's recall date and sends reminders without you lifting a finger.</p>
      <p><strong>Your 4-minute setup:</strong><br/>
      Step 1 — Set default recall periods (6 months for check-ups, 3 months for hygiene)<br/>
      Step 2 — Customise your recall message templates<br/>
      Step 3 — Turn on automated campaigns<br/>
      <a class="btn" href="[Recall Setup URL]" target="_blank">Activate Recall System →</a></p>
      <p><strong>Today's challenge:</strong> Run your first batch recall campaign for overdue patients.<br/>
      <a class="btn" href="[Recall Setup URL]" target="_blank">Find Overdue Patients →</a></p>
      <p>Tomorrow: Eliminate 90% of manual work with Flossy Automations.</p>
      <p>You're halfway there,<br/>The Flossy Team</p>
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
      <p><strong>Today's focus: Flossy Automations</strong><br/>
      Flossy Automations connects your modules and makes your practice run itself.</p>
      <p><strong>Your 10-minute challenge:</strong><br/>
      Step 1 — Browse automation templates<br/>
      Step 2 — Activate "Appointment Reminder Sequence"<br/>
      Step 3 — Watch it run automatically<br/>
      <a class="btn" href="[Activate Automation URL]" target="_blank">Activate First Automation →</a></p>
      <p>Want the full automation suite including WhatsApp messaging? Upgrade to Flossy CRM — £199/mo.<br/>
      <a class="btn" href="[Subscribe URL]" target="_blank">Explore Flossy CRM →</a></p>
      <p>The finish line is close,<br/>The Flossy Team</p>
    `,
  },
  {
    key: "onboarding_email_day7",
    offsetDays: 7,
    subject: "One week in — how's Flossy working for you, [Name]?",
    body: `
      <p>Hi [Name],</p>
      <p>You're a week into Flossy. We'd love to hear how it's going — what's working, what's not, anything we can help with.</p>
      <p><a class="btn" href="[Base URL]/support" target="_blank">Share Quick Feedback →</a></p>
      <p><strong>Your Flossy snapshot:</strong><br/>
      ✅ [Tasks Count] tasks created and assigned<br/>
      ✅ [Leads Count] leads captured<br/>
      ✅ [Automations Count] automations running<br/>
      ✅ [Hours Saved] hours saved through automation<br/>
      Estimated value created: £[Value Created]</p>
      <p><strong>Ready to unlock more?</strong><br/>
      Flossy Lite is free forever — and when you're ready to grow, here's what's waiting:</p>
      <p>→ <strong>Flossy CRM — £199/mo</strong>: WhatsApp messaging, unlimited leads, full automation builder<br/>
      → <strong>Flossy Pro — £499/mo</strong>: everything in CRM + advanced analytics and dedicated support<br/>
      <a class="btn" href="[Subscribe URL]" target="_blank">Explore Plans →</a></p>
      <p>Still have questions? Just reply to this email — we're here to help.</p>
      <p>Thanks for being part of Flossy,<br/>The Flossy Team</p>
    `,
  },
  {
    key: "onboarding_email_day13",
    offsetDays: 13,
    subject: "Two weeks in — unlock everything Flossy has to offer",
    body: `
      <p>Hi [Name],</p>
      <p>Two weeks in — you've made a great start. Here's what you've built so far:</p>
      <p>✅ [Tasks Count] tasks created and assigned<br/>
      ✅ [Leads Count] leads captured<br/>
      ✅ [Automations Count] automations running</p>
      <p><strong>What Flossy Lite gives you:</strong><br/>
      ✅ Up to 100 leads — free forever<br/>
      ✅ Task management — free forever<br/>
      ✅ Practice diary — free forever</p>
      <p><strong>What you unlock with Flossy CRM (£199/mo):</strong><br/>
      → Unlimited leads<br/>
      → WhatsApp Business messaging<br/>
      → Full automation builder<br/>
      → Dedicated account manager</p>
      <p><a class="btn" href="[Subscribe URL]" target="_blank">Upgrade to CRM — £199/mo →</a></p>
      <p>Not ready yet? No problem — your Lite plan stays free forever.</p>
      <p>The Flossy Team</p>
    `,
  },
];

export const ONBOARDING_INAPP_MESSAGES = [
  {
    key: "onboarding_inapp_day2_meta",
    offsetDays: 2,
    title: "Pro tip: turn Facebook leads into booked appointments",
    message:
      "Right now, leads from your Meta ads are probably sitting in Facebook — while you're here in Flossy. Connect them in 60 seconds: every Facebook enquiry flows straight into your CRM dashboard, auto-reply in 2 minutes, never lose another £2,000 treatment plan.",
    primaryLabel: "Connect Meta Ads",
    primaryLink: "[Connect Meta Ads URL]",
    secondaryLabel: "Maybe later",
  },
  {
    key: "onboarding_inapp_day3_automation",
    offsetDays: 3,
    title: "Leads that get 2-minute responses convert 300% better",
    message:
      "Flossy Automations sends instant replies, auto-follow-ups (Day 1, 2, 4, 7), and team alerts. Upgrade to CRM (£199/mo) to unlock WhatsApp messaging and unlimited automations.",
    primaryLabel: "Explore Flossy CRM",
    primaryLink: "[Automation Builder URL]",
    secondaryLabel: "See what's included",
    secondaryLink: "[Automation Builder URL]",
  },
  {
    key: "onboarding_inapp_day4_noshows",
    offsetDays: 4,
    title: "Cut no-shows by 40% — save £103K/year",
    message:
      "Every no-show costs £125–£350. Flossy Diary sends automatic reminders at 48 hours, 24 hours, and 3 hours before appointments. No-show rate drops from 18% to 7%.",
    primaryLabel: "Set up reminders (3 min)",
    primaryLink: "[Set Up Diary URL]",
    secondaryLabel: "See how it works",
    secondaryLink: "[Set Up Diary URL]",
  },
  {
    key: "onboarding_inapp_day5_recalls",
    offsetDays: 5,
    title: "Recover £30K in overdue recalls",
    message:
      "You have patients overdue for check-ups right now. Flossy Recalls sends automatic reminders and recovers an average £30,000/year per practice.",
    primaryLabel: "Run first recall campaign",
    primaryLink: "[Recall Setup URL]",
    secondaryLabel: "See overdue list",
    secondaryLink: "[Recall Setup URL]",
  },
  {
    key: "onboarding_inapp_day6_automation",
    offsetDays: 6,
    title: "Eliminate 90% of manual work",
    message:
      "Your practice can run itself. Flossy Automations handles appointment reminders, lead follow-ups, task creation, and payment reminders — saving 14+ hours/week. Upgrade to CRM (£199/mo) to unlock the full automation builder.",
    primaryLabel: "Explore Flossy CRM — £199/mo",
    primaryLink: "[Activate Automation URL]",
    secondaryLabel: "See templates",
    secondaryLink: "[Automation Builder URL]",
  },
  {
    key: "onboarding_inapp_day7_trial",
    offsetDays: 7,
    title: "A week in — your trial ends in [Trial Days Remaining] [Trial Days Remaining Unit]",
    message:
      "You've built [Tasks Count] tasks, captured [Leads Count] leads, and activated [Automations Count] automations. Your [Plan Name] trial ends on [Trial End Date]. Subscribe now to keep everything and continue saving 10+ hours/week.",
    primaryLabel: "Subscribe to CRM — £199/mo",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "View plans",
    secondaryLink: "[Subscribe URL]",
  },
  {
    key: "onboarding_inapp_day13_trial",
    offsetDays: 13,
    title: "Trial ends [Trial End Date] — keep everything you've built",
    message:
      "Your [Plan Name] trial ends on [Trial End Date]. Tasks: [Tasks Count]. Leads: [Leads Count]. Subscribe before then to keep all your data, automations, and team access.",
    primaryLabel: "Subscribe to CRM — £199/mo",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "Maybe later",
  },
  {
    key: "upgrade_f1_leads_80pct",
    offsetDays: -1,
    triggerType: "event",
    title: "📈 80 leads captured — your campaigns are working",
    message:
      "You've captured 80 leads and you're close to the Flossy Lite limit of 100. Don't lose your momentum — upgrade to CRM to keep capturing and following up leads automatically.",
    primaryLabel: "Upgrade to CRM — £199/mo",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "Maybe later",
  },
  {
    key: "upgrade_f2_leads_limit",
    offsetDays: -1,
    triggerType: "event",
    title: "🎯 You hit 100 leads — don't lose the next one",
    message:
      "Your practice is growing fast. You've hit the Flossy Lite lead limit. Upgrade to Flossy CRM to keep capturing leads, run automations, and unlock WhatsApp messaging.",
    primaryLabel: "Upgrade to CRM — £199/mo",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "Maybe later",
  },
  {
    key: "upgrade_f8_high_engagement",
    offsetDays: 14,
    title: "You're getting a lot from Flossy 💪",
    message:
      "You've been using multiple features across your practice. Ready to unlock full automation, WhatsApp messaging, and unlimited leads? Upgrade to Flossy CRM.",
    primaryLabel: "Upgrade to CRM — £199/mo",
    primaryLink: "[Subscribe URL]",
    secondaryLabel: "Maybe later",
  },
];
