import { useState, useEffect } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import CurrencySelector from "@/components/user_components/CurrencySelector";

const defaultAvatar = "https://www.w3schools.com/w3images/avatar2.png";

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
        setFormData(response.data);
      } catch (error) {
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("No authentication token found");
      setUpdating(false);
      return;
    }

    const updatedData = {};
    Object.keys(formData).forEach((key) => {
      updatedData[key] = formData[key] || "";
    });

    try {
      await axios.patch(
        `http://localhost:5000/api/users/${user._id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Profile updated successfully");
      setUser({ ...user, ...updatedData });
      setIsEditing(false);
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading...</p>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-lg p-8 shadow-lg rounded-lg bg-white">
        <CardContent>
          <div className="flex flex-col items-center mb-4">
            <img
              src={user.avatar || defaultAvatar}
              alt="User Avatar"
              className="w-24 h-24 rounded-full border border-gray-300 shadow-md"
            />
            <h2 className="text-2xl font-bold mt-3">{user.username}</h2>
            <Button onClick={() => setIsEditing(true)} className="mt-2">
              Edit Profile
            </Button>
          </div>
          <div className="space-y-2 text-center">
            <p>
              <strong>Name:</strong> {user.firstname} {user.lastname}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Contact:</strong> {user.contact || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {user.address || "N/A"}
            </p>
            <p>
              <strong>City:</strong> {user.city || "N/A"}
            </p>
            <p>
              <strong>Postal Code:</strong> {user.postalCode || "N/A"}
            </p>
            <p>
              <strong>Country:</strong> {user.country || "N/A"}
            </p>
            <p>
              <strong>Preferred Currency:</strong> {user.currency}
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                name="username"
                value={formData.username || ""}
                onChange={handleChange}
                placeholder="User Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <Input
                name="firstname"
                value={formData.firstname || ""}
                onChange={handleChange}
                placeholder="First Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <Input
                name="lastname"
                value={formData.lastname || ""}
                onChange={handleChange}
                placeholder="Last Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Avatar URL
              </label>
              <Input
                name="avatar"
                value={formData.avatar || ""}
                onChange={handleChange}
                placeholder="Avatar URL"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                name="email"
                value={formData.email || ""}
                disabled
                className="bg-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Contact
              </label>
              <Input
                name="contact"
                value={formData.contact || ""}
                onChange={handleChange}
                placeholder="Contact"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <Input
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <Input
                name="city"
                value={formData.city || ""}
                onChange={handleChange}
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code
              </label>
              <Input
                name="postalCode"
                value={formData.postalCode || ""}
                onChange={handleChange}
                placeholder="Postal Code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <Input
                name="country"
                value={formData.country || ""}
                onChange={handleChange}
                placeholder="Country"
              />
            </div>

            {/* Currency Field - Full Width */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Preferred Currency
              </label>
              <CurrencySelector
                value={formData.currency}
                onChange={handleChange}
              />
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <Input
                  type="password"
                  name="prevPassword"
                  onChange={handleChange}
                  placeholder="Current Password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <Input
                  type="password"
                  name="newPassword"
                  onChange={handleChange}
                  placeholder="New Password"
                />
              </div>
            </div>

            <div className="col-span-2 flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? "Updating..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProfile;
