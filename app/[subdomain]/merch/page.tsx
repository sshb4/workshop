export default function Page() {
  return <div>Merch page coming soon.</div>;
}

{/* 

import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function Page({ params }: { params: { subdomain: string } }) {
  const { subdomain } = params;
  const teacher = await prisma.teacher.findUnique({ where: { subdomain } });
  if (!teacher || !teacher.hasMerchPage) {
    notFound();
  }

  // Default to invoice if not set
  // Fix checkoutType type
  const checkoutType = (teacher as unknown as { checkoutType?: string }).checkoutType || 'invoice';

  if (checkoutType === 'invoice') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-16">
        <div className="max-w-xl w-full mx-auto p-8 rounded-2xl shadow-lg border border-gray-200">
          <h1 className="text-3xl font-bold text-amber-700 mb-4 text-center">{teacher.name}&apos;s Merch</h1>
          <p className="text-gray-700 text-center mb-6">
            Welcome to the merch page! Here you can list products, resources, or anything you&apos;d like to offer to your students.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <span className="text-amber-800 font-medium">No products listed yet.</span>
            <p className="text-amber-700 mt-1 text-sm">Contact {teacher.name} for more info or check back soon!</p>
          </div>
          <div className="flex justify-center mt-8">
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition">
              Book Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // For checkout, show the calendar
  // Fetch availabilitySlots and colorScheme
  // Normalize availabilitySlots to string dates
  const rawSlots = await prisma.availabilitySlot.findMany({
    where: { teacherId: teacher.id, isActive: true },
  });
  const availabilitySlots = rawSlots.map(slot => ({
    ...slot,
    startDate: typeof slot.startDate === 'string' ? slot.startDate : slot.startDate.toISOString(),
    endDate: slot.endDate ? (typeof slot.endDate === 'string' ? slot.endDate : slot.endDate.toISOString()) : null,
  }));
  // You may want to fetch colorScheme from your theme system
  const colorScheme = {
    styles: {
      primary: '#f59e42',
      primaryLight: '#fde68a',
      accent: '#6366f1',
      background: '#fff',
      backgroundSecondary: '#fef3c7',
      border: '#e5e7eb',
      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
    }
  };

  // Dynamic import for BookingCalendar
  const BookingCalendar = (await import('../BookingCalendar')).default;

  // Handler for day selection
  function handleDaySelect(date: Date) {
    if (!teacher) return;
    window.location.href = `/checkout?date=${encodeURIComponent(date.toISOString())}&teacher=${teacher.id}`;
  }

  // Fix hourlyRate type for BookingCalendar
  const teacherForCalendar = {
    ...teacher,
    hourlyRate: teacher.hourlyRate ?? undefined,
  };
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center py-16">
      <div className="max-w-xl w-full mx-auto p-8 rounded-2xl shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-amber-700 mb-4 text-center">{teacher.name}&apos;s Merch</h1>
        <p className="text-gray-700 text-center mb-6">
          Welcome to the merch page! Here you can book a time using the calendar below.
        </p>
        <BookingCalendar
          teacher={teacherForCalendar}
          availabilitySlots={availabilitySlots}
          colorScheme={colorScheme}
          onDaySelect={handleDaySelect}
        />
      </div>
    </div>
  );
}

*/}
