import { useEffect, useState } from "react";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

const SUBJECTS = [
  { id: "path_theory", name: "PATHOLOGY/THEORY" },
  { id: "comm_clinic", name: "COMMUNITY MEDICINE/CLINICAL PRACTICE" },
  { id: "pharm_theory", name: "PHARMACOLOGY/THEORY" },
  { id: "pharm_prac", name: "PHARMACOLOGY/PRACTICAL" },
  { id: "micro_theory", name: "MICROBIOLOGY/THEORY" },
  { id: "path_prac", name: "PATHOLOGY/PRACTICAL" },
  { id: "micro_prac", name: "MICROBIOLOGY/PRACTICAL" },
  { id: "pedi_clin", name: "PAEDIATRIC/CLINICAL" },
  { id: "dent_clinic", name: "DENTAL/CLINIC" },
  { id: "obg_clinic", name: "OBG/CLINIC" },
  { id: "gen_surg", name: "GENERAL SURGERY/CLINIC" },
  { id: "comm_theory", name: "COMMUNITY MEDICINE/THEORY" },
  { id: "gen_med", name: "GENERAL MEDICINE/CLINIC" },
  { id: "forens_prac", name: "FORENSIC MEDICINE/PRACTICAL" },
];

export default function Home() {
  const today = new Date();
  const [month, setMonth] = useState(today.toISOString().slice(0, 7));
  const [passwordOk, setPasswordOk] = useState(false);
  const [theme, setTheme] = useState("light");
  const { data: records, mutate } = useSWR(`/api/attendance?month=${month}`, fetcher);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function mark(subject, status) {
    const date = new Date().toISOString().slice(0, 10);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId: subject.id,
        subjectName: subject.name,
        date,
        status,
      }),
    });
    mutate();
  }

  function calc(subjectId) {
    if (!records) return { total: 0, present: 0, percent: 0 };
    const list = records.filter((r) => r.subjectId === subjectId);
    const total = list.length;
    const present = list.filter((r) => r.status === "present").length;
    return {
      total,
      present,
      percent: total ? Math.round((present / total) * 100) : 0,
    };
  }

  function unlock() {
    const pass = prompt("Enter admin password:");
    if (pass === process.env.NEXT_PUBLIC_ADMIN_PASS) setPasswordOk(true);
    else alert("Wrong password");
  }

  if (!passwordOk)
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-3">🔒 College Attendance</h1>
        <button onClick={unlock} className="px-4 py-2 bg-blue-600 text-white rounded">
          Unlock
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">College Attendance</h1>
        <button
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="px-3 py-1 bg-white dark:bg-gray-800 rounded shadow"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUBJECTS.map((s) => {
          const stats = calc(s.id);
          return (
            <div key={s.id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
              <h2 className="font-semibold mb-1">{s.name}</h2>
              <p className="text-sm mb-3">
                {stats.present}/{stats.total} — {stats.percent}%
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => mark(s, "present")}
                  className="flex-1 bg-green-500 text-white rounded py-1"
                >
                  ✅ Present
                </button>
                <button
                  onClick={() => mark(s, "absent")}
                  className="flex-1 bg-red-500 text-white rounded py-1"
                >
                  ❌ Absent
                </button>
                <button
                  onClick={() => mark(s, "abandoned")}
                  className="flex-1 bg-yellow-500 text-white rounded py-1"
                >
                  ⚠️ Abandoned
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
