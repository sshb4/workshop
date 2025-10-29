import GraphUpIcon from '@/components/icons/graph-up.svg';
// components/SuccessMessage.tsx

interface SuccessMessageProps {
  message: string
  className?: string
}

export default function SuccessMessage({ message, className = "" }: SuccessMessageProps) {
  return (
    <div className={`bg-green-50 border-l-4 border-green-500 p-4 rounded ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
              <GraphUpIcon className="h-5 w-5" style={{ filter: 'invert(44%) sepia(98%) saturate(1000%) hue-rotate(90deg) brightness(90%) contrast(100%)' }} />
        </div>
        <div className="ml-3">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  )
}
