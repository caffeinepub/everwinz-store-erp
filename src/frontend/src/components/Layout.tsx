import {
  Archive,
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ShoppingCart,
  Truck,
  Users,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { useActor } from "../hooks/useActor";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useOfflineQueue } from "../hooks/useOfflineQueue";

const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  { id: "suppliers", label: "Suppliers", icon: Building2, adminOnly: false },
  {
    id: "purchase-orders",
    label: "Purchase Orders",
    icon: ShoppingCart,
    adminOnly: false,
  },
  {
    id: "mrn",
    label: "Materials Request",
    icon: ClipboardList,
    adminOnly: false,
  },
  { id: "grn", label: "Goods Received", icon: PackageCheck, adminOnly: false },
  {
    id: "delivery-challan",
    label: "Delivery Challan",
    icon: Truck,
    adminOnly: false,
  },
  { id: "mcr", label: "Store MCR", icon: BarChart3, adminOnly: false },
  {
    id: "closing-stock",
    label: "Closing Stock",
    icon: Archive,
    adminOnly: false,
  },
  {
    id: "user-management",
    label: "User Management",
    icon: Users,
    adminOnly: true,
  },
];

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function Layout({
  currentPage,
  onNavigate,
  children,
}: LayoutProps) {
  const { user, logout } = useAuth();
  const { actor } = useActor();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentNav = NAV.find((n) => n.id === currentPage);
  const { isOnline } = useNetworkStatus();
  const { pendingCount, syncNow, isSyncing } = useOfflineQueue();
  const [showSyncBanner, setShowSyncBanner] = useState(false);

  const syncNowRef = useRef(syncNow);
  const actorRef = useRef(actor);
  const pendingCountRef = useRef(pendingCount);
  syncNowRef.current = syncNow;
  actorRef.current = actor;
  pendingCountRef.current = pendingCount;

  useEffect(() => {
    if (isOnline && pendingCountRef.current > 0) {
      setShowSyncBanner(true);
      syncNowRef.current(actorRef.current).then(() => {
        setTimeout(() => setShowSyncBanner(false), 3000);
      });
    }
  }, [isOnline]);

  const showOfflineBanner = !isOnline;
  const showOnlineSyncBanner = isOnline && showSyncBanner;

  const visibleNav = NAV.filter((item) => {
    if (item.adminOnly) return user?.role === "admin";
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm shrink-0">
            <img
              src="/assets/img-20260317-wa0036-019d1c16-55a3-74fb-b354-f7471e141478.jpg"
              alt="EWZ"
              className="w-14 h-14 object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-blue-800 text-sm leading-tight">
              EVERWINZ
            </div>
            <div className="text-xs text-gray-500">
              Store &amp; Purchase ERP
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                type="button"
                key={item.id}
                data-ocid={`nav.${item.id}.link`}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-700 text-white"
                    : item.id === "user-management"
                      ? "text-purple-700 hover:bg-purple-50"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {user?.displayName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {user?.displayName}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role?.replace("_", " ")}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-1.5 rounded hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-800 text-lg flex-1">
            {currentNav?.label || "Dashboard"}
          </h1>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
            Store ERP
          </span>
        </header>

        {showOfflineBanner && (
          <div
            data-ocid="offline.banner"
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm"
          >
            <WifiOff size={15} className="shrink-0" />
            <span>
              You are offline. Data entered will be saved and synced when you
              reconnect.{" "}
              {pendingCount > 0 && (
                <strong>
                  ({pendingCount} entr{pendingCount === 1 ? "y" : "ies"} queued)
                </strong>
              )}
            </span>
          </div>
        )}

        {showOnlineSyncBanner && !showOfflineBanner && (
          <div
            data-ocid="sync.banner"
            className="flex items-center gap-2 px-4 py-2 bg-green-50 border-b border-green-200 text-green-800 text-sm"
          >
            <span>
              {isSyncing
                ? `Back online! Syncing ${pendingCount} queued entr${
                    pendingCount === 1 ? "y" : "ies"
                  }...`
                : "All queued entries synced successfully! \u2713"}
            </span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
