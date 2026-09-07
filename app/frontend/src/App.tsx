import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import OrganizationsPage from "./pages/OrganizationsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import UsersPage from "./pages/UsersPage";
import ItemsPage from "./pages/ItemsPage";
import ItemEditor from "./components/ItemEditor";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/items/new" element={<ItemEditor />} />
        <Route path="/items/:id/edit" element={<ItemEditor />} />
      </Route>
      <Route path="*" element={<Navigate to="/organizations" replace />} />
    </Routes>
  );
}
