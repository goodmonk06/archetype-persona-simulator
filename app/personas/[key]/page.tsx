import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PersonaTabs from '@/components/PersonaTabs';

export default async function PersonaDetailPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;

  const persona = await prisma.persona.findUnique({
    where: { key },
    include: {
      promptProfile: true,
      testScenarios: {
        orderBy: { createdAt: 'desc' },
      },
      responseLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!persona) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {persona.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full text-sm">
                  {persona.archetypeGroup}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  Key: {persona.key}
                </span>
              </div>
            </div>
            <a
              href="/personas"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Personas
            </a>
          </div>
        </div>

        <PersonaTabs persona={persona} />
      </div>
    </div>
  );
}
