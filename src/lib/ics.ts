// src/lib/ics.ts
// ICS (iCalendar) feed generation for calendar subscriptions

type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  families?: {
    full_name: string | null;
  } | null;
};

/**
 * Builds an ICS (iCalendar) feed string from appointments
 * @param specialistId - The specialist's ID
 * @param appointments - Array of appointment records
 * @returns ICS formatted string
 */
export function buildIcsFeed(
  specialistId: string,
  appointments: AppointmentRow[]
): string {
  const now = new Date();
  const nowUTC = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let ics = "BEGIN:VCALENDAR\r\n";
  ics += "VERSION:2.0\r\n";
  ics += "PRODID:-//Soradin//Appointment Calendar//EN\r\n";
  ics += "CALSCALE:GREGORIAN\r\n";
  ics += "METHOD:PUBLISH\r\n";

  // Filter to only confirmed appointments
  const confirmedAppointments = appointments.filter(
    (apt) => apt.status === "confirmed"
  );

  for (const appointment of confirmedAppointments) {
    const startDate = new Date(appointment.starts_at);
    const endDate = new Date(appointment.ends_at);

    // Format dates as UTC in ICS format (YYYYMMDDTHHMMSSZ)
    const dtStart = startDate
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";
    const dtEnd = endDate
      .toISOString()
      .replace(/[-:]/g, "")
      .split(".")[0] + "Z";

    // Generate UID (unique identifier for the event)
    const uid = `soradin-${appointment.id}@soradin.com`;

    // Build summary with family name
    const familyName =
      appointment.families?.full_name || "Soradin client";
    const summary = `Funeral planning with ${familyName}`;

    // Build description
    const description = `Soradin appointment scheduled for ${startDate.toLocaleString()}`;

    // Create VEVENT
    ics += "BEGIN:VEVENT\r\n";
    ics += `UID:${uid}\r\n`;
    ics += `DTSTAMP:${nowUTC}\r\n`;
    ics += `DTSTART:${dtStart}\r\n`;
    ics += `DTEND:${dtEnd}\r\n`;
    ics += `SUMMARY:${escapeIcsText(summary)}\r\n`;
    ics += `DESCRIPTION:${escapeIcsText(description)}\r\n`;
    ics += `STATUS:CONFIRMED\r\n`;
    ics += `SEQUENCE:0\r\n`;
    ics += "END:VEVENT\r\n";
  }

  ics += "END:VCALENDAR\r\n";
  return ics;
}

/**
 * Escapes special characters in ICS text fields
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

