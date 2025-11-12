// seed.js
import mongoose from "mongoose";
import Attendance from "./models/Attendance.js";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const seedData = [
  { id: "path_theory", name: "PATHOLOGY/THEORY", total: 72, present: 64, absent: 8 },
  { id: "path_practical", name: "PATHOLOGY/PRACTICAL", total: 25, present: 23, absent: 2 },
  { id: "micro_theory", name: "MICROBIOLOGY/THEORY", total: 60, present: 57, absent: 3 },
  { id: "micro_practical", name: "MICROBIOLOGY/PRACTICAL", total: 16, present: 16, absent: 0 },
  { id: "pharm_theory", name: "PHARMACOLOGY/THEORY", total: 52, present: 47, absent: 5 },
  { id: "pharm_practical", name: "PHARMACOLOGY/PRACTICAL", total: 18, present: 16, absent: 2 },
  { id: "comm_theory", name: "COMMUNITY MEDICINE/THEORY", total: 12, present: 7, absent: 5 },
  { id: "comm_clinicalposting", name: "COMMUNITY MEDICINE/CLINICALPOSTING", total: 15, present: 15, absent: 0 },
  { id: "comm_prac_a", name: "COMMUNITY MEDICINE/PRACTICAL-A", total: 3, present: 2, absent: 1 },
  { id: "comm_prac_b", name: "COMMUNITY MEDICINE/PRACTICAL-B", total: 3, present: 2, absent: 1 },
  { id: "comm_fap", name: "COMMUNITY MEDICINE/FAP", total: 2, present: 2, absent: 0 },
  { id: "gen_surg", name: "GENERAL SURGERY/CLINIC", total: 13, present: 9, absent: 4 },
  { id: "gen_med_theory", name: "GENERAL MEDICINE/THEORY", total: 4, present: 4, absent: 0 },
  { id: "gen_med_clinic", name: "GENERAL MEDICINE/CLINIC", total: 2, present: 1, absent: 1 },
  { id: "forens_theory", name: "FORENSIC MEDICINE/THEORY", total: 6, present: 6, absent: 0 },
  { id: "forens_prac", name: "FORENSIC MEDICINE/PRACTICAL", total: 2, present: 0, absent: 2 },
  { id: "forens_prac_b", name: "FORENSIC MEDICINE/PRACTICAL-B", total: 4, present: 4, absent: 0 },
  { id: "derm_theory", name: "DERMATOLOGY/THEORY", total: 34, present: 34, absent: 0 },
  { id: "psych_theory", name: "PSYCHIATRY/THEORY", total: 19, present: 14, absent: 5 },
  { id: "obg_clinic", name: "OBG/CLINIC", total: 8, present: 6, absent: 2 },
  { id: "ent_theory", name: "ENT Theory", total: 7, present: 7, absent: 0 },
  { id: "ent_clinic", name: "ENT/CLINIC", total: 15, present: 10, absent: 5 },
  { id: "pulmo_theory", name: "PULMONARY MEDICINE/THEORY", total: 5, present: 2, absent: 3 },
  { id: "pedi_clin", name: "PAEDIATRIC/CLINICAL", total: 14, present: 11, absent: 3 },
  { id: "dent_clinic", name: "DENTAL/CLINIC", total: 3, present: 2, absent: 1 },
  { id: "skill_lab", name: "Skill Lab", total: 3, present: 0, absent: 3 },
  { id: "anaesthesia_clinical", name: "ANAESTHESIA/CLINIKAL", total: 1, present: 1, absent: 0 },
  { id: "radio_theory", name: "RADIOLOGY/THEORY", total: 5, present: 5, absent: 0 },
];

async function seed() {
  await mongoose.connect(MONGODB_URI, { dbName: "college_attendance" });
  console.log("✅ Connected to MongoDB");

  await Attendance.deleteMany({});
  console.log("🧹 Cleared old attendance");

  const today = new Date();

  for (const subj of seedData) {
    for (let i = 0; i < subj.present; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      await Attendance.create({
        subjectId: subj.id,
        subjectName: subj.name,
        date: d.toISOString().slice(0, 10),
        status: "present",
      });
    }
    for (let i = 0; i < subj.absent; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - subj.present - i);
      await Attendance.create({
        subjectId: subj.id,
        subjectName: subj.name,
        date: d.toISOString().slice(0, 10),
        status: "absent",
      });
    }
    console.log(`✅ Seeded ${subj.name}: ${subj.present}P ${subj.absent}A`);
  }

  await mongoose.disconnect();
  console.log("🌱 Seeding complete!");
}

seed().catch((err) => {
  console.error("❌ Seed error", err);
  mongoose.disconnect();
});
