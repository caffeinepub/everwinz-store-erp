import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useActor } from "../hooks/useActor";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { downloadPDF } from "../lib/pdfUtils";

const MONTHS = [
  "All",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const YEARS = ["All", "2024", "2025", "2026", "2027"];

function statusLabel(status: any) {
  if ("draft" in status) return "Draft";
  if ("approved" in status) return "Approved";
  return "Received";
}

function statusBadge(status: any) {
  if ("draft" in status) return <Badge variant="secondary">Draft</Badge>;
  if ("approved" in status)
    return <Badge className="bg-blue-100 text-blue-800">Approved</Badge>;
  return <Badge className="bg-green-100 text-green-800">Received</Badge>;
}

export default function PurchaseOrders() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterSupplier, setFilterSupplier] = useState("All");
  const { isOnline } = useNetworkStatus();
  const { enqueue } = useOfflineQueue();

  const emptyItem = () => ({
    _id: Math.random().toString(36).slice(2),
    itemName: "",
    unit: "",
    quantity: "",
    rate: "",
  });
  const [form, setForm] = useState({
    supplierId: "",
    orderDate: "",
    expectedDelivery: "",
    remarks: "",
    items: [emptyItem()],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => actor!.getAllSuppliers(),
    enabled: !!actor,
  });
  const { data: pos = [], isLoading } = useQuery({
    queryKey: ["pos"],
    queryFn: () => actor!.getAllPOs(),
    enabled: !!actor,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const sup = (suppliers as any[]).find(
        (s) => s.id.toString() === form.supplierId,
      );
      const now = new Date(form.orderDate || Date.now());
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const items = form.items
        .filter((i) => i.itemName)
        .map((i) => ({
          itemCode: "",
          itemName: i.itemName,
          unit: i.unit,
          quantity: Number.parseFloat(i.quantity) || 0,
          rate: Number.parseFloat(i.rate) || 0,
          amount:
            (Number.parseFloat(i.quantity) || 0) *
            (Number.parseFloat(i.rate) || 0),
        }));
      const total = items.reduce((s, i) => s + i.amount, 0);
      return actor.createPO(
        BigInt(Number.parseInt(form.supplierId)),
        sup?.name ?? "",
        form.orderDate,
        form.expectedDelivery,
        items,
        total,
        form.remarks,
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos"] });
      setOpen(false);
      setForm({
        supplierId: "",
        orderDate: "",
        expectedDelivery: "",
        remarks: "",
        items: [emptyItem()],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      const sup = (suppliers as any[]).find(
        (s) => s.id.toString() === form.supplierId,
      );
      const now = new Date(form.orderDate || Date.now());
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const items = form.items
        .filter((i) => i.itemName)
        .map((i) => ({
          itemCode: "",
          itemName: i.itemName,
          unit: i.unit,
          quantity: Number.parseFloat(i.quantity) || 0,
          rate: Number.parseFloat(i.rate) || 0,
          amount:
            (Number.parseFloat(i.quantity) || 0) *
            (Number.parseFloat(i.rate) || 0),
        }));
      const total = items.reduce((s, i) => s + i.amount, 0);
      enqueue("po", [
        BigInt(Number.parseInt(form.supplierId)),
        sup?.name ?? "",
        form.orderDate,
        form.expectedDelivery,
        items,
        total,
        form.remarks,
        BigInt(month),
        BigInt(year),
      ]);
      toast.info("Saved offline. Will sync when connected.");
      setOpen(false);
      setForm({
        supplierId: "",
        orderDate: "",
        expectedDelivery: "",
        remarks: "",
        items: [emptyItem()],
      });
    } else {
      mutation.mutate();
    }
  };

  const filteredPos = (pos as any[]).filter((po) => {
    const mOk =
      filterMonth === "All" ||
      po.month.toString() === String(MONTHS.indexOf(filterMonth));
    const yOk = filterYear === "All" || po.year.toString() === filterYear;
    const sOk =
      filterSupplier === "All" || po.supplierId.toString() === filterSupplier;
    return mOk && yOk && sOk;
  });

  const updateItem = (idx: number, field: string, val: string) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    setForm({ ...form, items });
  };

  const handleDownloadPDF = () => {
    const columns = [
      "PO Number",
      "Date",
      "Supplier",
      "Items",
      "Amount",
      "Status",
    ];
    const rows = filteredPos.map((po: any) => [
      po.code,
      po.orderDate,
      po.supplierName,
      po.items?.length ?? 0,
      `Rs ${po.totalAmount?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      statusLabel(po.status),
    ]);
    downloadPDF("Purchase Orders", columns, rows);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs text-gray-500">Month</Label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Year</Label>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Supplier</Label>
          <Select value={filterSupplier} onValueChange={setFilterSupplier}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Suppliers</SelectItem>
              {(suppliers as any[]).map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="border-blue-600 text-blue-700 hover:bg-blue-50"
            data-ocid="purchase_orders.download_button"
          >
            <Download size={15} className="mr-1" /> Download PDF
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Plus size={16} className="mr-1" /> Create PO
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredPos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ShoppingCart size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No purchase orders found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {[
                    "PO Code",
                    "Supplier",
                    "Order Date",
                    "Expected Delivery",
                    "Total Amount",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-gray-600 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPos.map((po: any) => (
                  <tr
                    key={po.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">
                      {po.code}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {po.supplierName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{po.orderDate}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {po.expectedDelivery}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ₹
                      {po.totalAmount?.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3">{statusBadge(po.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm({ ...form, supplierId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {(suppliers as any[]).map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div />
              <div>
                <Label>Order Date *</Label>
                <Input
                  type="date"
                  value={form.orderDate}
                  onChange={(e) =>
                    setForm({ ...form, orderDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) =>
                    setForm({ ...form, expectedDelivery: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm({ ...form, items: [...form.items, emptyItem()] })
                  }
                >
                  <Plus size={14} className="mr-1" /> Add Row
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {[
                        "Item Name",
                        "Unit",
                        "Quantity",
                        "Rate (₹)",
                        "Amount (₹)",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 text-gray-600 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => {
                      const amt =
                        (Number.parseFloat(item.quantity) || 0) *
                        (Number.parseFloat(item.rate) || 0);
                      return (
                        <tr
                          key={item._id ?? idx}
                          className="border-b last:border-0"
                        >
                          <td className="px-2 py-1">
                            <Input
                              value={item.itemName}
                              onChange={(e) =>
                                updateItem(idx, "itemName", e.target.value)
                              }
                              className="h-8"
                              placeholder="Item name"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(idx, "unit", e.target.value)
                              }
                              className="h-8 w-20"
                              placeholder="pcs"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(idx, "quantity", e.target.value)
                              }
                              className="h-8 w-24"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                updateItem(idx, "rate", e.target.value)
                              }
                              className="h-8 w-28"
                            />
                          </td>
                          <td className="px-3 py-1 text-gray-700">
                            ₹{amt.toFixed(2)}
                          </td>
                          <td className="px-2 py-1">
                            {form.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setForm({
                                    ...form,
                                    items: form.items.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t">
                      <td
                        colSpan={4}
                        className="px-3 py-2 text-right font-semibold text-gray-700"
                      >
                        Total:
                      </td>
                      <td className="px-3 py-2 font-bold text-gray-800">
                        ₹
                        {form.items
                          .reduce(
                            (s, i) =>
                              s +
                              (Number.parseFloat(i.quantity) || 0) *
                                (Number.parseFloat(i.rate) || 0),
                            0,
                          )
                          .toFixed(2)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <Label>Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-700 hover:bg-blue-800"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Create Purchase Order"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
