import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Buffer "mo:base/Buffer";

actor {

  // ==================== TYPES ====================

  public type PaymentTerms = { #advance; #credit30 };
  public type POStatus = { #draft; #approved; #received };
  public type MRNStatus = { #pending; #approved };

  public type Supplier = {
    id: Nat; code: Text; name: Text; address: Text; contactPerson: Text;
    phone: Text; email: Text; gstNo: Text; itemsSupplied: [Text];
    estimatedDeliveryDays: Nat; paymentTerms: PaymentTerms; active: Bool;
  };

  public type Item = {
    id: Nat; code: Text; name: Text; unit: Text; category: Text;
    currentStock: Float; minimumStock: Float;
  };

  public type POItem = {
    itemCode: Text; itemName: Text; unit: Text;
    quantity: Float; rate: Float; amount: Float;
  };

  public type PurchaseOrder = {
    id: Nat; code: Text; supplierId: Nat; supplierName: Text;
    orderDate: Text; expectedDelivery: Text; items: [POItem];
    totalAmount: Float; status: POStatus; remarks: Text; month: Nat; year: Nat;
  };

  public type MRNItem = {
    slNo: Nat; itemCode: Text; itemDescription: Text;
    unit: Text; quantity: Float; remark: Text;
  };

  public type MaterialsRequest = {
    id: Nat; code: Text; requestDate: Text; month: Nat; year: Nat;
    items: [MRNItem]; requestedBy: Text; approvedBy: Text; status: MRNStatus;
  };

  public type GRNItem = {
    itemCode: Text; itemName: Text; unit: Text;
    orderedQty: Float; receivedQty: Float; rate: Float; amount: Float;
  };

  public type GRN = {
    id: Nat; code: Text; poId: Nat; supplierId: Nat; supplierName: Text;
    receivedDate: Text; items: [GRNItem]; totalAmount: Float;
    receivedBy: Text; remarks: Text; month: Nat; year: Nat;
  };

  public type DCItem = {
    itemCode: Text; itemName: Text; unit: Text; quantity: Float; remarks: Text;
  };

  public type DeliveryChallan = {
    id: Nat; code: Text; dcDate: Text; deliverTo: Text; projectName: Text;
    items: [DCItem]; preparedBy: Text; authorizedBy: Text; month: Nat; year: Nat;
  };

  public type MCRItem = {
    itemCode: Text; itemName: Text; unit: Text;
    openingStock: Float; received: Float; issued: Float; closingStock: Float;
  };

  // ==================== STABLE STATE ====================

  var supplierSeq : Nat = 0;
  var suppliers : [Supplier] = [];

  var itemSeq : Nat = 0;
  var itemStore : [Item] = [];

  var poSeq : Nat = 0;
  var poStore : [PurchaseOrder] = [];

  var mrnSeq : Nat = 0;
  var mrnStore : [MaterialsRequest] = [];

  var grnSeq : Nat = 0;
  var grnStore : [GRN] = [];

  var dcSeq : Nat = 0;
  var dcStore : [DeliveryChallan] = [];

  // ==================== HELPERS ====================

  func padNat(n: Nat) : Text {
    if (n < 10) { "00" # Nat.toText(n) }
    else if (n < 100) { "0" # Nat.toText(n) }
    else { Nat.toText(n) }
  };

  func appendSupplier(arr: [Supplier], s: Supplier) : [Supplier] {
    let buf = Buffer.fromArray<Supplier>(arr);
    buf.add(s);
    Buffer.toArray(buf)
  };

  func appendItem(arr: [Item], i: Item) : [Item] {
    let buf = Buffer.fromArray<Item>(arr);
    buf.add(i);
    Buffer.toArray(buf)
  };

  func appendPO(arr: [PurchaseOrder], p: PurchaseOrder) : [PurchaseOrder] {
    let buf = Buffer.fromArray<PurchaseOrder>(arr);
    buf.add(p);
    Buffer.toArray(buf)
  };

  func appendMRN(arr: [MaterialsRequest], m: MaterialsRequest) : [MaterialsRequest] {
    let buf = Buffer.fromArray<MaterialsRequest>(arr);
    buf.add(m);
    Buffer.toArray(buf)
  };

  func appendGRN(arr: [GRN], g: GRN) : [GRN] {
    let buf = Buffer.fromArray<GRN>(arr);
    buf.add(g);
    Buffer.toArray(buf)
  };

  func appendDC(arr: [DeliveryChallan], d: DeliveryChallan) : [DeliveryChallan] {
    let buf = Buffer.fromArray<DeliveryChallan>(arr);
    buf.add(d);
    Buffer.toArray(buf)
  };

  // ==================== SUPPLIERS ====================

  public func createSupplier(
    name: Text, address: Text, contactPerson: Text, phone: Text,
    email: Text, gstNo: Text, itemsSupplied: [Text],
    estimatedDeliveryDays: Nat, paymentTerms: PaymentTerms
  ) : async Supplier {
    supplierSeq += 1;
    let s : Supplier = {
      id = supplierSeq; code = "EWZ-SUP-" # padNat(supplierSeq);
      name; address; contactPerson; phone; email; gstNo;
      itemsSupplied; estimatedDeliveryDays; paymentTerms; active = true;
    };
    suppliers := appendSupplier(suppliers, s);
    s
  };

  public query func getAllSuppliers() : async [Supplier] {
    suppliers
  };

  public query func getSupplierById(id: Nat) : async ?Supplier {
    Array.find(suppliers, func(s) { s.id == id })
  };

  public func updateSupplier(id: Nat, name: Text, address: Text, contactPerson: Text,
    phone: Text, email: Text, gstNo: Text, itemsSupplied: [Text],
    estimatedDeliveryDays: Nat, paymentTerms: PaymentTerms) : async Bool {
    let found = Array.find(suppliers, func(s) { s.id == id });
    switch found {
      case null { false };
      case (?_) {
        suppliers := Array.map(suppliers, func(s) {
          if (s.id == id) { { s with name; address; contactPerson; phone; email; gstNo; itemsSupplied; estimatedDeliveryDays; paymentTerms } }
          else { s }
        });
        true
      };
    }
  };

  // ==================== ITEMS ====================

  public func createItem(name: Text, unit: Text, category: Text, minimumStock: Float) : async Item {
    itemSeq += 1;
    let itm : Item = {
      id = itemSeq; code = "EWZ-ITM-" # padNat(itemSeq);
      name; unit; category; currentStock = 0.0; minimumStock;
    };
    itemStore := appendItem(itemStore, itm);
    itm
  };

  public query func getAllItems() : async [Item] {
    itemStore
  };

  public func updateItemStock(id: Nat, stock: Float) : async Bool {
    let found = Array.find(itemStore, func(i) { i.id == id });
    switch found {
      case null { false };
      case (?_) {
        itemStore := Array.map(itemStore, func(i) {
          if (i.id == id) { { i with currentStock = stock } } else { i }
        });
        true
      };
    }
  };

  // ==================== PURCHASE ORDERS ====================

  public func createPO(supplierId: Nat, supplierName: Text, orderDate: Text,
    expectedDelivery: Text, poItems: [POItem], totalAmount: Float,
    remarks: Text, month: Nat, year: Nat) : async PurchaseOrder {
    poSeq += 1;
    let po : PurchaseOrder = {
      id = poSeq; code = "EWZ-PO-" # padNat(poSeq);
      supplierId; supplierName; orderDate; expectedDelivery;
      items = poItems; totalAmount; status = #draft; remarks; month; year;
    };
    poStore := appendPO(poStore, po);
    po
  };

  public query func getAllPOs() : async [PurchaseOrder] {
    poStore
  };

  public query func getPOById(id: Nat) : async ?PurchaseOrder {
    Array.find(poStore, func(p) { p.id == id })
  };

  public func updatePOStatus(id: Nat, status: POStatus) : async Bool {
    let found = Array.find(poStore, func(p) { p.id == id });
    switch found {
      case null { false };
      case (?_) {
        poStore := Array.map(poStore, func(p) {
          if (p.id == id) { { p with status } } else { p }
        });
        true
      };
    }
  };

  public query func getPOsByFilter(month: Nat, year: Nat, supplierId: Nat) : async [PurchaseOrder] {
    Array.filter(poStore, func(po) {
      (month == 0 or po.month == month) and
      (year == 0 or po.year == year) and
      (supplierId == 0 or po.supplierId == supplierId)
    })
  };

  // ==================== MATERIALS REQUEST NOTE ====================

  public func createMRN(requestDate: Text, month: Nat, year: Nat,
    mrnItems: [MRNItem], requestedBy: Text, approvedBy: Text) : async MaterialsRequest {
    mrnSeq += 1;
    let mrn : MaterialsRequest = {
      id = mrnSeq; code = "EWZ-MRN-" # padNat(mrnSeq);
      requestDate; month; year; items = mrnItems;
      requestedBy; approvedBy; status = #pending;
    };
    mrnStore := appendMRN(mrnStore, mrn);
    mrn
  };

  public query func getAllMRNs() : async [MaterialsRequest] {
    mrnStore
  };

  public query func getMRNById(id: Nat) : async ?MaterialsRequest {
    Array.find(mrnStore, func(m) { m.id == id })
  };

  public func approveMRN(id: Nat, approvedBy: Text) : async Bool {
    let found = Array.find(mrnStore, func(m) { m.id == id });
    switch found {
      case null { false };
      case (?_) {
        mrnStore := Array.map(mrnStore, func(m) {
          if (m.id == id) { { m with status = #approved; approvedBy } } else { m }
        });
        true
      };
    }
  };

  // ==================== GRN ====================

  public func createGRN(poId: Nat, supplierId: Nat, supplierName: Text,
    receivedDate: Text, grnItems: [GRNItem], totalAmount: Float,
    receivedBy: Text, remarks: Text, month: Nat, year: Nat) : async GRN {
    grnSeq += 1;
    let grn : GRN = {
      id = grnSeq; code = "EWZ-GRN-" # padNat(grnSeq);
      poId; supplierId; supplierName; receivedDate;
      items = grnItems; totalAmount; receivedBy; remarks; month; year;
    };
    grnStore := appendGRN(grnStore, grn);
    for (gItem in grnItems.vals()) {
      itemStore := Array.map(itemStore, func(itm) {
        if (itm.code == gItem.itemCode) {
          { itm with currentStock = itm.currentStock + gItem.receivedQty }
        } else { itm }
      });
    };
    grn
  };

  public query func getAllGRNs() : async [GRN] {
    grnStore
  };

  public query func getGRNById(id: Nat) : async ?GRN {
    Array.find(grnStore, func(g) { g.id == id })
  };

  public query func getGRNsByFilter(month: Nat, year: Nat, supplierId: Nat) : async [GRN] {
    Array.filter(grnStore, func(g) {
      (month == 0 or g.month == month) and
      (year == 0 or g.year == year) and
      (supplierId == 0 or g.supplierId == supplierId)
    })
  };

  // ==================== DELIVERY CHALLAN ====================

  public func createDC(dcDate: Text, deliverTo: Text, projectName: Text,
    dcItems: [DCItem], preparedBy: Text, authorizedBy: Text,
    month: Nat, year: Nat) : async DeliveryChallan {
    dcSeq += 1;
    let dc : DeliveryChallan = {
      id = dcSeq; code = "EWZ-DC-" # padNat(dcSeq);
      dcDate; deliverTo; projectName; items = dcItems;
      preparedBy; authorizedBy; month; year;
    };
    dcStore := appendDC(dcStore, dc);
    for (dItem in dcItems.vals()) {
      itemStore := Array.map(itemStore, func(itm) {
        if (itm.code == dItem.itemCode) {
          let newStock = if (itm.currentStock > dItem.quantity) { itm.currentStock - dItem.quantity } else { 0.0 };
          { itm with currentStock = newStock }
        } else { itm }
      });
    };
    dc
  };

  public query func getAllDCs() : async [DeliveryChallan] {
    dcStore
  };

  public query func getDCById(id: Nat) : async ?DeliveryChallan {
    Array.find(dcStore, func(d) { d.id == id })
  };

  // ==================== CLOSING STOCK ====================

  public query func getClosingStock() : async [Item] {
    itemStore
  };

  // ==================== MCR ====================

  public query func getMCR(month: Nat, year: Nat) : async [MCRItem] {
    Array.map(itemStore, func(itm) {
      var received : Float = 0.0;
      for (grn in grnStore.vals()) {
        if (grn.month == month and grn.year == year) {
          for (gi in grn.items.vals()) {
            if (gi.itemCode == itm.code) { received += gi.receivedQty; };
          };
        };
      };
      var issued : Float = 0.0;
      for (dc in dcStore.vals()) {
        if (dc.month == month and dc.year == year) {
          for (di in dc.items.vals()) {
            if (di.itemCode == itm.code) { issued += di.quantity; };
          };
        };
      };
      let closingStock = itm.currentStock;
      {
        itemCode = itm.code; itemName = itm.name; unit = itm.unit;
        openingStock = closingStock - received + issued;
        received; issued; closingStock;
      }
    })
  };

};
