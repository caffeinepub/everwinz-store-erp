import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth";
import Layout from "./components/Layout";
import ClosingStock from "./pages/ClosingStock";
import Dashboard from "./pages/Dashboard";
import DeliveryChallan from "./pages/DeliveryChallan";
import GRN from "./pages/GRN";
import LoginPage from "./pages/LoginPage";
import MRN from "./pages/MRN";
import PurchaseOrders from "./pages/PurchaseOrders";
import StoreMCR from "./pages/StoreMCR";
import Suppliers from "./pages/Suppliers";

function AppRoutes() {
  const { user } = useAuth();
  const [page, setPage] = useState("dashboard");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () =>
        navigator.serviceWorker.register("/sw.js"),
      );
    }
  }, []);

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard onNavigate={setPage} />;
      case "suppliers":
        return <Suppliers />;
      case "purchase-orders":
        return <PurchaseOrders />;
      case "mrn":
        return <MRN />;
      case "grn":
        return <GRN />;
      case "delivery-challan":
        return <DeliveryChallan />;
      case "mcr":
        return <StoreMCR />;
      case "closing-stock":
        return <ClosingStock />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
