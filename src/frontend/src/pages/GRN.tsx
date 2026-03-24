import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, PackageCheck, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

export default function GRN() {
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
    itemCode: "",
    itemName: "",
    unit: "",
    orderedQty: "",
    receivedQty: "",
    rate: "",
  });
  const [form, setForm] = useState({
    poId: "0",
    supplierId: "",
    supplierName: "",
    receivedDate: new Date().toISOString().split("T")[0],
    receivedBy: "",
    remarks: "",
    items: [emptyItem()],
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => actor!.getAllSuppliers(),
    enabled: !!actor,
  });
  const { data: pos = [] } = useQuery({
    queryKey: ["pos"],
    queryFn: () => actor!.getAllPOs(),
    enabled: !!actor,
  });
  const { data: grns = [], isLoading } = useQuery({
    queryKey: ["grns"],
    queryFn: () => actor!.getAllGRNs(),
    enabled: !!actor,
  });

  const buildGrnPayload = () => {
    const now = new Date(form.receivedDate);
    const items = form.items
      .filter((i) => i.itemName)
      .map((i) => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        unit: i.unit,
        orderedQty: Number.parseFloat(i.orderedQty) || 0,
        receivedQty: Number.parseFloat(i.receivedQty) || 0,
        rate: Number.parseFloat(i.rate) || 0,
        amount:
          (Number.parseFloat(i.receivedQty) || 0) *
          (Number.parseFloat(i.rate) || 0),
      }));
    const total = items.reduce((s, i) => s + i.amount, 0);
    return [
      BigInt(Number.parseInt(form.poId) || 0),
      BigInt(Number.parseInt(form.supplierId) || 0),
      form.supplierName,
      form.receivedDate,
      items,
      total,
      form.receivedBy,
      form.remarks,
      BigInt(now.getMonth() + 1),
      BigInt(now.getFullYear()),
    ];
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const payload = buildGrnPayload();
      return actor.createGRN(
        ...(payload as Parameters<typeof actor.createGRN>),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grns"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      enqueue("grn", buildGrnPayload());
      toast.info("Saved offline. Will sync when connected.");
      setOpen(false);
    } else {
      mutation.mutate();
    }
  };

  const filtered = (grns as any[]).filter((g) => {
    const mOk =
      filterMonth === "All" ||
      g.month.toString() === String(MONTHS.indexOf(filterMonth));
    const yOk = filterYear === "All" || g.year.toString() === filterYear;
    const sOk =
      filterSupplier === "All" || g.supplierId.toString() === filterSupplier;
    return mOk && yOk && sOk;
  });

  const updateItem = (idx: number, field: string, val: string) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    setForm({ ...form, items });
  };

  const handleDownloadPDF = () => {
    const columns = [
      "GRN No",
      "Date",
      "Supplier",
      "PO Reference",
      "Item",
      "Qty Received",
    ];
    const rows = filtered.flatMap((g: any) =>
      (g.items ?? [{ itemName: "-", receivedQty: 0 }]).map((item: any) => [
        g.code,
        g.receivedDate,
        g.supplierName,
        `PO-${g.poId.toString()}`,
        item.itemName || "-",
        item.receivedQty ?? 0,
      ]),
    );
    downloadPDF("Goods Received Notes", columns, rows);
  };

  return (
    <div className="space-y-4">
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
            data-ocid="grn.download_button"
          >
            <Download size={15} className="mr-1" /> Download PDF
          </Button>
          <Button
            onClick={() => setOpen(true)}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Plus size={16} className="mr-1" /> Create GRN
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <PackageCheck size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No GRNs found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {[
                    "GRN Code",
                    "PO Ref",
                    "Supplier",
                    "Received Date",
                    "Total Amount",
                    "Received By",
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
                {filtered.map((g: any) => (
                  <tr
                    key={g.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">
                      {g.code}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      PO-{g.poId.toString()}
                    </td>
                    <td className="px-4 py-3 text-gray-800">
                      {g.supplierName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {g.receivedDate}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      ₹
                      {g.totalAmount?.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Goods Received Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label>Reference PO</Label>
                <Select
                  value={form.poId}
                  onValueChange={(v) => {
                    const po = (pos as any[]).find(
                      (p) => p.id.toString() === v,
                    );
                    setForm({
                      ...form,
                      poId: v,
                      supplierId: po?.supplierId?.toString() ?? "",
                      supplierName: po?.supplierName ?? "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PO" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No PO reference</SelectItem>
                    {(pos as any[]).map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.code} - {p.supplierName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Supplier Name *</Label>
                <Input
                  value={form.supplierName}
                  onChange={(e) =>
                    setForm({ ...form, supplierName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Received Date</Label>
                <Input
                  type="date"
                  value={form.receivedDate}
                  onChange={(e) =>
                    setForm({ ...form, receivedDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Received By *</Label>
                <Input
                  value={form.receivedBy}
                  onChange={(e) =>
                    setForm({ ...form, receivedBy: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Remarks</Label>
                <Input
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({ ...form, remarks: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items Received</Label>
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
                        "Item Code",
                        "Item Name",
                        "Unit",
                        "Ordered Qty",
                        "Received Qty",
                        "Rate (₹)",
                        "Amount",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-2 py-2 text-gray-600 font-medium"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => {
                      const amt =
                        (Number.parseFloat(item.receivedQty) || 0) *
                        (Number.parseFloat(item.rate) || 0);
                      return (
                        <tr
                          key={item._id ?? idx}
                          className="border-b last:border-0"
                        >
                          <td className="px-2 py-1">
                            <Input
                              value={item.itemCode}
                              onChange={(e) =>
                                updateItem(idx, "itemCode", e.target.value)
                              }
                              className="h-8 w-24"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              value={item.itemName}
                              onChange={(e) =>
                                updateItem(idx, "itemName", e.target.value)
                              }
                              className="h-8"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              value={item.unit}
                              onChange={(e) =>
                                updateItem(idx, "unit", e.target.value)
                              }
                              className="h-8 w-16"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={item.orderedQty}
                              onChange={(e) =>
                                updateItem(idx, "orderedQty", e.target.value)
                              }
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={item.receivedQty}
                              onChange={(e) =>
                                updateItem(idx, "receivedQty", e.target.value)
                              }
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="px-2 py-1">
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                updateItem(idx, "rate", e.target.value)
                              }
                              className="h-8 w-24"
                            />
                          </td>
                          <td className="px-2 py-1 text-gray-700">
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
                </table>
              </div>
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
                {mutation.isPending ? "Saving..." : "Create GRN"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
