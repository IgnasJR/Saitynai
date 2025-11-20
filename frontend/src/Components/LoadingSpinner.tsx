export default function Spinner() {
  return (
    <svg
      className="w-10 h-10 animate-spin text-white-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}
