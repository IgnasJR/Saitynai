import { useState } from "react";
import Spinner from "../Components/LoadingSpinner";
import { setStorageItem } from "../Utils/localStorage";
import Header from "../Components/Header";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router";

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLoginClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setStorageItem("accessToken", data.accessToken);
        setStorageItem("role", data.role);
        navigate("/", { state: { toast: "Login successful!" } });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed", {
        theme: "dark",
        position: "bottom-right",
      });
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <Header />
      {isLoading && <Spinner />}

      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold text-white">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleLoginClick} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Username
              </label>
              <div className="mt-2">
                <input
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100">
                Password
              </label>
              <div className="mt-2">
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
