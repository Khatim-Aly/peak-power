import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Product from "./pages/Product";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import WhatsAppButton from "./components/WhatsAppButton";
import AiChatbot from "./components/ai/AiChatbot";
import ExitIntentModal from "./components/ExitIntentModal";
import SocialProofPopup from "./components/SocialProofPopup";
import PromoNotification from "./components/PromoNotification";

// Dashboard sub-pages
import {
  DashboardUsers,
  DashboardMerchants,
  DashboardOrders,
  DashboardAnalytics,
  DashboardSettings,
  DashboardFavorites,
  DashboardProfile,
  DashboardProducts,
  DashboardRequests,
} from "./pages/dashboard";
import DashboardPromoCodes from "./pages/dashboard/DashboardPromoCodes";
import DashboardCms from "./pages/dashboard/DashboardCms";
import DashboardLogistics from "./pages/dashboard/DashboardLogistics";
import DashboardFinance from "./pages/dashboard/DashboardFinance";
import DashboardGrowth from "./pages/dashboard/DashboardGrowth";
import CmsPage from "./pages/CmsPage";
import MerchantProfile from "./pages/MerchantProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/product" element={<Product />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/products" element={<Products />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/users" element={<DashboardUsers />} />
            <Route path="/dashboard/merchants" element={<DashboardMerchants />} />
            <Route path="/dashboard/orders" element={<DashboardOrders />} />
            <Route path="/dashboard/analytics" element={<DashboardAnalytics />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/dashboard/favorites" element={<DashboardFavorites />} />
            <Route path="/dashboard/profile" element={<DashboardProfile />} />
            <Route path="/dashboard/products" element={<DashboardProducts />} />
            <Route path="/dashboard/requests" element={<DashboardRequests />} />
            <Route path="/dashboard/promo-codes" element={<DashboardPromoCodes />} />
            <Route path="/dashboard/cms" element={<DashboardCms />} />
            <Route path="/dashboard/logistics" element={<DashboardLogistics />} />
            <Route path="/dashboard/finance" element={<DashboardFinance />} />
            <Route path="/dashboard/growth" element={<DashboardGrowth />} />
            <Route path="/merchant/:id" element={<MerchantProfile />} />
            <Route path="/page/:slug" element={<CmsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <WhatsAppButton />
          <AiChatbot />
          <ExitIntentModal />
          <SocialProofPopup />
          <PromoNotification />
        </BrowserRouter>
      </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
