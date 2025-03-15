import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import { UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MenuItems from "./menuitems";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "react-toastify";

const defaultAvatar = "https://www.w3schools.com/w3images/avatar2.png";

const AdminSidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authentication token found");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmin(response.data);
      } catch (error) {
        toast.error("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const handleProfileClick = () => {
    navigate("/admin/profile", { state: { admin } });
  };

  return (
    <Fragment>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 bg-orange-200">
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b">
              <SheetTitle
                className="flex gap-2 mt-5 mb-5 items-center cursor-pointer"
                onClick={handleProfileClick}
              >
                {admin?.avatar ? (
                  <img
                    src={admin.avatar}
                    alt="Admin Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircle size={30} />
                )}
                <h1 className="text-xl font-extrabold">
                  {admin?.firstname || "Admin Panel"}
                </h1>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} navigate={navigate} />
          </div>
        </SheetContent>
      </Sheet>
      <aside className="hidden w-64 flex-col border-r bg-background p-6 lg:flex">
        <div
          onClick={handleProfileClick}
          className="flex cursor-pointer items-center gap-2"
        >
          {admin?.avatar ? (
            <img
              src={admin.avatar}
              alt="Admin Avatar"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <UserCircle size={30} />
          )}
          <h1 className="text-xl font-extrabold">
            {admin?.firstname || "Admin Panel"}
          </h1>
        </div>
        <MenuItems navigate={navigate} />
      </aside>
    </Fragment>
  );
};

export default AdminSidebar;
