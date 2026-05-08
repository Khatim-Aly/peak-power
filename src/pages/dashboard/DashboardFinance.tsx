import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommissionSettingsManager } from "@/components/dashboard/finance/CommissionSettingsManager";
import { PayoutsManager } from "@/components/dashboard/finance/PayoutsManager";
import { CommissionsLedger } from "@/components/dashboard/finance/CommissionsLedger";
import { MerchantPayouts } from "@/components/dashboard/finance/MerchantPayouts";

const DashboardFinance = () => {
  const { role, isLoading } = useAuth();
  if (isLoading) return null;
  if (role !== "admin" && role !== "merchant") return <Navigate to="/dashboard" replace />;

  if (role === "merchant") {
    return (
      <DashboardLayout title="Earnings & Payouts" subtitle="Track your sales, commission, and payout history">
        <MerchantPayouts />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Finance" subtitle="Commissions, payouts, and revenue management">
      <Tabs defaultValue="payouts">
        <TabsList className="mb-4">
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="commissions">Commissions Ledger</TabsTrigger>
          <TabsTrigger value="settings">Commission Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="payouts"><PayoutsManager /></TabsContent>
        <TabsContent value="commissions"><CommissionsLedger /></TabsContent>
        <TabsContent value="settings"><CommissionSettingsManager /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DashboardFinance;
