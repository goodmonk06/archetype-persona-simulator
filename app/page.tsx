import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
            Archetype Persona Simulator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            An AI engine that simulates archetypal personas with distinct personalities,
            values, and communication styles. Create, test, and interact with personas
            like Mentors, Tricksters, Guardians, and Sages.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/personas"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
            >
              View Personas
            </Link>
            <Link
              href="/api"
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              API Documentation
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🧙</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Define Personas
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Create archetypal personas with unique values, communication styles,
                and behavioral patterns.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🎭</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Simulate Interactions
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Generate responses that authentically match each persona's archetype
                using AI-powered simulation.
              </p>
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="text-3xl mb-3">🧪</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Test & Validate
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Create test scenarios to validate persona behavior and ensure
                consistent character representation.
              </p>
            </div>
          </div>

          <div className="mt-16 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Getting Started
            </h2>
            <div className="text-left space-y-2 text-gray-700 dark:text-gray-300">
              <p>1. Start the database: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">npm run docker:up</code></p>
              <p>2. Setup the database: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">npm run setup</code></p>
              <p>3. Start the dev server: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">npm run dev</code></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
