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

export const sendTaskAssignmentEmail = async (data) => {
  await transporter.sendMail({
    from: "Flossly <helloflossly@gmail.com>",
    to: [data.email],
    subject: "New Task Assigned to You",
    html: `<html>
      <body> 
      <p>Dear ${data.name},</p>
      <br />
      <p>You have been assigned a new task: <strong>${data.taskTitle}</strong>.</p>
      <p>Please log in to Flossly to view and complete the task.</p>
      <br/>
      <a href="${config.public.BASE_URL}/taskmanagement/mytasks" target="_blank">View Task</a>
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
