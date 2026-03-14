import axios, { AxiosInstance } from 'axios';

export class MetabaseClient {
  private client: AxiosInstance;

  private throwAxiosError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      throw new Error(`Metabase API error: ${error.response?.data?.message || error.message}`);
    }
    throw error as Error;
  }

  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getDatabaseSchema(databaseId: number, tableName?: string) {
    try {
      const response = await this.client.get(`/api/database/${databaseId}/metadata`);
      const tables = response.data.tables || [];

      if (tableName) {
        const table = tables.find(
          (t: any) => t.name.toLowerCase() === tableName.toLowerCase()
        );
        if (!table) {
          return { error: `Table '${tableName}' not found` };
        }
        return {
          table: table.name,
          schema: table.schema || 'dbo',
          fields: table.fields.map((f: any) => ({
            name: f.name,
            type: f.base_type,
            description: f.description,
          })),
        };
      }

      return {
        database: response.data.name,
        tables: tables.map((t: any) => ({
          name: t.name,
          schema: t.schema || 'dbo',
          field_count: t.fields?.length || 0,
        })),
        total_tables: tables.length,
      };
    } catch (error) {
      this.throwAxiosError(error);
    }
  }

  async testQuery(databaseId: number, query: string, maxRows: number = 10) {
    try {
      const response = await this.client.post('/api/dataset', {
        database: databaseId,
        type: 'native',
        native: {
          query: query,
        },
      });

      const data = response.data.data;
      const cols = data.cols.map((c: any) => c.name);
      const rows = data.rows.slice(0, maxRows);

      return {
        success: true,
        columns: cols,
        rows: rows,
        total_rows: data.rows.length,
        row_count: rows.length,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.response?.data || error.message;
        return {
          success: false,
          error: errorMsg,
          suggestion: 'Check SQL Server syntax. Use get-sql-server-syntax-guide for help.',
        };
      }
      throw error;
    }
  }

  async getCards(collectionId: string, limit: number = 20) {
    try {
      const response = await this.client.get('/api/card', {
        params: {
          f: 'all',
          collection: collectionId,
        },
      });

      const cards = response.data.data || response.data;
      const limitedCards = cards.slice(0, limit);

      return {
        collection_id: collectionId,
        card_count: limitedCards.length,
        cards: limitedCards.map((card: any) => ({
          id: card.id,
          name: card.name,
          description: card.description,
          query_type: card.dataset_query?.type,
          sql_query: card.dataset_query?.native?.query,
          visualization: card.display,
        })),
      };
    } catch (error) {
      this.throwAxiosError(error);
    }
  }
}
