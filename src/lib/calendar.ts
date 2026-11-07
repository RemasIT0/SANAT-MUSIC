// src/lib/calendar.ts
// "Agregar a mi calendario" para los eventos de la agenda:
// link a Google Calendar o archivo .ics (calendario del celular, Outlook, Apple).

export interface CalendarEvent {
  id: string
  title: string
  startsAt: string      // fecha ISO
  place: string
  address?: string
  description?: string
  url: string           // link al evento en SANAT
}

const DURATION_HOURS = 3   // los eventos no guardan hora de fin: se asume una duración típica

// 20261107T230000Z
const toUtcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const range = (ev: CalendarEvent) => {
  const start = new Date(ev.startsAt)
  const end = new Date(start.getTime() + DURATION_HOURS * 3600000)
  return { start, end }
}

const location = (ev: CalendarEvent) => [ev.place, ev.address].filter(Boolean).join(', ')
const details = (ev: CalendarEvent) => [ev.description, `Más info en SANAT: ${ev.url}`].filter(Boolean).join('\n\n')

export function googleCalendarUrl(ev: CalendarEvent) {
  const { start, end } = range(ev)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    details: details(ev),
    location: location(ev),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// En los .ics hay que escapar barras, comas, punto y coma y saltos de línea
const icsText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n')

export function buildIcs(ev: CalendarEvent) {
  const { start, end } = range(ev)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SANAT//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id}@sanat`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${icsText(ev.title)}`,
    `LOCATION:${icsText(location(ev))}`,
    `DESCRIPTION:${icsText(details(ev))}`,
    `URL:${ev.url}`,
    // Recordatorio del calendario un día antes
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(ev.title)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(ev: CalendarEvent) {
  const blob = new Blob([buildIcs(ev)], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${ev.title.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g, '').trim().slice(0, 40) || 'evento'}.ics`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
