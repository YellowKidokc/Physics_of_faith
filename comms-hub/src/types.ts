export interface Env {
  DB: D1Database;
}

export interface Message {
  id: number;
  from_name: string;
  to_name: string | null;
  content: string;
  created_at: number;
  read_by: string;
}
