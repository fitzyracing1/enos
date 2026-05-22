import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import AreaDetails from "@/pages/AreaDetails";
import MyContributions from "@/pages/MyContributions";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/Home"
            element={
              <Layout>
                <Home />
              </Layout>
            }
          />
          <Route
            path="/AreaDetails"
            element={
              <Layout>
                <AreaDetails />
              </Layout>
            }
          />
          <Route
            path="/MyContributions"
            element={
              <Layout>
                <MyContributions />
              </Layout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
