import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
  __kind__: "Some";
  value: T;
}
export interface None {
  __kind__: "None";
}
export type Option<T> = Some<T> | None;

export type PaymentTerms = { advance: null } | { credit30: null };
export type POStatus = { draft: null } | { approved: null } | { received: null };
export type MRNStatus = { pending: null } | { approved: null };

export interface Supplier {
  id: bigint;
  code: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNo: string;
  itemsSupplied: string[];
  estimatedDeliveryDays: bigint;
  paymentTerms: PaymentTerms;
  active: boolean;
}

export interface Item {
  id: bigint;
  code: string;
  name: string;
  unit: string;
  category: string;
  currentStock: number;
  minimumStock: number;
}

export interface POItem {
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface PurchaseOrder {
  id: bigint;
  code: string;
  supplierId: bigint;
  supplierName: string;
  orderDate: string;
  expectedDelivery: string;
  items: POItem[];
  totalAmount: number;
  status: POStatus;
  remarks: string;
  month: bigint;
  year: bigint;
}

export interface MRNItem {
  slNo: bigint;
  itemCode: string;
  itemDescription: string;
  unit: string;
  quantity: number;
  remark: string;
}

export interface MaterialsRequest {
  id: bigint;
  code: string;
  requestDate: string;
  month: bigint;
  year: bigint;
  items: MRNItem[];
  requestedBy: string;
  approvedBy: string;
  status: MRNStatus;
}

export interface GRNItem {
  itemCode: string;
  itemName: string;
  unit: string;
  orderedQty: number;
  receivedQty: number;
  rate: number;
  amount: number;
}

export interface GRN {
  id: bigint;
  code: string;
  poId: bigint;
  supplierId: bigint;
  supplierName: string;
  receivedDate: string;
  items: GRNItem[];
  totalAmount: number;
  receivedBy: string;
  remarks: string;
  month: bigint;
  year: bigint;
}

export interface DCItem {
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  remarks: string;
}

export interface DeliveryChallan {
  id: bigint;
  code: string;
  dcDate: string;
  deliverTo: string;
  projectName: string;
  items: DCItem[];
  preparedBy: string;
  authorizedBy: string;
  month: bigint;
  year: bigint;
}

export interface MCRItem {
  itemCode: string;
  itemName: string;
  unit: string;
  openingStock: number;
  received: number;
  issued: number;
  closingStock: number;
}

export interface backendInterface {
  createSupplier(name: string, address: string, contactPerson: string, phone: string, email: string, gstNo: string, itemsSupplied: string[], estimatedDeliveryDays: bigint, paymentTerms: PaymentTerms): Promise<Supplier>;
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplierById(id: bigint): Promise<Option<Supplier>>;
  updateSupplier(id: bigint, name: string, address: string, contactPerson: string, phone: string, email: string, gstNo: string, itemsSupplied: string[], estimatedDeliveryDays: bigint, paymentTerms: PaymentTerms): Promise<boolean>;

  createItem(name: string, unit: string, category: string, minimumStock: number): Promise<Item>;
  getAllItems(): Promise<Item[]>;
  updateItemStock(id: bigint, stock: number): Promise<boolean>;

  createPO(supplierId: bigint, supplierName: string, orderDate: string, expectedDelivery: string, items: POItem[], totalAmount: number, remarks: string, month: bigint, year: bigint): Promise<PurchaseOrder>;
  getAllPOs(): Promise<PurchaseOrder[]>;
  getPOById(id: bigint): Promise<Option<PurchaseOrder>>;
  updatePOStatus(id: bigint, status: POStatus): Promise<boolean>;
  getPOsByFilter(month: bigint, year: bigint, supplierId: bigint): Promise<PurchaseOrder[]>;

  createMRN(requestDate: string, month: bigint, year: bigint, items: MRNItem[], requestedBy: string, approvedBy: string): Promise<MaterialsRequest>;
  getAllMRNs(): Promise<MaterialsRequest[]>;
  getMRNById(id: bigint): Promise<Option<MaterialsRequest>>;
  approveMRN(id: bigint, approvedBy: string): Promise<boolean>;

  createGRN(poId: bigint, supplierId: bigint, supplierName: string, receivedDate: string, items: GRNItem[], totalAmount: number, receivedBy: string, remarks: string, month: bigint, year: bigint): Promise<GRN>;
  getAllGRNs(): Promise<GRN[]>;
  getGRNById(id: bigint): Promise<Option<GRN>>;
  getGRNsByFilter(month: bigint, year: bigint, supplierId: bigint): Promise<GRN[]>;

  createDC(dcDate: string, deliverTo: string, projectName: string, items: DCItem[], preparedBy: string, authorizedBy: string, month: bigint, year: bigint): Promise<DeliveryChallan>;
  getAllDCs(): Promise<DeliveryChallan[]>;
  getDCById(id: bigint): Promise<Option<DeliveryChallan>>;

  getClosingStock(): Promise<Item[]>;
  getMCR(month: bigint, year: bigint): Promise<MCRItem[]>;
}
