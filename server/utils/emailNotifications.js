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
}

export const sendInvitationEmail = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Invitation",
    html: `<html>
      <body> 
      <p>Dear User</p>
      <br />
      <p>Welcome to Flossly! You are invited to Flossly by ${data.manager} to join their ${data.orgTitle}.</p>
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
}

// on borarding and staff invitations
export const welcomeEmailUponSignup = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Welcome to Flossly!",
    html: `<html>
      <body> 
      <p>Welcome to Flossly—where dental dreams go digital! Let's get your practice running smoother than a fresh polish. ✨</p>
      <br/>
      <a href="${config.public.BASE_URL}" target="_blank">👉Watch Quick Start Video</a>
      <a href="${config.public.BASE_URL}" target="_blank">👉Explore Your Dashboard</a>
      <br/>
      </body>
      </html>`,
  });
}
export const firstLoginTipNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "First Login Tip Notification",
    html: `<html>
      <body> 
      <p>👋 “Hey superstar! First time on Flossly? Let's take a quick spin around the block. 🚀</p>
      <br/>
      <a href="${config.public.BASE_URL}" target="_blank">🎥 Watch: Flossly in 2 Minutes</a>
      <a href="${config.public.BASE_URL}" target="_blank">📝 Set Up Your Profile”</a>
      <br/>
      </body>
      </html>`,
  });
}
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
}
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
}
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
    subject: "Payment Success Notification 💳",
    html: `
      <html>
        <body>
          <p>💳 Woohoo! Payment received—your Flossly flow keeps going.</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 View Receipt</a>
          <br/>
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
    subject: "New Task Assigned to You",
    html: `<html>
      <body> 
     <p>📝 Hey ${data.name}, you've got a shiny new task: '${data.taskTitle}'—let's crush it!</p>
      <p>Please log in to Flossly to view and complete the task.</p>
      <br/>
      <a href="${config.public.BASE_URL}/taskmanagement/mytasks" target="_blank">👉 View My Task</a>
      </body>
      </html>`,
  });
};

export const taskDueReminderTeam = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Task Due Reminder (for Team) ⏰",
    html: `
      <html>
        <body>
          <p>⏰ Gentle nudge: Your task '${data.task}' is due soon. Let's wrap this up like a pro!</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 Open Task</a>
          <br/>
        </body>
      </html>
    `,
  });
};

export const taskCompletedNotification = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "Task Completed Notification 🎉",
    html: `
      <html>
        <body>
          <p>🎉 ${data.name} just completed '${data.task}'—round of applause! 👏</p>
          <br/>
          <a href="${config.public.BASE_URL}" target="_blank">👉 See Task</a>
          <br/>
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



