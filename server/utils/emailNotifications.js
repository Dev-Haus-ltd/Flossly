import { transporter } from "./nodeMailer";
import { template } from "./emailTemplate";
import { buildLeadContext, renderTokens } from './tokenRenderer.js'
const config = useRuntimeConfig();

/** These notifications are configured */

export const paymentSuccessNotification = async (data) => {
  const content = ` <p>Dear ${data.fullName},</p>
          <br/>
          <p>Welcome to Flossly!</p>
          <p>We're excited to confirm your subscription to our platform. Your account is now active, and you can begin exploring all the features available to you.</p>
          <br/>
          <p>To get started, simply log in here:</p>
          <p style="text-align:center;margin-top:25px;">
          <a href="${config.public.BASE_URL}/login" class="btn">Login</a>
          </p>
          <br/><br/>
          <p>If you have any questions or need assistance, our support team is here to help.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const subject = "Welcome to Flossly – Subscription Confirmed";
  const html = template
  .replaceAll("{subject}", subject)
  .replace("{content}", content);

  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const accountCreationNotification = async (data) => {
  const subject = "Your Flossly Account Has Been Created";
  const content = ` <p>Dear ${data.fullName},</p>
          <br/>
          <p>Your account has been successfully created.</p>
          <p>Login into your account to enjoy amazing features.</p>
          <br/>
          <p>Welcome to the team!</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const sendOtpForPasswordReset = async (data) => {
  const subject = "Reset Password Request";
  const content = `<p>Dear ${data.name}</p>
      <br />
      <p>Your one time password for reset password request is:</p>
      <br/>
      <h2> ${data.otp} </h2>
      <br/>
      <p> If you did not request this change, please ignore this email. </p>
       <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const portalReadyTrainingInvite = async (data) => {
  const subject = "Your Portal is Ready - Book Your Training Today";
  const content = `
  <p>Dear ${data.fullName},</p>
          <br/>
          <p>We're excited to let you know that your portal is now ready! 🎉</p>
          <p>To help you get the most out of it, please book your training session at your earliest convenience.</p>
          <br/>
          <a href="https://calendly.com/helloflossly/flossly-training" target="_blank">👉 Book Your Training</a>
          <br/><br/>
          <p>If you have any questions or need assistance, our support team will be happy to help.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const taskCompletedNotification = async (data) => {
  const taskTitle =
    data.task === "Multiple"
      ? "Multiple tasks have been completed by"
      : "Task, " + data.task + "has been completed by";
  const content = ` <p>Dear ${data.fullName},</p>
          <br/>
          <p>${taskTitle + " " + data.fullName}</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const subject = `Task Completed – ${data.task}`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const sendTaskAssignmentEmail = async (data) => {
  const content = `<p>Dear ${data.name},</p>
          <br/>
          <p>We would like to inform you that a new task has been assigned to you:</p>
          <p><strong>Task:</strong> ${data.taskTitle}</p>
          <br/>
          <p>Best regards,<br/>Flossly Team</p>`;
  const subject = "New Task Assigned";
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const sendTaskDueReminderEmail = async (data) => {
  const content = `<p>Dear ${data.name},</p>
          <br/>
          <p>This is a reminder that your task is due tomorrow:</p>
          <p><strong>Task:</strong> ${data.taskTitle}</p>
          ${data.dueDate ? `<p><strong>Due date:</strong> ${data.dueDate}</p>` : ""}
          <br/>
          <p>Please log in to review and complete it.</p>
          <br/>
          <p>Best regards,<br/>Flossly Team</p>`;
  const subject = "Task due tomorrow";
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const sendTaskCommentNotificationEmail = async (data) => {
  const content = `<p>Dear ${data.name},</p>
          <br/>
          <p>A new comment was added to the task:</p>
          <p><strong>Task:</strong> ${data.taskTitle}</p>
          <p><strong>Comment:</strong> ${data.comment}</p>
          <br/>
          <p>Best regards,<br/>Flossly Team</p>`;
  const subject = "New comment on your task";
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};
export const sendTaskUnassignmentEmail = async (data) => {
  const content = `<p>Dear ${data.name},</p>
          <br/>
          <p>The following task has been reassigned and is no longer assigned to you:</p>
          <p><strong>Task:</strong> ${data.taskTitle}</p>
          <p><strong>Updated by:</strong> ${data.removedBy || "Your team"}</p>
          <br/>
          <p>If you have any questions, please reach out to your manager.</p>
          <br/>
          <p>Best regards,<br/>Flossly Team</p>`;
  const subject = "Task Reassigned";
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const newRotaAvailableNotification = async (data) => {
  const subject = `New Rota Available - ${data.name}`;
  const content = ` <p>Dear ${data.fullName},</p>
          <br/>
          <p>A new rota has been created starting on ${data.startDate}.</p>
          <p>Please log in to your portal to review your schedule.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const leaveRequestApprovedNotification = async (data) => {
  const subject = `Leave Request Approved`;
  const content = ` <p>Hi ${data.fullName},</p>
          <br/>
          <p>Good news — your leave request for <strong>${
            data.startDate + " - " + data.endDate
          }</strong> has been approved.</p>
          <p>The rota has been updated accordingly to reflect your absence.</p>
          <br/>
          <p>You can log in to your portal anytime to review your updated schedule:</p>
          <a href="${
            config.public.BASE_URL
          }/rota" target="_blank">View My Rota</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const leaveRequestDeniedNotification = async (data) => {
  const subject = `Leave Request Denied`;
  const content = `   <p>Hi ${data.fullName},</p>
          <br/>
          <p>Your leave request for <strong>${
            data.startDate + " - " + data.endDate
          }</strong> has unfortunately been denied.</p>
          <p>The rota will remain unchanged, and you are still scheduled to work during this period.</p>
          <p>If you'd like to discuss this further, please contact your manager.</p>
          <br/>
          <a href="${
            config.public.BASE_URL
          }/rota" target="_blank">View My Rota</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const sendEmailVerificationEmail = async (data) => {
  const subject = "Verify Email";
  const baseUrl = config.public.BASE_URL.endsWith('/') 
    ? config.public.BASE_URL.slice(0, -1) 
    : config.public.BASE_URL;
  const content = `
  <p>Dear ${data.fullName}</p>
      <br />
      <p>Welcome on board. Please click the link below the verify your email.</p>
      <br/>
      <a href=${
        baseUrl + "/verifyemail/" + data.link
      } target="blank"> Verify Email </a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

export const sendOrgnisationAddedToRegisteredUsers = async (data) => {
  const subject = `Invitation To ${data.orgTitle}`;
  const baseUrl = config.public.BASE_URL.endsWith('/') 
    ? config.public.BASE_URL.slice(0, -1) 
    : config.public.BASE_URL;
  
  // Send individual emails with personalized invitation links
  const emailPromises = data.users.map((userData) => {
    const invitationLink = `${baseUrl}/invitation/respond/${userData.token}`;
  const content = `
 <p>Dear Flossly User</p>
      <br />
      <p>You have been invited to join <strong>${data.orgTitle}</strong> by ${data.manager}.</p>
      <br/>
      <p>Click the link below to accept or decline this invitation:</p>
      <br/>
      <p style="text-align:center;margin-top:25px;">
        <a href="${invitationLink}" target="blank" style="background-color: #0061fb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Respond to Invitation</a>
      </p>
      <br/>
      <p>This invitation link will expire in 7 days.</p>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
    
    return transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
      to: userData.email,
    subject,
    html,
  });
  });
  
  await Promise.all(emailPromises);
};

