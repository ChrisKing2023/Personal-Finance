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

const defaultAvatar = "https://www.w3schools.com/w3images/avatar2.png"; // Default avatar placeholder

const UserSidebar = ({ open, setOpen }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
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
        setUser(response.data);
      } catch (error) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    console.log("User Firstname:", user?.firstname);
    console.log("User Avatar:", user?.avatar);
  }, [user]); // Logs when user changes

  return (
    <Fragment>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col h-full">
            <SheetHeader className="border-b">
              <SheetTitle className="flex gap-2 mt-5 mb-5 items-center">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircle size={30} />
                )}
                <h1 className="text-xl font-extrabold">
                  {user?.firstname || "User Panel"}
                </h1>
              </SheetTitle>
            </SheetHeader>
            <MenuItems setOpen={setOpen} navigate={navigate} />
          </div>
        </SheetContent>
      </Sheet>
      <aside className="hidden w-64 flex-col border-r bg-background p-6 lg:flex">
        <div
          onClick={() => navigate("/user/profile")}
          className="flex cursor-pointer items-center gap-2"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <UserCircle size={30} />
          )}
          <h1 className="text-xl font-extrabold">
            {user?.firstname || "User Panel"}
          </h1>
        </div>
        <MenuItems navigate={navigate} />
      </aside>
    </Fragment>
  );
};

export default UserSidebar;
