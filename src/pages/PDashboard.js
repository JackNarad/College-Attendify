import { Navigation } from "../components/Navigation";
import { Header } from "../components/Header";
import { CDashboard } from "../components/CDashboard";

export default function PDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">

        <Navigation />

      <main className="flex-1 p-4">

        <Header />
        <CDashboard/>

      </main>
    </div>
  );
}