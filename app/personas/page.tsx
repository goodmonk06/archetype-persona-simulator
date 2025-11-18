import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function PersonasPage() {
  const personas = await prisma.persona.findMany({
    include: {
      promptProfile: true,
      _count: {
        select: {
          testScenarios: true,
          responseLogs: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Personas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and interact with archetypal personas
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>

        {personas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              No personas yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Run the seed script to create initial personas
            </p>
            <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded text-sm">
              npm run db:seed
            </code>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <Link
                key={persona.id}
                href={`/personas/${persona.key}`}
                className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {persona.name}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm rounded-full">
                      {persona.archetypeGroup}
                    </span>
                  </div>
                  {!persona.promptProfile && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                      No profile
                    </span>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                  {persona.descriptionMarkdown.substring(0, 150)}
                  {persona.descriptionMarkdown.length > 150 ? '...' : ''}
                </p>

                <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>🧪 {persona._count.testScenarios} scenarios</span>
                  <span>💬 {persona._count.responseLogs} responses</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
