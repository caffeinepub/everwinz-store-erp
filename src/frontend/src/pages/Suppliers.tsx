import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Download, Plus, Search } from "lucide-react";
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
import { Textarea } from "../components/ui/textarea";
import { useActor } from "../hooks/useActor";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";
import { downloadPDF } from "../lib/pdfUtils";

export default function Suppliers() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { isOnline } = useNetworkStatus();
  const { enqueue } = useOfflineQueue();
  const [form, setForm] = useState({
    name: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNo: "",
    itemsSupplied: "",
    estimatedDeliveryDays: "7",
    paymentTerms: "advance",
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => actor!.getAllSuppliers(),
    enabled: !!actor,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("No actor");
      const pt =
        form.paymentTerms === "advance"
          ? { advance: null }
          : { credit30: null };
      return actor.createSupplier(
        form.name,
        form.address,
        form.contactPerson,
        form.phone,
        form.email,
        form.gstNo,
        form.itemsSupplied
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        BigInt(Number.parseInt(form.estimatedDeliveryDays) || 7),
        pt,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      resetForm();
    },
  });

  const resetForm = () =>
    setForm({
      name: "",
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
      gstNo: "",
      itemsSupplied: "",
      estimatedDeliveryDays: "7",
      paymentTerms: "advance",
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      const pt =
        form.paymentTerms === "advance"
          ? { advance: null }
          : { credit30: null };
      enqueue("supplier", [
        form.name,
        form.address,
        form.contactPerson,
        form.phone,
        form.email,
        form.gstNo,
        form.itemsSupplied
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        BigInt(Number.parseInt(form.estimatedDeliveryDays) || 7),
        pt,
      ]);
      toast.info("Saved offline. Will sync when connected.");
      setOpen(false);
      resetForm();
    } else {
      mutation.mutate();
    }
  };

  const filtered = (suppliers as any[]).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDownloadPDF = () => {
    const columns = [
      "Supplier Code",
      "Name",
      "Contact",
      "Email",
      "GST",
      "Payment Terms",
    ];
    const rows = filtered.map((s: any) => [
      s.code,
      s.name,
      s.contactPerson,
      s.email || "-",
      s.gstNo || "-",
      "advance" in s.paymentTerms ? "Advance" : "30 Days Credit",
    ]);
    downloadPDF("Supplier Register", columns, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          className="border-blue-600 text-blue-700 hover:bg-blue-50"
          data-ocid="suppliers.download_button"
        >
          <Download size={15} className="mr-1" /> Download PDF
        </Button>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-700 hover:bg-blue-800"
        >
          <Plus size={16} className="mr-1" /> New Supplier
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Building2 size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500">No suppliers found</p>
          <Button
            onClick={() => setOpen(true)}
            className="mt-3 bg-blue-700 hover:bg-blue-800"
          >
            Add First Supplier
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {[
                    "Code",
                    "Name",
                    "Contact",
                    "Phone",
                    "GST No",
                    "Delivery (days)",
                    "Payment Terms",
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
                {filtered.map((s: any) => (
                  <tr
                    key={s.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium whitespace-nowrap">
                      {s.code}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.contactPerson}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.phone}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.gstNo || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.estimatedDeliveryDays?.toString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          "advance" in s.paymentTerms ? "default" : "secondary"
                        }
                      >
                        {"advance" in s.paymentTerms
                          ? "Advance"
                          : "30 Days Credit"}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Supplier Registration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Name of Supplier *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label>Contact Person *</Label>
                <Input
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>GST No</Label>
                <Input
                  value={form.gstNo}
                  onChange={(e) => setForm({ ...form, gstNo: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Items Supplied (comma-separated)</Label>
                <Input
                  value={form.itemsSupplied}
                  onChange={(e) =>
                    setForm({ ...form, itemsSupplied: e.target.value })
                  }
                  placeholder="e.g. Steel, Cement, Sand"
                />
              </div>
              <div>
                <Label>Estimated Delivery Time (days)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.estimatedDeliveryDays}
                  onChange={(e) =>
                    setForm({ ...form, estimatedDeliveryDays: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Payment Terms</Label>
                <Select
                  value={form.paymentTerms}
                  onValueChange={(v) => setForm({ ...form, paymentTerms: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advance">Advance Payment</SelectItem>
                    <SelectItem value="credit30">30 Days Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
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
                {mutation.isPending ? "Saving..." : "Register Supplier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
