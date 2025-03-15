import {
  LayoutDashboard,
  Tag,
  UserRoundSearch,
  CreditCard,
} from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components
export const adminSideBarMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: <LayoutDashboard />,
  },
  {
    id: "userProfiles",
    label: "User Profiles",
    path: "/admin/customerInformation",
    icon: <UserRoundSearch />,
  },
  {
    id: "utilities",
    label: "Utilities",
    path: "/admin/utilities",
    icon: <Tag />,
  },
  {
    id: "transactions",
    label: "User Transactions",
    path: "/admin/transaction",
    icon: <CreditCard />,
  },
];

// eslint-disable-next-line react/prop-types
const MenuItems = ({ navigate, setOpen }) => {
  return (
    <nav className="mt-8 flex-col flex gap-2">
      {adminSideBarMenuItems.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            navigate(item.path);
            setOpen ? setOpen(false) : null;
          }}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default MenuItems;
