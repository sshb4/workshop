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
        <img src="/file.svg" alt="Error" className="h-5 w-5" style={{ filter: 'invert(24%) sepia(94%) saturate(7470%) hue-rotate(0deg) brightness(95%) contrast(101%)' }} />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  )
}
