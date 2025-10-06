import { prisma } from '@/lib/prisma'

export default async function TestPage() {
  const teachers = await prisma.teacher.findMany()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Test</h1>
      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(teachers, null, 2)}
      </pre>
    </div>
  )
}