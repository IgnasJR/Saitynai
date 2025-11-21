import { useState } from "react";
import { clearStorage, getStorageItem } from "../Utils/localStorage";

function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const role = getStorageItem("role");
  const isLoggedIn = !!getStorageItem("accessToken");

  const handleLogout = () => {
    clearStorage();
    window.location.href = "/login";
  };

  return (
    <header className="bg-gray-800 text-white top-0 fixed p-4 w-full flex items-center justify-between z-50">
      <p
        className="font-bold text-3xl cursor-pointer"
        onClick={() => (window.location.href = "/")}
      >
        TuneRecommend
      </p>
      <div className="hidden md:flex space-x-4 items-center">
        {role === "admin" && (
          <p
            className="cursor-pointer hover:text-gray-300"
            onClick={() => (window.location.href = "/admin")}
          >
            Admin Panel
          </p>
        )}

        <p
          className="cursor-pointer hover:text-gray-300"
          onClick={
            isLoggedIn ? handleLogout : () => (window.location.href = "/login")
          }
        >
          {isLoggedIn ? "Logout" : "Login"}
        </p>
      </div>
      <div className="md:hidden flex items-center">
        <button onClick={toggleMenu} className="focus:outline-none">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>
      <div
        className={`md:hidden absolute top-full left-0 w-full bg-gray-800 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col p-4 space-y-2">
          {role === "admin" && (
            <p
              className="cursor-pointer hover:bg-gray-700 rounded px-2 py-2 text-center"
              onClick={() => {
                window.location.href = "/admin";
                setIsOpen(false);
              }}
            >
              Admin Panel
            </p>
          )}

          <p
            className="cursor-pointer hover:bg-gray-700 rounded px-2 py-2 text-center"
            onClick={() => {
              if (isLoggedIn) {
                handleLogout();
              } else {
                window.location.href = "/login";
              }
              setIsOpen(false);
            }}
          >
            {isLoggedIn ? "Logout" : "Login"}
          </p>
        </div>
      </div>
    </header>
  );
}

export default Header;
