import { Navigation } from "../components/Navigation";
import { Header } from "../components/Header";
import { CAttendance } from "../components/CAttendance";

export default function PReports() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      <Navigation />

      <main className="flex-1 p-4">

        <Header />
        <CAttendance />

      </main>
    </div>
  );
}