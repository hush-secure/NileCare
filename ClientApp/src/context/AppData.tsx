import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { Appointment, Clinic, CompleteVisitInput, Doctor, NewAppointment, Specialty } from "../types";
import { useAuth } from "./Auth";
import {
  cancelAppointmentRequest,
  completeAppointmentRequest,
  createAppointment,
  fetchAppointments,
  fetchClinics,
  fetchDoctors,
  fetchSpecialties,
  submitReview
} from "../api/services";

interface AppData {
  clinics: Clinic[];
  specialties: Specialty[];
  doctors: Doctor[];
  appointments: Appointment[];
  loading: boolean;
  error: string;
  reload: () => void;
  refreshCatalog: () => Promise<void>;
  addAppointment: (data: NewAppointment) => Promise<Appointment>;
  cancelAppointment: (id: number) => Promise<void>;
  completeAppointment: (id: number, data: CompleteVisitInput) => Promise<void>;
  rateAppointment: (id: number, rating: number, comment: string) => Promise<void>;
  getClinicName: (id: number) => string;
  getDoctorName: (id: number) => string;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider(props: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user ? user.id : 0;

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clinicList, specialtyList, doctorList, appointmentList] = await Promise.all([
        fetchClinics(),
        fetchSpecialties(),
        fetchDoctors(),
        userId !== 0 ? fetchAppointments() : Promise.resolve([] as Appointment[])
      ]);
      setClinics(clinicList);
      setSpecialties(specialtyList);
      setDoctors(doctorList);
      setAppointments(appointmentList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function refreshCatalog() {
    const [clinicList, specialtyList, doctorList] = await Promise.all([
      fetchClinics(),
      fetchSpecialties(),
      fetchDoctors()
    ]);
    setClinics(clinicList);
    setSpecialties(specialtyList);
    setDoctors(doctorList);
  }

  function replaceAppointment(updated: Appointment) {
    setAppointments((list) => list.map((a) => (a.id === updated.id ? updated : a)));
  }

  async function addAppointment(data: NewAppointment) {
    const created = await createAppointment(data);
    setAppointments((list) => [...list, created]);
    return created;
  }

  async function cancelAppointment(id: number) {
    replaceAppointment(await cancelAppointmentRequest(id));
  }

  async function completeAppointment(id: number, data: CompleteVisitInput) {
    replaceAppointment(await completeAppointmentRequest(id, data));
  }

  async function rateAppointment(id: number, rating: number, comment: string) {
    replaceAppointment(await submitReview(id, { rating, comment }));
    await refreshCatalog();
  }

  function getClinicName(id: number) {
    const clinic = clinics.find((c) => c.id === id);
    return clinic ? clinic.name : "";
  }

  function getDoctorName(id: number) {
    const doctor = doctors.find((d) => d.id === id);
    return doctor ? doctor.name : "";
  }

  const value: AppData = {
    clinics,
    specialties,
    doctors,
    appointments,
    loading,
    error,
    reload: load,
    refreshCatalog,
    addAppointment,
    cancelAppointment,
    completeAppointment,
    rateAppointment,
    getClinicName,
    getDoctorName
  };

  return <AppDataContext.Provider value={value}>{props.children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
