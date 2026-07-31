import React from "react";
import { NavLink } from "react-router";

const Navbar = () => {
  return (
    <nav className="w-full flex justify-between items-center bg-black text-white px-8 py-4 shadow-lg">
      <h1 className="text-2xl font-bold tracking-wide">Logo</h1>

      <div className="flex items-center gap-2">
        {[
          { path: "/", label: "Home" },
          { path: "/about", label: "About" },
          { path: "/product", label: "Product" },
          { path: "/users", label: "Users" },
        ].map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                isActive
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-300 hover:bg-slate-700 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;