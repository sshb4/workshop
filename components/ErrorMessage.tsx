import TimesCircleIcon from '@/components/icons/TimesCircleIcon';
// components/ErrorMessage.tsx

interface ErrorMessageProps {
  message: string
  className?: string
}

export default function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border-l-4 border-red-500 p-4 rounded ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <TimesCircleIcon className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  )
}
