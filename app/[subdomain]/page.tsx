import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { getColorScheme } from '@/lib/themes';
import ManualBookModal from '@/components/ManualBookModal';

interface TeacherMeta {
	title?: string;
	favicon?: string;
	profileImage?: string;
	bio?: string;
	hourlyRate?: number;
	subdomain: string;
	name: string;
}

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
	const { subdomain } = await params;
	const teacher = await prisma.teacher.findUnique({ where: { subdomain } });
	if (!teacher) {
		return { title: 'Provider Not Found' };
	}
	const teacherMeta: TeacherMeta = {
		title: typeof teacher.title === 'string' ? teacher.title : undefined,
		favicon: typeof teacher.favicon === 'string' ? teacher.favicon : undefined,
		profileImage: typeof teacher.profileImage === 'string' ? teacher.profileImage : undefined,
		bio: typeof teacher.bio === 'string' ? teacher.bio : undefined,
		hourlyRate: typeof teacher.hourlyRate === 'number' ? teacher.hourlyRate : undefined,
		subdomain: teacher.subdomain,
		name: teacher.name,
	};
	return {
		title: teacherMeta.title ? `${teacherMeta.name} - ${teacherMeta.title}` : teacherMeta.name,
		description: teacherMeta.bio
			? `Book appointments with ${teacherMeta.name}. ${teacherMeta.bio.slice(0, 160)}...`
			: `Book appointments with ${teacherMeta.name}. Professional services available for $${teacherMeta.hourlyRate}/hour.`,
		icons: teacherMeta.favicon
			? {
					icon: teacherMeta.favicon,
					shortcut: teacherMeta.favicon,
				}
			: undefined,
		openGraph: {
			title: teacherMeta.title ? `${teacherMeta.name} - ${teacherMeta.title}` : teacherMeta.name,
			description: teacherMeta.bio || `Professional services available for $${teacherMeta.hourlyRate}/hour.`,
			images: teacherMeta.profileImage ? [teacherMeta.profileImage] : [],
			url: `/${teacherMeta.subdomain}`,
		},
		twitter: {
			card: 'summary_large_image',
			title: teacherMeta.title ? `${teacherMeta.name} - ${teacherMeta.title}` : teacherMeta.name,
			description: teacherMeta.bio || `Professional services available for $${teacherMeta.hourlyRate}/hour.`,
			images: teacherMeta.profileImage ? [teacherMeta.profileImage] : [],
		},
	};
}

interface AvailabilitySlot {
	id: string;
	title: string | null;
	startDate: string;
	endDate: string | null;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	isActive: boolean;
}

