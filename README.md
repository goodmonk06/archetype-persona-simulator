# Archetype Persona Simulator

An AI-powered engine that simulates archetypal personas with distinct personalities, values, and communication styles. Create, test, and interact with personas like Mentors, Tricksters, Guardians, and Sages.

## Features

- **Persona Definition & Management**: Create archetypal personas with unique values, communication styles, and behavioral patterns
- **AI-Powered Simulation**: Generate responses that authentically match each persona's archetype using OpenAI
- **Prompt Engineering**: Advanced prompt building system that composes system prompts from persona attributes
- **Test Scenarios**: Define and run test scenarios to validate persona behavior
- **Response Logging**: Track all interactions with detailed metadata
- **REST API**: Full CRUD API for integration with external systems
- **Admin UI**: Web interface for managing personas, viewing logs, and running tests

## Tech Stack

- **Framework**: Next.js 16 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **LLM**: OpenAI GPT-4o-mini
- **Styling**: Tailwind CSS
- **Testing**: Vitest

## Architecture

### Domain Model

```
┌─────────────────────────────────────────────────────────────┐
│                         Persona                              │
├─────────────────────────────────────────────────────────────┤
│ • id, key (unique URL-friendly identifier)                  │
│ • name, archetypeGroup                                       │
│ • descriptionMarkdown                                        │
│ • primaryValuesJson, shadowAspectsJson                      │
└───────────────┬─────────────────────────────────────────────┘
                │
                ├──> PersonaPromptProfile (1:1)
                │    • systemPromptMarkdown
                │    • styleGuidelinesMarkdown
                │    • exampleDialoguesJson
                │
                ├──> PersonaTestScenario (1:N)
                │    • title, inputPrompt
                │    • expectedToneDescriptionMarkdown
                │
                └──> PersonaResponseLog (1:N)
                     • inputPrompt, outputText
                     • metadataJson (model, tokens, duration)
                     • scenarioId (optional)
```

### Core Components

1. **Persona Prompt Builder** (`lib/personaPromptBuilder.ts`)
   - Composes final system prompts from persona attributes
   - Includes global safety rules
   - Estimates token usage

2. **OpenAI Adapter** (`lib/openai.ts`)
   - Clean abstraction over OpenAI SDK
   - Handles chat completions with metadata
   - Error handling and token tracking

3. **API Routes** (`app/api/personas/...`)
   - RESTful endpoints for persona CRUD
   - Simulation endpoint for generating responses
   - Test scenario management

4. **UI** (`app/personas/...`)
   - Persona list and detail views
   - Tabbed interface (Overview, Prompt Profile, Scenarios, Logs)
   - Responsive design with dark mode support

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/archetype-persona-simulator.git
   cd archetype-persona-simulator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-...
   ```

5. Start the database and run setup:
   ```bash
   npm run setup
   ```
   This will:
   - Start PostgreSQL in Docker
   - Push the database schema
   - Generate Prisma client
   - Seed initial personas (Warm Mentor, Playful Trickster, Quiet Sage)

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio
- `npm run docker:up` - Start PostgreSQL container
- `npm run docker:down` - Stop PostgreSQL container
- `npm run setup` - Full setup (docker + db + seed)

## API Reference

### Base URL

```
http://localhost:3000/api
```

### Endpoints

#### List Personas

```http
GET /api/personas
```

Response:
```json
[
  {
    "id": "...",
    "key": "warm-mentor",
    "name": "The Warm Mentor",
    "archetypeGroup": "Mentor",
    "descriptionMarkdown": "...",
    "primaryValuesJson": "[\"Growth\", \"Compassion\"]",
    "promptProfile": { ... },
    "_count": {
      "testScenarios": 2,
      "responseLogs": 15
    }
  }
]
```

#### Get Persona

```http
GET /api/personas/{key}
```

#### Create Persona

```http
POST /api/personas
Content-Type: application/json

{
  "key": "wise-guardian",
  "name": "The Wise Guardian",
  "archetypeGroup": "Guardian",
  "descriptionMarkdown": "A protective presence...",
  "primaryValuesJson": "[\"Safety\", \"Tradition\", \"Community\"]",
  "shadowAspectsJson": "[\"Over-protection\", \"Resistance to change\"]"
}
```

#### Update Persona

```http
PUT /api/personas/{key}
Content-Type: application/json

