#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MetabaseClient } from './metabase-client.js';
import { SQLServerValidator } from './sql-validator.js';

const METABASE_URL = process.env.METABASE_URL || 'https://wealth-fish.metabaseapp.com';
const METABASE_API_KEY = process.env.METABASE_API_KEY;
const METABASE_DATABASE_ID = process.env.METABASE_DATABASE_ID || '34';

if (!METABASE_API_KEY) {
  console.error('Error: METABASE_API_KEY environment variable is required');
  process.exit(1);
}

const metabaseClient = new MetabaseClient(METABASE_URL, METABASE_API_KEY);
const sqlValidator = new SQLServerValidator();

const tools: Tool[] = [
  {
    name: 'get-database-schema',
    description: 'Retrieves the schema (tables and columns) from the htmigration SQL Server database. Essential for understanding available data before writing queries.',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Optional: Specific table name to get details for. If omitted, returns all tables.',
        },
      },
    },
  },
  {
    name: 'validate-sql-server-query',
    description: 'Validates SQL query syntax for SQL Server compatibility. Checks for common PostgreSQL/MySQL syntax errors that would fail on SQL Server.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL query to validate',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'test-metabase-query',
    description: 'Executes a SQL query against Metabase to verify it works. Returns sample results or error messages. Use this before deploying cards.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The SQL query to test',
        },
        max_rows: {
          type: 'number',
          description: 'Maximum rows to return (default: 10)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get-existing-cards',
    description: 'Fetches existing Metabase cards/questions from the SPQR collection. Useful for learning patterns and seeing working SQL examples.',
    inputSchema: {
      type: 'object',
      properties: {
        collection_id: {
          type: 'string',
          description: 'Collection ID (default: 133 for SPQR)',
          default: '133',
        },
        limit: {
          type: 'number',
          description: 'Maximum cards to return',
          default: 20,
        },
      },
    },
  },
  {
    name: 'get-sql-server-syntax-guide',
    description: 'Returns SQL Server syntax patterns and common corrections for PostgreSQL/MySQL syntax. Use this to understand SQL Server requirements.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

const server = new Server(
  {
    name: 'metabase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get-database-schema': {
        const tableName = args?.table_name as string | undefined;
        const schema = await metabaseClient.getDatabaseSchema(
          parseInt(METABASE_DATABASE_ID),
          tableName
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(schema, null, 2),
            },
          ],
        };
      }

      case 'validate-sql-server-query': {
        const query = args?.query as string;
        if (!query) {
          throw new Error('Query parameter is required');
        }
        const validation = sqlValidator.validate(query);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(validation, null, 2),
            },
          ],
        };
      }

      case 'test-metabase-query': {
        const query = args?.query as string;
        const maxRows = (args?.max_rows as number) || 10;
        if (!query) {
          throw new Error('Query parameter is required');
        }
        const result = await metabaseClient.testQuery(
          parseInt(METABASE_DATABASE_ID),
          query,
          maxRows
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'get-existing-cards': {
        const collectionId = (args?.collection_id as string) || '133';
        const limit = (args?.limit as number) || 20;
        const cards = await metabaseClient.getCards(collectionId, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(cards, null, 2),
            },
          ],
        };
      }

      case 'get-sql-server-syntax-guide': {
        const guide = sqlValidator.getSyntaxGuide();
        return {
          content: [
            {
              type: 'text',
              text: guide,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Metabase MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
