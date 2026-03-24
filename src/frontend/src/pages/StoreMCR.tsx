import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useActor } from "../hooks/useActor";
import { downloadPDF } from "../lib/pdfUtils";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];
const YEARS = ["2024", "2025", "2026", "2027"];

export default function StoreMCR() {
  const { actor } = useActor();
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [fetchEnabled, setFetchEnabled] = useState(false);

  const { data: mcr = [], isFetching } = useQuery({
    queryKey: ["mcr", month, year],
    queryFn: () =>
      actor!.getMCR(
        BigInt(Number.parseInt(month)),
        BigInt(Number.parseInt(year)),
      ),
    enabled: !!actor && fetchEnabled,
  });

  const monthLabel = MONTHS.find((m) => m.value === month)?.label;

  const activeItems = (mcr as any[]).filter(
    (m: any) => m.received > 0 || m.issued > 0 || m.openingStock > 0,
  );

  const handleDownloadPDF = () => {
    const columns = [
      "Item",
      "Unit",
      "Opening Stock",
      "Received",
      "Issued",
      "Closing Stock",
    ];
    const rows = activeItems.map((item: any) => [
      item.itemName,
      item.unit,
      item.openingStock?.toFixed(2) ?? "0.00",
      item.received?.toFixed(2) ?? "0.00",
      item.issued?.toFixed(2) ?? "0.00",
      item.closingStock?.toFixed(2) ?? "0.00",
    ]);
    downloadPDF(`Store MCR - ${monthLabel} ${year}`, columns, rows);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs text-gray-500">Month</Label>
          <Select
            value={month}
            onValueChange={(v) => {
              setMonth(v);
              setFetchEnabled(false);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-gray-500">Year</Label>
          <Select
            value={year}
            onValueChange={(v) => {
              setYear(v);
              setFetchEnabled(false);
            }}
          >
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
        <Button
          onClick={() => setFetchEnabled(true)}
          className="bg-blue-700 hover:bg-blue-800"
        >
          Generate MCR
        </Button>
        {fetchEnabled && activeItems.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="border-blue-600 text-blue-700 hover:bg-blue-50"
            data-ocid="store_mcr.download_button"
          >
            <Download size={15} className="mr-1" /> Download PDF
          </Button>
        )}
      </div>

      {fetchEnabled &&
        (isFetching ? (
          <div className="text-center py-12 text-gray-400">
            Generating report...
          </div>
        ) : activeItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <BarChart3 size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500">
              No data for {monthLabel} {year}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b bg-blue-50">
              <h3 className="font-semibold text-blue-800">
                Monthly Consumption Report - {monthLabel} {year}
              </h3>
              <p className="text-xs text-blue-600">
                EVERWINZ STRUCTURAL SYSTEMS PVT LTD
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {[
                      "Item Code",
                      "Item Name",
                      "Unit",
                      "Opening Stock",
                      "Received",
                      "Issued",
                      "Closing Stock",
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
                  {activeItems.map((item: any) => (
                    <tr
                      key={item.itemCode}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-blue-700">
                        {item.itemCode}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {item.openingStock?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-green-700 font-medium">
                        {item.received?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-red-600 font-medium">
                        {item.issued?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-800 font-semibold">
                        {item.closingStock?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
