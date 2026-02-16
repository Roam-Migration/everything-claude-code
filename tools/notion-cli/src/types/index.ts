/**
 * Notion CLI - Type Definitions
 */

export interface NotionConfig {
  auth: {
    token: string;
    workspace: string;
  };
  databases: {
    tasks: {
      id: string;
      collection_id?: string;
    };
    projects?: {
      id: string;
      collection_id?: string;
    };
  };
  users: Record<string, string>;
  defaults: {
    driver?: string;
    status?: string;
  };
}

export interface TaskInput {
  title: string;
  status?: string;
  priority?: string;
  effort?: number | string;
  driver?: string;
  project?: string;
  tags?: string[];
  summary?: string;
  url?: string;
  content?: string;
  dueDate?: string;
  startDate?: string;
}

export interface BulkTasksInput {
  database: string;
  defaults?: Partial<TaskInput>;
  tasks: TaskInput[];
}

export interface TaskOutput {
  id: string;
  url: string;
  title: string;
  status?: string;
  priority?: string;
}

export interface QueryOptions {
  driver?: string;
  status?: string;
  project?: string;
  limit?: number;
  format?: 'table' | 'json' | 'urls';
}

export interface NotionProperty {
  id: string;
  type: string;
  name: string;
}

export interface DatabaseSchema {
  id: string;
  title: string;
  properties: Record<string, NotionProperty>;
}
