import { transporter } from "./nodeMailer";
const config = useRuntimeConfig();
export const sendTestEmail = async () => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: ["hhumza673@gmail.com", "sabah.arif29@gmail.com"],
    subject: "Test notification",
    html: `<html>
    <body> Hello.... !!!! </body>
    </html>`,
  });
  return "Mail Sent";
};

export const sendEmailVerificationEmail = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Verify Email",
    html: `<html>
      <body> 
      <p>Dear ${data.fullName}</p>
      <br />
      <p>Welcome on board. Please click the link below the verify your email.</p>
      <br/>
      <a href=${
        config.public.BASE_URL + "/verifyemail/" + data.link
      } target="blank"> Verify Email </a>
      </body>
      </html>`,
  });
};

export const sendOtpForPasswordReset = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Reset Password Request",
    html: `<html>
      <body> 
      <p>Dear ${data.name}</p>
      <br />
      <p>Your one time password for reset password request is:</p>
      <br/>
      <h2> ${data.otp} </h2>
      <br/>
      <p> If you did not request this change, please ignore this email. </p>
       <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
      </body>
      </html>`,
  });
};

export const sendOrgnisationAddedToRegisteredUsers = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    bcc: data.users,
    subject: `Invitation To ${data.orgTitle}`,
    html: `<html>
      <body> 
      <p>Dear Flossly Users</p>
      <br />
      <p>You have been invited to ${data.orgTitle} by ${data.manager}. </p>
      <br/>
      <p> Please login to continue using Flossly with more and more people! </p>
      </body>
      </html>`,
  });
};

export const sendInvitationEmail = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Invitation",
    html: `<html>
      <body> 
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
      </body>
      </html>`,
  });
};

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
      <p>You have been assigned a new task: <strong>${data.message}</strong>.</p>
      <br/>
      </body>
      </html>`,
  });
};

// on borarding and staff invitations
// export const welcomeEmailUponSignup = async (data) => {
//   await transporter.sendMail({
//     from: "Flossly <helloflossly@gmail.com>",
//     to: [data.email],
//     subject: "Welcome to Flossly!",
//     html: `<html>
//       <body>
//       <p>Welcome to Flossly—where dental dreams go digital! Let's get your practice running smoother than a fresh polish. ✨</p>
//       <br/>
//       <a href="${config.public.BASE_URL}" target="_blank">👉Watch Quick Start Video</a>
//       <a href="${config.public.BASE_URL}" target="_blank">👉Explore Your Dashboard</a>
//       <br/>
//       </body>
//       </html>`,
//   });
// }
// export const firstLoginTipNotification = async (data) => {
//   await transporter.sendMail({
//     from: "Flossly <helloflossly@gmail.com>",
//     to: [data.email],
//     subject: "First Login Tip Notification",
//     html: `<html>
//       <body>
//       <p>👋 “Hey superstar! First time on Flossly? Let's take a quick spin around the block. 🚀</p>
//       <br/>
//       <a href="${config.public.BASE_URL}" target="_blank">🎥 Watch: Flossly in 2 Minutes</a>
//       <a href="${config.public.BASE_URL}" target="_blank">📝 Set Up Your Profile”</a>
//       <br/>
//       </body>
//       </html>`,
//   });
// }
export const accountCreationNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Your Flossly Account Has Been Created",
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>Your account has been successfully created.</p>
          <p>For your first login, please use the default password: <strong>welcome1</strong></p>
          <p>(We recommend updating your password immediately for security.)</p>
          <br/>
          <p>Welcome to the team!</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
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

// Account access
export const forgotPasswordRequest = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Forgot Password Request 🔑",
    html: `
      <html>
        <body>
          <p>🔑 No worries—we've got your back! Click below to reset your password and get back to the good stuff.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Reset Password</a>
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
export const paymentSuccessNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Welcome to Flossly – Subscription Confirmed",
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>Welcome to Flossly!</p>
          <p>We're excited to confirm your subscription to our platform. Your account is now active, and you can begin exploring all the features available to you.</p>
          <br/>
          <p>To get started, simply log in here:</p>
          <a href="${config.public.BASE_URL}/login" target="_blank">👉 Log In</a>
          <br/><br/>
          <p>If you have any questions or need assistance, our support team is here to help.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

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

export const sendTaskAssignmentEmail = async (data) => { 
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "New Task Assigned",
    html: `
      <html>
        <body>
          <p>Dear ${data.name},</p>
          <br/>
          <p>We would like to inform you that a new task has been assigned to you:</p>
          <p><strong>Task:</strong> ${data.taskTitle}</p>
          <br/>
          <p>Best regards,<br/>Flossly Team</p>
        </body>
      </html>
    `,
  });
};

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

export const taskCompletedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `New Task Completed – ${data.task}`,
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>A new task, “${data.task}”, has been completed by ${data.name}.</p>
          <br/>
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
export const portalReadyTrainingInvite = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Your Portal is Ready - Book Your Training Today",
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>We're excited to let you know that your portal is now ready! 🎉</p>
          <p>To help you get the most out of it, please book your training session at your earliest convenience.</p>
          <br/>
          <a href="https://calendly.com/helloflossly/flossly-training" target="_blank">👉 Book Your Training</a>
          <br/><br/>
          <p>If you have any questions or need assistance, our support team will be happy to help.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

// rota
export const newRotaAvailableNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `New Rota Available - Week of ${data.rotaWeek}`,
    html: `
      <html>
        <body>
          <p>Dear ${data.fullName},</p>
          <br/>
          <p>A new rota has been created for the week starting ${data.rotaWeek}.</p>
          <p>Please log in to your portal to review your schedule.</p>
          <br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};
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
export const leaveRequestApprovedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `Leave Request Approved - ${data.dates}`,
    html: `
      <html>
        <body>
          <p>Hi ${data.fullName},</p>
          <br/>
          <p>Good news — your leave request for <strong>${data.dates}</strong> has been approved.</p>
          <p>The rota has been updated accordingly to reflect your absence.</p>
          <br/>
          <p>You can log in to your portal anytime to review your updated schedule:</p>
          <a href="${config.public.BASE_URL}/rota" target="_blank">👉 View My Rota</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};

export const leaveRequestDeniedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: `Leave Request Denied - ${data.dates}`,
    html: `
      <html>
        <body>
          <p>Hi ${data.fullName},</p>
          <br/>
          <p>Your leave request for <strong>${data.dates}</strong> has unfortunately been denied.</p>
          <p>The rota will remain unchanged, and you are still scheduled to work during this period.</p>
          <p>If you'd like to discuss this further, please contact your manager.</p>
          <br/>
          <a href="${config.public.BASE_URL}/rota" target="_blank">👉 View My Rota</a>
          <br/><br/>
          <p>Best regards,<br/>The Flossly Team</p>
        </body>
      </html>
    `,
  });
};
