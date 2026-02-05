
export enum GroupType {
  KIDO = 'KIDO',
  UNICHARM = 'UNICHARM',
  COLGATE = 'COLGATE',
  KIOTVIET_NPP = 'KIOTVIET_NPP'
}

export interface ImportItem {
  orderId: string;
  customerName: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  discountRate: number;
  discountAmount: number;
  afterDiscountAmount: number;
  totalPayment: number;
  // Trường mới cho V9.0 Final
  hasWarning?: boolean;
  warningMessage?: string;
}

export interface BasicUnitMap {
  [itemCode: string]: {
    itemName: string;
    basicUnit: string;
    groupName?: string;
  };
}

export interface ImportResult {
  group: GroupType;
  items: ImportItem[];
  metadata: {
    processedDate: string;
    totalAmount: number;
  };
}
