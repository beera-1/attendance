// pages/index.js
import { useEffect, useState, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

// --- FULL SUBJECT LIST (28 subjects from your screenshots) ---
const SUBJECTS = [
  { id: "path_theory", name: "PATHOLOGY/THEORY" },
  { id: "path_practical", name: "PATHOLOGY/PRACTICAL" },
  { id: "micro_theory", name: "MICROBIOLOGY/THEORY" },
  { id: "micro_practical", name: "MICROBIOLOGY/PRACTICAL" },
  { id: "pharm_theory", name: "PHARMACOLOGY/THEORY" },
  { id: "pharm_practical", name: "PHARMACOLOGY/PRACTICAL" },
  { id: "comm_theory", name: "COMMUNITY MEDICINE/THEORY" },
  { id: "comm_clinicalposting", name: "COMMUNITY MEDICINE/CLINICALPOSTING" },
  { id: "comm_prac_a", name: "COMMUNITY MEDICINE/PRACTICAL-A" },
  { id: "comm_prac_b", name: "COMMUNITY MEDICINE/PRACTICAL-B" },
  { id: "comm_fap", name: "COMMUNITY MEDICINE/FAP" },
  { id: "gen_surg", name: "GENERAL SURGERY/CLINIC" },
  { id: "gen_med_theory", name: "GENERAL MEDICINE/THEORY" },
  { id: "gen_med_clinic", name: "GENERAL MEDICINE/CLINIC" },
  { id: "forens_theory", name: "FORENSIC MEDICINE/THEORY" },
  { id: "forens_prac", name: "FORENSIC MEDICINE/PRACTICAL" },
  { id: "forens_prac_b", name: "FORENSIC MEDICINE/PRACTICAL-B" },
  { id: "derm_theory", name: "DERMATOLOGY/THEORY" },
  { id: "psych_theory", name: "PSYCHIATRY/THEORY" },
  { id: "obg_clinic", name: "OBG/CLINIC" },
  { id: "ent_theory", name: "ENT Theory" },
  { id: "ent_clinic", name: "ENT/CLINIC" },
  { id: "pulmo_theory", name: "PULMONARY MEDICINE/THEORY" },
  { id: "pedi_clin", name: "PAEDIATRIC/CLINICAL" },
  { id: "dent_clinic", name: "DENTAL/CLINIC" },
  { id: "skill_lab", name: "Skill Lab" },
  { id: "anaesthesia_clinical", name: "ANAESTHESIA/CLINIKAL" },
  { id: "radio_theory", name: "RADIOLOGY/THEORY" },
];

function monthToString(ym) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1).toLocaleString(undefined, { month: "long", year: "numeric" });
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function Home() {
  const today = new Date();
  const initialMonth = today.toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(initialMonth);
  const [passwordOk, setPasswordOk] = useState(false);
  const [theme, setTheme] = useState("light");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // fetch monthly records (for calendar) and all records (for cumulative totals)
  const { data: monthRecords, mutate: mutateMonth } = useSWR(
    `/api/attendance?month=${month}`,
    fetcher
  );
  const { data: allRecords, mutate: mutateAll } = useSWR("/api/attendance", fetcher);

  // theme persistence
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  // utility: calculate cumulative stats for subject from allRecords
  function calcCumulative(subjectId) {
    if (!allRecords) return { total: 0, present: 0, absent: 0, percent: 0 };
    const list = allRecords.filter((r) => r.subjectId === subjectId);
    const total = list.length;
    const present = list.filter((r) => r.status === "present").length;
    const absent = list.filter((r) => r.status === "absent").length;
    return {
      total,
      present,
      absent,
      percent: total ? Math.round((present / total) * 100) : 0,
    };
  }

  function unlock() {
    const pass = prompt("Enter admin password:");
    if (pass === process.env.NEXT_PUBLIC_ADMIN_PASS) setPasswordOk(true);
    else alert("Wrong password");
  }

  // month navigation
  function changeMonth(offset) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + offset, 1);
    setMonth(d.toISOString().slice(0, 7));
  }

  // open calendar for subject (month-specific)
  function openCalendar(s) {
    setSelectedSubject(s);
    setCalendarOpen(true);
  }

  // quick mark: mark today's attendance for a subject
  async function markToday(subject, status) {
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
    // refresh both datasets
    globalMutate(`/api/attendance?month=${month}`);
    globalMutate("/api/attendance");
  }

  // mark arbitrary date (calendar)
  async function markDate(subject, date, status) {
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
    globalMutate(`/api/attendance?month=${month}`);
    globalMutate("/api/attendance");
  }

  // calendar generation
  const calendarData = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const year = y;
    const monthIndex = m - 1;
    const totalDays = daysInMonth(year, monthIndex);
    const arr = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      arr.push({ day: d, dateStr });
    }
    return arr;
  }, [month]);

  function getStatusFor(subjectId, dateStr) {
    if (!monthRecords) return null;
    const rec = monthRecords.find((r) => r.subjectId === subjectId && r.date === dateStr);
    return rec ? rec.status : null;
  }

  // handy: when modal opens ensure monthRecords loaded (SWR will do it)
  if (!passwordOk)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <h1 className="text-2xl font-bold mb-3">🔒 College Attendance</h1>
        <button onClick={unlock} className="px-4 py-2 bg-blue-600 text-white rounded">
          Unlock
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">College Attendance</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Tap a subject to open month calendar — mark Present / Absent / Abandoned</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow">
            <button onClick={() => changeMonth(-1)} className="px-2">◀</button>
            <div className="px-2 font-medium">{monthToString(month)}</div>
            <button onClick={() => changeMonth(1)} className="px-2">▶</button>
          </div>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-1 rounded border bg-white dark:bg-gray-800"
          />

          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="px-3 py-1 bg-white dark:bg-gray-800 rounded shadow"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </header>

      {/* Dashboard grid */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SUBJECTS.map((s) => {
          const st = calcCumulative(s.id);
          // color logic for percent box
          const percentColor =
            st.percent >= 75 ? "bg-green-600" : st.percent >= 60 ? "bg-yellow-500" : "bg-red-600";

          return (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="font-semibold mb-1">{s.name}</h2>
                  <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mt-2 pt-3" />
                  <div className="flex items-center gap-6 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">Attendance</div>
                      <div className="text-xl font-medium mt-1">{st.total}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Present</div>
                      <div className="text-xl font-medium mt-1 flex items-center gap-2">
                        {st.present}
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-sm">P</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Absent</div>
                      <div className="text-xl font-medium mt-1 flex items-center gap-2">
                        {st.absent}
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">A</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`w-20 h-20 rounded-lg flex items-center justify-center text-white text-xl font-bold ${percentColor}`}>
                    {st.percent}%
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => openCalendar(s)} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Open Calendar</button>
                    <div className="flex gap-1">
                      <button onClick={() => markToday(s, "present")} className="px-2 py-1 bg-green-500 text-white rounded text-sm">✅</button>
                      <button onClick={() => markToday(s, "absent")} className="px-2 py-1 bg-red-500 text-white rounded text-sm">❌</button>
                      <button onClick={() => markToday(s, "abandoned")} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">⚠️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* Calendar Modal */}
      {calendarOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCalendarOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-5xl p-4 z-50">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-semibold">{selectedSubject.name} — {monthToString(month)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Click a date to set status</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCalendarOpen(false)} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Close</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-sm">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(wd => (
                <div key={wd} className="text-center font-medium text-xs text-gray-500 dark:text-gray-400">{wd}</div>
              ))}

              {(() => {
                const [y, m] = month.split("-").map(Number);
                const firstDay = new Date(y, m - 1, 1).getDay();
                return Array.from({ length: firstDay }).map((_, i) => <div key={"b"+i} />);
              })()}

              {calendarData.map(({ day, dateStr }) => {
                const status = getStatusFor(selectedSubject.id, dateStr);
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                return (
                  <div key={dateStr} className={`p-2 rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer ${isToday ? "ring-2 ring-indigo-300" : ""}`} onClick={() => {
                    const choice = prompt(`Mark ${dateStr} as (present / absent / abandoned). Leave empty to cancel.`);
                    if (!choice) return;
                    const c = choice.trim().toLowerCase();
                    if (!["present","absent","abandoned"].includes(c)) { alert("Invalid choice"); return; }
                    markDate(selectedSubject, dateStr, c);
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium">{day}</div>
                      <div className="text-xs">
                        {status === "present" && <span className="text-green-600">P</span>}
                        {status === "absent" && <span className="text-red-600">A</span>}
                        {status === "abandoned" && <span className="text-yellow-600">X</span>}
                        {!status && <span className="text-gray-400">-</span>}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {status === "present" ? "Present" : status === "absent" ? "Absent" : status === "abandoned" ? "Abandoned" : "No record"}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => {
                if (!confirm("Mark all days without records as 'absent' for this subject?")) return;
                (async () => {
                  for (const { dateStr } of calendarData) {
                    const status = getStatusFor(selectedSubject.id, dateStr);
                    if (!status) {
                      await markDate(selectedSubject, dateStr, "absent");
                    }
                  }
                  alert("Done.");
                })();
              }} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Fill empties as Absent</button>

              <button onClick={() => {
                const csvRows = [["date","status"]];
                for (const { dateStr } of calendarData) {
                  const s = getStatusFor(selectedSubject.id, dateStr) || "";
                  csvRows.push([dateStr, s]);
                }
                const csv = csvRows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${selectedSubject.id}_${month}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Export CSV</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
