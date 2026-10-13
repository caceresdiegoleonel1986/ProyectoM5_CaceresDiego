import { AdminProvider } from "../contexts/admin/AdminProvider";
import AdminLayout from "../components/admin/AdminLayout";
import AdminDashboard from "./AdminDashboard";

export default function AdminRoute() {
  return (
    <AdminProvider>
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </AdminProvider>
  );
}