export const sendInvitationEmail = async (data) => {
  const subject = `Invitation`;
  const content = `
 <p>Dear User</p>
      <br />
      <p>Welcome to Flossly! You are invited to Flossly by ${
        data.manager
      } to join their ${data.orgTitle}.</p>
      <br/>
      <p> Please click on the link below to get started with Flossly. </p>
       <a href=${
         config.public.BASE_URL + "/invite/" + data.link
       } target="blank"> Get Started </a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>`;
  const html = template
    .replaceAll("{subject}", subject)
    .replace("{content}", content);
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject,
    html,
  });
};

// CRM: bulk-send email to leads using a provided HTML body.
// Performs light-weight placeholder replacement and wraps with the app template.
// Placeholders supported:
// - [Patient Name], [First Name], [Your Name]
export const sendLeadBulkEmail = async ({ leads = [], subject, html, from, senderName }) => {
  if (!Array.isArray(leads) || !leads.length) return { sent: 0 };
  const fromAddress = from || process.env.MAIL_FROM || "helloflossly@gmail.com";

  let sent = 0;
  for (const lead of leads) {
    if (!lead?.email) continue;
    const ctx = buildLeadContext({ lead, userName: senderName || 'Team' })
    const renderedSubject = renderTokens(subject || '', ctx)
    const content = renderTokens(html || '', ctx)

    try {
      const wrapped = template
        .replaceAll("{subject}", renderedSubject || "")
        .replace("{content}", content);
      await transporter.sendMail({ to: lead.email, from: fromAddress, subject: renderedSubject, html: wrapped });
      sent++;
    } catch (e) {
      // swallow and continue with others
    }
  }

  return { sent };
};

/** These notifications are pending */

export const sendOnBoardingMail = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Welcome to Flossly!",
    html: `<html>
      <body> 
      <p>Dear ${data.fullName}</p>
      <br />
      <p>Welcome to Flossly! Congratulations on successful registration.</p>
      <br/>
      <p> You can update your profile to access all features. </p>
      </body>
      </html>`,
  });
};

