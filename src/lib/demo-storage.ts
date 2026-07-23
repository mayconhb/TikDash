import { AffiliateOrderRow, ImportRecord } from '../types';

const STORAGE_KEYS = {
  IMPORTS: 'demo_imports',
  ROWS: 'demo_order_rows'
};

export const demoStorage = {
  getImports: (): ImportRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.IMPORTS);
    return data ? JSON.parse(data) : [];
  },

  saveImport: (record: ImportRecord) => {
    const imports = demoStorage.getImports();
    const newImports = [record, ...imports];
    localStorage.setItem(STORAGE_KEYS.IMPORTS, JSON.stringify(newImports));
    return record;
  },

  getRows: (userId: string, startUtc?: string, endUtcExclusive?: string): AffiliateOrderRow[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ROWS);
    if (!data) return [];
    
    const rows: AffiliateOrderRow[] = JSON.parse(data);
    return rows.filter(row => {
      const matchesUser = row.user_id === userId;
      if (!matchesUser) return false;
      if (startUtc && row.order_date < startUtc) return false;
      if (endUtcExclusive && row.order_date >= endUtcExclusive) return false;
      return true;
    });
  },

  saveRows: (newRows: AffiliateOrderRow[]) => {
    const existingData = localStorage.getItem(STORAGE_KEYS.ROWS);
    const existingRows: AffiliateOrderRow[] = existingData ? JSON.parse(existingData) : [];
    
    // Simular upsert por row_identity
    const rowMap = new Map(existingRows.map(r => [r.row_identity, r]));
    newRows.forEach(r => rowMap.set(r.row_identity, r));
    
    localStorage.setItem(STORAGE_KEYS.ROWS, JSON.stringify(Array.from(rowMap.values())));
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.IMPORTS);
    localStorage.removeItem(STORAGE_KEYS.ROWS);
  }
};
