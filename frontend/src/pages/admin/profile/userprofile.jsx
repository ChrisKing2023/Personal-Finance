import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CurrencySelector from "@/components/user_components/CurrencySelector";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

const UserProfiles = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({});
  const navigate = useNavigate(); // Initialize useNavigate hook

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(res.data);
    } catch (error) {
      toast.error("Error fetching users");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Error deleting user");
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData(user);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCurrencyChange = (e) => {
    setFormData({ ...formData, currency: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `http://localhost:5000/api/users/${editUser._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("User updated successfully");
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Error updating user");
    }
  };

  // Function to handle navigation to the User Report page
  const handleUserReportClick = () => {
    navigate("/admin/customer-summary-report"); // Navigate to the report page
  };

  return (
    <Card>
      <ToastContainer />
      <CardContent>
        <h2 className="text-xl font-bold mb-4 text-center">User Profiles</h2>

        {/* Add the button to navigate to the User Report page */}
        <div className="mb-4 text-center">
          <Button onClick={handleUserReportClick} className="mx-auto">
            User Report
          </Button>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Details</Th>
              <Th>Currency</Th>
              <Th>Role</Th>
              <Th>Country</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr key={user._id}>
                <Td className="text-white">
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full mb-2"
                  />
                  {user.username} ({user.email})<br />
                  {user.firstname} {user.lastname}
                </Td>
                <Td className="text-white">{user.currency}</Td>
                <Td className="text-white">{user.role}</Td>
                <Td className="text-white">{user.country}</Td>
                <Td>
                  <Button
                    onClick={() => handleEdit(user)}
                    className="mr-2"
                    variant="green"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(user._id)}
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardContent>

      {editUser && (
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent>
            <DialogTitle>Edit User</DialogTitle>
            <Label>Avatar</Label>
            <img
              src={formData.avatar}
              alt="Avatar"
              className="w-20 h-20 rounded-full mb-2"
            />
            <Input
              name="avatar"
              value={formData.avatar || ""}
              onChange={handleChange}
            />

            <Label>Username</Label>
            <Input
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
            />

            <Label>Email</Label>
            <Input name="email" value={formData.email || ""} readOnly />

            <Label>First Name</Label>
            <Input
              name="firstname"
              value={formData.firstname || ""}
              onChange={handleChange}
            />

            <Label>Last Name</Label>
            <Input
              name="lastname"
              value={formData.lastname || ""}
              onChange={handleChange}
            />

            <Label>Currency</Label>
            <CurrencySelector
              value={formData.currency}
              onChange={handleCurrencyChange}
            />

            <Label>Role</Label>
            <Input
              name="role"
              value={formData.role || ""}
              onChange={handleChange}
            />

            <Label>Contact</Label>
            <Input
              name="contact"
              value={formData.contact || ""}
              onChange={handleChange}
            />

            <Label>Address</Label>
            <Input
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
            />

            <Label>City</Label>
            <Input
              name="city"
              value={formData.city || ""}
              onChange={handleChange}
            />

            <Label>Postal Code</Label>
            <Input
              name="postalCode"
              value={formData.postalCode || ""}
              onChange={handleChange}
            />

            <Label>Country</Label>
            <Input
              name="country"
              value={formData.country || ""}
              onChange={handleChange}
            />

            <Button onClick={handleUpdate} className="mt-4">
              Update
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default UserProfiles;
