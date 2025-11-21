import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router";

export default function Layout() {
  return (
    <>
      <Header />
      <main className="pt-20 pb-20">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
