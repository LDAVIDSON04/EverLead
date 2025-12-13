// src/lib/booking-api-examples.ts
// Example client-side code for calling the booking APIs
// Copy these into your React components

/**
 * Example: Fetch availability for a specialist
 * 
 * Usage in a React component:
 * 
 * const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
 * 
 * useEffect(() => {
 *   fetchAvailability('specialist-uuid', '2024-01-15', '2024-01-22')
 *     .then(setAvailability)
 *     .catch(console.error);
 * }, []);
 */
export type AvailabilityDay = {
  date: string; // YYYY-MM-DD in specialist's timezone
  slots: { startsAt: string; endsAt: string }[]; // ISO timestamps in UTC
};

export async function fetchAvailability(
  specialistId: string,
  startDate: string, // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
): Promise<AvailabilityDay[]> {
  const params = new URLSearchParams({
    specialistId,
    startDate,
    endDate,
  });

  const response = await fetch(`/api/availability?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch availability");
  }

  return response.json();
}

/**
 * Example: Create a new appointment
 * 
 * Usage in a React component:
 * 
 * const handleBookAppointment = async () => {
 *   try {
 *     const appointment = await createAppointment({
 *       specialistId: 'specialist-uuid',
 *       familyId: 'family-uuid',
 *       appointmentTypeId: 'appointment-type-uuid',
 *       startsAt: '2024-01-15T14:00:00Z', // ISO UTC timestamp
 *     });
 *     console.log('Appointment created:', appointment);
 *   } catch (error) {
 *     console.error('Failed to book:', error);
 *   }
 * };
 */
export type CreateAppointmentParams = {
  specialistId: string;
  familyId: string;
  appointmentTypeId: string;
  startsAt: string; // ISO UTC timestamp
};

export async function createAppointment(
  params: CreateAppointmentParams
): Promise<any> {
  const response = await fetch("/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      throw new Error("Time slot no longer available");
    }
    throw new Error(error.error || "Failed to create appointment");
  }

  return response.json();
}

/**
 * Example: Cancel an appointment
 * 
 * Usage in a React component:
 * 
 * const handleCancel = async () => {
 *   try {
 *     await cancelAppointment('appointment-uuid', 'family');
 *     console.log('Appointment cancelled');
 *   } catch (error) {
 *     console.error('Failed to cancel:', error);
 *   }
 * };
 */
export async function cancelAppointment(
  appointmentId: string,
  cancelledBy: "family" | "specialist"
): Promise<any> {
  const response = await fetch("/api/appointments/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId, cancelledBy }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel appointment");
  }

  return response.json();
}

/**
 * Example: Complete React component using these APIs
 * 
 * 'use client';
 * 
 * import { useState, useEffect } from 'react';
 * import { fetchAvailability, createAppointment, type AvailabilityDay } from '@/lib/booking-api-examples';
 * 
 * export default function BookingComponent({ specialistId, familyId, appointmentTypeId }: Props) {
 *   const [availability, setAvailability] = useState<AvailabilityDay[]>([]);
 *   const [selectedDate, setSelectedDate] = useState<string | null>(null);
 *   const [selectedSlot, setSelectedSlot] = useState<{ startsAt: string; endsAt: string } | null>(null);
 *   const [loading, setLoading] = useState(false);
 * 
 *   useEffect(() => {
 *     const startDate = new Date().toISOString().split('T')[0];
 *     const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
 *     
 *     fetchAvailability(specialistId, startDate, endDate)
 *       .then(setAvailability)
 *       .catch(console.error);
 *   }, [specialistId]);
 * 
 *   const handleBook = async () => {
 *     if (!selectedSlot) return;
 *     
 *     setLoading(true);
 *     try {
 *       const appointment = await createAppointment({
 *         specialistId,
 *         familyId,
 *         appointmentTypeId,
 *         startsAt: selectedSlot.startsAt,
 *       });
 *       alert('Appointment booked!');
 *     } catch (error: any) {
 *       alert(error.message);
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 * 
 *   const selectedDay = availability.find(d => d.date === selectedDate);
 * 
 *   return (
 *     <div>
 *       <div>
 *         {availability.map(day => (
 *           <button key={day.date} onClick={() => setSelectedDate(day.date)}>
 *             {day.date} ({day.slots.length} slots)
 *           </button>
 *         ))}
 *       </div>
 *       
 *       {selectedDay && (
 *         <div>
 *           <h3>Available times for {selectedDate}</h3>
 *           {selectedDay.slots.map(slot => (
 *             <button
 *               key={slot.startsAt}
 *               onClick={() => setSelectedSlot(slot)}
 *             >
 *               {new Date(slot.startsAt).toLocaleTimeString()}
 *             </button>
 *           ))}
 *         </div>
 *       )}
 *       
 *       {selectedSlot && (
 *         <button onClick={handleBook} disabled={loading}>
 *           {loading ? 'Booking...' : 'Book Appointment'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 */

