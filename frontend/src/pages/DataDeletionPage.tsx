import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, CheckCircle2, Mail } from "lucide-react";
import "./LegalPages.css";

export const DataDeletionPage: React.FC = () => {
  const navigate = useNavigate();
  const [emailInput, setEmailInput] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="legal-container">
      <div className="legal-content-card">
        <header className="legal-header">
          <button
            onClick={() => navigate(-1)}
            className="legal-back-btn"
            aria-label="Go Back"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="legal-title">Data Deletion Policy & Instructions</h1>
            <div className="legal-subtitle">Google Play & OAuth User Data Rights</div>
          </div>
        </header>

        <main className="legal-body">
          <div className="legal-badge" style={{ background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" }}>
            <Trash2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
            Account & Data Removal
          </div>

          <p>
            At <strong>Siraat</strong>, you have full control over your personal data. You can request the permanent deletion of your account and any associated information at any time.
          </p>

          <h2>1. What Data Is Deleted Upon Request?</h2>
          <p>When you delete your account or submit a deletion request, the following information is permanently removed from our active databases:</p>
          <ul>
            <li>Your Google account identifier and verified email address</li>
            <li>Your synchronized Quran bookmarks, last read position, and reading history</li>
            <li>Your personalized prayer notification preferences and calculation settings</li>
            <li>Your saved favorites across Quran, Duas, and Hadith</li>
            <li>Any push notification registration tokens</li>
          </ul>

          <h2>2. How to Request Account & Data Deletion</h2>
          <div className="legal-highlight-box">
            <strong>Method A: Directly In the App (Instant)</strong>
            <p style={{ margin: "0.5rem 0 0" }}>
              Open Siraat &rarr; Tap <strong>Settings</strong> &rarr; Scroll down to <strong>Account & Security</strong> &rarr; Tap <strong>Delete My Account</strong>. Your account and stored cloud data will be wiped immediately.
            </p>
          </div>

          <div className="legal-highlight-box" style={{ borderLeftColor: "var(--gold-600)" }}>
            <strong>Method B: Submit Request Online via Email</strong>
            <p style={{ margin: "0.5rem 0 0" }}>
              If you have uninstalled the app or cannot sign in, submit your registered Google email address below or email us at{" "}
              <a href="mailto:support@siraat.app" style={{ color: "var(--teal-600)", fontWeight: 600 }}>support@siraat.app</a>{" "}
              with the subject &quot;Account Data Deletion Request&quot;.
            </p>
          </div>

          <div style={{ marginTop: "1.5rem", padding: "1.25rem", background: "var(--surface-subtle)", borderRadius: 12, border: "1px solid var(--border)" }}>
            {submitted ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--teal-800)" }}>
                <CheckCircle2 size={24} color="#16a34a" />
                <div>
                  <strong>Deletion Request Received</strong>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem" }}>
                    We have recorded your deletion request for <strong>{emailInput}</strong>. Your account data will be completely expunged within 30 days in compliance with privacy regulations.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--teal-900)" }}>
                  Submit email for deletion:
                </label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <input
                    type="email"
                    required
                    placeholder="Enter your registered Google email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    style={{
                      flex: "1 1 240px",
                      padding: "0.6rem 0.85rem",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: "0.95rem",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "var(--teal-700)",
                      color: "#fff",
                      border: "none",
                      padding: "0.6rem 1.25rem",
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <Mail size={16} /> Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>

          <h2>3. Data Retention Period</h2>
          <p>
            Upon receipt of a manual deletion request, your data is scheduled for complete removal from our backup cycles within <strong>30 calendar days</strong>.
          </p>

          <h2>4. Offline Local Data on Your Device</h2>
          <p>
            If you wish to clear local offline Quran downloads and local app cache stored on your mobile phone, you can clear app storage via:
            <br />
            <strong>Android Settings &rarr; Apps &rarr; Siraat &rarr; Storage & Cache &rarr; Clear Storage</strong>.
          </p>
        </main>
      </div>
    </div>
  );
};

export default DataDeletionPage;
