import { useState } from "react";
import Spinner from "../Components/LoadingSpinner";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router";

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegisterClick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: password }),
      });

      const data = await response.json();

      if (response.status === 201) {
        toast.success("Registration successful!", {
          theme: "dark",
          position: "bottom-right",
        });
        setTimeout(() => {
          navigate("/login");
        }, 4000);
      } else {
        throw new Error(data.error?.toString() || "An unknown error occurred");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed", {
        theme: "dark",
        position: "bottom-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Spinner />}

      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold text-white">
            Sign up for an account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleRegisterClick} className="space-y-6">
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
              Sign up
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default Login;
