import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const AdminHome = lazy(() => import("./admin/AdminHome"));
const AdminUsers = lazy(() => import("./admin/AdminUsers"));
const AdminReports = lazy(() => import("./admin/AdminReports"));
const AdminCommunities = lazy(() => import("./admin/AdminCommunities"));
const AdminEvents = lazy(() => import("./admin/AdminEvents"));
const AdminMessages = lazy(() => import("./admin/AdminMessages"));
const AdminAnalytics = lazy(() => import("./admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./admin/AdminSettings"));

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
          <Route path="communities" element={<AdminCommunities />} />
          <Route path="events" element={<AdminEvents />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<AdminHome />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminDashboard;
