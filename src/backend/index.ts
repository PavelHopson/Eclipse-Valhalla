// Eclipse Valhalla — Backend Entry Point

export { getSupabase, isCloudAvailable, requireSupabase } from './supabaseClient';
export * as questRepo from './repositories/questRepository';
export * as userRepo from './repositories/userRepository';
export * as gamificationRepo from './repositories/gamificationRepository';
export * as settingsRepo from './repositories/settingsRepository';
export type { Database } from './schema/database.types';
export type * from './schema/entities';
