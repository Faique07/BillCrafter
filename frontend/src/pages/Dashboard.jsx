import React, { useCallback, useEffect, useState, useMemo } from "react";
import { dashboardStyles } from "../assets/dummyStyles";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = "http://localhost:4000";

/* normalize client object */
function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string")
    return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? raw.emailAddress ?? "",
      address: raw.address ?? "",
      phone: raw.phone ?? raw.contact ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
} // currency is indian

// icons
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M23 6l-9.5 9.5-5-5L1 18" />
    <path d="M17 6h6v6" />
  </svg>
);
const DollarIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const ClockIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const BrainIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M9.5 14.5A2.5 2.5 0 0 1 7 12c0-1.38.5-2 1-3 1.072-2.143 2.928-3.25 4.5-3 1.572.25 3 2 3 4 0 1.5-.5 2.5-1 3.5-1 2-2 3-3.5 3-1.5 0-2.5-1.5-2.5-3Z" />
    <path d="M14.5 9.5A2.5 2.5 0 0 1 17 12c0 1.38-.5 2-1 3-1.072 2.143-2.928 3.25-4.5 3-1.572-.25-3-2-3-4 0-1.5.5-2.5 1-3.5 1-2 2-3 3.5-3 1.5 0 2.5 1.5 2.5 3Z" />
  </svg>
);
const FileTextIcon = ({ className = "w-5 h-5" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const EyeIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* small helpers to make the value to uppercase*/
function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

/* ---------- date formatting helper: DD/MM/YYYY ---------- */
function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();

  //to obtain the token

  const obtainToken = useCallback(async () => {
    if (typeof getToken !== "function") return null;
    try {
      let token = await getToken({ template: "default" }).catch(() => null);
      if (!token) {
        token = await getToken({ forceRefresh: true }).catch(() => null);
      }
      return token;
    } catch (error) {
      return null;
    }
  }, [getToken]);

  const [storedInvoices, setStoredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [businessProfile, setBusinessProfile] = useState(null);

  //fetch the invoices from the backend

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await obtainToken();
      const headers = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/invoice`, {
        method: "GET",
        headers,
      });
      const json = await res.json().catch(() => null);
      /* ---------- Component (fetch from backend) ---------- */
      if (res.status === 401) {
        // unauthorized - prompt login
        setError("Unauthorized. Please sign in.");
        setStoredInvoices([]);
        return;
      }

      if (!res.ok) {
        const msg = json?.message || `Failed to fetch (${res.status})`;
        throw new Error(msg);
      }

      const raw = json?.data || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
        const clientObj = inv.client ?? {};
        const amountVal = Number(inv.total ?? inv.amount ?? 0);
        const currency = (inv.currency || "INR").toUpperCase();

        return {
          ...inv,
          id: inv.invoiceNumber || inv._id || String(inv._id || ""),
          client: clientObj,
          amount: amountVal,
          currency,
          // keep status normalized
          status:
            typeof inv.status === "string"
              ? capitalize(inv.status)
              : inv.status || "Draft",
        };
      });
      setStoredInvoices(mapped);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError(err?.message || "Failed to load invoices");
      setStoredInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [obtainToken]);

  // fetch user profile

  const fetchBusinessProfile = useCallback(async () => {
    try {
      const token = await obtainToken();
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/businessProfile/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (res.status === 401) {
        // silently ignore; profile not available
        return;
      }
      if (!res.ok) return;
      const json = await res.json().catch(() => null);
      const data = json?.data || null;
      if (data) setBusinessProfile(data);
    } catch (err) {
      // non-fatal
      console.warn("Failed to fetch business profile:", err);
    }
  }, [obtainToken]);

  useEffect(() => {
    fetchInvoices();
    fetchBusinessProfile();

    function onStorage(e) {
      if(e.key === "invoice_v1") fetchInvoices();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchInvoices, fetchBusinessProfile, isSignedIn]);

  // 
  const HARD_RATES = {
    USD_TO_INR: 95, 
  };

  //convert amount to inr

  function convertToINR(amount = 0, currency = "INR") {
    const n = Number(amount || 0);
    const curr = String(currency || "INR")
      .trim()
      .toUpperCase();

    if (curr === "INR") return n;
    if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
    return n;
  }

  // KPI computation with percentage is(convert each invoices to inr before summarizing)

  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0; // in INR
    let totalUnpaid = 0; // in INR
    let paidCount = 0;
    let unpaidCount = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount =
        typeof inv.amount === "number"
          ? inv.amount
          : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "INR";
      const amtInINR = convertToINR(rawAmount, invCurrency);

      if (inv.status === "Paid") {
        totalPaid += amtInINR;
        paidCount++;
      }
      if (inv.status === "Unpaid" || inv.status === "Overdue") {
        totalUnpaid += amtInINR;
        unpaidCount++;
      }
    });

    const totalAmount = totalPaid + totalUnpaid;
    const paidPercentage =
      totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const unpaidPercentage =
      totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;

    return {
      totalInvoices,
      totalPaid,
      totalUnpaid,
      paidCount,
      unpaidCount,
      paidPercentage,
      unpaidPercentage,
    };
  }, [storedInvoices]);

  // recent invoices by created at date in database

  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort(
        (a, b) =>
          (Date.parse(b.issueDate || 0) || 0) -
          (Date.parse(a.issueDate || 0) || 0)
      )
      .slice(0, 5);
  }, [storedInvoices]);

  // to fetch client name

  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object")
      return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  // get first letter of clients name
  const getClientInitial = (inv) => {
    const clientName = getClientName(inv);
    return clientName ? clientName.charAt(0).toUpperCase() : "C";
  };

  //navigate to invoice preview

  function openInvoice(invRow) {
    const payload = invRow;
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: payload } });
  } 

  return(
    <div className={dashboardStyles.pageContainer}>
    <div className={dashboardStyles.headerContainer}>
      <h1 className={dashboardStyles.headerTitle}>Dashboard Overview</h1>
      <p className={dashboardStyles.headerSubtitle}>
        Track your invoicing performance and business insights
      </p>
    </div>
    </div>
  )
};

export default Dashboard;
