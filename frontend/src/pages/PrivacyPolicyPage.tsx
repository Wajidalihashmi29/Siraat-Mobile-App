import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Database, Bell, MapPin } from "lucide-react";
import "./LegalPages.css";

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

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
            <h1 className="legal-title">Privacy Policy</h1>
            <div className="legal-subtitle">Effective Date: November 20, 2026</div>
          </div>
        </header>

        <main className="legal-body">
          <div className="legal-badge">
            <ShieldCheck size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
            Commitment to Your Privacy
          </div>

          <p>
            Welcome to <strong>Siraat</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            Siraat is committed to providing a distraction-free, respectful, and privacy-first Islamic companion app.
            This Privacy Policy explains how your information is handled when you use our mobile and web applications.
          </p>

          <h2><Lock size={18} /> 1. Information We Collect</h2>
          <p>We believe in minimal data collection. We only process information strictly required to deliver our core services:</p>
          <ul>
            <li>
              <strong>Account Information (Google OAuth):</strong> When you sign in using Google, we receive your basic profile information (such as your name, verified email address, and profile photo) from Google to authenticate your identity. We never access your Google password or personal contacts.
            </li>
            <li>
              <strong>Approximate / Precise Location:</strong> When you grant location permissions, we use your device GPS coordinates solely to calculate accurate local prayer times (Namaz timings) and determine the exact Qibla direction to the Holy Kaaba in Makkah. Your location is processed on-device or sent as non-identifying coordinates to calculate prayer times. We do <strong>not</strong> track, store, or sell your location history.
            </li>
            <li>
              <strong>Reading Progress & App Preferences:</strong> Your Quran reading bookmarks, last-read ayah, selected translations, script preferences (Indo-Pak vs Uthmani), and Tasbeeh counter values are saved locally on your device (via IndexedDB/localStorage) and synchronized to your account only when you are signed in.
            </li>
          </ul>

          <h2><MapPin size={18} /> 2. Device Permissions We Request</h2>
          <ul>
            <li>
              <strong>Location (ACCESS_FINE_LOCATION / ACCESS_COARSE_LOCATION):</strong> Used strictly to calculate local prayer times and determine the Qibla compass bearing.
            </li>
            <li>
              <strong>Notifications (POST_NOTIFICATIONS):</strong> Used to deliver timely Adhan and prayer reminders that you opt into.
            </li>
            <li>
              <strong>Exact Alarms (SCHEDULE_EXACT_ALARM):</strong> Required on modern Android devices to ensure prayer alerts ring precisely at calculated times even when the device is in low-power/doze mode.
            </li>
          </ul>

          <h2><EyeOff size={18} /> 3. Third-Party Services & Integrations</h2>
          <p>We work with trusted services to provide reliable features:</p>
          <ul>
            <li><strong>Google Identity Services:</strong> For secure, one-tap authentication.</li>
            <li><strong>AlAdhan API / Islamic Scholarly Databases:</strong> For astronomical prayer time calculations and verified Quranic audio / metadata.</li>
          </ul>
          <div className="legal-highlight-box">
            <strong>Zero Advertising & No Data Selling:</strong> Siraat does not sell, rent, or trade your personal data with third-party advertisers or data brokers under any circumstances.
          </div>

          <h2><Database size={18} /> 4. Data Storage & Offline Reading</h2>
          <p>
            The Quranic text, translations, and hadiths are cached offline on your device using Service Worker and local storage so that you can read peacefully without continuous internet connectivity.
          </p>

          <h2><Bell size={18} /> 5. Data Deletion & Account Rights</h2>
          <p>
            You have full ownership of your data. You may request complete deletion of your account and all associated synchronized data at any time directly through the app settings or by visiting our{" "}
            <a href="/data-deletion" style={{ color: "var(--teal-600)", fontWeight: 600 }}>Data Deletion Request Page</a>.
          </p>

          <h2>6. Children&apos;s Privacy</h2>
          <p>
            Siraat is safe for users of all ages and does not knowingly collect personal information from children under 13 without parental consent.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have questions or concerns about this Privacy Policy or how your data is handled, please contact our team at:
            <br />
            <strong>Email:</strong> <a href="mailto:support@siraat.app" style={{ color: "var(--teal-600)" }}>support@siraat.app</a>
          </p>
        </main>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
