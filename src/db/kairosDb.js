import Dexie from 'dexie'

/**
 * Base de datos local Offline-First para Kairos Anticaligus.
 * ++id genera claves autoincrementales en la tabla conteos.
 */
export const db = new Dexie('KairosDB')

db.version(1).stores({
  conteos: '++id, fecha, centro, jaula',
})
