/**
 * Eclipse Valhalla — Note Mapper
 */

import type { Note } from '../schema/entities';
import type { Database } from '../schema/database.types';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type NoteInsert = Database['public']['Tables']['notes']['Insert'];

export function fromRow(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    color: row.color,
    positionX: row.position_x,
    positionY: row.position_y,
    width: row.width,
    height: row.height,
    zIndex: row.z_index,
    minimized: row.minimized,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toInsert(note: Note): NoteInsert {
  return {
    id: note.id,
    user_id: note.userId,
    content: note.content,
    color: note.color,
    position_x: note.positionX,
    position_y: note.positionY,
    width: note.width,
    height: note.height,
    z_index: note.zIndex,
    minimized: note.minimized,
  };
}

export function fromLegacyNote(n: any, userId: string): Note {
  return {
    id: n.id,
    userId,
    content: n.content || '',
    color: n.color || 'yellow',
    positionX: n.x || 0,
    positionY: n.y || 0,
    width: n.width || 200,
    height: n.height || 200,
    zIndex: n.zIndex || 0,
    minimized: n.isMinimized || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
