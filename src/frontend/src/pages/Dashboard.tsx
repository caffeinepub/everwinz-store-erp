import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useActor } from "../hooks/useActor";

interface Props {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { actor } = useActor();

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
  const { data: grns = [] } = useQuery({
    queryKey: ["grns"],
    queryFn: () => actor!.getAllGRNs(),
    enabled: !!actor,
  });
  const { data: dcs = [] } = useQuery({
    queryKey: ["dcs"],
    queryFn: () => actor!.getAllDCs(),
    enabled: !!actor,
  });

  const pendingPOs = (pos as any[]).filter((p) => "draft" in p.status).length;

  const cards = [
    {
      label: "Total Suppliers",
      value: (suppliers as any[]).length,
      icon: Building2,
      color: "bg-blue-500",
      page: "suppliers",
    },
    {
      label: "Purchase Orders",
      value: (pos as any[]).length,
      icon: ShoppingCart,
      color: "bg-indigo-500",
      page: "purchase-orders",
    },
    {
      label: "Draft POs",
      value: pendingPOs,
      icon: ClipboardList,
      color: "bg-yellow-500",
      page: "purchase-orders",
    },
    {
      label: "GRNs Created",
      value: (grns as any[]).length,
      icon: PackageCheck,
      color: "bg-green-500",
      page: "grn",
    },
    {
      label: "Delivery Challans",
      value: (dcs as any[]).length,
      icon: Truck,
      color: "bg-purple-500",
      page: "delivery-challan",
    },
  ];

  const shortcuts = [
    {
      id: "suppliers",
      label: "Supplier Register",
      icon: Building2,
      desc: "View & register suppliers",
    },
    {
      id: "purchase-orders",
      label: "Purchase Orders",
      icon: ShoppingCart,
      desc: "Create & track POs",
    },
    {
      id: "mrn",
      label: "Materials Request",
      icon: ClipboardList,
      desc: "Monthly material requests",
    },
    {
      id: "grn",
      label: "Goods Received",
      icon: PackageCheck,
      desc: "Record material receipts",
    },
    {
      id: "delivery-challan",
      label: "Delivery Challan",
      icon: Truck,
      desc: "Issue delivery challans",
    },
    {
      id: "mcr",
      label: "Store MCR",
      icon: BarChart3,
      desc: "Monthly consumption report",
    },
    {
      id: "closing-stock",
      label: "Closing Stock",
      icon: Archive,
      desc: "Current stock levels",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Store & Purchase Overview
        </h2>
        <p className="text-gray-500 text-sm">
          Everwinz Structural Systems Pvt Ltd
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              type="button"
              key={card.label}
              onClick={() => onNavigate(card.page)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
            >
              <div
                className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}
              >
                <Icon size={20} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {card.value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shortcuts.map((s) => {
            const Icon = s.icon;
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => onNavigate(s.id)}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 text-sm">
                    {s.label}
                  </div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
