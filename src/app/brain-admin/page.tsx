"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Brain,
  Cloud,
  Database,
  File,
  FileCode,
  FileText,
  Image,
  Mic,
  Moon,
  Music,
  Sparkles,
  Trash2,
  Upload,
  Video,
  WandSparkles,
  X,
  Star,
  Users,
  TrendingUp,
  Target,
  Lightbulb,
  Award,
  MessageCircle,
  Camera,
  FolderOpen,
  BarChart3,
  Heart,
  Share2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import AppShell from "../components/AppShell";
import styles from "./brain-admin.module.css";
import { useBrainAdminRealtime } from "../../hooks/brain-admin/useBrainAdminRealtime";
import { useBrainAdminFileUpload } from "../../hooks/brain-admin/useBrainAdminFileUpload";
import { useBrainAdminVoice } from "../../hooks/brain-admin/useBrainAdminVoice";
import { useBrainAdminNotes } from "../../hooks/brain-admin/useBrainAdminNotes";
import { useBrainAdminQR } from "../../hooks/brain-admin/useBrainAdminQR";
import { useBrainAdminAuth } from "../../hooks/brain-admin/useBrainAdminAuth";
import { useBrainAdminData } from "../../hooks/brain-admin/useBrainAdminData";
import { LoginScreen } from "./components/LoginScreen";
import { CommandCenterHero } from "./components/CommandCenterHero";
import { TabBar } from "./components/TabBar";
import { Toast } from "./components/Toast";
import { SmartDropzone } from "./components/SmartDropzone";
import { LearnedTodayCard } from "./components/LearnedTodayCard";
import { NewSignalsCard } from "./components/NewSignalsCard";
import { LearningTimeline } from "./components/LearningTimeline";
import { VoiceModal } from "./components/VoiceModal";
import { NotesModal } from "./components/NotesModal";
import { QRModal } from "./components/QRModal";

type BrainSummary = {
  uploadedConversations: number;
  premiumFeature: boolean;
  storage: {
    local: boolean;
    s3: string;
    supabase: string;
  };
  metrics: {
    brainConfidence: number;
    emotionalUnderstanding: number;
    campaignAccuracy: number;
    conversionIntelligence: number;
    toneConsistency: number;
  };
  learningMetrics: {
    brainConfidence: number;
    estiloAprendido: number;
    talentoEquipo: number;
    satisfaccionSocial: number;
    oportunidades: number;
  };
  topConvertingTones: { label: string; count: number }[];
  strongestEmotionalTriggers: { label: string; count: number }[];
  serviceDemand: { label: string; count: number }[];
  bestPerformingResponses: string[];
  lastUploads: {
    id: string;
    originalName: string;
    sourceType: string;
    uploadedAt: string;
    leadWarmth: string;
    bookingIntent: string;
  }[];
  pendingSuggestions?: {
    id: string;
    title: string;
    category: string;
    impact: number;
    status: string;
  }[];
  // New learning system fields
  learningSignals?: {
    id: string;
    category: string;
    title: string;
    impact: number;
    status: string;
    createdAt: string;
    source: string;
  }[];
  newSignalsCount?: number;
  talentEntries?: {
    name: string;
    strengths: string[];
    detectedAt: string;
    signals: string[];
  }[];
  satisfactionSignals?: {
    type: string;
    text: string;
    source: string;
    detectedAt: string;
  }[];
  campaignOpportunities?: {
    id: string;
    title: string;
    narrative: string;
    signals: string[];
    impact: number;
    status: string;
  }[];
  workEntries?: {
    id: string;
    filename: string;
    serviceType: string;
    quality: number;
    style: string;
    campaignPotential: boolean;
    isFeatured: boolean;
    uploadedAt: string;
    folder: string;
  }[];
};

const emptySummary: BrainSummary = {
  uploadedConversations: 0,
  premiumFeature: true,
  storage: {
    local: true,
    s3: "optional_ready",
    supabase: "optional_ready",
  },
  metrics: {
    brainConfidence: 0,
    emotionalUnderstanding: 0,
    campaignAccuracy: 0,
    conversionIntelligence: 0,
    toneConsistency: 0,
  },
  learningMetrics: {
    brainConfidence: 0,
    estiloAprendido: 0,
    talentoEquipo: 0,
    satisfaccionSocial: 0,
    oportunidades: 0,
  },
  topConvertingTones: [],
  strongestEmotionalTriggers: [],
  serviceDemand: [],
  bestPerformingResponses: [],
  lastUploads: [],
  pendingSuggestions: [],
  learningSignals: [],
  newSignalsCount: 0,
  talentEntries: [],
  satisfactionSignals: [],
  campaignOpportunities: [],
  workEntries: [],
};

