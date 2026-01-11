/**
 * IndexedDB Storage Utility
 * Manages design metadata and page-specific canvas data
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { Design } from '../../types/design.types';

// Database schema interface
interface AppicDB {
  designs: {
    key: string;
    value: Design;
  };
  pageData: {
    key: string; // Format: `${designId}_${pageId}`
    value: {
      pageId: string;
      designId: string;
      canvasJSON: string;
      updatedAt: number;
    };
  };
}

const DB_NAME = 'appic-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<AppicDB> | null = null;

/**
 * Initialize and get database instance
 */
async function getDB(): Promise<IDBPDatabase<AppicDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<AppicDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create designs store
      if (!db.objectStoreNames.contains('designs')) {
        db.createObjectStore('designs', { keyPath: 'id' });
      }

      // Create pageData store
      if (!db.objectStoreNames.contains('pageData')) {
        const pageDataStore = db.createObjectStore('pageData');
        pageDataStore.createIndex('designId', 'designId');
        pageDataStore.createIndex('pageId', 'pageId');
      }
    },
  });

  return dbInstance;
}

/**
 * Save design metadata
 */
export async function saveDesign(design: Design): Promise<void> {
  const db = await getDB();
  await db.put('designs', design);
}

/**
 * Get design metadata by ID
 */
export async function getDesign(designId: string): Promise<Design | undefined> {
  const db = await getDB();
  return await db.get('designs', designId);
}

/**
 * Get all designs
 */
export async function getAllDesigns(): Promise<Design[]> {
  const db = await getDB();
  return await db.getAll('designs');
}

/**
 * Delete design and all its page data
 */
export async function deleteDesign(designId: string): Promise<void> {
  const db = await getDB();
  
  // Delete design metadata
  await db.delete('designs', designId);
  
  // Delete all page data for this design
  const tx = db.transaction('pageData', 'readwrite');
  const index = tx.store.index('designId');
  const pageDataKeys = await index.getAllKeys(designId);
  
  await Promise.all(pageDataKeys.map(key => tx.store.delete(key)));
  await tx.done;
}

/**
 * Save page canvas data
 */
export async function savePageData(
  designId: string,
  pageId: string,
  canvasJSON: string
): Promise<void> {
  const db = await getDB();
  const key = `${designId}_${pageId}`;
  
  await db.put('pageData', {
    pageId,
    designId,
    canvasJSON,
    updatedAt: Date.now(),
  }, key);
}

/**
 * Get page canvas data
 */
export async function getPageData(
  designId: string,
  pageId: string
): Promise<string | undefined> {
  const db = await getDB();
  const key = `${designId}_${pageId}`;
  const data = await db.get('pageData', key);
  return data?.canvasJSON;
}

/**
 * Delete page data
 */
export async function deletePageData(
  designId: string,
  pageId: string
): Promise<void> {
  const db = await getDB();
  const key = `${designId}_${pageId}`;
  await db.delete('pageData', key);
}

/**
 * Get all page data for a design
 */
export async function getAllPageDataForDesign(
  designId: string
): Promise<Array<{ pageId: string; canvasJSON: string }>> {
  const db = await getDB();
  const tx = db.transaction('pageData', 'readonly');
  const index = tx.store.index('designId');
  const allData = await index.getAll(designId);
  
  return allData.map(data => ({
    pageId: data.pageId,
    canvasJSON: data.canvasJSON,
  }));
}

/**
 * Clear all data (for debugging/reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('designs');
  await db.clear('pageData');
}
