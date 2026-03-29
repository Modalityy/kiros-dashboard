import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `Daniel Wong's Office <${process.env.GMAIL_USER}>`

function formatSGT(iso: string): string {
  return new Date(iso).toLocaleString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function sendBookingConfirmation({
  firstName,
  lastName,
  email,
  dateTime,
}: {
  firstName: string
  lastName: string
  email: string
  dateTime: string
}) {
  const displayTime = formatSGT(dateTime)

  await transporter.sendMail({
    from: FROM,
    to: email,

    subject: 'Your Zoom Session is Confirmed',
    html: `
      <p>Hi ${firstName},</p>
      <p>Your consultation with Daniel Wong has been scheduled for:</p>
      <p><strong>${displayTime} (Singapore Time)</strong></p>
      <p>A Zoom link will be shared closer to the date. If you need to reschedule or cancel, please call us back.</p>
      <p>Best regards,<br/>Daniel Wong's Office</p>
    `,
  })
}

export async function sendRescheduleConfirmation({
  firstName,
  lastName,
  email,
  newDateTime,
}: {
  firstName: string
  lastName: string
  email: string
  newDateTime: string
}) {
  const displayTime = formatSGT(newDateTime)

  await transporter.sendMail({
    from: FROM,
    to: email,

    subject: 'Your Zoom Session Has Been Rescheduled',
    html: `
      <p>Hi ${firstName},</p>
      <p>Your consultation with Daniel Wong has been rescheduled to:</p>
      <p><strong>${displayTime} (Singapore Time)</strong></p>
      <p>If you need to make further changes, please call us back.</p>
      <p>Best regards,<br/>Daniel Wong's Office</p>
    `,
  })
}

export async function sendCancellationConfirmation({
  firstName,
  lastName,
  email,
}: {
  firstName: string
  lastName: string
  email: string
}) {
  await transporter.sendMail({
    from: FROM,
    to: email,

    subject: 'Your Zoom Session Has Been Cancelled',
    html: `
      <p>Hi ${firstName},</p>
      <p>Your upcoming consultation with Daniel Wong has been cancelled as requested.</p>
      <p>If you'd like to book again in the future, please give us a call.</p>
      <p>Best regards,<br/>Daniel Wong's Office</p>
    `,
  })
}
