import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminHome = lazy(() => import("./admin/AdminHome"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));
const AdminReports = lazy(() => import("./admin/AdminReports"));

const Fallback = () => (
  <div className="flex justify-center py-12">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="*" element={<AdminHome />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminDashboard;
