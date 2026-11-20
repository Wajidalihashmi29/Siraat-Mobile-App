import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Heart, Shield, Code, ChevronRight } from "lucide-react";
import BrandMark from "../components/BrandMark";
import "./LegalPages.css";

export const AboutPage: React.FC = () => {
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
            <h1 className="legal-title">About Siraat</h1>
            <div className="legal-subtitle">Version 1.0.0</div>
          </div>
        </header>

        <main className="legal-body">
          <div className="about-hero-section">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <BrandMark size={72} />
            </div>
            <div className="about-arabic-title">صِرَاط</div>
            <div className="about-tagline">The Straight Path — Namaz, Quran & Qibla</div>
            <p style={{ maxWidth: 480, margin: "1rem auto 0", color: "var(--muted, #536462)" }}>
              A modern, distraction-free Islamic companion thoughtfully engineered for Muslim believers worldwide, especially tailored for the Indian subcontinent and international communities.
            </p>
          </div>

          <h2><Heart size={18} /> Our Vision</h2>
          <p>
            Siraat was built with the singular mission of bringing authentic, beautifully typeset Islamic tools to your fingertips.
            We prioritize zero ads, clean design, authentic 15-line and 16-line Indo-Pak printed Mushaf aesthetics, and instant offline availability.
          </p>

          <h2><Code size={18} /> Engineering & Open Source Credits</h2>
          <p>
            Built with modern web and mobile technologies:
          </p>
          <ul>
            <li><strong>React 19 & TypeScript:</strong> Modern, type-safe reactive UI engine.</li>
            <li><strong>Capacitor:</strong> Native Android runtime for performant hardware acceleration.</li>
            <li><strong>AlAdhan API:</strong> Accurate astronomical prayer timing calculations.</li>
            <li><strong>Amiri & Noto Nastaliq Fonts:</strong> Open-source Arabic and Urdu typographic excellence.</li>
          </ul>

          <h2><Shield size={18} /> Privacy & Compliance</h2>
          <p>
            We are fully dedicated to protecting your privacy. Siraat does not display advertisements, does not track your location history, and does not sell user data.
          </p>

          <div className="about-links-grid">
            <Link to="/privacy" className="about-link-card">
              <span>Privacy Policy</span>
              <ChevronRight size={18} color="var(--teal-600)" />
            </Link>
            <Link to="/terms" className="about-link-card">
              <span>Terms of Service</span>
              <ChevronRight size={18} color="var(--teal-600)" />
            </Link>
            <Link to="/data-deletion" className="about-link-card">
              <span>Data Deletion Instructions</span>
              <ChevronRight size={18} color="var(--teal-600)" />
            </Link>
          </div>

          <div style={{ marginTop: "2.5rem", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
              Crafted with devotion for the Ummah.
              <br />
              Developer Contact: <a href="mailto:support@siraat.app" style={{ color: "var(--teal-600)" }}>support@siraat.app</a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AboutPage;
