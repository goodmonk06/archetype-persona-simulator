'use client';

import { useState } from 'react';
import { Persona, PersonaPromptProfile, PersonaTestScenario, PersonaResponseLog } from '@/app/generated/prisma';

type PersonaWithRelations = Persona & {
  promptProfile: PersonaPromptProfile | null;
  testScenarios: PersonaTestScenario[];
  responseLogs: PersonaResponseLog[];
};

interface PersonaTabsProps {
  persona: PersonaWithRelations;
}

type TabName = 'overview' | 'prompt' | 'scenarios' | 'logs';

export default function PersonaTabs({ persona }: PersonaTabsProps) {
  const [activeTab, setActiveTab] = useState<TabName>('overview');

  const tabs: { id: TabName; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'prompt', label: 'Prompt Profile' },
    { id: 'scenarios', label: 'Test Scenarios', count: persona.testScenarios.length },
    { id: 'logs', label: 'Response Logs', count: persona.responseLogs.length },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      {/* Tab Headers */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-4 text-sm font-medium border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab persona={persona} />}
        {activeTab === 'prompt' && <PromptProfileTab persona={persona} />}
        {activeTab === 'scenarios' && <ScenariosTab persona={persona} />}
        {activeTab === 'logs' && <LogsTab persona={persona} />}
      </div>
    </div>
  );
}

function OverviewTab({ persona }: { persona: PersonaWithRelations }) {
  const primaryValues = JSON.parse(persona.primaryValuesJson);
  const shadowAspects = persona.shadowAspectsJson ? JSON.parse(persona.shadowAspectsJson) : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Description
        </h3>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          {persona.descriptionMarkdown}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Core Values
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
          {primaryValues.map((value: string, idx: number) => (
            <li key={idx}>{value}</li>
          ))}
        </ul>
      </div>

      {shadowAspects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Shadow Aspects
          </h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            {shadowAspects.map((aspect: string, idx: number) => (
              <li key={idx}>{aspect}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PromptProfileTab({ persona }: { persona: PersonaWithRelations }) {
  if (!persona.promptProfile) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Prompt Profile
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This persona doesn't have a prompt profile configured yet.
        </p>
      </div>
    );
  }

  const exampleDialogues = JSON.parse(persona.promptProfile.exampleDialoguesJson);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          System Prompt
        </h3>
        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {persona.promptProfile.systemPromptMarkdown}
        </pre>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Style Guidelines
        </h3>
        <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
          {persona.promptProfile.styleGuidelinesMarkdown}
        </div>
      </div>

      {exampleDialogues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Example Dialogues
          </h3>
          <div className="space-y-4">
            {exampleDialogues.map((dialogue: { user: string; assistant: string }, idx: number) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="mb-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">USER:</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{dialogue.user}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {persona.name.toUpperCase()}:
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{dialogue.assistant}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenariosTab({ persona }: { persona: PersonaWithRelations }) {
  if (persona.testScenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🧪</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Test Scenarios
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create test scenarios to validate this persona's behavior.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {persona.testScenarios.map((scenario) => (
        <div key={scenario.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
            {scenario.title}
          </h4>
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">INPUT:</span>
            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{scenario.inputPrompt}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">EXPECTED TONE:</span>
            <div className="text-gray-700 dark:text-gray-300 text-sm mt-1">
              {scenario.expectedToneDescriptionMarkdown}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LogsTab({ persona }: { persona: PersonaWithRelations }) {
  if (persona.responseLogs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">💬</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Response Logs
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Interactions with this persona will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {persona.responseLogs.map((log) => {
        const metadata = JSON.parse(log.metadataJson);
        return (
          <div key={log.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(log.createdAt).toLocaleString()}
              </span>
              <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{metadata.usage?.totalTokens || 0} tokens</span>
                <span>{metadata.duration || 0}ms</span>
              </div>
            </div>
            <div className="mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">INPUT:</span>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{log.inputPrompt}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                RESPONSE:
              </span>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{log.outputText}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
