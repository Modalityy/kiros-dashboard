import { Resend } from 'resend'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'Eh-va <noreply@yourdomain.com>'
const DANIEL_EMAIL = process.env.DANIEL_EMAIL ?? 'daniel@kiros.sg'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key || key.startsWith('re_your_')) return null
  return new Resend(key)
}
const TIMEZONE = 'Asia/Singapore'

type BookingEmailArgs = {
  to: string
  name: string
  dateTime: string        // ISO string
  prevDateTime?: string   // ISO string, for reschedule
  type: 'booking' | 'reschedule' | 'cancellation'
}

function formatSGT(iso: string): string {
  try {
    const zonedDate = toZonedTime(new Date(iso), TIMEZONE)
    return format(zonedDate, "EEEE, MMMM d, yyyy 'at' h:mm a 'SGT'")
  } catch {
    return iso
  }
}

export async function sendConfirmationEmail({
  to,
  name,
  dateTime,
  prevDateTime,
  type,
}: BookingEmailArgs): Promise<void> {
  const firstName = name.split(' ')[0]
  const formattedNew = dateTime ? formatSGT(dateTime) : ''
  const formattedPrev = prevDateTime ? formatSGT(prevDateTime) : ''

  let subject: string
  let html: string

  if (type === 'booking') {
    subject = `Your Zoom Session with Daniel Wong is Confirmed ✅`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #0f172a;">Hi ${firstName},</h2>
        <p>Your Zoom session with <strong>Daniel Wong</strong> has been successfully booked.</p>
        <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px;"><strong>📅 Date & Time:</strong><br/>${formattedNew}</p>
        </div>
        <p>You will receive a Zoom link closer to your session. If you need to reschedule or cancel, simply call back and Eh-va will assist you.</p>
        <p style="margin-top: 32px;">Warm regards,<br/><strong>Eh-va</strong><br/>AI Assistant to Daniel Wong</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 40px;"/>
        <p style="font-size: 12px; color: #94a3b8;">This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    `
  } else if (type === 'reschedule') {
    subject = `Your Zoom Session has been Rescheduled 🔄`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #0f172a;">Hi ${firstName},</h2>
        <p>Your Zoom session with <strong>Daniel Wong</strong> has been rescheduled.</p>
        ${formattedPrev ? `
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #7f1d1d;"><strong>Previous:</strong> ${formattedPrev}</p>
        </div>
        ` : ''}
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; margin: 24px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px;"><strong>📅 New Date & Time:</strong><br/>${formattedNew}</p>
        </div>
        <p>If you need to make further changes, please call back and Eh-va will be happy to help.</p>
        <p style="margin-top: 32px;">Warm regards,<br/><strong>Eh-va</strong><br/>AI Assistant to Daniel Wong</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 40px;"/>
        <p style="font-size: 12px; color: #94a3b8;">This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    `
  } else {
    subject = `Your Zoom Session has been Cancelled`
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h2 style="color: #0f172a;">Hi ${firstName},</h2>
        <p>Your Zoom session with <strong>Daniel Wong</strong> scheduled for <strong>${formattedNew || formattedPrev}</strong> has been cancelled.</p>
        <p>If you'd like to rebook at a later time, simply give us a call and Eh-va will assist you.</p>
        <p style="margin-top: 32px;">Warm regards,<br/><strong>Eh-va</strong><br/>AI Assistant to Daniel Wong</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 40px;"/>
        <p style="font-size: 12px; color: #94a3b8;">This is an automated confirmation. Please do not reply to this email.</p>
      </div>
    `
  }

  const resend = getResend()
  if (!resend) return // Email not configured — skip silently

  // Send to client
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  })

  // BCC Daniel on all booking actions
  await resend.emails.send({
    from: FROM_EMAIL,
    to: DANIEL_EMAIL,
    subject: `[Eh-va] ${subject} — ${name}`,
    html: `<p><strong>Client:</strong> ${name} (${to})</p>` + html,
  })
}
