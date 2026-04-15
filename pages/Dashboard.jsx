import { useEffect, useState } from "react";
import DealCard from "../components/DealCard.jsx";
import DealForm from "../components/DealForm.jsx";
import DealList from "../components/DealList.jsx";

const STORAGE_KEY = "deal-engine.deals";

function readSavedDeals() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const [history, setHistory] = useState(() => readSavedDeals());
  const [result, setResult] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const handleResult = (deal) => {
    setResult(deal);
    setHistory((current) => [deal, ...current].slice(0, 12));
  };

  const clearHistory = () => {
    setHistory([]);
    setResult(null);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Underwriting Workspace</p>
        <h1>Deal Engine</h1>
        <p className="intro">
          Inspect acquisition, creative finance, wholesale, rental, short-term,
          flip, and exchange deals from one underwriting room.
        </p>
      </section>

      <div className="workspace">
        <DealForm onResult={handleResult} />

        <section className="results-stack">
          {result ? (
            <DealCard deal={result} />
          ) : (
            <div className="panel empty-state">
              <h2>No deal scored yet</h2>
              <p>Add the deal structure, rent roll, leases, expenses, and diligence package to generate an inspection.</p>
            </div>
          )}

          <DealList deals={history} onClear={clearHistory} />
        </section>
      </div>
    </main>
  );
}
