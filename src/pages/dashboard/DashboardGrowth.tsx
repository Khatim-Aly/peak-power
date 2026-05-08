import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferralsManager } from "@/components/dashboard/growth/ReferralsManager";
import { BroadcastsManager } from "@/components/dashboard/growth/BroadcastsManager";
import { AnalyticsWidgets } from "@/components/dashboard/growth/AnalyticsWidgets";
import { MerchantReferral } from "@/components/dashboard/growth/MerchantReferral";

const DashboardGrowth = () => {
  const { role, isLoading } = useAuth();
  if (isLoading) return null;
  if (role !== "admin" && role !== "merchant") return <Navigate to="/dashboard" replace />;

  if (role === "merchant") {
    return (
      <DashboardLayout title="Growth" subtitle="Refer customers and grow your store">
        <MerchantReferral />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Growth" subtitle="Referrals, broadcasts, and platform analytics">
      <div className="space-y-6">
        <AnalyticsWidgets />
        <Tabs defaultValue="referrals">
          <TabsList className="mb-4">
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="broadcasts">Broadcasts</TabsTrigger>
          </TabsList>
          <TabsContent value="referrals"><ReferralsManager /></TabsContent>
          <TabsContent value="broadcasts"><BroadcastsManager /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardGrowth;
