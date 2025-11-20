import { clearStorage, getStorageItem } from "../Utils/localStorage";

function Header() {
  return (
    <header className="bg-gray-800 text-white top-0 fixed p-4 w-full flex items-center justify-between">
      <p
        className="font-bold text-3xl cursor-pointer"
        onClick={() => {
          window.location.href = "/";
        }}
      >
        TuneRecommend
      </p>

      <div className="flex space-x-4">
        {getStorageItem("role") === "admin" && (
          <p
            className="cursor-pointer"
            onClick={() => {
              window.location.href = "/admin";
            }}
          >
            Admin Panel
          </p>
        )}
        <p
          className="cursor-pointer"
          onClick={
            getStorageItem("accessToken")
              ? () => {
                  clearStorage();
                  window.location.href = "/login";
                }
              : () => {
                  window.location.href = "/login";
                }
          }
        >
          {getStorageItem("accessToken") ? "Logout" : "Login"}
        </p>
      </div>
    </header>
  );
}

export default Header;
