import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CouriersManager } from "@/components/dashboard/logistics/CouriersManager";
import { DeliveryZonesManager } from "@/components/dashboard/logistics/DeliveryZonesManager";
import { ShipmentsManager } from "@/components/dashboard/logistics/ShipmentsManager";
import { ReturnsManager } from "@/components/dashboard/logistics/ReturnsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardLogistics() {
  return (
    <DashboardLayout title="Logistics" subtitle="Shipments, couriers, delivery zones and returns">
      <Tabs defaultValue="shipments">
        <TabsList className="mb-6">
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="couriers">Couriers</TabsTrigger>
          <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
        </TabsList>
        <TabsContent value="shipments"><ShipmentsManager /></TabsContent>
        <TabsContent value="returns"><ReturnsManager /></TabsContent>
        <TabsContent value="couriers"><CouriersManager /></TabsContent>
        <TabsContent value="zones"><DeliveryZonesManager /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
