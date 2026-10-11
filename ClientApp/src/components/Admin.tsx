import { FormEvent, useEffect, useState } from "react";
import {
  adminAddClinic,
  adminAddSpecialty,
  adminDeleteClinic,
  adminDeleteSpecialty,
  adminDeleteReview,
  adminFetchAudit,
  adminFetchReviews,
  adminFetchUsers
} from "../api/services";
import { useAppData } from "../context/AppData";
import { AdminReview, AdminUser, AuditEntry } from "../types";
import { Stars } from "./Stars";

type Tab = "clinics" | "specialties" | "reviews" | "users" | "audit";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function Admin() {
  const { clinics, specialties, refreshCatalog } = useAppData();
  const [tab, setTab] = useState<Tab>("clinics");
  const [error, setError] = useState<string>("");

  const [clinicForm, setClinicForm] = useState({ name: "", floor: "", description: "", phone: "" });
  const [specialtyForm, setSpecialtyForm] = useState({ name: "", description: "" });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);

  useEffect(() => {
    setError("");
    if (tab === "users") {
      adminFetchUsers().then(setUsers).catch((e) => setError(e.message));
    }
    if (tab === "reviews") {
      adminFetchReviews().then(setReviews).catch((e) => setError(e.message));
    }
    if (tab === "audit") {
      adminFetchAudit().then(setAudit).catch((e) => setError(e.message));
    }
  }, [tab]);

  async function run(action: () => Promise<unknown>) {
    setError("");
    try {
      await action();
      await refreshCatalog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  function addClinic(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await adminAddClinic(clinicForm);
      setClinicForm({ name: "", floor: "", description: "", phone: "" });
    });
  }

  function addSpecialty(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await adminAddSpecialty(specialtyForm);
      setSpecialtyForm({ name: "", description: "" });
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "clinics", label: "Clinics" },
    { key: "specialties", label: "Specialties" },
    { key: "reviews", label: "Reviews" },
    { key: "users", label: "Users" },
    { key: "audit", label: "Audit log" }
  ];

  return (
    <section className="section">
      <h1 className="page-title">Admin panel</h1>
      <p className="page-subtitle">Manage the hospital structure and review what happened in the system.</p>

      <div className="chips" role="tablist">
        {tabs.map((t) => (
          <button key={t.key} role="tab" className={tab === t.key ? "chip active" : "chip"} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error !== "" && <div className="error">{error}</div>}

      {tab === "clinics" && (
        <>
          <form className="card form" onSubmit={addClinic}>
            <h3>Add a clinic</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="cName">Name</label>
                <input id="cName" value={clinicForm.name} onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="cFloor">Floor</label>
                <input id="cFloor" value={clinicForm.floor} onChange={(e) => setClinicForm({ ...clinicForm, floor: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="cPhone">Phone</label>
                <input id="cPhone" value={clinicForm.phone} onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="cDesc">Description</label>
                <input id="cDesc" value={clinicForm.description} onChange={(e) => setClinicForm({ ...clinicForm, description: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Add clinic</button>
          </form>

          <div className="table-wrapper spaced">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Floor</th><th>Phone</th><th></th></tr>
              </thead>
              <tbody>
                {clinics.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.floor}</td>
                    <td>{c.phone}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => window.confirm("Delete " + c.name + "?") && run(() => adminDeleteClinic(c.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "specialties" && (
        <>
          <form className="card form" onSubmit={addSpecialty}>
            <h3>Add a specialty</h3>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sName">Name</label>
                <input id="sName" value={specialtyForm.name} onChange={(e) => setSpecialtyForm({ ...specialtyForm, name: e.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="sDesc">Description</label>
                <input id="sDesc" value={specialtyForm.description} onChange={(e) => setSpecialtyForm({ ...specialtyForm, description: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Add specialty</button>
          </form>

          <div className="table-wrapper spaced">
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Description</th><th></th></tr>
              </thead>
              <tbody>
                {specialties.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.description}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => window.confirm("Delete " + s.name + "?") && run(() => adminDeleteSpecialty(s.id))}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Last login</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td><span className="tag">{u.role}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>{formatDate(u.lastLoginAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "reviews" && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>When</th><th>Doctor</th><th>Patient</th><th>Rating</th><th>Comment</th><th></th></tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.createdAt)}</td>
                  <td>{r.doctorName}</td>
                  <td>{r.patientName}</td>
                  <td><Stars value={r.rating} /></td>
                  <td>{r.comment || "-"}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        window.confirm("Delete this review?") &&
                        run(async () => {
                          await adminDeleteReview(r.id);
                          setReviews((list) => list.filter((x) => x.id !== r.id));
                        })
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "audit" && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>When</th><th>User</th><th>Action</th><th>Target</th><th>IP</th></tr>
            </thead>
            <tbody>
              {audit.map((l) => (
                <tr key={l.id}>
                  <td>{formatDate(l.at)}</td>
                  <td>{l.userName}</td>
                  <td>{l.action}</td>
                  <td>{l.entity}{l.entityId !== null ? " #" + l.entityId : ""}</td>
                  <td>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default Admin;
