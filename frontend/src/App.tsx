import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UploadPage } from './pages/UploadPage';
import { ProfilePage } from './pages/ProfilePage';
import { RulesPage } from './pages/RulesPage';
import { CleanPage } from './pages/CleanPage';
import { ReportPage } from './pages/ReportPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

import { api } from './services/api';
import { Dataset } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';

export const App: React.FC = () => {
  // Global dataset state shared across pages
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>({
    upload_id: 'upl_982347102938',
    filename: 'enterprise_customer_leads.csv',
    file_size: 1458920,
    row_count: 12500,
    column_count: 8,
    uploaded_at: new Date().toISOString(),
    columns: ['id', 'full_name', 'email', 'age', 'annual_income', 'country', 'signup_date', 'is_active'],
  });

  const handleNewUpload = () => {
    api.resetSession();
    setCurrentDataset(null);
  };

  const handleDatasetUploaded = (ds: Dataset) => {
    api.resetSession();
    setCurrentDataset(ds);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
        {/* Global Website Header Navbar */}
        <Navbar
          currentDataset={currentDataset}
          onNewUpload={handleNewUpload}
        />

        {/* Main Website Page Content Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/upload"
                element={<UploadPage onDatasetUploaded={handleDatasetUploaded} />}
              />
              <Route
                path="/profile"
                element={<ProfilePage dataset={currentDataset} />}
              />
              <Route
                path="/rules"
                element={<RulesPage dataset={currentDataset} />}
              />
              <Route
                path="/clean"
                element={<CleanPage dataset={currentDataset} />}
              />
              <Route
                path="/report"
                element={<ReportPage dataset={currentDataset} />}
              />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />

              <Route path="*" element={<Navigate to="/upload" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Global Website Footer */}
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