export const sendFeedBack = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Feedback recevied",
    html: `<html>
      <body> 
      <p>You have received a feedback from <b>${data.name}</b>,</p>
      <br />
      <p><strong>${data.message}</strong>.</p>
      <br/>
      </body>
      </html>`,
  });
};

export const completeProfileReminder = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Complete Profile Reminder",
    html: `<html>
      <body> 
      <p> ⚙️ “Your practice is unique—let's make sure your profile says so too! 🦷</p>
      <br/>
      <a href="${config.public.BASE_URL}" target="_blank">🎥 How to Complete Your Profile</a>
      <a href="${config.public.BASE_URL}" target="_blank">👉 Go to Profile</a>
      <br/>
      </body>
      </html>`,
  });
};
export const inviteStaffMemberPrompt = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Invite Staff Member Prompt",
    html: `<html>
      <body> 
      <p> 🙌 “Don't fly solo—invite your dream team to Flossly today! </p>
      <br/>
      <a href="${config.public.BASE_URL}" target="_blank">🎥 Watch: How to Add Your Team</a>
      <a href="${config.public.BASE_URL}" target="_blank">👉 Send Invitations Now”</a>
      <br/>
      </body>
      </html>`,
  });
};
export const staffInvitationAcceptedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Staff Invitation Accepted 🎉",
    html: `
      <html>
        <body>
          <p>🎊 Boom! <strong>${data.fullName}</strong> is officially part of the Flossly Family.</p>
          <p>Let's get those tasks and smiles rolling!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Assign Their First Task</a>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">🎥 Team Quick Start Guide</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const teamSetupCompletionReminder = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Complete Your Team Setup 🚦",
    html: `
      <html>
        <body>
          <p>🚦 One more step to go: finish your team setup and unlock Flossly's full magic! 🦷✨</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Complete Team Setup</a>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">🎥 Watch How: Building Your Team</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const passwordChangedConfirmation = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Password Changed Confirmation 🔒",
    html: `
      <html>
        <body>
          <p>🔒 All set! Your password's been updated—security level: superhero. 🦸‍♀️</p>
          <br/>
        </body>
      </html>
    `,
  });
};

export const firstTimeLoginPrompt = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "First Time Login 👋",
    html: `
      <html>
        <body>
          <p>👋 First time? We're thrilled you're here! Let's set up your Flossly magic.</p>
          <br/>
          <a href="${config.public.BASE_URL} target="_blank">👉 Get Started</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const inactiveUserReactivationNudge = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "We Miss You 💌",
    html: `
      <html>
        <body>
          <p>💌 We miss you like molars miss floss! Hop back into Flossly and pick up where you left off.</p>
          <br/>
          <a href="${config.public.BASE_URL}/login" target="_blank">👉 Log Back In</a>
          <br/>
        </body>
      </html>
    `,
  });
};
// billing

export const paymentFailedAlert = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Payment Failed Alert 🚫",
    html: `
      <html>
        <body>
          <p>🚫 Uh-oh! We couldn't process your payment. Let's fix it so you stay in the loop.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Update Payment</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const subscriptionRenewalReminder = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Subscription Renewal Reminder ⏳",
    html: `
      <html>
        <body>
          <p>⏳ Your Flossly subscription renews soon—no action needed unless you want to change something!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Manage Subscription</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const freeTrialEndingSoon = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Free Trial Ending Soon 🎁",
    html: `
      <html>
        <body>
          <p>🎁 Your free ride's almost up! Don't miss out on full Flossly access.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Upgrade Now</a>
          <br/>
        </body>
      </html>
    `,
  });
};

// community notifications
export const newFeatureAnnouncement = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "New Feature Announcement 🚀",
    html: `
      <html>
        <body>
          <p>🚀 Hot off the press: <strong>${data.featureName}</strong> is here to make your life easier!</p>
          <br/>
          <a href="${config.public.BASE_URL}/features/${data.featureSlug}" target="_blank">👉 Discover What's New</a> |
          <a href="${config.public.BASE_URL}" target="_blank">🎥 Watch Demo</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const tipOfTheWeek = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Tip of the Week 💡",
    html: `
      <html>
        <body>
          <p>💡 Flossly Tip: Did you know you can ${data.tipDescription}? Make your day smoother with this quick win!</p>
          <br/>
          <a href="${config.public.BASE_URL}}" target="_blank">👉 Learn How</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const webinarInvite = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Webinar Invite 🎙",
    html: `
      <html>
        <body>
          <p>🎙 Join us live! Learn how to get the most from Flossly and ask your burning questions.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Reserve Your Spot</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const customerSuccessCheckIn = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Customer Success Check-in 🤝",
    html: `
      <html>
        <body>
          <p>🤝 Need a hand? We're here to help you succeed—book your free success session!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Schedule Now</a>
          <br/>
        </body>
      </html>
    `,
  });
};

