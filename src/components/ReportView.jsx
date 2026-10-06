import React, { useState } from 'react';
import { FileText, Printer, Copy, Check, ExternalLink, Bookmark, Sparkles } from 'lucide-react';
import { REPORT_DATA } from '../utils/reportContent';

export function ReportView() {
  const [activeSectionId, setActiveSectionId] = useState(REPORT_DATA.sections[0].id);
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    const text = REPORT_DATA.sections
      .map((s) => `## ${s.number}. ${s.title}\n\n${s.content}\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="main-content">
      {/* Report Header Bar */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-cyan">{REPORT_DATA.courseCode}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{REPORT_DATA.courseName}</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginTop: '0.25rem' }}>{REPORT_DATA.assignmentTitle}</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn btn-secondary" onClick={handleCopyMarkdown}>
            {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied Markdown' : 'Copy Report MD'}</span>
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Main Report Layout */}
      <div className="workspace-grid" style={{ gridTemplateColumns: '280px 1fr' }}>
        {/* Table of Contents Sticky Sidebar */}
        <div
          className="glass-card sidebar-panel"
          style={{ position: 'sticky', top: '5rem', maxHeight: 'calc(100vh - 7rem)', overflowY: 'auto' }}
        >
          <div className="panel-header">
            <span className="panel-title">
              <Bookmark size={16} color="var(--accent-cyan)" />
              Report Sections
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {REPORT_DATA.sections.map((section) => {
              const isActive = activeSectionId === section.id;
              return (
                <button
                  key={section.id}
                  className={`btn btn-secondary ${isActive ? 'btn-primary' : ''}`}
                  style={{
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    fontSize: '0.78rem',
                    padding: '0.5rem 0.75rem',
                  }}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span style={{ opacity: 0.7, marginRight: '0.3rem' }}>{section.number}.</span>
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '1.5rem',
              padding: '0.85rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
            }}
          >
            <strong>Assignment Rubric:</strong>
            <ul style={{ paddingLeft: '1.1rem', marginTop: '0.4rem', lineHeight: 1.6 }}>
              <li>Q1 (Single Robot): 5 Marks</li>
              <li>Q2 Identification: 5 Marks</li>
              <li>Q2 Novel Solution: 15 Marks</li>
              <li>Implementation: 10 Marks</li>
              <li>Report: 5 Marks</li>
              <li>Presentation: 10 Marks</li>
            </ul>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {REPORT_DATA.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              style={{
                scrollMarginTop: '6rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span
                  style={{
                    background: 'var(--accent-cyan)',
                    color: '#000000',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                  }}
                >
                  {section.number}
                </span>
                <h2 style={{ fontSize: '1.35rem' }}>{section.title}</h2>
              </div>

              {/* Render section text formatted */}
              <div
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.925rem',
                  lineHeight: 1.7,
                }}
              >
                {section.content.split('\n\n').map((paragraph, pIdx) => {
                  // Heading 3
                  if (paragraph.trim().startsWith('### ')) {
                    return (
                      <h3
                        key={pIdx}
                        style={{
                          fontSize: '1.1rem',
                          color: 'var(--text-primary)',
                          marginTop: '1.5rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }

                  // Heading 4
                  if (paragraph.trim().startsWith('#### ')) {
                    return (
                      <h4
                        key={pIdx}
                        style={{
                          fontSize: '0.98rem',
                          color: 'var(--accent-cyan)',
                          marginTop: '1.2rem',
                          marginBottom: '0.4rem',
                        }}
                      >
                        {paragraph.replace('#### ', '')}
                      </h4>
                    );
                  }

                  // Markdown Tables
                  if (paragraph.includes('|')) {
                    const lines = paragraph.trim().split('\n').filter(Boolean);
                    if (lines.length > 2) {
                      const headers = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
                      const rows = lines.slice(2).map((line) =>
                        line.split('|').map((c) => c.trim()).filter(Boolean)
                      );

                      return (
                        <div key={pIdx} style={{ overflowX: 'auto', margin: '1rem 0' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
                            <thead>
                              <tr style={{ background: '#131b2e', borderBottom: '1px solid var(--border-medium)' }}>
                                {headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    style={{
                                      padding: '0.65rem 0.85rem',
                                      textAlign: hIdx === 0 ? 'left' : 'center',
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  style={{
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                                  }}
                                >
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      style={{
                                        padding: '0.65rem 0.85rem',
                                        textAlign: cIdx === 0 ? 'left' : 'center',
                                        color: cIdx === 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                                      }}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    }
                  }

                  return (
                    <p key={pIdx} style={{ marginBottom: '1rem' }}>
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
