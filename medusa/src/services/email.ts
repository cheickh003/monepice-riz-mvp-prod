import nodemailer from 'nodemailer'

export function createMailer() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing (SMTP_HOST/USER/PASS)')
  }
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
  return transporter
}

export async function sendTestEmail(to: string) {
  const from = process.env.SMTP_FROM || 'no-reply@example.com'
  const transporter = createMailer()
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Test MonEpice&Riz SMTP',
    text: 'Ceci est un e-mail de test SMTP pour MonEpice&Riz.',
  })
  return info.messageId
}