// tasks and workflow notifications
// USER NOTIFICATIONS

export const taskDueReminderTeam = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Task Due Reminder",
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>We hope you are doing well.</p>
          <p>The following tasks have not yet been completed. Please submit them to stay up to date with your tasks.</p>
          <br/>
          <p>You can log in here to review and complete your events:</p>
          <a href="${config.public.BASE_URL}/login" target="_blank">👉 Login Here</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

export const teamProgressMilestone = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Team Progress Milestone 📊",
    html: `
      <html>
        <body>
          <p>📊 Team update: 75% of this week's tasks smashed! Let's hit 💯.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Check Progress</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const teamRecognitionNudge = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Team Recognition Nudge 💬",
    html: `
      <html>
        <body>
          <p>💬 Why not give ${data.name} a shout-out? They just nailed a big task!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Send Kudos</a>
          <br/>
        </body>
      </html>
    `,
  });
};

// cpd notifications
export const newCpdCourseAvailable = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "New CPD Course Available 🎓",
    html: `
      <html>
        <body>
          <p>🎓 Fresh learning just landed! New CPD course ready for you. 📚</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Explore Course</a> |
          <a href="${config.public.BASE_URL}" target="_blank">🎥 How to Get Started</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const newCpdActivityAssigned = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "New CPD Activity Assigned",
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>A new CPD activity has been assigned to you:</p>
          <p><strong>Activity:</strong> ${data.activityName}</p>
          <br/>
          <p>Please log in to your portal to review and complete the activity:</p>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Access CPD Portal</a>
          <br/><br/>
          <p>Completing your assigned CPD on time will help you stay up to date with your professional requirements.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

export const cpdEnrollmentConfirmation = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "CPD Enrollment Confirmation ✅",
    html: `
      <html>
        <body>
          <p>✅ You're in! Your CPD journey just got greener. 🌱</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Start Course</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const incompleteCpdModuleReminder = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Incomplete CPD Module Reminder 🕒",
    html: `
      <html>
        <body>
          <p>🕒 Quick nudge—your CPD module is waiting. Finish it and level up!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Resume Course</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const cpdCompletionCertificate = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "CPD Completion Certificate 🎉",
    html: `
      <html>
        <body>
          <p>🎉 You did it! Your CPD certificate is ready to show off. 🏆</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Download Certificate</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const cpdExpiryReminder = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "CPD Expiry Reminder ⏳",
    html: `
      <html>
        <body>
          <p>⏳ Time for a refresh! Your CPD is expiring soon—keep those skills sharp.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Renew Now</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const mandatoryTrainingAlert = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Mandatory Training Alert 🚨",
    html: `
      <html>
        <body>
          <p>🚨 Mandatory training alert—get it done and stay compliant!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Start Training</a>
          <br/>
        </body>
      </html>
    `,
  });
};

// latest word file

// rota

export const upcomingRotaShiftReminder = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `Upcoming Shift Reminder – ${data.date}`,
    html: `
      <html>
        <body>
          <p>Hi ${data.fullName},</p>
          <br/>
          <p>This is a reminder that you are scheduled for a shift on:</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          ${
            data.location
              ? `<p><strong>Location/Department:</strong> ${data.location}</p>`
              : ""
          }
          <br/>
          <p>Please log in to your portal to confirm your schedule.</p>
          <a href="${
            config.public.BASE_URL
          }/rota" target="_blank">👉 View My Rota</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

//  CRM (Leads) Notifications
export const newLeadAddedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `New Lead Added - ${data.leadName}`,
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>A new lead has been added to the CRM:</p>
          <p><strong>Lead Name:</strong> ${data.leadName}</p>
          <p><strong>Added by:</strong> ${data.addedBy}</p>
          <p><strong>Date Added:</strong> ${data.dateAdded}</p>
          <br/>
          <p>Please log in to the CRM to review the lead details and assign follow-up actions.</p>
          <a href="${config.public.BASE_URL}/crm/leads" target="_blank">👉 View Lead in CRM</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};
export const leadStatusChangedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `Lead Status Changed - ${data.leadName}`,
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>The status of the following lead has been updated in the CRM:</p>
          <p><strong>Lead Name:</strong> ${data.leadName}</p>
          <p><strong>New Status:</strong> ${data.newStatus}</p>
          <p><strong>Updated by:</strong> ${data.updatedBy}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <br/>
          <p>Please log in to the CRM to review the details and continue managing this lead.</p>
          <a href="${config.public.BASE_URL}" target="_blank">👉 View Lead in CRM</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

// leaves
