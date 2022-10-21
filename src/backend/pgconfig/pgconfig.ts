import type { Pool } from "pg";
import type { Executor } from "../pg.js";
import { getSupabaseServerConfig } from "../supabase.js";
import { PGMemConfig } from "./pgmem.js";
import { supabaseDBConfig } from "./supabase.js";

/**
 * We use Postgres in a few different ways: directly, via supabase,
 * emulated with pg-mem. This interface abstracts their differences.
 */
export interface PGConfig {
  initPool(): Pool;
  getSchemaVersion(executor: Executor): Promise<number>;
}

export function getDBConfig(): PGConfig {
  const supabaseServerConfig = getSupabaseServerConfig();
  if (supabaseServerConfig) {
    return supabaseDBConfig(supabaseServerConfig);
  }
  return new PGMemConfig();
}
