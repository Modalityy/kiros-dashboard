import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

const FROM = `Daniel Wong's Office <${process.env.GMAIL_USER}>`

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-SG', {
    timeZone: 'Asia/Singapore',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export async function sendBookingConfirmation({
  firstName,
  email,
  dateTime,
}: {
  firstName: string
  lastName: string
  email: string
  dateTime: string
}) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your Zoom Session is Confirmed',
    html: `
      <p>Dear ${firstName},</p>

      <p>This is to confirm that our Zoom meeting has been successfully scheduled.</p>

      <p><strong>Meeting Details:</strong><br>
      <b>Date</b>: ${formatDate(dateTime)}<br>
      <b>Time</b>: ${formatTime(dateTime)} (Singapore Time)</p>

      <p>A Zoom link will be sent to you 30 minutes before the scheduled time. If you need to reschedule or have any questions, don't hesitate to reach us at 9173 3883.</p>

      <p>Warm regards,<br/>Daniel Wong's Office</p>
    `,
  })
}

export async function sendRescheduleConfirmation({
  firstName,
  email,
  newDateTime,
}: {
  firstName: string
  lastName: string
  email: string
  newDateTime: string
}) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your Zoom Session Has Been Rescheduled',
    html: `
      <p>Dear ${firstName},</p>

      <p>This is to confirm that your Zoom meeting has been successfully rescheduled.</p>

      <p><strong>Updated Meeting Details:</strong><br>
      <b>Date</b>: ${formatDate(newDateTime)}<br>
      <b>Time</b>: ${formatTime(newDateTime)} (Singapore Time)</p>

      <p>A Zoom link will be sent to you 30 minutes before the scheduled time. If you need to make further changes or have any questions, don't hesitate to reach us at 9173 3883.</p>

      <p>Warm regards,<br/>Daniel Wong's Office</p>
    `,
  })
}

export async function sendSessionReminder({
  firstName,
  email,
  dateTime,
}: {
  firstName: string
  email: string
  dateTime: string
}) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reminder: Your Zoom Session is Tomorrow',
    html: `
      <p>Dear ${firstName},</p>

      <p>This is a friendly reminder that your Zoom session with Daniel Wong is scheduled for <strong>tomorrow</strong>.</p>

      <p><strong>Meeting Details:</strong><br>
      <b>Date</b>: ${formatDate(dateTime)}<br>
      <b>Time</b>: ${formatTime(dateTime)} (Singapore Time)</p>

      <p>A Zoom link will be sent to you 30 minutes before the scheduled time. If you need to reschedule or have any questions, please reach us at 9173 3883.</p>

      <p>Warm regards,<br/>Daniel Wong's Office</p>
    `,
  })
}

export async function sendCancellationConfirmation({
  firstName,
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
      <p>Dear ${firstName},</p>

      <p>This is to confirm that your upcoming Zoom meeting has been successfully cancelled as requested.</p>

      <p>If you'd like to reschedule or book a new session in the future, please don't hesitate to give us a call at 9173 3883. We'd be happy to assist.</p>

      <p>Warm regards,<br/>Daniel Wong's Office</p>
    `,
  })
}
