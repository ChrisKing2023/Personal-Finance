import {
  LayoutDashboard,
  CreditCard,
  HandCoins,
  CircleDollarSign,
  Calculator,
  Target,
} from "lucide-react";

// eslint-disable-next-line react-refresh/only-export-components
export const userSideBarMenuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/user/home",
    icon: <LayoutDashboard />,
  },
  {
    id: "viewtransaction",
    label: "ViewTransaction",
    path: "/user/view-transaction",
    icon: <CreditCard />,
  },
  {
    id: "incomes",
    label: "Incomes",
    path: "/user/incomes",
    icon: <HandCoins />,
  },
  {
    id: "expenses",
    label: "Expenses",
    path: "/user/expenses",
    icon: <CircleDollarSign />,
  },
  {
    id: "budgets",
    label: "Budgets",
    path: "/user/budgets",
    icon: <Calculator />,
  },
  {
    id: "goals",
    label: "Goals",
    path: "/user/goals",
    icon: <Target />,
  },
];

// eslint-disable-next-line react/prop-types
const MenuItems = ({ navigate, setOpen }) => {
  return (
    <nav className="mt-8 flex-col flex gap-2">
      {userSideBarMenuItems.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            navigate(item.path);
            setOpen ? setOpen(false) : null;
          }}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground hover:bg-orange-200"
        >
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
    </nav>
  );
};

export default MenuItems;
