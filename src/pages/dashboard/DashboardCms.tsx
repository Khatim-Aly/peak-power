import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CmsBannersManager } from "@/components/dashboard/cms/CmsBannersManager";
import { CmsCategoriesManager } from "@/components/dashboard/cms/CmsCategoriesManager";
import { CmsPagesManager } from "@/components/dashboard/cms/CmsPagesManager";
import { CmsFaqsManager } from "@/components/dashboard/cms/CmsFaqsManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardCms() {
  return (
    <DashboardLayout title="Content Management" subtitle="Banners, categories, static pages and FAQs">
      <Tabs defaultValue="banners">
        <TabsList className="mb-6">
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
        </TabsList>
        <TabsContent value="banners"><CmsBannersManager /></TabsContent>
        <TabsContent value="categories"><CmsCategoriesManager /></TabsContent>
        <TabsContent value="pages"><CmsPagesManager /></TabsContent>
        <TabsContent value="faqs"><CmsFaqsManager /></TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
