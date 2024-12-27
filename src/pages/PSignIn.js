import { CSignIn } from "../components/CSignIn";

export default function PDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">

      <main className="flex-1 p-4">

        <CSignIn/>

      </main>
    </div>
  );
}