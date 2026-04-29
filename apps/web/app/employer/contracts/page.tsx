/** @format */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  Crown,
  FileText,
  Lock,
  PenLine,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib";
import { API_BASE } from "../../constants";
import styles from "./contracts.module.css";

type TemplateKind = "contract" | "offer_letter";

interface ContractTemplate {
  id: string;
  title: string;
  type: TemplateKind;
  content: string;
  description?: string;
  isDefault?: boolean;
  isPremium?: boolean;
}

interface ContractsResponse {
  plan: string;
  payPerUseAmount: number;
  capabilities: {
    canCustomize: boolean;
    requiresPayPerUse: boolean;
  };
  defaults: ContractTemplate[];
  premium: ContractTemplate[];
  custom: ContractTemplate[];
}

interface ApplicationOption {
  id: string;
  applicantId: string;
  applicant?: {
    fullName?: string;
    email?: string;
  };
  job?: {
    title?: string;
  };
}

type Tab = "templates" | "mine" | "ai";

const jobTypes = ["full-time", "part-time", "contract", "internship"] as const;

export default function EmployerContractsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("templates");
  const [data, setData] = useState<ContractsResponse | null>(null);
  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);
  const [selectedApplication, setSelectedApplication] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiForm, setAiForm] = useState({
    jobTitle: "",
    companyName: "",
    candidateName: "",
    salary: "",
    jobType: "full-time",
    location: "",
    startDate: "",
    additionalNotes: "",
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api<ContractsResponse>(`${API_BASE}/contracts/templates`, "GET"),
      api<ApplicationOption[]>(`${API_BASE}/applications?limit=50&sort=recent`, "GET"),
    ])
      .then(([contracts, apps]) => {
        if (!mounted) return;
        setData(contracts);
        setApplications(apps);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load contracts");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const allTemplates = useMemo(
    () => [...(data?.defaults ?? []), ...(data?.premium ?? [])],
    [data],
  );

  function openTemplate(template: ContractTemplate) {
    setSelectedTemplate(template);
    setDraftTitle(template.title);
    setDraftContent(template.content);
    setStatus(null);
    setError(null);
  }

  async function generateAiContract() {
    setSending(true);
    setStatus(null);
    setError(null);
    try {
      const result = await api<{ title: string; content: string }>(
        `${API_BASE}/contracts/ai-generate`,
        "POST",
        aiForm,
      );
      setSelectedTemplate({
        id: "ai-generated",
        title: result.title,
        type: "contract",
        content: result.content,
      });
      setDraftTitle(result.title);
      setDraftContent(result.content);
      setStatus("AI draft generated. Review it before sending.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate contract");
    } finally {
      setSending(false);
    }
  }

  async function sendContract() {
    if (!selectedApplication) {
      setError("Select a candidate before sending.");
      return;
    }
    setSending(true);
    setStatus(null);
    setError(null);
    try {
      const result = await api<{ amount: number; sent: boolean }>(
        `${API_BASE}/contracts/send`,
        "POST",
        {
          applicationId: selectedApplication,
          templateId: selectedTemplate?.id,
          title: draftTitle,
          content: draftContent,
          confirmOneTimePayment: data?.capabilities.requiresPayPerUse ?? true,
        },
      );
      setStatus(
        result.amount > 0
          ? `Contract sent. PKR ${result.amount} one-time usage recorded.`
          : "Contract sent successfully.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send contract");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonGrid}>
          <div />
          <div />
          <div />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Contracts workspace</span>
          <h1>Contracts & Offer Letters</h1>
          <p>
            Create, customize, and send polished candidate documents without
            slowing down your hiring workflow.
          </p>
          <div className={styles.heroMeta}>
            <span>
              <FileText size={15} /> 3 free starter templates
            </span>
            <span>
              <Sparkles size={15} /> AI drafting included
            </span>
            <span>
              <Crown size={15} /> Save reusable templates on Growth
            </span>
          </div>
        </div>
        <div className={styles.monetizeCard}>
          <span className={styles.planBadge}>{data?.plan ?? "free"} plan</span>
          <h2>
            {data?.capabilities.requiresPayPerUse
              ? "Send once for PKR 500"
              : "Reusable templates unlocked"}
          </h2>
          <p>
            {data?.capabilities.requiresPayPerUse
              ? "Use a contract once when you need it, or upgrade to save reusable templates."
              : "Your plan can save and reuse custom contract templates."}
          </p>
          <Link href="/employer/billing" className={styles.primaryLink}>
            View upgrade options
          </Link>
        </div>
      </section>

      {error && <div className={styles.error}>{error}</div>}
      {status && <div className={styles.success}>{status}</div>}

      <div className={styles.tabs}>
        {[
          ["templates", "Templates"],
          ["mine", "My Templates"],
          ["ai", "AI Generator"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={activeTab === key ? styles.activeTab : ""}
            onClick={() => setActiveTab(key as Tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "templates" && (
        <section className={styles.grid}>
          {allTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              canCustomize={data?.capabilities.canCustomize ?? false}
              onUse={() => openTemplate(template)}
            />
          ))}
        </section>
      )}

      {activeTab === "mine" && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h2>My reusable templates</h2>
              <p>Save company-specific offers and contracts for repeated use.</p>
            </div>
            {!data?.capabilities.canCustomize && <Lock size={18} />}
          </div>
          {data?.custom.length ? (
            <div className={styles.grid}>
              {data.custom.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  canCustomize
                  onUse={() => openTemplate(template)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <PenLine size={24} />
              <h3>No saved templates yet</h3>
              <p>
                Upgrade to Growth to save reusable templates tailored to your
                contracts, offer terms, and hiring process.
              </p>
              <Link href="/employer/billing" className={styles.secondaryLink}>
                Unlock reusable templates
              </Link>
            </div>
          )}
        </section>
      )}

      {activeTab === "ai" && (
        <section className={styles.aiPanel}>
          <div className={styles.aiForm}>
            <h2>Generate a professional first draft</h2>
            <p>
              Add the key hiring details and review the output before sending.
            </p>
            <div className={styles.formGrid}>
              <input
                placeholder="Job title"
                value={aiForm.jobTitle}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, jobTitle: e.target.value }))
                }
              />
              <input
                placeholder="Company name"
                value={aiForm.companyName}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, companyName: e.target.value }))
                }
              />
              <input
                placeholder="Candidate name"
                value={aiForm.candidateName}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, candidateName: e.target.value }))
                }
              />
              <input
                placeholder="Salary / compensation"
                value={aiForm.salary}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, salary: e.target.value }))
                }
              />
              <select
                value={aiForm.jobType}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, jobType: e.target.value }))
                }
              >
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <input
                placeholder="Location"
                value={aiForm.location}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, location: e.target.value }))
                }
              />
              <input
                type="date"
                value={aiForm.startDate}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, startDate: e.target.value }))
                }
              />
              <textarea
                placeholder="Additional notes"
                value={aiForm.additionalNotes}
                onChange={(e) =>
                  setAiForm((p) => ({ ...p, additionalNotes: e.target.value }))
                }
              />
            </div>
            <button
              className={styles.primaryButton}
              onClick={generateAiContract}
              disabled={sending}
            >
              <Bot size={17} />
              {sending ? "Generating..." : "Generate Contract with AI"}
            </button>
          </div>
        </section>
      )}

      {selectedTemplate && (
        <section className={styles.editor}>
          <div className={styles.editorHeader}>
            <div>
              <span className={styles.eyebrow}>Review and send</span>
              <h2>{selectedTemplate.title}</h2>
            </div>
            {data?.capabilities.requiresPayPerUse && (
              <span className={styles.payBadge}>PKR {data.payPerUseAmount} once</span>
            )}
          </div>
          <div className={styles.editorGrid}>
            <div className={styles.editorFields}>
              <label>
                Candidate
                <select
                  value={selectedApplication}
                  onChange={(e) => setSelectedApplication(e.target.value)}
                >
                  <option value="">Select candidate</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.applicant?.fullName ?? "Candidate"} -{" "}
                      {app.job?.title ?? "Role"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Document title
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
              </label>
              <label>
                Editable content
                <textarea
                  className={styles.editorText}
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                />
              </label>
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  onClick={sendContract}
                  disabled={sending}
                >
                  <Send size={16} />
                  {sending ? "Sending..." : "Send contract"}
                </button>
                {data?.capabilities.requiresPayPerUse && (
                  <Link href="/employer/billing" className={styles.secondaryLink}>
                    Upgrade instead
                  </Link>
                )}
              </div>
            </div>
            <div className={styles.preview}>
              <div dangerouslySetInnerHTML={{ __html: draftContent }} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  canCustomize,
  onUse,
}: {
  template: ContractTemplate;
  canCustomize: boolean;
  onUse: () => void;
}) {
  return (
    <article className={`${styles.card} ${template.isPremium ? styles.lockedCard : ""}`}>
      <div className={styles.cardIcon}>
        {template.isPremium ? <Lock size={18} /> : <FileText size={18} />}
      </div>
      <div className={styles.cardMeta}>
        <span>{template.type.replace("_", " ")}</span>
        <span className={template.isPremium ? styles.premium : styles.free}>
          {template.isPremium ? "Premium" : "Free"}
        </span>
      </div>
      <h3>{template.title}</h3>
      <p>{template.description ?? "Create professional offers in seconds."}</p>
      <div className={styles.cardActions}>
        <button onClick={onUse}>
          <CheckCircle2 size={15} />
          Use Template
        </button>
        <span>
          {template.isPremium && !canCustomize
            ? "Upgrade to customize"
            : "Editable before sending"}
        </span>
      </div>
    </article>
  );
}