{
  "name": "Updated Name",
  "descriptionMarkdown": "Updated description"
}
```

#### Delete Persona

```http
DELETE /api/personas/{key}
```

#### Update Prompt Profile

```http
PUT /api/personas/{key}/prompt-profile
Content-Type: application/json

{
  "systemPromptMarkdown": "You are a guardian...",
  "styleGuidelinesMarkdown": "- Be protective\n- Value tradition",
  "exampleDialoguesJson": "[{\"user\": \"...\", \"assistant\": \"...\"}]"
}
```

#### Generate Response (Simulate Persona)

```http
POST /api/personas/{key}/respond
Content-Type: application/json

{
  "userMessage": "I'm thinking about making a big change in my career.",
  "contextJson": { "sessionId": "abc123" }
}
```

Response:
```json
{
  "response": "That's a significant step you're considering...",
  "persona": {
    "key": "warm-mentor",
    "name": "The Warm Mentor",
    "archetypeGroup": "Mentor"
  },
  "metadata": {
    "logId": "...",
    "model": "gpt-4o-mini",
    "usage": {
      "promptTokens": 245,
      "completionTokens": 89,
      "totalTokens": 334
    },
    "duration": 1234
  }
}
```

#### Create Test Scenario

```http
POST /api/personas/{key}/scenarios
Content-Type: application/json

{
  "title": "Handling Uncertainty",
  "inputPrompt": "I don't know what to do next.",
  "expectedToneDescriptionMarkdown": "Should be supportive yet encourage self-reflection"
}
```

#### List Test Scenarios

```http
GET /api/personas/{key}/scenarios
```

## Using the API in Your Application

### Example: Chat Integration

```typescript
async function getPersonaResponse(personaKey: string, userMessage: string) {
  const response = await fetch(`/api/personas/${personaKey}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userMessage }),
  });

  const data = await response.json();
  return data.response;
}

// Usage
const mentorResponse = await getPersonaResponse(
  'warm-mentor',
  'I\'m struggling with this problem'
);
console.log(mentorResponse);
```

### Example: Building a Chatbot

```typescript
const personas = {
  mentor: 'warm-mentor',
  trickster: 'playful-trickster',
  sage: 'quiet-sage',
};

async function chat(personaType: keyof typeof personas, message: string) {
  const personaKey = personas[personaType];

  const response = await fetch(`/api/personas/${personaKey}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage: message,
      contextJson: { timestamp: Date.now() },
    }),
  });

  return response.json();
}

// Use different personas for different situations
const result = await chat('mentor', 'How do I improve my skills?');
```

## Extending the System

### Adding a New Persona

1. **Via UI**: Visit `/personas` and use the admin interface
2. **Via API**: Use the POST `/api/personas` endpoint
3. **Via Seed Script**: Edit `prisma/seed.ts` and run `npm run db:seed`

### Creating Custom Archetypes

When defining a new persona, consider:

- **Archetype Group**: What universal role does this represent? (e.g., Hero, Caregiver, Explorer)
- **Primary Values**: What does this persona care about most?
- **Shadow Aspects**: What negative traits should it avoid?
- **Communication Style**: How should it speak and interact?
- **Example Dialogues**: Show ideal interactions

### Prompt Engineering Tips

The system builds prompts from multiple components:

1. **Base Template**: Generic structure for all personas
2. **Persona Core**: Description, values, shadow aspects
3. **Prompt Profile**: Custom instructions, style guidelines, examples
4. **Global Safety**: Rules applied to all personas

For best results:
- Be specific in style guidelines
- Provide 2-3 high-quality example dialogues
- Clearly define boundaries and limitations
- Test with various scenarios

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Open test UI:

```bash
npm run test:ui
```

## Database Management

### View Database

```bash
npm run db:studio
```

### Reset Database

```bash
npm run db:reset
```

### Create Migration

```bash
npm run db:migrate
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables in your hosting platform:
   - `DATABASE_URL`: PostgreSQL connection string
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NODE_ENV=production`

3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `npm test` and `npm run lint`
6. Submit a pull request

## License

MIT

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI](https://openai.com/)
- Database with [Prisma](https://www.prisma.io/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
