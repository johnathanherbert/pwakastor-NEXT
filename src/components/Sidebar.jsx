import React from "react";
import Link from "next/link";
import { 
  Bars3Icon,
  HomeIcon,
  ScaleIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from "@heroicons/react/24/outline";

const Sidebar = ({ open, toggleDrawer }) => {
  const menuItems = [
    { text: "Início", icon: <HomeIcon className="h-5 w-5" />, path: "/" },
    { text: "Pesagem", icon: <ScaleIcon className="h-5 w-5" />, path: "#" },
    { text: "Rejunka Dashboard", icon: <ChartBarIcon className="h-5 w-5" />, path: "#" },
    { text: "Configurações", icon: <Cog6ToothIcon className="h-5 w-5" />, path: "#" },
  ];

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={toggleDrawer(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-xl z-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 h-14 flex items-center">
          <button
            onClick={toggleDrawer(false)}
            className="p-2 hover:bg-blue-700 rounded-lg"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <span className="ml-2 font-bold">Menu</span>
        </div>

        {/* Divider */}
        <div className="border-b border-gray-200 dark:border-gray-700" />

        {/* Menu Items */}
        <nav className="p-2">
          {menuItems.map((item) => (
            <Link 
              href={item.path} 
              key={item.text}
              className="flex items-center gap-3 px-3 py-2 
                text-gray-700 dark:text-slate-200 
                rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/50 
                transition-colors"
            >
              <span className="text-blue-600 dark:text-blue-400">
                {item.icon}
              </span>
              <span className="font-medium">{item.text}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
