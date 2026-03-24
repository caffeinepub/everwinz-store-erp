import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Download,
  Plus,
} from "lucide-react";
import { useState } from "react";
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
import { downloadPDF } from "../lib/pdfUtils";

export default function ClosingStock() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "",
    category: "",
    minimumStock: "0",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["items"],
    queryFn: () => actor!.getClosingStock(),
    enabled: !!actor,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.createItem(
        form.name,
        form.unit,
        form.category,
        Number.parseFloat(form.minimumStock) || 0,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setForm({ name: "", unit: "", category: "", minimumStock: "0" });
    },
  });

  const totalItems = (items as any[]).length;
  const lowStock = (items as any[]).filter(
    (i) => i.currentStock < i.minimumStock,
  ).length;

  const handleDownloadPDF = () => {
    const columns = ["Item Code", "Description", "Unit", "Quantity", "Status"];
    const rows = (items as any[]).map((item: any) => [
      item.code,
      item.name,
      item.unit,
      item.currentStock?.toFixed(2) ?? "0.00",
      item.currentStock < item.minimumStock ? "Low Stock" : "OK",
    ]);
    downloadPDF("Closing Stock Report", columns, rows);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
          <div className="text-sm text-gray-500">Total Items</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-red-600">{lowStock}</div>
          <div className="text-sm text-gray-500">Low Stock Items</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-green-600">
            {totalItems - lowStock}
          </div>
          <div className="text-sm text-gray-500">Adequate Stock</div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="border-blue-600 text-blue-700 hover:bg-blue-50"
          data-ocid="closing_stock.download_button"
        >
          <Download size={15} className="mr-1" /> Download PDF
        </Button>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-700 hover:bg-blue-800"
        >
          <Plus size={16} className="mr-1" /> Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (items as any[]).length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Archive size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No items in inventory</p>
          <Button
            onClick={() => setOpen(true)}
            className="mt-3 bg-blue-700 hover:bg-blue-800"
          >
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {[
                    "Item Code",
                    "Item Name",
                    "Category",
                    "Unit",
                    "Current Stock",
                    "Min Stock",
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
                {(items as any[]).map((item: any) => {
                  const low = item.currentStock < item.minimumStock;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-blue-700">
                        {item.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                      <td
                        className={`px-4 py-3 font-semibold ${
                          low ? "text-red-600" : "text-gray-800"
                        }`}
                      >
                        {item.currentStock?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item.minimumStock?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {low ? (
                          <span className="flex items-center gap-1 text-red-600 text-xs">
                            <AlertTriangle size={14} /> Low Stock
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle size={14} /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stock Item</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
            className="space-y-4 mt-2"
          >
            <div>
              <Label>Item Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="pcs, kg, m"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Minimum Stock Level</Label>
              <Input
                type="number"
                value={form.minimumStock}
                onChange={(e) =>
                  setForm({ ...form, minimumStock: e.target.value })
                }
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
                {mutation.isPending ? "Saving..." : "Add Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
