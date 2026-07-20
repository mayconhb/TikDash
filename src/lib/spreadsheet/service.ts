import * as XLSX from 'xlsx';
import { 
  AffiliateOrderRow, 
  ImportRecord, 
  SettlementStatus 
} from '../../types';
import { 
  mapHeaders, 
  normalizeStatus, 
  normalizeContentType, 
  determineTrafficSource, 
  createRowIdentity 
} from './normalizer';
import { format } from 'date-fns';
import { parseBRLAmount, parseTikTokOrderDate, APP_TIME_ZONE, fromZonedTime } from '../../utils/formatters';
import { supabase } from '../supabase';
import { demoStorage } from '../demo-storage';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function processSpreadsheet(
  file: File, 
  userId: string, 
  onProgress: (progress: number, message: string) => void
): Promise<ImportRecord> {
  const isDemo = userId === DEMO_USER_ID;
  onProgress(10, 'Lendo arquivo...');
  
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawData.length < 2) {
    throw new Error('Planilha vazia ou sem cabeçalhos.');
  }

  const rawHeaders = rawData[0];
  const mapping = mapHeaders(rawHeaders);
  
  // Mandatory headers validation
  const mandatoryKeys = ['order_id', 'product_name', 'settlement_status', 'content_type', 'gmv', 'standard_comm', 'order_date'];
  const missingHeaders = mandatoryKeys.filter(key => mapping[key] === undefined);
  
  if (missingHeaders.length > 0) {
    throw new Error(`Colunas obrigatórias ausentes: ${missingHeaders.join(', ')}`);
  }

  onProgress(30, 'Validando dados...');
  
  const rows: any[] = [];
  let gmvTotal = 0;
  let commissionTotal = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  const uniqueOrders = new Set<string>();
  const warnings: string[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const rawRow = rawData[i];
    if (!rawRow || rawRow.length === 0) continue;

    const orderId = String(rawRow[mapping.order_id] || '').trim();
    if (!orderId) {
      warnings.push(`Linha ${i + 1}: ID do pedido ausente.`);
      continue;
    }

    const rawDateValue = rawRow[mapping.order_date];
    let orderDate: Date | null = null;
    
    try {
      if (rawDateValue instanceof Date) {
        // Handle Date objects from XLSX by formatting back to string to ensure wall-clock parsing
        const dateStr = format(rawDateValue, 'dd/MM/yyyy HH:mm:ss');
        orderDate = parseTikTokOrderDate(dateStr);
      } else {
        orderDate = parseTikTokOrderDate(String(rawDateValue));
      }
    } catch (e) {
      warnings.push(`Linha ${i + 1}: Data do pedido inválida (${rawDateValue}).`);
      continue;
    }

    const gmv = parseBRLAmount(rawRow[mapping.gmv]);
    const stdComm = parseBRLAmount(rawRow[mapping.standard_comm]);
    const shopAdsComm = parseBRLAmount(rawRow[mapping.shop_ads_comm]);
    const bonus = parseBRLAmount(rawRow[mapping.bonus]);
    const agencyBonus = parseBRLAmount(rawRow[mapping.agency_bonus]);
    const totalComm = stdComm + shopAdsComm + bonus + agencyBonus;

    const normalizedRow: any = {
      user_id: userId,
      import_id: '', // Will be set after import doc is created
      row_identity: '', // Will be set below
      row_fingerprint: '', 
      order_id: orderId,
      sku_id: String(rawRow[mapping.sku_id] || '').trim(),
      product_id: String(rawRow[mapping.product_id] || '').trim(),
      product_name: String(rawRow[mapping.product_name] || 'Produto sem nome').trim(),
      store_name: String(rawRow[mapping.store_name] || '').trim(),
      items_sold: parseInt(rawRow[mapping.items_sold]) || 1,
      items_refunded: parseInt(rawRow[mapping.items_refunded]) || 0,
      order_type: String(rawRow[mapping.order_type] || '').trim(),
      original_settlement_status: String(rawRow[mapping.settlement_status] || '').trim(),
      normalized_settlement_status: normalizeStatus(String(rawRow[mapping.settlement_status] || '')),
      content_type_original: String(rawRow[mapping.content_type] || '').trim(),
      content_type_normalized: normalizeContentType(String(rawRow[mapping.content_type] || '')),
      content_id: String(rawRow[mapping.content_id] || '').trim(),
      traffic_source: determineTrafficSource(rawRow, mapping),
      gmv,
      standard_estimated_commission: stdComm,
      shop_ads_estimated_commission: shopAdsComm,
      estimated_bonus: bonus,
      partner_agency_estimated_bonus: agencyBonus,
      estimated_commission: totalComm,
      order_date: orderDate.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    normalizedRow.row_identity = createRowIdentity(normalizedRow as AffiliateOrderRow);
    normalizedRow.row_fingerprint = normalizedRow.row_identity;

    rows.push(normalizedRow);
    uniqueOrders.add(orderId);
    gmvTotal += gmv;
    commissionTotal += totalComm;

    if (!minDate || orderDate < minDate) minDate = orderDate;
    if (!maxDate || orderDate > maxDate) maxDate = orderDate;
  }

  onProgress(50, 'Preparando importação...');

  const importPayload = {
    user_id: userId,
    original_filename: file.name,
    file_size_bytes: file.size,
    total_rows: rawData.length - 1,
    valid_rows: rows.length,
    invalid_rows: (rawData.length - 1) - rows.length,
    unique_orders: uniqueOrders.size,
    minimum_order_date: minDate?.toISOString(),
    maximum_order_date: maxDate?.toISOString(),
    gmv_total: gmvTotal,
    estimated_commission_total: commissionTotal,
    status: 'processing' as const,
    warnings: warnings.slice(0, 10),
    created_at: new Date().toISOString(),
  };

  let importRecord: ImportRecord;

  if (isDemo) {
    importRecord = {
      ...importPayload,
      id: crypto.randomUUID(),
      inserted_rows: 0,
      updated_rows: 0,
      ignored_rows: 0,
    } as unknown as ImportRecord;
    demoStorage.saveImport(importRecord);
  } else {
    const { data: importData, error: importError } = await supabase
      .from('imports')
      .insert([importPayload])
      .select()
      .single();

    if (importError) throw importError;
    importRecord = importData as unknown as ImportRecord;
  }

  onProgress(60, 'Salvando dados...');

  if (isDemo) {
    const chunk = rows.map(row => ({
      ...row,
      import_id: importRecord.id
    }));
    demoStorage.saveRows(chunk as AffiliateOrderRow[]);
    onProgress(90, 'Finalizando...');
  } else {
    const batchSize = 1000;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const chunk = rows.slice(i, i + batchSize).map(row => ({
        ...row,
        import_id: importRecord.id
      }));
      
      const { error: batchError } = await supabase
        .from('affiliate_order_rows')
        .upsert(chunk, { onConflict: 'row_identity' });

      if (batchError) throw batchError;
      
      inserted += chunk.length;
      onProgress(60 + Math.floor((inserted / rows.length) * 30), `Salvando... (${inserted}/${rows.length})`);
    }
  }

  const finalStatus = warnings.length > 0 ? 'completed_with_warnings' : 'completed';
  
  if (isDemo) {
    const finalRecord = {
      ...importRecord,
      status: finalStatus,
      completed_at: new Date().toISOString(),
      inserted_rows: rows.length
    } as ImportRecord;
    // Update in localStorage
    const imports = demoStorage.getImports().map(i => i.id === importRecord.id ? finalRecord : i);
    localStorage.setItem('demo_imports', JSON.stringify(imports));
    
    onProgress(100, 'Concluído!');
    return finalRecord;
  } else {
    const { data: finalRecord, error: finalError } = await supabase
      .from('imports')
      .update({ 
        status: finalStatus, 
        completed_at: new Date().toISOString(),
        inserted_rows: rows.length 
      })
      .eq('id', importRecord.id)
      .select()
      .single();

    if (finalError) throw finalError;

    onProgress(100, 'Concluído!');
    return finalRecord as unknown as ImportRecord;
  }
}

