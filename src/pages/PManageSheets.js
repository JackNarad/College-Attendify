import { Navigation } from "../components/Navigation";
import { Header } from "../components/Header";
import { CManageSheets } from "../components/CManageSheets";

export default function PReports() {
  return (
    <div className="flex min-h-screen bg-gray-100">

        <Navigation />

      <main className="flex-1 p-4">

        <Header />
        <CManageSheets/>

      </main>
    </div>
  );
}