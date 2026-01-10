import { supabase } from './supabase';

// Example database operations
// Replace 'your_table_name' with your actual table names

export class DatabaseService {
  // Example: Get all records from a table
  static async getAll(tableName: string) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) throw error;
    return data;
  }

  // Example: Insert a record
  static async insert(tableName: string, data: any) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();

    if (error) throw error;
    return result;
  }

  // Example: Update a record
  static async update(tableName: string, id: string, updates: any) {
    const { data, error } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }

  // Example: Delete a record
  static async delete(tableName: string, id: string) {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Example: Get records with user-specific data
  static async getUserRecords(tableName: string, userId: string) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data;
  }

  // Example: Real-time subscription
  static subscribeToTable(tableName: string, callback: (payload: any) => void) {
    return supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe();
  }
}