export default async function Page({ params }: { params: Promise<{ subdomain: string }> }) {
	const { subdomain } = await params;
	const teacher = await prisma.teacher.findUnique({ where: { subdomain } });
	if (!teacher) {
		notFound();
	}
	let allowCustomerBook = true;
	let allowManualBook = true;
	const bookingSettings: { form_fields?: string } = {};
	try {
		const rawSettings = await prisma.$queryRaw`SELECT * FROM booking_settings WHERE teacher_id = ${teacher.id} LIMIT 1`;
		if (Array.isArray(rawSettings) && rawSettings.length > 0) {
			const dbSettings = rawSettings[0];
			allowCustomerBook = dbSettings.allow_customer_book !== undefined ? !!dbSettings.allow_customer_book : true;
			allowManualBook = dbSettings.allow_manual_book !== undefined ? !!dbSettings.allow_manual_book : true;
			bookingSettings.form_fields = dbSettings.form_fields;
		}
	} catch {}
	let availabilitySlots: AvailabilitySlot[] = [];
	if (allowCustomerBook) {
		const slots = await prisma.availabilitySlot.findMany({
			where: {
				teacherId: teacher.id,
				isActive: true,
			},
			orderBy: { startTime: 'asc' },
		});
		availabilitySlots = slots.map((slot: typeof slots[0]) => ({
			...slot,
			startDate: slot.startDate instanceof Date ? slot.startDate.toISOString() : slot.startDate,
			endDate: slot.endDate instanceof Date && slot.endDate !== null ? slot.endDate.toISOString() : slot.endDate,
		})) as AvailabilitySlot[];
	}
	const colorScheme = getColorScheme((teacher as typeof teacher & { colorScheme?: string }).colorScheme || 'default');
	return (
		<div className="min-h-screen transition-colors duration-300"
			style={{
				background: `linear-gradient(135deg, ${colorScheme.styles.primaryLight}, ${colorScheme.styles.backgroundSecondary})`,
				color: colorScheme.styles.textPrimary,
				'--theme-primary': colorScheme.styles.primary,
				'--theme-primary-hover': colorScheme.styles.primaryHover,
				'--theme-background': colorScheme.styles.background,
				'--theme-text-primary': colorScheme.styles.textPrimary,
				'--theme-border': colorScheme.styles.border,
			} as React.CSSProperties}
		>
			<header className="shadow-sm border-b transition-colors duration-300 sticky top-0 z-30"
				style={{
					backgroundColor: colorScheme.styles.background,
					borderColor: colorScheme.styles.border
				}}
			>
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<h1 className="text-2xl sm:text-4xl font-bold transition-colors duration-300"
						style={{ color: colorScheme.styles.textPrimary }}>
						{teacher.name}
					</h1>
					{(teacher as { title?: string }).title && (
						<p className="text-sm sm:text-lg mt-1 transition-colors duration-300"
							style={{ color: colorScheme.styles.textSecondary }}>
							{(teacher as { title?: string }).title}
						</p>
					)}
				</div>
			</header>
			<main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
				<div className="rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-8 mb-6 sm:mb-8 transition-colors duration-300"
					style={{
						backgroundColor: colorScheme.styles.background,
						borderColor: colorScheme.styles.border,
						border: `1px solid ${colorScheme.styles.border}`
					}}
				>
					<div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
						<div className="flex-shrink-0 mx-auto sm:mx-0">
							{teacher.profileImage ? (
								<Image
									src={teacher.profileImage}
									alt={teacher.name}
									width={120}
									height={120}
									className="w-24 h-24 sm:w-40 sm:h-40 rounded-full object-cover border-4 transition-colors duration-300"
									style={{ borderColor: colorScheme.styles.primaryLight }}
								/>
							) : (
								<div className="w-24 h-24 sm:w-40 sm:h-40 rounded-full flex items-center justify-center border-4 transition-colors duration-300"
									style={{
										background: `linear-gradient(135deg, ${colorScheme.styles.primary}, ${colorScheme.styles.accent})`,
										borderColor: colorScheme.styles.primaryLight
									}}
								>
									<span className="text-3xl sm:text-6xl font-bold text-white">
										{teacher.name[0]}
									</span>
								</div>
							)}
						</div>
						<div className="flex-1 text-center sm:text-left">
							<h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 transition-colors duration-300"
								style={{ color: colorScheme.styles.textPrimary }}>
								About Me
							</h2>
							{teacher.bio && (
								<p className="text-sm sm:text-lg leading-relaxed mb-4 sm:mb-6 transition-colors duration-300"
									style={{ color: colorScheme.styles.textSecondary }}>
									{teacher.bio}
								</p>
							)}
							{teacher.hourlyRate && (
								<div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 sm:gap-3 rounded-lg p-3 sm:p-4 inline-block transition-colors duration-300"
									style={{ backgroundColor: colorScheme.styles.primaryLight }}>
									<span className="text-xs sm:text-sm font-medium transition-colors duration-300"
										style={{ color: colorScheme.styles.textSecondary }}>
										Hourly Rate
									</span>
									<p className="text-xl font-bold text-primary"
										style={{ color: colorScheme.styles.primary }}>
										${teacher.hourlyRate}/hour
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className="mt-8">
					<ManualBookModal
						colorScheme={colorScheme}
						bookingSettings={bookingSettings}
						availabilitySlots={availabilitySlots}
						showCalendar={allowManualBook}
						teacher={{
							...teacher,
							hourlyRate: teacher.hourlyRate === null ? undefined : teacher.hourlyRate,
							title: teacher.title === null ? undefined : teacher.title,
							bio: teacher.bio === null ? undefined : teacher.bio,
							profileImage: teacher.profileImage === null ? undefined : teacher.profileImage,
							email: teacher.email === null ? undefined : teacher.email,
							phone: teacher.phone === null ? undefined : teacher.phone,
							colorScheme: teacher.colorScheme === null ? undefined : teacher.colorScheme
						}}
					/>
				</div>
			</main>
			<footer className="mt-16 py-8 text-center text-gray-500 text-sm">
				<p>Powered by Buzz Financial</p>
			</footer>
		</div>
	);
}
