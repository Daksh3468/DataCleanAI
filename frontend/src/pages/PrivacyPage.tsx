import React from 'react';
import { Shield, Lock, Eye, Server, UserCheck, Bell, Mail } from 'lucide-react';

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

export const PrivacyPage: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span>Legal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Intro */}
      <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 text-sm text-indigo-800 font-medium leading-relaxed">
        DataCleanAI is committed to protecting your data and your privacy. This policy explains what
        information we collect, how we use it, and what rights you have over it. By using DataCleanAI,
        you agree to the practices described below.
      </div>

      {/* Sections */}
      <Section icon={<Eye className="w-4 h-4" />} title="Information We Collect">
        <p>We collect only what is necessary to provide the service:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li><strong>Uploaded datasets</strong> — files you upload (CSV, Excel, JSON) are processed in-memory and stored temporarily to fulfil your cleaning session.</li>
          <li><strong>Usage metadata</strong> — timestamps, file sizes, row/column counts, and quality scores associated with each upload session.</li>
          <li><strong>Cleaning logs</strong> — a record of operations applied (e.g. "removed duplicates", "imputed 42 nulls") for audit purposes.</li>
        </ul>
        <p className="mt-1">We do <strong>not</strong> collect personal account information, passwords, or payment details.</p>
      </Section>

      <Section icon={<Server className="w-4 h-4" />} title="How Your Data Is Stored">
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>Uploaded files are stored in a temporary session store on the server and are <strong>automatically deleted</strong> when the session ends or within 24 hours.</li>
          <li>Cleaning metadata and audit logs are persisted in a local SQLite or PostgreSQL database, depending on your deployment configuration.</li>
          <li>No dataset content is ever transmitted to third-party services without your explicit action.</li>
        </ul>
      </Section>

      <Section icon={<Lock className="w-4 h-4" />} title="Data Security">
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li>All API communication occurs over HTTPS in production deployments.</li>
          <li>The backend enforces a maximum upload size limit to prevent abuse.</li>
          <li>Dataset files are stored with restricted filesystem permissions and are never publicly accessible.</li>
          <li>We recommend running DataCleanAI within a private network or VPN for enterprise deployments.</li>
        </ul>
      </Section>

      <Section icon={<UserCheck className="w-4 h-4" />} title="Your Rights">
        <p>You retain full ownership of any data you upload. You have the right to:</p>
        <ul className="list-disc pl-5 space-y-1 text-slate-600">
          <li><strong>Access</strong> — view what data has been stored about your session.</li>
          <li><strong>Delete</strong> — request permanent deletion of your uploaded datasets and logs at any time.</li>
          <li><strong>Export</strong> — download your cleaned dataset in CSV, Excel, or HTML formats at any point.</li>
          <li><strong>Portability</strong> — your data is always exportable in open, standard formats.</li>
        </ul>
      </Section>

      <Section icon={<Bell className="w-4 h-4" />} title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or
          for legal and regulatory reasons. Any material changes will be noted with an updated "Last
          updated" date at the top of this page.
        </p>
      </Section>

      <Section icon={<Mail className="w-4 h-4" />} title="Contact">
        <p>
          If you have any questions or concerns about this Privacy Policy or how your data is handled,
          please open an issue on our{' '}
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

export default PrivacyPage;