export default function BrainAdminPage() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [modoTecnico, setModoTecnico] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"aprender" | "trabajos" | "talento" | "satisfaccion" | "campanas">("aprender");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [systemHealth] = useState({
    uptime: "0h 2m",
    agentsActive: 4,
    agentsTotal: 8,
    memoryUsed: "1.2 GB",
    memoryTotal: "5120 MB",
    lastSync: new Date().toLocaleTimeString("es-CL", { timeZone: "America/Santiago", hour: "2-digit", minute: "2-digit" }),
  });

  const {
    summary,
    setSummary,
    storageStats,
    nightQueue,
    toastMessage,
    toastVisible,
    loadSummary,
    loadStorageStats,
    loadNightQueue,
    showToast,
  } = useBrainAdminData(emptySummary);

  const { incomingUpload } = useBrainAdminRealtime(
    useCallback((newSummary: unknown) => {
      setSummary(newSummary as BrainSummary ?? emptySummary);
    }, [])
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkState = () => {
      setModoTecnico(window.localStorage.getItem("modo-tecnico-ia") === "true");
    };
    checkState();
    window.addEventListener("modo-tecnico-ia-changed", checkState);
    return () => window.removeEventListener("modo-tecnico-ia-changed", checkState);
  }, []);

  const metrics = useMemo(
    () => Object.entries(summary.metrics) as Array<[keyof BrainSummary["metrics"], number]>,
    [summary.metrics]
  );

  const {
    isAuthenticated,
    isCheckingAuth,
    password,
    loginError,
    localDevKeyHint,
    isSuperAdmin,
    setPassword,
    handleLogin,
  } = useBrainAdminAuth({
    loadSummary,
    loadStorageStats,
    loadNightQueue,
  });

  const {
    selectedFile,
    uploadStatus,
    isUploading,
    notes,
    learnedToday,
    newSignals,
    uploadLog,
    handleFileChange,
    handleUpload,
    handleClearFile,
    setNotes,
    setUploadStatus,
  } = useBrainAdminFileUpload({
    onUploadSuccess: async ({ summary: newSummary }) => {
      if (newSummary) {
        setSummary(newSummary as BrainSummary);
      }
    },
    loadStorageStats,
    showToast,
  });

  const {
    isRecording,
    voiceTranscript,
    voiceStatus,
    isSavingVoice,
    formattedRecordingTime,
    startVoiceRecording,
    stopVoiceRecording,
    saveVoiceLearning: saveVoiceLearningFromHook,
    updateSuggestion,
    setVoiceTranscript,
    closeVoiceModal: closeVoiceModalFromHook,
  } = useBrainAdminVoice({
    onSaveSuccess: (newSummary) => {
      setSummary(newSummary as BrainSummary);
    },
    setUploadStatus,
  });

  const closeVoiceModal = () => {
    closeVoiceModalFromHook();
    setIsVoiceModalOpen(false);
  };

  const saveVoiceLearning = async () => {
    await saveVoiceLearningFromHook();
    setIsVoiceModalOpen(false);
  };

  const {
    noteText,
    auditResult,
    isAuditing,
    isSavingNote,
    auditNote,
    saveNote: saveNoteFromHook,
    openNotesModal: openNotesModalFromHook,
    closeNotesModal: closeNotesModalFromHook,
    setNoteText,
  } = useBrainAdminNotes({
    showToast,
    loadSummary,
  });

  const openNotesModal = () => {
    openNotesModalFromHook();
    setIsNotesModalOpen(true);
  };

  const closeNotesModal = () => {
    closeNotesModalFromHook();
    setIsNotesModalOpen(false);
  };

  const saveNote = async () => {
    await saveNoteFromHook();
    setIsNotesModalOpen(false);
  };

  // ─── QR upload ───────────────────────────────────────────────
  const {
    qrToken,
    qrCodeUrl,
    qrShortCode,
    qrLocalIP,
    qrPort,
    generateQRToken,
    closeQRModal: closeQRModalFromHook,
  } = useBrainAdminQR({
    showToast,
    onQRModalOpen: () => setIsQRModalOpen(true),
  });

  const closeQRModal = () => {
    closeQRModalFromHook();
    setIsQRModalOpen(false);
  };

  return (
    <AppShell>
      <main className={styles.brainPage}>
        {isCheckingAuth || !isAuthenticated ? (
          <LoginScreen
            isCheckingAuth={isCheckingAuth}
            isAuthenticated={isAuthenticated}
            password={password}
            loginError={loginError}
            localDevKeyHint={localDevKeyHint}
            onPasswordChange={setPassword}
            onLogin={handleLogin}
          />
        ) : (
          <>
            <CommandCenterHero
              learningMetrics={summary.learningMetrics}
              systemHealth={systemHealth}
            />

            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* ═══════════════════════════════════════════════════════
               TAB: APRENDER — Smart dropzone + Qué aprendió hoy
               ═══════════════════════════════════════════════════════ */}
            {activeTab === "aprender" ? (
              <>
                <SmartDropzone
                  selectedFile={selectedFile}
                  isUploading={isUploading}
                  uploadStatus={uploadStatus}
                  uploadLog={uploadLog}
                  onFileChange={handleFileChange}
                  onUpload={handleUpload}
                  onClearFile={handleClearFile}
                  onVoiceClick={() => setIsVoiceModalOpen(true)}
                  onNotesClick={openNotesModal}
                  onQRClick={generateQRToken}
                />

                {/* "Qué aprendió hoy el Brain" */}
                {learnedToday ? (
                  <LearnedTodayCard learnedToday={learnedToday} />
                ) : null}

                {/* Nuevas señales detectadas */}
                <NewSignalsCard newSignals={newSignals} />

                {/* Actividad nocturna */}
                <article className={styles.nightActivityCard}>
                  <div className={styles.nightActivityHeader}>
                    <div>
                      <span>Procesamiento automático</span>
                      <h2>Actividad nocturna</h2>
                    </div>
                    <div className={styles.nightActivityBadge} data-status={nightQueue && nightQueue.pending > 0 ? "processing" : "idle"}>
                      <Moon size={14} strokeWidth={1.8} />
                      {nightQueue && nightQueue.pending > 0
                        ? `${nightQueue.pending} pendiente${nightQueue.pending !== 1 ? "s" : ""}`
                        : "Sin actividad"}
                    </div>
                  </div>
                  <div className={styles.nightActivityBody}>
                    {nightQueue && nightQueue.jobs && nightQueue.jobs.length > 0 ? (
                      nightQueue.jobs.slice(0, 5).map((job) => {
                        const jobLabels: Record<string, string> = {
                          transcribe_audio: "Transcripción de audio",
                          analyze_video: "Análisis de video",
                          extract_pdf: "Extracción de PDF",
                          batch_ocr: "OCR de imágenes",
                          emotional_clustering: "Clustering emocional",
                          campaign_generation: "Generación de campañas",
                          talent_analysis: "Análisis de talento",
                          social_satisfaction_analysis: "Análisis de satisfacción",
                        };
                        const jobIcons: Record<string, React.ReactNode> = {
                          transcribe_audio: <Mic size={14} strokeWidth={1.8} />,
                          analyze_video: <Video size={14} strokeWidth={1.8} />,
                          extract_pdf: <FileText size={14} strokeWidth={1.8} />,
                          batch_ocr: <Image size={14} strokeWidth={1.8} />,
                          emotional_clustering: <Heart size={14} strokeWidth={1.8} />,
                          campaign_generation: <Target size={14} strokeWidth={1.8} />,
                          talent_analysis: <Users size={14} strokeWidth={1.8} />,
                          social_satisfaction_analysis: <BarChart3 size={14} strokeWidth={1.8} />,
                        };
                        const statusLabels: Record<string, string> = {
                          completed: "Completado",
                          failed: "Falló",
                          processing: "Procesando",
                          queued: "En cola",
                        };
                        return (
                          <div key={job.id} className={styles.nightJobRow}>
                            <div className={styles.nightJobIcon}>
                              {jobIcons[job.type] ?? <Brain size={14} strokeWidth={1.8} />}
                            </div>
                            <div className={styles.nightJobBody}>
                              <strong>{jobLabels[job.type] ?? job.type}</strong>
                              <span>{new Date(job.createdAt).toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <span className={styles.nightJobStatus} data-status={job.status}>
                              {statusLabels[job.status] ?? job.status}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className={styles.nightEmpty}>
                        <Moon size={20} strokeWidth={1.5} style={{ opacity: 0.3, marginBottom: 6 }} />
                        <p>Sin actividad nocturna programada. Los archivos pesados se procesan automáticamente en segundo plano.</p>
                      </div>
                    )}
                  </div>
                </article>

                {/* Suggestions card (compact) */}
                {summary.pendingSuggestions && summary.pendingSuggestions.length > 0 ? (
                  <article className={styles.suggestionsCard}>
                    <div className={styles.cardHeader}>
                      <div>
                        <span>Recomendaciones activas</span>
                        <h2>Sugerencias del Brain</h2>
                      </div>
                      <WandSparkles size={18} strokeWidth={1.7} />
                    </div>
                    <div className={styles.suggestionRows}>
                      {summary.pendingSuggestions.map((suggestion) => (
                        <div key={suggestion.id}>
                          <div>
                            <strong>{suggestion.title}</strong>
                            <span>{suggestion.category} · impacto {suggestion.impact}%</span>
                          </div>
                          <button onClick={() => updateSuggestion(suggestion.id, "applied")} type="button">Apply</button>
                          <button onClick={() => updateSuggestion(suggestion.id, "dismissed")} type="button">Dismiss</button>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                {/* Storage section (compact, admin only) */}
                <article className={styles.memorySection}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span>Uso de almacenamiento</span>
                      <h2>Memoria del Brain</h2>
                    </div>
                    <Database size={18} strokeWidth={1.7} />
                  </div>
                  <p className={styles.storageSubtitle}>Archivos, cuota y actividad del aprendizaje del negocio.</p>

                  {storageStats ? (
                    <>
                      <div className={styles.quotaBarContainer}>
                        <div className={styles.quotaBarHeader}>
                          <span className={styles.quotaBarLabel}>
                            {storageStats.totalFormatted as string} de {storageStats.quotaFormatted as string} usados
                          </span>
                          <span className={styles.quotaBarPercent}>{storageStats.usedPercent as number}%</span>
                        </div>
                        <div className={styles.quotaBarTrack}>
                          <div
                            className={styles.quotaBarFill}
                            data-level={
                              (storageStats.usedPercent as number) >= 95 ? "danger"
                              : (storageStats.usedPercent as number) >= 90 ? "warning"
                              : (storageStats.usedPercent as number) >= 80 ? "attention"
                              : "normal"
                            }
                            style={{ width: `${Math.min(storageStats.usedPercent as number, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className={styles.formatCards}>
                        {(["image", "video", "audio", "pdf", "text", "markdown"] as const).map((type) => {
                          const t = (storageStats.byType as Record<string, { bytes: number; files: number; lastUploadedAt: string }>)[type];
                          const icons: Record<string, React.ReactNode> = {
                            image: <Image size={18} strokeWidth={1.6} />,
                            video: <Video size={18} strokeWidth={1.6} />,
                            audio: <Music size={18} strokeWidth={1.6} />,
                            pdf: <FileText size={18} strokeWidth={1.6} />,
                            text: <File size={18} strokeWidth={1.6} />,
                            markdown: <FileCode size={18} strokeWidth={1.6} />,
                          };
                          const labels: Record<string, string> = {
                            image: "Imágenes",
                            video: "Videos",
                            audio: "Audios",
                            pdf: "PDF",
                            text: "Textos",
                            markdown: "Markdown",
                          };
                          const bytes = t?.bytes ?? 0;
                          const files = t?.files ?? 0;
                          const lastUp = t?.lastUploadedAt;
                          const sizeStr = bytes === 0 ? "0 B" : (() => {
                            const units = ["B", "KB", "MB", "GB"];
                            const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
                            const val = bytes / Math.pow(1024, i);
                            return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
                          })();

                          return (
                            <div key={type} className={styles.formatCard}>
                              <span className={styles.formatCardIcon}>{icons[type]}</span>
                              <div className={styles.formatCardBody}>
                                <strong className={styles.formatCardLabel}>{labels[type]}</strong>
                                <span className={styles.formatCardMeta}>
                                  {files} archivo{files !== 1 ? "s" : ""} · {sizeStr}
                                </span>
                                {lastUp ? (
                                  <span className={styles.formatCardLast}>
                                    Último: {new Date(lastUp).toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short" })}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {storageStats.lastUploadedFile ? (
                        <div className={styles.activityRow}>
                          <span className={styles.activityLabel}>Última actividad</span>
                          <div className={styles.activityBody}>
                            <strong>{storageStats.lastUploadedFile as string}</strong>
                            <span>
                              {new Date(storageStats.lastUploadedAt as string).toLocaleString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              {storageStats.lastUploadedFolder ? ` · ${storageStats.lastUploadedFolder as string}` : ""}
                            </span>
                          </div>
                        </div>
                      ) : null}

                      {(storageStats.daysSinceLastUpload as number) >= 0 ? (
                        <div
                          className={styles.inactivityAlert}
                          data-level={storageStats.inactivityLevel as string}
                        >
                          {storageStats.inactivityLevel === "active" ? (
                            <><Brain size={14} strokeWidth={1.8} style={{ marginRight: 6, verticalAlign: "middle" }} /> Actividad reciente · {storageStats.daysSinceLastUpload as number} día{(storageStats.daysSinceLastUpload as number) !== 1 ? "s" : ""}</>
                          ) : storageStats.inactivityLevel === "attention" ? (
                            <><Sparkles size={14} strokeWidth={1.8} style={{ marginRight: 6, verticalAlign: "middle" }} /> {storageStats.daysSinceLastUpload as number} días sin nuevo contenido · programa una sesión de aprendizaje</>
                          ) : storageStats.inactivityLevel === "warning" ? (
                            <><Cloud size={14} strokeWidth={1.8} style={{ marginRight: 6, verticalAlign: "middle" }} /> {storageStats.daysSinceLastUpload as number} días sin actividad · el Brain necesita contenido fresco</>
                          ) : (
                            <><X size={14} strokeWidth={1.8} style={{ marginRight: 6, verticalAlign: "middle" }} /> {storageStats.daysSinceLastUpload as number} días sin contenido · el conocimiento del negocio se está quedando obsoleto</>
                          )}
                        </div>
                      ) : (
                        <div className={styles.inactivityAlert} data-level="active">
                          <Brain size={14} strokeWidth={1.8} style={{ marginRight: 6, verticalAlign: "middle" }} /> Sin contenido aún · sube tu primer archivo para iniciar el aprendizaje
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.storageLoading}>
                      <span>Cargando estadísticas de almacenamiento...</span>
                    </div>
                  )}

                  <button
                    className={styles.techToggle}
                    onClick={() => setShowTechDetails((prev) => !prev)}
                    type="button"
                  >
                    {showTechDetails ? "Ocultar" : "Mostrar"} detalles técnicos
                  </button>

                  {showTechDetails ? (
                    <div className={styles.techDetails}>
                      <div className={styles.techDetailsGrid}>
                        <div className={styles.techDetailItem}>
                          <span className={styles.techDetailLabel}>Almacenamiento local</span>
                          <span className={styles.techDetailValue}>✅ Activo</span>
                        </div>
                        <div className={styles.techDetailItem}>
                          <span className={styles.techDetailLabel}>S3</span>
                          <span className={styles.techDetailValue}>⚪ Ready</span>
                        </div>
                        <div className={styles.techDetailItem}>
                          <span className={styles.techDetailLabel}>Supabase</span>
                          <span className={styles.techDetailValue}>⚪ Ready</span>
                        </div>
                        <div className={styles.techDetailItem}>
                          <span className={styles.techDetailLabel}>Cuota configurada</span>
                          <span className={styles.techDetailValue}>{storageStats?.quotaMB as number ?? 5120} MB</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              </>
            ) : null}

            {/* ═══════════════════════════════════════════════════════
               TAB: TRABAJOS REALIZADOS
               ═══════════════════════════════════════════════════════ */}
            {activeTab === "trabajos" ? (
              <section className={styles.tabSection}>
                <article className={styles.tabContentCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span>Portafolio visual</span>
                      <h2>Trabajos realizados</h2>
                    </div>
                    <FolderOpen size={18} strokeWidth={1.7} />
                  </div>
                  <p className={styles.tabSectionDesc}>
                    Trabajos destacados del salón organizados por tipo.
                  </p>
                  {summary.workEntries && summary.workEntries.length > 0 ? (
                    <div className={styles.workGrid}>
                      {summary.workEntries.map((entry) => (
                        <div key={entry.id} className={styles.workCard}>
                          <div className={styles.workCardHeader}>
                            <strong>{entry.filename}</strong>
                            {entry.isFeatured ? <Award size={14} strokeWidth={1.8} /> : null}
                          </div>
                          <div className={styles.workCardBody}>
                            <span className={styles.workServiceType}>{entry.serviceType}</span>
                            <div className={styles.workMeta}>
                              <span>Calidad: {entry.quality}%</span>
                              <span>Estilo: {entry.style}</span>
                            </div>
                            {entry.campaignPotential ? (
                              <span className={styles.workCampaignBadge}>Potencial de campaña</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyTab}>
                      <Camera size={32} strokeWidth={1.5} />
                      <p>Aún no hay trabajos registrados. Los trabajos aparecerán aquí cuando se suban fotos, videos o archivos de trabajos realizados.</p>
                    </div>
                  )}
                </article>
              </section>
            ) : null}

            {/* ═══════════════════════════════════════════════════════
               TAB: TALENTO DEL EQUIPO
               ═══════════════════════════════════════════════════════ */}
            {activeTab === "talento" ? (
              <section className={styles.tabSection}>
                <article className={styles.tabContentCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span>Fortalezas detectadas</span>
                      <h2>Talento del equipo</h2>
                    </div>
                    <Users size={18} strokeWidth={1.7} />
                  </div>
                  <p className={styles.tabSectionDesc}>
                    Talentos y fortalezas del equipo detectados a partir de las conversaciones y aprendizajes registrados.
                  </p>
                  {summary.talentEntries && summary.talentEntries.length > 0 ? (
                    <div className={styles.talentList}>
                      {summary.talentEntries.map((entry, i) => (
                        <div key={i} className={styles.talentItem}>
                          <div className={styles.talentHeader}>
                            <Star size={16} strokeWidth={1.7} />
                            <strong>{entry.name}</strong>
                          </div>
                          <div className={styles.talentStrengths}>
                            {entry.strengths.map((s, j) => (
                              <span key={j} className={styles.talentStrengthPill}>{s}</span>
                            ))}
                          </div>
                          {entry.signals.length > 0 ? (
                            <span className={styles.talentSignals}>
                              {entry.signals.length} señal{entry.signals.length !== 1 ? "es" : ""} asociada{entry.signals.length !== 1 ? "s" : ""}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyTab}>
                      <Users size={32} strokeWidth={1.5} />
                      <p>Aún no se ha detectado talento del equipo. Las señales de talento aparecerán cuando el Brain procese conversaciones que mencionen estilistas, profesionales o talento del equipo.</p>
                    </div>
                  )}
                </article>
              </section>
            ) : null}

            {/* ═══════════════════════════════════════════════════════
               TAB: SATISFACCIÓN SOCIAL
               ═══════════════════════════════════════════════════════ */}
            {activeTab === "satisfaccion" ? (
              <section className={styles.tabSection}>
                <article className={styles.tabContentCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span>Opinión de clientes</span>
                      <h2>Satisfacción social</h2>
                    </div>
                    <Heart size={18} strokeWidth={1.7} />
                  </div>
                  <p className={styles.tabSectionDesc}>
                    Señales de satisfacción, testimonios y oportunidades de reseña detectadas en las conversaciones.
                  </p>
                  {summary.satisfactionSignals && summary.satisfactionSignals.length > 0 ? (
                    <div className={styles.satisfactionList}>
                      {summary.satisfactionSignals.map((signal, i) => (
                        <div key={i} className={styles.satisfactionItem}>
                          <div className={styles.satisfactionIcon}>
                            {signal.type === "positive" ? <Heart size={16} strokeWidth={1.7} /> :
                             signal.type === "testimonial" ? <MessageCircle size={16} strokeWidth={1.7} /> :
                             <Share2 size={16} strokeWidth={1.7} />}
                          </div>
                          <div className={styles.satisfactionBody}>
                            <p>{signal.text}</p>
                            <span className={styles.satisfactionMeta}>
                              {signal.source} · {new Date(signal.detectedAt).toLocaleDateString("es-CL", { timeZone: "America/Santiago", day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyTab}>
                      <Heart size={32} strokeWidth={1.5} />
                      <p>Aún no hay señales de satisfacción. Aparecerán cuando el Brain detecte comentarios positivos, testimonios o reseñas en las conversaciones.</p>
                    </div>
                  )}
                </article>
              </section>
            ) : null}

            {/* ═══════════════════════════════════════════════════════
               TAB: OPORTUNIDADES DE CAMPAÑA
               ═══════════════════════════════════════════════════════ */}
            {activeTab === "campanas" ? (
              <section className={styles.tabSection}>
                <article className={styles.tabContentCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <span>Ideas para campañas</span>
                      <h2>Oportunidades de campaña</h2>
                    </div>
                    <Target size={18} strokeWidth={1.7} />
                  </div>
                  <p className={styles.tabSectionDesc}>
                    Oportunidades de campaña detectadas por el Brain a partir de patrones de conversación, servicios demandados y señales emocionales.
                  </p>
                  {summary.campaignOpportunities && summary.campaignOpportunities.length > 0 ? (
                    <div className={styles.campaignList}>
                      {summary.campaignOpportunities.map((camp) => (
                        <div key={camp.id} className={styles.campaignItem}>
                          <div className={styles.campaignHeader}>
                            <Lightbulb size={16} strokeWidth={1.7} />
                            <strong>{camp.title}</strong>
                            <span className={styles.campaignImpact}>Impacto: {camp.impact}%</span>
                          </div>
                          <p className={styles.campaignNarrative}>{camp.narrative}</p>
                          {camp.signals.length > 0 ? (
                            <div className={styles.campaignSignals}>
                              {camp.signals.map((s, i) => (
                                <span key={i} className={styles.campaignSignalPill}>{s}</span>
                              ))}
                            </div>
                          ) : null}
                          <span className={styles.campaignStatus} data-status={camp.status}>
                            {camp.status === "new" ? "Nueva" : camp.status === "active" ? "Activa" : "Completada"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyTab}>
                      <Target size={32} strokeWidth={1.5} />
                      <p>Aún no hay oportunidades de campaña. El Brain generará oportunidades cuando detecte patrones repetidos de servicios, emociones o conversaciones que puedan convertirse en campañas.</p>
                    </div>
                  )}
                </article>
              </section>
            ) : null}

            {/* ═══════════════════════════════════════════════════════
               Timeline de aprendizaje (always visible at bottom)
               ═══════════════════════════════════════════════════════ */}
            <LearningTimeline lastUploads={summary.lastUploads} />
          </>
        )}
        <Toast message={toastMessage} visible={toastVisible} />
        <VoiceModal
          isOpen={isVoiceModalOpen}
          isRecording={isRecording}
          isSavingVoice={isSavingVoice}
          voiceTranscript={voiceTranscript}
          voiceStatus={voiceStatus}
          formattedRecordingTime={formattedRecordingTime}
          onStartRecording={startVoiceRecording}
          onStopRecording={stopVoiceRecording}
          onTranscriptChange={setVoiceTranscript}
          onSave={saveVoiceLearning}
          onClose={closeVoiceModal}
        />
        <NotesModal
          isOpen={isNotesModalOpen}
          noteText={noteText}
          isAuditing={isAuditing}
          isSavingNote={isSavingNote}
          auditResult={auditResult}
          onNoteTextChange={setNoteText}
          onAudit={auditNote}
          onSave={saveNote}
          onClose={closeNotesModal}
        />
        <QRModal
          isOpen={isQRModalOpen}
          qrCodeUrl={qrCodeUrl}
          qrShortCode={qrShortCode}
          qrLocalIP={qrLocalIP}
          qrPort={qrPort}
          incomingUpload={incomingUpload}
          summary={summary}
          onRegenerate={generateQRToken}
          onClose={closeQRModal}
        />
      </main>
    </AppShell>
  );
}
