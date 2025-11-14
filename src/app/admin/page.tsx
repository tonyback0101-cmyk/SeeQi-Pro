import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import AdminDashboard from "@/components/admin/AdminDashboard";

function isAdmin(email?: string | null) {
  if (!email) return false;
  const allowList = (process.env.ADMIN_EMAILS || "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!allowList.length) return false;
  return allowList.includes(email.toLowerCase());
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    redirect("/");
  }

  return <AdminDashboard adminEmail={session.user.email ?? ""} />;
}






