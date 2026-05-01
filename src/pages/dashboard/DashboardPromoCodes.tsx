import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import AdminPromoCodesOverview from "@/components/dashboard/AdminPromoCodesOverview";
import { PromoCodeManager } from "@/components/dashboard/PromoCodeManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const DashboardPromoCodes = () => {
  const { role, isLoading } = useAuth();

  if (isLoading) return null;
  if (role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout
      title="Manage Promo Codes"
      subtitle="Pending approvals and active codes by store"
    >
      <div className="space-y-8">
        <AdminPromoCodesOverview />
        <PromoCodeManager isAdmin={true} />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPromoCodes;
