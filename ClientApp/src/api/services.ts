import { get, post, put, del } from "./client";
import {
  AdminUser,
  Appointment,
  AssistantReply,
  AssistantStatus,
  AuditEntry,
  ChatMessage,
  Clinic,
  CompleteVisitInput,
  Doctor,
  DoctorProfileInput,
  NewAppointment,
  PatientProfile,
  RegisterData,
  Review,
  AdminReview,
  Specialty,
  Stat,
  TimeSlot,
  User
} from "../types";

export function fetchClinics() {
  return get<Clinic[]>("/clinics");
}

export function fetchSpecialties() {
  return get<Specialty[]>("/specialties");
}

export function fetchDoctors() {
  return get<Doctor[]>("/doctors");
}

export function fetchSlots(doctorId: number, date: string) {
  return get<TimeSlot[]>("/doctors/" + doctorId + "/slots?date=" + encodeURIComponent(date));
}

export function fetchReviews(doctorId: number) {
  return get<Review[]>("/doctors/" + doctorId + "/reviews");
}

export function fetchAppointments() {
  return get<Appointment[]>("/appointments");
}

export function createAppointment(data: NewAppointment) {
  return post<Appointment>("/appointments", data);
}

export function cancelAppointmentRequest(id: number) {
  return post<Appointment>("/appointments/" + id + "/cancel", {});
}

export function completeAppointmentRequest(id: number, data: CompleteVisitInput) {
  return post<Appointment>("/appointments/" + id + "/complete", data);
}

export function submitReview(appointmentId: number, data: { rating: number; comment: string }) {
  return post<Appointment>("/appointments/" + appointmentId + "/review", data);
}

export function fetchPatientProfileForVisit(appointmentId: number) {
  return get<PatientProfile>("/appointments/" + appointmentId + "/patient-profile");
}

export function fetchMe() {
  return get<User>("/auth/me");
}

export function login(email: string, password: string) {
  return post<User>("/auth/login", { email, password });
}

export function register(data: RegisterData) {
  return post<User>("/auth/register", data);
}

export function logout() {
  return post<void>("/auth/logout", {});
}

export function saveDoctorProfile(data: DoctorProfileInput) {
  return put<Doctor>("/doctor/profile", data);
}

export function fetchMyPatientProfile() {
  return get<PatientProfile>("/patient/profile");
}

export function saveMyPatientProfile(data: PatientProfile) {
  return put<PatientProfile>("/patient/profile", data);
}

export function fetchDashboard() {
  return get<Stat[]>("/dashboard");
}

export function adminAddClinic(data: { name: string; floor: string; description: string; phone: string }) {
  return post<Clinic>("/admin/clinics", data);
}

export function adminDeleteClinic(id: number) {
  return del("/admin/clinics/" + id);
}

export function adminAddSpecialty(data: { name: string; description: string }) {
  return post<Specialty>("/admin/specialties", data);
}

export function adminDeleteSpecialty(id: number) {
  return del("/admin/specialties/" + id);
}

export function adminFetchReviews() {
  return get<AdminReview[]>("/admin/reviews");
}

export function adminDeleteReview(id: number) {
  return del("/admin/reviews/" + id);
}

export function adminFetchUsers() {
  return get<AdminUser[]>("/admin/users");
}

export function adminFetchAudit() {
  return get<AuditEntry[]>("/admin/audit");
}

export function fetchAssistantStatus() {
  return get<AssistantStatus>("/assistant/status");
}

export function sendAssistantChat(messages: ChatMessage[]) {
  return post<AssistantReply>("/assistant/chat", { messages });
}
