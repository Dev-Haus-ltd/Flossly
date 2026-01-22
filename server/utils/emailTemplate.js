export const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0" />
    <title>{subject}</title>
    <style>
      /* CLIENT RESET */
      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      img {
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
      }
      table {
        border-collapse: collapse !important;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        height: 100% !important;
        background-color: #f8f9fb;
        font-family: Arial, Helvetica, sans-serif;
      }

      /* MAIN CARD */
      .email-container {
        max-width: 500px;
        background: #ffffff;
        margin-top: 10px;
        border-radius: 10px;
        border:1px solid #e5e5e5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        overflow: hidden;
      }
      .main-container {
        max-width: 500px;
        margin: 40px auto;
        overflow: hidden;
      }
      .os {
        margin-top: 40px;
        display: inline;
      }

      .header {
        text-align: center;
        padding: 30px 20px 10px;
      }
      .logo {
        font-size: 22px;
        font-weight: 700;
        color: #111;
      }
      .title {
        font-size: 18px;
        font-weight: 600;
        max-width: 250px;
        margin: auto;
        margin-top: 15px;
        color: #000;
      }

      .subtitle {
        font-size: 13px;
        color: #777;
        margin-top: 4px;
        margin-bottom: 0;
      }

      .content {
        padding: 25px 25px 35px;
        background-color: #f3f8ff;
        border-top: 1px solid #e5eaf0;
      }
      .content p {
        margin: 0 0 15px;
        font-size: 14px;
        color: #333;
        line-height: 1.6;
      }
      .btn {
        display: inline-block;
        background-color: #2563eb;
        color: #fff !important;
        padding: 10px 28px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        font-size: 14px;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #999;
        padding: 20px 10px;
      }

      @media only screen and (max-width: 600px) {
        .email-container {
          width: 95% !important;
        }
        .content {
          padding: 20px;
        }
      }
    </style>
  </head>
  <body>
    <center>
      <table
        role="presentation"
        cellspacing="0"
        cellpadding="0"
        border="0"
        width="100%"
      >
        <tr>
          <td>
            <div class="main-container">
              <div class="os">
                <img
                  src="https://dev.flossly.ai/emails/email-logo.png"
                  alt="Flossly Logo"
                  width="36"
                  height="36"
                  style="display: block"
                />
              </div>
              <div class="email-container">
                <!-- Header -->
                <div class="header">
                  <img
                    src="https://dev.flossly.ai/emails/logo.png"
                    alt="Flossly Logo"
                    width="36"
                    height="36"
                    style="display: block; margin: 0 auto 8px"
                  />
                  <h2 class="title">{subject}</h2>
                  <p class="subtitle">By flossly Team</p>
                </div>

                <!-- Content -->
                <div class="content">{content}</div>

                <!-- Footer -->
                <div class="footer">© 2026 Flossly</div>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
`