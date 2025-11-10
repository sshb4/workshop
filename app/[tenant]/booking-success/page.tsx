import Link from 'next/link'

interface BookingSuccessProps {
  params: Promise<{ subdomain: string }>
}

export default async function BookingSuccessPage({ params }: BookingSuccessProps) {
  const { subdomain } = await params

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
          <svg 
            className="h-12 w-12 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
        
        {/* Success Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Booking Request Sent!
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Your booking request has been successfully submitted. The service provider will contact you shortly to confirm your appointment details.
          </p>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-blue-900">What happens next?</h3>
          <ul className="text-sm text-blue-800 space-y-2 text-left">
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">1.</span>
              <span>You&apos;ll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">2.</span>
              <span>The provider will contact you to confirm appointment details</span>
            </li>
            <li className="flex items-start">
              <span className="flex-shrink-0 h-5 w-5 text-blue-600 mr-2">3.</span>
              <span>Payment and final scheduling will be arranged directly</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href={`/${subdomain}`}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center"
          >
            Back to Provider Page
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-medium py-3 px-6 rounded-lg transition-colors duration-200 text-center"
          >
            Find More Providers
          </Link>
        </div>

        {/* Help Text */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Questions about your booking? Check your email for contact information or visit the provider&apos;s page.
          </p>
        </div>
      </div>
    </div>
  )
}
