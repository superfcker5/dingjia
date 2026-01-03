import { read, utils } from 'xlsx';
import { Product } from '../types';

export const parseExcelFile = async (file: File): Promise<Product[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = read(arrayBuffer);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // 1. Find the header row containing "名称" (Name)
  const headerRowIndex = data.findIndex(row => 
    row.some(cell => cell && typeof cell === 'string' && cell.includes('名称'))
  );

  if (headerRowIndex === -1) {
    throw new Error("无法识别表格格式：未找到'名称'列");
  }

  const headerRow = data[headerRowIndex];
  const nameColIndex = headerRow.findIndex(cell => cell && cell.toString().includes('名称'));

  // 2. Identify Column Indices for Prices
  // We assume the standard order of tiers: Purchase -> Wholesale -> Floor -> Retail
  // Within each tier, we look for "价格/箱" (Box) and "售价/个" (Item)
  // Fix: Ensure we match columns that actually represent prices (contain "价" or "售"), ignoring "总箱数" etc.

  const boxIndices: number[] = [];
  const itemIndices: number[] = [];

  headerRow.forEach((cell, idx) => {
    if (!cell || idx <= nameColIndex) return;
    const str = cell.toString();
    
    // Must look like a price column
    const isPriceRelated = str.includes('价') || str.includes('售');
    
    if (isPriceRelated) {
      if (str.includes('箱')) {
        boxIndices.push(idx);
      }
      if (str.includes('个') || str.includes('单')) {
        itemIndices.push(idx);
      }
    }
  });

  // Helper to safely get price or default to 0
  const getVal = (row: any[], indices: number[], tierIdx: number): number => {
    if (tierIdx >= indices.length) return 0;
    const colIdx = indices[tierIdx];
    const val = row[colIdx];
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const products: Product[] = [];

  // 3. Parse Data Rows
  for (let i = headerRowIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length <= nameColIndex) continue;
    
    const rawName = row[nameColIndex];
    if (!rawName) continue;

    // Sanitize name: remove newlines/returns, trim
    const name = rawName.toString().replace(/[\r\n]+/g, ' ').trim();

    // Skip empty names or total rows
    if (name === '' || name.includes('总计')) continue;

    // Skip section headers (where prices are likely 0 or empty)
    // Heuristic: If name is "产品名称" (Product Name) it's a repeated header
    if (name.includes('产品名称') || name.includes('名称')) continue;

    // Extract raw prices
    let purchaseBox = getVal(row, boxIndices, 0);
    let purchaseItem = getVal(row, itemIndices, 0);
    let wholesaleBox = getVal(row, boxIndices, 1);
    let wholesaleItem = getVal(row, itemIndices, 1);
    let floorBox = getVal(row, boxIndices, 2);
    let floorItem = getVal(row, itemIndices, 2);
    let retailBox = getVal(row, boxIndices, 3);
    let retailItem = getVal(row, itemIndices, 3);

    // FIX: Handle "Big Fireworks" logic (1 Box = 1 Item)
    // If Box Price exists but Item Price is 0, assume Item Price = Box Price
    if (purchaseBox > 0 && purchaseItem === 0) purchaseItem = purchaseBox;
    if (wholesaleBox > 0 && wholesaleItem === 0) wholesaleItem = wholesaleBox;
    if (floorBox > 0 && floorItem === 0) floorItem = floorBox;
    if (retailBox > 0 && retailItem === 0) retailItem = retailBox;

    products.push({
      id: crypto.randomUUID(),
      name: name,
      prices: {
        purchase: { box: purchaseBox, item: purchaseItem },
        wholesale: { box: wholesaleBox, item: wholesaleItem },
        retail_floor: { box: floorBox, item: floorItem },
        retail: { box: retailBox, item: retailItem }
      }
    });
  }

  return products;
};