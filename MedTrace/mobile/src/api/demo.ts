// Rich sample data for portfolio / demo mode (set DEMO_MODE = true in config.ts).
// All types match the real API response shapes exactly.

import { DoseStatusEntry } from './doses';
import { Medication } from './medications';
import { CheckIn } from './checkins';
import { CareLink } from './careLinks';

// ─── Patient demo data ────────────────────────────────────────────────────────

export const DEMO_MEDICATIONS: Medication[] = [
  {
    id: 1,
    name: 'Metformin',
    dosage: '1000mg',
    frequency: 'Twice daily',
    scheduledTimes: ['08:00', '20:00'],
    description: 'Controls blood sugar levels in type 2 diabetes.',
  },
  {
    id: 2,
    name: 'Lisinopril',
    dosage: '10mg',
    frequency: 'Once daily',
    scheduledTimes: ['09:00'],
    description: 'ACE inhibitor — lowers blood pressure and protects the heart.',
  },
  {
    id: 3,
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily',
    scheduledTimes: ['21:00'],
    description: 'Statin that lowers LDL cholesterol.',
  },
  {
    id: 4,
    name: 'Ibuprofen',
    dosage: '400mg',
    frequency: 'As needed',
    description: 'Pain reliever and anti-inflammatory — take as needed.',
  },
];

export const DEMO_DOSES: DoseStatusEntry[] = [
  {
    scheduleId: 1,
    medicationId: 1,
    medicationName: 'Metformin',
    dosage: '1000mg',
    scheduledTime: '08:00:00',
    status: 'TAKEN',
  },
  {
    scheduleId: 3,
    medicationId: 2,
    medicationName: 'Lisinopril',
    dosage: '10mg',
    scheduledTime: '09:00:00',
    status: 'TAKEN',
  },
  {
    scheduleId: 2,
    medicationId: 1,
    medicationName: 'Metformin',
    dosage: '1000mg',
    scheduledTime: '20:00:00',
    status: 'UPCOMING',
  },
  {
    scheduleId: 4,
    medicationId: 3,
    medicationName: 'Atorvastatin',
    dosage: '20mg',
    scheduledTime: '21:00:00',
    status: 'UPCOMING',
  },
];

export const DEMO_CHECKINS: CheckIn[] = [
  {
    id: 5,
    checkInDate: '2026-06-24',
    mood: 7,
    energy: 6,
    painLevel: 2,
    sleepHours: 7.5,
    medicationsTaken: true,
    journalEntry: 'Feeling pretty good today — had a short walk after lunch.',
    createdAt: '2026-06-24T09:12:00.000000',
    enteredById: null,
    enteredByName: null,
  },
  {
    id: 4,
    checkInDate: '2026-06-23',
    mood: 5,
    energy: 4,
    painLevel: 4,
    sleepHours: 6.0,
    medicationsTaken: true,
    journalEntry: 'Tired after an early appointment. Back pain in the afternoon.',
    createdAt: '2026-06-23T10:05:00.000000',
    enteredById: null,
    enteredByName: null,
  },
  {
    id: 3,
    checkInDate: '2026-06-22',
    mood: 8,
    energy: 7,
    painLevel: 1,
    sleepHours: 8.0,
    medicationsTaken: true,
    journalEntry: null,
    createdAt: '2026-06-22T08:30:00.000000',
    enteredById: null,
    enteredByName: null,
  },
  {
    id: 2,
    checkInDate: '2026-06-21',
    mood: 4,
    energy: 3,
    painLevel: 5,
    sleepHours: 5.5,
    medicationsTaken: false,
    journalEntry: 'Rough night — couldn\'t sleep. Skipped evening meds by mistake.',
    createdAt: '2026-06-21T11:20:00.000000',
    enteredById: null,
    enteredByName: null,
  },
  {
    id: 1,
    checkInDate: '2026-06-20',
    mood: 6,
    energy: 6,
    painLevel: 2,
    sleepHours: 7.0,
    medicationsTaken: true,
    journalEntry: null,
    createdAt: '2026-06-20T09:00:00.000000',
    enteredById: null,
    enteredByName: null,
  },
];

// ─── Caregiver demo data ──────────────────────────────────────────────────────

export const DEMO_CARE_LINKS: CareLink[] = [
  {
    id: 1,
    patientId: 1,
    patientName: 'Amina Habaik',
    caregiverId: 2,
    caregiverName: 'Sara Habaik',
    permission: 'VIEW_AND_INPUT',
    status: 'ACTIVE',
    createdAt: '2026-06-01T10:00:00.000000',
    updatedAt: '2026-06-01T10:00:00.000000',
  },
];

export const DEMO_PATIENT_CHECKINS: CheckIn[] = [
  {
    id: 5,
    checkInDate: '2026-06-24',
    mood: 7,
    energy: 6,
    painLevel: 2,
    sleepHours: 7.5,
    medicationsTaken: true,
    journalEntry: 'Feeling pretty good today.',
    createdAt: '2026-06-24T09:12:00.000000',
    enteredById: null,
    enteredByName: null,
  },
  {
    id: 4,
    checkInDate: '2026-06-23',
    mood: 5,
    energy: 4,
    painLevel: 4,
    sleepHours: 6.0,
    medicationsTaken: true,
    journalEntry: null,
    createdAt: '2026-06-23T10:05:00.000000',
    enteredById: 2,
    enteredByName: 'Sara Habaik',
  },
  {
    id: 3,
    checkInDate: '2026-06-22',
    mood: 4,
    energy: 3,
    painLevel: 5,
    sleepHours: 5.5,
    medicationsTaken: false,
    journalEntry: 'Patient reported a difficult night.',
    createdAt: '2026-06-22T11:00:00.000000',
    enteredById: 2,
    enteredByName: 'Sara Habaik',
  },
];
