import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Trash2, Truck } from "lucide-react";
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
import { useActor } from "../hooks/useActor";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { downloadPDF } from "../lib/pdfUtils";

export default function DeliveryChallan() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { enqueue } = useOfflineQueue();

  const emptyItem = () => ({
    _id: Math.random().toString(36).slice(2),
    itemCode: "",
    itemName: "",
    unit: "",
    quantity: "",
    remarks: "",
  });
  const [form, setForm] = useState({
    dcDate: new Date().toISOString().split("T")[0],
    deliverTo: "",
    projectName: "",
    preparedBy: "",
    authorizedBy: "",
    items: [emptyItem()],
  });

  const { data: dcs = [], isLoading } = useQuery({
    queryKey: ["dcs"],
    queryFn: () => actor!.getAllDCs(),
    enabled: !!actor,
  });

  const buildDcPayload = () => {
    const now = new Date(form.dcDate);
    const items = form.items
      .filter((i) => i.itemName)
      .map((i) => ({
        itemCode: i.itemCode,
        itemName: i.itemName,
        unit: i.unit,
        quantity: Number.parseFloat(i.quantity) || 0,
        remarks: i.remarks,
      }));
    return [
      form.dcDate,
      form.deliverTo,
      form.projectName,
      items,
      form.preparedBy,
      form.authorizedBy,
      BigInt(now.getMonth() + 1),
      BigInt(now.getFullYear()),
    ];
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const payload = buildDcPayload();
      return actor.createDC(...(payload as Parameters<typeof actor.createDC>));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dcs"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      enqueue("dc", buildDcPayload());
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
      "Challan No",
      "Date",
      "Project",
      "Item",
      "Quantity",
      "Unit",
    ];
    const rows = (dcs as any[]).flatMap((dc: any) =>
      (dc.items ?? [{ itemName: "-", quantity: 0, unit: "-" }]).map(
        (item: any) => [
          dc.code,
          dc.dcDate,
          dc.projectName || "-",
          item.itemName || "-",
          item.quantity ?? 0,
          item.unit || "-",
        ],
      ),
    );
    downloadPDF("Delivery Challans", columns, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="border-blue-600 text-blue-700 hover:bg-blue-50"
          data-ocid="delivery_challan.download_button"
        >
          <Download size={15} className="mr-1" /> Download PDF
        </Button>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-700 hover:bg-blue-800"
        >
          <Plus size={16} className="mr-1" /> Create Delivery Challan
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (dcs as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Truck size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No delivery challans yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {[
                    "DC Code",
                    "Date",
                    "Deliver To",
                    "Project",
                    "Items",
                    "Prepared By",
                    "Authorized By",
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
                {(dcs as any[]).map((dc: any) => (
                  <tr
                    key={dc.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">
                      {dc.code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{dc.dcDate}</td>
                    <td className="px-4 py-3 text-gray-800">{dc.deliverTo}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {dc.projectName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {dc.items?.length} items
                    </td>
                    <td className="px-4 py-3 text-gray-600">{dc.preparedBy}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {dc.authorizedBy}
                    </td>
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
            <DialogTitle>Create Delivery Challan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label>DC Date</Label>
                <Input
                  type="date"
                  value={form.dcDate}
                  onChange={(e) => setForm({ ...form, dcDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Deliver To *</Label>
                <Input
                  value={form.deliverTo}
                  onChange={(e) =>
                    setForm({ ...form, deliverTo: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Project Name</Label>
                <Input
                  value={form.projectName}
                  onChange={(e) =>
                    setForm({ ...form, projectName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Prepared By *</Label>
                <Input
                  value={form.preparedBy}
                  onChange={(e) =>
                    setForm({ ...form, preparedBy: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Authorized By</Label>
                <Input
                  value={form.authorizedBy}
                  onChange={(e) =>
                    setForm({ ...form, authorizedBy: e.target.value })
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
                        "Item Code",
                        "Item Name",
                        "Unit",
                        "Quantity",
                        "Remarks",
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
                            className="h-8 w-24"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <Input
                            value={item.remarks}
                            onChange={(e) =>
                              updateItem(idx, "remarks", e.target.value)
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
                {mutation.isPending ? "Saving..." : "Create Delivery Challan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
