import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Download, Plus, Trash2 } from "lucide-react";
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
import { useActor } from "../hooks/useActor";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { downloadPDF } from "../lib/pdfUtils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MRN() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { enqueue } = useOfflineQueue();

  const emptyItem = (n: number) => ({
    _id: Math.random().toString(36).slice(2),
    slNo: n,
    itemCode: "",
    itemDescription: "",
    unit: "",
    quantity: "",
    remark: "",
  });
  const [form, setForm] = useState({
    requestDate: new Date().toISOString().split("T")[0],
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    requestedBy: "",
    approvedBy: "",
    items: [emptyItem(1)],
  });

  const { data: mrns = [], isLoading } = useQuery({
    queryKey: ["mrns"],
    queryFn: () => actor!.getAllMRNs(),
    enabled: !!actor,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const items = form.items
        .filter((i) => i.itemDescription)
        .map((i, idx) => ({
          slNo: BigInt(idx + 1),
          itemCode: i.itemCode,
          itemDescription: i.itemDescription,
          unit: i.unit,
          quantity: Number.parseFloat(i.quantity) || 0,
          remark: i.remark,
        }));
      return actor.createMRN(
        form.requestDate,
        BigInt(Number.parseInt(form.month)),
        BigInt(Number.parseInt(form.year)),
        items,
        form.requestedBy,
        form.approvedBy,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mrns"] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      const items = form.items
        .filter((i) => i.itemDescription)
        .map((i, idx) => ({
          slNo: BigInt(idx + 1),
          itemCode: i.itemCode,
          itemDescription: i.itemDescription,
          unit: i.unit,
          quantity: Number.parseFloat(i.quantity) || 0,
          remark: i.remark,
        }));
      enqueue("mrn", [
        form.requestDate,
        BigInt(Number.parseInt(form.month)),
        BigInt(Number.parseInt(form.year)),
        items,
        form.requestedBy,
        form.approvedBy,
      ]);
      toast.info("Saved offline. Will sync when connected.");
      setOpen(false);
    } else {
      mutation.mutate();
    }
  };

  const updateItem = (idx: number, field: string, val: string) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: val };
    setForm({ ...form, items });
  };

  const handleDownloadPDF = () => {
    const columns = [
      "Sl No",
      "Item Code",
      "Description",
      "Unit",
      "Quantity",
      "Remarks",
    ];
    const rows = (mrns as any[]).flatMap((m: any) =>
      (m.items ?? []).map((item: any, idx: number) => [
        idx + 1,
        item.itemCode || "-",
        item.itemDescription,
        item.unit,
        item.quantity,
        item.remark || "-",
      ]),
    );
    downloadPDF("Materials Request Notes", columns, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="border-blue-600 text-blue-700 hover:bg-blue-50"
          data-ocid="mrn.download_button"
        >
          <Download size={15} className="mr-1" /> Download PDF
        </Button>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-700 hover:bg-blue-800"
        >
          <Plus size={16} className="mr-1" /> New MRN
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (mrns as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No materials request notes yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {[
                    "MRN Code",
                    "Date",
                    "Month",
                    "Requested By",
                    "Approved By",
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
                {(mrns as any[]).map((m: any) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">
                      {m.code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{m.requestDate}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {MONTHS[Number.parseInt(m.month.toString()) - 1]}{" "}
                      {m.year.toString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{m.requestedBy}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {m.approvedBy || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          "pending" in m.status ? "secondary" : "default"
                        }
                      >
                        {"pending" in m.status ? "Pending" : "Approved"}
                      </Badge>
                    </td>
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
            <DialogTitle>Monthly Materials Request Note</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2">
                <Label>Request Date</Label>
                <Input
                  type="date"
                  value={form.requestDate}
                  onChange={(e) =>
                    setForm({ ...form, requestDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                />
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Requested By *</Label>
                <Input
                  value={form.requestedBy}
                  onChange={(e) =>
                    setForm({ ...form, requestedBy: e.target.value })
                  }
                  required
                />
              </div>
              <div className="col-span-2">
                <Label>Approved By</Label>
                <Input
                  value={form.approvedBy}
                  onChange={(e) =>
                    setForm({ ...form, approvedBy: e.target.value })
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
                    setForm({
                      ...form,
                      items: [...form.items, emptyItem(form.items.length + 1)],
                    })
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
                        "Sl No",
                        "Item Code",
                        "Item Description",
                        "Unit",
                        "Quantity",
                        "Remark",
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
                    {form.items.map((item, idx) => (
                      <tr
                        key={item._id ?? idx}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-1 text-gray-500 w-12">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.itemCode}
                            onChange={(e) =>
                              updateItem(idx, "itemCode", e.target.value)
                            }
                            className="h-8 w-28"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.itemDescription}
                            onChange={(e) =>
                              updateItem(idx, "itemDescription", e.target.value)
                            }
                            className="h-8"
                            placeholder="Description"
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
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, "quantity", e.target.value)
                            }
                            className="h-8 w-20"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.remark}
                            onChange={(e) =>
                              updateItem(idx, "remark", e.target.value)
                            }
                            className="h-8"
                          />
                        </td>
                        <td className="px-2 py-1">
                          {form.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  items: form.items.filter((_, i) => i !== idx),
                                })
                              }
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
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
                {mutation.isPending ? "Saving..." : "Submit MRN"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
