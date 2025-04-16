
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SearchRestaurants from "./pages/SearchRestaurants";
import RestaurantDetails from "./pages/RestaurantDetails";
import TableSelection from "./pages/TableSelection";
import MenuSelection from "./pages/MenuSelection";
import PaymentOptions from "./pages/PaymentOptions";
import CheckIn from "./pages/CheckIn";
import OrderSummary from "./pages/OrderSummary";
import CompletedOrder from "./pages/CompletedOrder";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PartnerRegistration from "./pages/PartnerRegistration";
import PaymentSetup from "./pages/PaymentSetup";
import EstablishmentLogin from "./pages/EstablishmentLogin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<SearchRestaurants />} />
          <Route path="/payment-setup" element={<PaymentSetup />} />
          <Route path="/restaurant/:id" element={<RestaurantDetails />} />
          <Route path="/table-selection/:restaurantId" element={<TableSelection />} />
          <Route path="/menu-selection/:restaurantId/:tableId" element={<MenuSelection />} />
          <Route path="/payment/:orderId" element={<PaymentOptions />} />
          <Route path="/check-in/:orderId" element={<CheckIn />} />
          <Route path="/order-summary/:orderId" element={<OrderSummary />} />
          <Route path="/completed-order/:orderId" element={<CompletedOrder />} />
          <Route path="/partner-registration" element={<PartnerRegistration />} />
          <Route path="/establishment-login" element={<EstablishmentLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
