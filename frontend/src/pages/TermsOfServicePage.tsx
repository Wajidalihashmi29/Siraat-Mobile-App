import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, Scale, AlertCircle, FileText } from "lucide-react";
import "./LegalPages.css";

export const TermsOfServicePage: React.FC = () => {
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
            <h1 className="legal-title">Terms of Service</h1>
            <div className="legal-subtitle">Last Revised: November 20, 2026</div>
          </div>
        </header>

        <main className="legal-body">
          <div className="legal-badge">
            <FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
            User Agreement
          </div>

          <p>
            Welcome to <strong>Siraat</strong>. By downloading, accessing, or using Siraat (mobile application or web version),
            you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these terms, please do not use the application.
          </p>

          <h2><Scale size={18} /> 1. License & Permitted Use</h2>
          <p>
            Siraat is provided free of charge for personal, non-commercial, religious, educational, and spiritual enrichment.
            You are granted a revocable, non-exclusive, non-transferable license to use the app for your personal devotion and Islamic learning.
          </p>

          <h2><BookOpenCheck size={18} /> 2. Content Attribution & Sacred Text Integrity</h2>
          <p>
            The Holy Quran text (both Indo-Pak script and Uthmani Madani script), translations, and Hadith records are sourced from established, authentic scholarly databases.
            We take utmost care in preserving diacritical precision (tashkeel), line structures, and verse delineations.
            However, digital representations should be used as a helpful study and recitation companion; users should consult certified scholars and printed Mushafs for canonical rulings.
          </p>

          <h2><AlertCircle size={18} /> 3. Prayer Times & Qibla Compass Disclaimer</h2>
          <p>
            Prayer times are calculated based on reputable astronomical calculation methods (such as University of Islamic Sciences Karachi, Muslim World League, ISNA, and Egyptian General Authority of Survey) based on your coordinates.
            Qibla direction relies on your device&apos;s internal magnetometer and compass sensors, which can be affected by magnetic interference or uncalibrated sensors. We advise performing a figure-8 calibration if compass accuracy is low.
          </p>

          <h2>4. User Accounts & Google Authentication</h2>
          <p>
            When registering or logging in using Google OAuth, you are responsible for maintaining the security of your device and Google account. You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted under applicable law, Siraat and its creators shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the service, including any reliance on prayer time notifications or Qibla direction.
          </p>

          <h2>6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
          </p>

          <h2>7. Contact</h2>
          <p>
            For any legal or service inquiries, please contact:
            <br />
            <strong>Email:</strong> <a href="mailto:support@siraat.app" style={{ color: "var(--teal-600)" }}>support@siraat.app</a>
          </p>
        </main>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
