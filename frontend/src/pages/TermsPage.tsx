import React from 'react';
import { FileText, AlertTriangle, Scale, Ban, RefreshCcw, Mail } from 'lucide-react';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon, title, children,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
    <div className="flex items-center space-x-3">
      <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
        {icon}
      </div>
      <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
    </div>
    <div className="text-sm text-slate-600 leading-relaxed space-y-2 pl-1">{children}</div>
  </div>
);

export const TermsPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Legal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Intro */}
      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-800 font-medium leading-relaxed">
        By accessing or using DataCleanAI, you agree to be bound by these Terms of Service. Please
        read them carefully before using the platform. If you do not agree with any part of these
        terms, you may not use the service.
      </div>

      {/* Sections */}
      <Section icon={<FileText className="w-4 h-4" />} title="Use of the Service">
        <p>DataCleanAI is an automated data quality assessment and cleaning tool. By using this service, you agree to:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>Use the platform only for lawful data processing activities.</li>
          <li>Upload only datasets that you own or have explicit rights to process.</li>
          <li>Not use the service to process data in violation of applicable privacy laws (e.g. GDPR, CCPA).</li>
          <li>Not attempt to reverse-engineer, modify, or exploit any part of the platform's infrastructure.</li>
        </ul>
      </Section>

      <Section icon={<Scale className="w-4 h-4" />} title="Intellectual Property">
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>You retain full ownership of all datasets you upload to DataCleanAI.</li>
          <li>DataCleanAI retains ownership of its source code, algorithms, models, and UI design.</li>
          <li>Cleaned outputs and audit reports generated from your data are yours to keep, export, and use freely.</li>
          <li>You may not redistribute or resell the DataCleanAI platform itself without explicit written permission.</li>
        </ul>
      </Section>

      <Section icon={<AlertTriangle className="w-4 h-4" />} title="Disclaimer of Warranties">
        <p>
          DataCleanAI is provided <strong>"as is"</strong> without warranties of any kind, express or implied. While
          we strive for accuracy in our cleaning and profiling algorithms, we do not guarantee:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600 mt-1">
          <li>That all data quality issues in your dataset will be detected or corrected.</li>
          <li>Uninterrupted or error-free operation of the platform.</li>
          <li>The fitness of the platform for any particular business purpose.</li>
        </ul>
        <p className="mt-1">
          Always validate cleaned outputs before using them in production systems or critical decisions.
        </p>
      </Section>

      <Section icon={<Ban className="w-4 h-4" />} title="Limitation of Liability">
        <p>
          To the fullest extent permitted by law, DataCleanAI and its contributors shall not be liable
          for any indirect, incidental, special, or consequential damages arising from your use of the
          platform — including, but not limited to, data loss, business interruption, or incorrect
          data analysis outcomes.
        </p>
        <p className="mt-1">
          Your sole remedy for dissatisfaction with the service is to discontinue using it.
        </p>
      </Section>

      <Section icon={<RefreshCcw className="w-4 h-4" />} title="Modifications to Terms">
        <p>
          We reserve the right to update or modify these Terms of Service at any time. Continued use
          of DataCleanAI after changes are posted constitutes your acceptance of the revised terms.
          Material changes will be reflected in the "Last updated" date at the top of this page.
        </p>
      </Section>

      <Section icon={<Mail className="w-4 h-4" />} title="Contact">
        <p>
          For questions regarding these Terms of Service, please open an issue on our{' '}
          <a
            href="https://github.com/Daksh3468/DataCleanAI/issues"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 font-semibold hover:underline"
          >
            GitHub repository
          </a>.
        </p>
      </Section>
    </div>
  );
};

export default TermsPage;
