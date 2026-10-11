export interface Clinic {
  id: number;
  name: string;
  floor: string;
  description: string;
  phone: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
}

export interface Doctor {
  id: number;
  name: string;
  clinicId: number;
  specialtyId: number;
  specialty: string;
  experience: number;
  fee: number;
  days: string;
  startTime: string;
  endTime: string;
  bio: string;
  rating: number;
  reviewCount: number;
}

export interface Review {
  id: number;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface AdminReview {
  id: number;
  doctorName: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type AppointmentStatus = "booked" | "completed" | "cancelled";

export interface Appointment {
  id: number;
  patientName: string;
  phone: string;
  clinicId: number;
  doctorId: number;
  date: string;
  time: string; 
  status: AppointmentStatus;
  reason: string;
  diagnosis: string;
  prescription: string;
  doctorNotes: string; 
  rating: number; 
}

export interface NewAppointment {
  patientName: string;
  phone: string;
  clinicId: number;
  doctorId: number;
  date: string;
  time: string;
  reason: string;
}

export interface CompleteVisitInput {
  diagnosis: string;
  prescription: string;
  notes: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export type Role = "patient" | "doctor" | "admin";

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  doctorId: number | null; 
}

export interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "patient" | "doctor";
}

export interface DoctorProfileInput {
  name: string;
  clinicId: number;
  specialtyId: number;
  experience: number;
  fee: number;
  days: string; 
  startTime: string;
  endTime: string;
  bio: string;
}

export interface PatientProfile {
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  allergies: string;
  chronicConditions: string;
  emergencyContact: string;
}

export interface Stat {
  label: string;
  value: number;
}

export interface AdminUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuditEntry {
  id: number;
  userName: string;
  action: string;
  entity: string;
  entityId: number | null;
  ip: string;
  at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantStatus {
  ready: boolean;
  model: string;
}

export interface BookingProposal {
  doctorId: number;
  doctorName: string;
  clinicId: number;
  clinicName: string;
  date: string;
  time: string;
  reason: string;
  patientName: string;
  phone: string;
}

export interface AssistantReply {
  reply: string;
  booking?: BookingProposal | null;
}
