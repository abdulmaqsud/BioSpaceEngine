"use client";

import {useEffect, useMemo, useState} from "react";
import type {EChartsOption} from "echarts";
import {useParams} from "next/navigation";
import Link from "next/link";
import {apiService, Study, EvidenceSentence, Section} from "../../../lib/api";
import {ReactECharts} from "../../../components/charts/ReactECharts";
import {
  Atom,
  BadgeCheck,
  BarChart3,
  BookMarked,
  BookOpen,
  ClipboardList,
  Clock,
  Dna,
  LineChart,
  Quote,
  PieChart,
  Rocket,
  SatelliteDish,
  Sparkles,
  Target,
} from "lucide-react";

type TabKey = "overview" | "evidence" | "entities";

type StudyEntity = {
  id: number;
  text: string;
  entity_type: string;
  start_char: number | null;
  end_char: number | null;
};

const truncateLabel = (value: string, maxLength = 22) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}…` : value;

export default function PaperDetailPage() {
  const params = useParams<{id: string | string[]}>();
  const rawStudyId = params?.id;
  const studyId = Array.isArray(rawStudyId) ? rawStudyId[0] : rawStudyId;

  const [study, setStudy] = useState<Study | null>(null);
  const [evidence, setEvidence] = useState<EvidenceSentence[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [entities, setEntities] = useState<StudyEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [compareList, setCompareList] = useState<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedCompare = window.localStorage.getItem("compareList");
    if (storedCompare) {
      try {
        const parsed = JSON.parse(storedCompare);
        if (Array.isArray(parsed)) {
          setCompareList(
            parsed.filter((value): value is number => typeof value === "number")
          );
        }
      } catch (err) {
        console.warn("Failed to parse compare list from local storage", err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!studyId) {
      setError("Missing study identifier.");
      setLoading(false);
      return;
    }

    const loadStudy = async () => {
      try {
        setLoading(true);

        const [studyData, evidenceData, sectionsData, rawEntities] =
          await Promise.all([
            apiService.getStudy(studyId),
            apiService.getStudyEvidence(studyId),
            apiService.getStudySections(studyId),
            apiService.getStudyEntities(studyId),
          ]);

        setStudy(studyData);
        setEvidence(evidenceData ?? []);
        setSections(sectionsData ?? []);
        const normalizedEntities = (rawEntities ?? [])
          .filter((entity) => Boolean(entity.text ?? entity.name))
          .map<StudyEntity>((entity) => ({
            id: entity.id,
            text: entity.text ?? entity.name ?? `Entity-${entity.id}`,
            entity_type: entity.entity_type ?? "unknown",
            start_char: entity.start_char ?? null,
            end_char: entity.end_char ?? null,
          }));
        setEntities(normalizedEntities);
        setError(null);
      } catch (err) {
        console.error("Error loading study data:", err);
        setError("Failed to load study intelligence.");
      } finally {
        setLoading(false);
      }
    };

    loadStudy();
  }, [studyId]);

  const isInCompareList = study ? compareList.includes(study.id) : false;

  const evidenceHighlights = useMemo(() => evidence.slice(0, 3), [evidence]);
  const sectionHighlights = useMemo(() => {
    // Only show Abstract and Introduction sections
    const filteredSections = sections.filter(section => 
      section.section_type === 'abstract' || section.section_type === 'introduction'
    );
    return filteredSections.slice(0, 2);
  }, [sections]);

  const uniqueEntityTypes = useMemo(
    () => new Set(entities.map((entity) => entity.entity_type)).size,
    [entities]
  );

  const readingTimeMinutes = useMemo(() => {
    if (!study?.abstract) {
      return null;
    }
    const wordCount = study.abstract.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [study?.abstract]);

  const entityTypeData = useMemo(() => {
    const counts = entities.reduce<Record<string, number>>((acc, entity) => {
      const key = (entity.entity_type || "unknown").toLowerCase();
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([name, value]) => ({name, value}))
      .sort((a, b) => b.value - a.value);
  }, [entities]);

  const entityTypeDistribution = useMemo(() => {
    const limit = isMobile ? 6 : 12;
    const limited = entityTypeData.slice(0, limit);
    if (entityTypeData.length > limit) {
      const otherValue = entityTypeData
        .slice(limit)
        .reduce((sum, entry) => sum + entry.value, 0);
      if (otherValue > 0) {
        limited.push({name: "Other entities", value: otherValue});
      }
    }
    return limited;
  }, [entityTypeData, isMobile]);

  const sectionLengthData = useMemo(
    () => {
      // Normalize section names and remove duplicates
      const normalizedSections = sections
        .map((section) => {
          const words = section.content
            ? section.content.trim().split(/\s+/).length
            : 0;
          const label =
            section.title && section.title.trim().length > 0
              ? section.title
              : section.section_type;
          return {
            id: section.id,
            order: section.order ?? 0,
            sectionType: section.section_type,
            label: label.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim(),
            words,
          };
        })
        .sort((a, b) => a.order - b.order);

      // Remove duplicates by combining sections with same normalized label
      const uniqueSections = new Map();
      normalizedSections.forEach(section => {
        const key = section.label;
        if (uniqueSections.has(key)) {
          const existing = uniqueSections.get(key);
          existing.words += section.words;
        } else {
          uniqueSections.set(key, { ...section });
        }
      });

      return Array.from(uniqueSections.values());
    },
    [sections]
  );

  const sectionLengthSeries = useMemo(() => {
    const limit = isMobile ? 6 : 12;
    const sortedByWords = sectionLengthData
      .slice()
      .sort((a, b) => b.words - a.words);
    const limited = sortedByWords.slice(0, limit);
    if (sortedByWords.length > limit) {
      const otherWords = sortedByWords
        .slice(limit)
        .reduce((sum, entry) => sum + entry.words, 0);
      if (otherWords > 0) {
        limited.push({
          id: -1,
          order: Number.MAX_SAFE_INTEGER,
          sectionType: "other",
          label: "Other sections",
          words: otherWords,
        });
      }
    }
    return limited;
  }, [sectionLengthData, isMobile]);

  const evidenceTimelinePoints = useMemo(
    () =>
      evidence
        .slice()
        .sort((a, b) => a.sentence_index - b.sentence_index)
        .map((item) => ({
          index: item.sentence_index,
          length: item.sentence_text.length,
          label: item.section_title ?? "Unassigned",
          charStart: item.char_start ?? null,
          charEnd: item.char_end ?? null,
        })),
    [evidence]
  );

  const evidenceSectionSeries = useMemo(() => {
    const counts = evidence.reduce<Record<string, number>>((acc, item) => {
      const key = item.section_title?.trim() || "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(counts)
      .map(([label, value]) => ({label, value}))
      .sort((a, b) => b.value - a.value);

    const limit = isMobile ? 6 : 10;
    const limited = entries.slice(0, limit);
    if (entries.length > limit) {
      const otherValue = entries
        .slice(limit)
        .reduce((sum, entry) => sum + entry.value, 0);
      if (otherValue > 0) {
        limited.push({label: "Other sections", value: otherValue});
      }
    }
    return limited;
  }, [evidence, isMobile]);

  const entityTypeChartOption = useMemo<EChartsOption>(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(34, 211, 238, 0.35)",
        textStyle: {
          color: "#e2e8f0",
        },
        formatter: (params) => {
          if (entityTypeDistribution.length === 0) {
            return "No entities detected";
          }
          const {name, value, percent} = params as {
            name?: string;
            value?: number;
            percent?: number;
          };
          return `${name ?? "Unknown"}<br/>Entities: ${value ?? 0}<br/>Share: ${
            percent !== undefined ? percent.toFixed?.(1) ?? percent : "0"
          }%`;
        },
      },
      legend: {
        top: "bottom",
        textStyle: {
          color: "rgba(203, 213, 225, 0.85)",
          fontSize: 11,
          letterSpacing: 1.5,
        },
      },
      series: [
        {
          name: "Entity Types",
          type: "pie",
          radius: ["35%", "70%"],
          avoidLabelOverlap: false,
          padAngle: 3,
          itemStyle: {
            borderRadius: 10,
            borderColor: "rgba(10, 15, 25, 0.9)",
            borderWidth: 2,
          },
          label: {
            show: entityTypeDistribution.length > 0,
            color: "#e2e8f0",
            lineHeight: 16,
            formatter: "{b}\n{c} entities",
          },
          labelLine: {
            length: 14,
            length2: 10,
            lineStyle: {
              color: "rgba(34, 211, 238, 0.6)",
            },
          },
          data:
            entityTypeDistribution.length > 0
              ? entityTypeDistribution
              : [{name: "No entities detected", value: 1}],
        },
      ],
      color: [
        "#22d3ee",
        "#a855f7",
        "#f97316",
        "#facc15",
        "#fb7185",
        "#34d399",
        "#60a5fa",
        "#f472b6",
      ],
    }),
    [entityTypeDistribution]
  );

  const sectionLengthChartOption = useMemo<EChartsOption>(() => {
    const categories =
      sectionLengthSeries.length > 0
        ? sectionLengthSeries.map((section) => section.label)
        : ["No sections"];
    const values =
      sectionLengthSeries.length > 0
        ? sectionLengthSeries.map((section) => section.words)
        : [0];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(59, 130, 246, 0.35)",
        textStyle: {
          color: "#e2e8f0",
        },
        formatter: (params) => {
          const paramArray = (Array.isArray(params) ? params : [params]) as Array<
            {
              axisValueLabel?: string;
              value?: number;
              dataIndex?: number;
            }
          >;
          const [first] = paramArray;
          if (!first || typeof first.value !== "number") {
            return "No sections available";
          }
          const dataIndex =
            typeof first.dataIndex === "number"
              ? first.dataIndex
              : -1;
          const originalLabel =
            typeof dataIndex === "number" && dataIndex >= 0
              ? sectionLengthSeries[dataIndex]?.label ?? first.axisValueLabel
              : first.axisValueLabel;
          const fallbackLabel =
            typeof first.axisValueLabel === "string"
              ? first.axisValueLabel
              : `${first.value}`;
          return `${originalLabel ?? fallbackLabel}<br/>Word count: ${first.value}`;
        },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: {
          color: "rgba(203, 213, 225, 0.78)",
          interval: 0,
          rotate: categories.length > 6 ? 32 : 0,
          fontSize: 11,
          formatter: (value: string | number) =>
            typeof value === "string" ? truncateLabel(value) : `${value}`,
        },
        axisLine: {
          lineStyle: {
            color: "rgba(59, 130, 246, 0.35)",
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: "value",
        name: "Word count",
        nameTextStyle: {
          color: "rgba(148, 163, 184, 0.95)",
          fontSize: 12,
          padding: [0, 0, 12, 0],
        },
        axisLabel: {
          color: "rgba(203, 213, 225, 0.7)",
        },
        splitLine: {
          lineStyle: {
            color: "rgba(71, 85, 105, 0.35)",
          },
        },
      },
      series: [
        {
          type: "bar",
          name: "Words",
          data: values,
          barWidth: "55%",
          itemStyle: {
            color: "#60a5fa",
            borderRadius: [10, 10, 3, 3],
            shadowBlur: 12,
            shadowColor: "rgba(14, 165, 233, 0.35)",
            shadowOffsetY: 6,
          },
          emphasis: {
            itemStyle: {
              color: "#22d3ee",
            },
          },
        },
      ],
    } satisfies EChartsOption;
  }, [sectionLengthSeries]);

  const evidenceSectionChartOption = useMemo<EChartsOption>(() => {
    const categories =
      evidenceSectionSeries.length > 0
        ? evidenceSectionSeries.map((section) => section.label)
        : ["No sections"];
    const values =
      evidenceSectionSeries.length > 0
        ? evidenceSectionSeries.map((section) => section.value)
        : [0];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: {type: "shadow"},
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(250, 204, 21, 0.35)",
        textStyle: {color: "#e2e8f0"},
        formatter: (params) => {
          const [first] =
            (Array.isArray(params) ? params : [params]) as Array<{
              axisValue?: string | number;
              value?: number;
            }>;
          if (!first || typeof first.value !== "number") {
            return "No evidence available";
          }
          const axisValue =
            typeof first.axisValue === "string" ||
            typeof first.axisValue === "number"
              ? first.axisValue
              : "Unknown";
          return `${axisValue}<br/>Evidence sentences: ${first.value}`;
        },
      },
      grid: {
        left: "3%",
        right: "6%",
        top: 20,
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        axisLabel: {color: "rgba(203, 213, 225, 0.75)"},
        splitLine: {
          lineStyle: {
            color: "rgba(71, 85, 105, 0.35)",
          },
        },
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: categories,
        axisLabel: {
          color: "rgba(203, 213, 225, 0.78)",
          formatter: (value: string | number) =>
            typeof value === "string" ? truncateLabel(value, isMobile ? 18 : 28) : `${value}`,
        },
        axisLine: {
          lineStyle: {
            color: "rgba(250, 204, 21, 0.35)",
          },
        },
        axisTick: {show: false},
      },
      series: [
        {
          type: "bar",
          name: "Evidence sentences",
          data: values,
          barWidth: "55%",
          itemStyle: {
            color: "#f97316",
            borderRadius: [0, 12, 12, 0],
            shadowBlur: 12,
            shadowColor: "rgba(251, 191, 36, 0.35)",
            shadowOffsetY: 6,
          },
          emphasis: {
            itemStyle: {
              color: "#fb923c",
            },
          },
        },
      ],
    } satisfies EChartsOption;
  }, [evidenceSectionSeries, isMobile]);

  const evidenceTrajectoryOption = useMemo<EChartsOption>(() => {
    const categories =
      evidenceTimelinePoints.length > 0
        ? evidenceTimelinePoints.map((point) => point.index)
        : [0];
    const values =
      evidenceTimelinePoints.length > 0
        ? evidenceTimelinePoints.map((point) => point.length)
        : [0];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        borderColor: "rgba(129, 140, 248, 0.35)",
        textStyle: {
          color: "#e2e8f0",
        },
        formatter: (params) => {
          const paramArray = (Array.isArray(params) ? params : [params]) as Array<
            {
              dataIndex?: number;
              axisValue?: number | string;
              value?: number;
            }
          >;
          const [first] = paramArray;
          if (!first || typeof first.dataIndex !== "number") {
            return "No evidence extracted";
          }
          const point = evidenceTimelinePoints[first.dataIndex];
          if (!point) {
            const axisValue =
              typeof first.axisValue === "number" || typeof first.axisValue === "string"
                ? first.axisValue
                : first.dataIndex;
            const value = typeof first.value === "number" ? first.value : 0;
            return `Sentence #${axisValue}<br/>Length: ${value} characters`;
          }
          const windowRange =
            point.charStart !== null && point.charEnd !== null
              ? `Span: ${point.charStart} – ${point.charEnd}`
              : "Span: n/a";
          return `Sentence #${point.index}<br/>Chars: ${point.length}${
            point.label ? `<br/>Section: ${point.label}` : ""
          }<br/>${windowRange}`;
        },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: 0,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: categories,
        name: "Sentence index",
        nameTextStyle: {
          color: "rgba(148, 163, 184, 0.9)",
          padding: [0, 0, 8, 0],
        },
        axisLine: {
          lineStyle: {
            color: "rgba(129, 140, 248, 0.35)",
          },
        },
        axisLabel: {
          color: "rgba(203, 213, 225, 0.75)",
        },
      },
      yAxis: {
        type: "value",
        name: "Sentence length (chars)",
        axisLabel: {
          color: "rgba(203, 213, 225, 0.75)",
        },
        splitLine: {
          lineStyle: {
            color: "rgba(71, 85, 105, 0.35)",
          },
        },
      },
      series: [
        {
          name: "Sentence length",
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          data: values,
          lineStyle: {
            width: 2,
            color: "#8b5cf6",
          },
          areaStyle: {
            color: "rgba(139, 92, 246, 0.2)",
          },
          itemStyle: {
            color: "#a855f7",
            borderColor: "#f0abfc",
            borderWidth: 1,
          },
        },
      ],
    } satisfies EChartsOption;
  }, [evidenceTimelinePoints]);

  const handleToggleCompare = () => {
    if (!study) {
      return;
    }

    setCompareList((prev) => {
      if (prev.includes(study.id)) {
        const next = prev.filter((id) => id !== study.id);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("compareList", JSON.stringify(next));
        }
        return next;
      }

      if (prev.length >= 3) {
        window.alert("You can compare up to 3 studies at a time.");
        return prev;
      }

      const next = [...prev, study.id];
      if (typeof window !== "undefined") {
        window.localStorage.setItem("compareList", JSON.stringify(next));
      }
      return next;
    });
  };

  const handleExportCitation = async () => {
    if (!study) {
      return;
    }
    const citation = `${study.authors || "Unknown Authors"}. ${study.title}. ${
      study.journal || "Unknown Journal"
    }. ${study.year || "Unknown Year"}.`;
    try {
      await navigator.clipboard.writeText(citation);
      window.alert("Citation copied to clipboard.");
    } catch (err) {
      console.error("Failed to copy citation:", err);
      window.alert("Unable to copy citation. Please copy manually.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 shadow-[0_0_45px_rgba(56,189,248,0.32)]">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-200" />
          </div>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">
            Initializing dossier
          </p>
          <p className="text-base text-slate-200">
            Retrieving study intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (error || !study) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="w-full max-w-lg space-y-5 rounded-3xl border border-rose-400/20 bg-slate-950/80 p-8 text-center shadow-[0_0_45px_rgba(251,113,133,0.28)]">
          <div className="text-5xl">🛰️</div>
          <h1 className="text-2xl font-semibold text-slate-50">Signal Lost</h1>
          <p className="text-sm text-slate-300">
            {error ?? "The requested study could not be located."}
          </p>
          {studyId && (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              ID: {studyId}
            </p>
          )}
          <Link
            href="/explore"
            className="inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
          >
            Return to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-28 text-slate-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,197,94,0.15),transparent_55%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.18),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(165,105,255,0.18),transparent_60%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,7,18,0.95),rgba(15,23,42,0.9))]"
        aria-hidden
      />
      <div className="relative">
        <header className="border-b border-cyan-400/15 bg-slate-950/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                <Link
                  href="/explore"
                  className="transition hover:text-cyan-200"
                >
                  Search
                </Link>
                <span>›</span>
                <span className="flex items-center gap-2 text-cyan-200">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Paper Analysis
                </span>
              </nav>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
                  {study.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  {study.authors && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-100">
                      {study.authors.split(";")[0]}
                    </span>
                  )}
                  {study.journal && <span>{study.journal}</span>}
                  {study.year && (
                    <span className="rounded-full border border-slate-500/40 px-3 py-1 text-xs uppercase tracking-[0.25em] text-slate-200">
                      {study.year}
                    </span>
                  )}
                  <a
                    href={study.pmc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-200 transition hover:text-white"
                  >
                    PMCID {study.pmcid}
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleToggleCompare}
                className={`rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition ${
                  isInCompareList
                    ? "border border-emerald-400/50 bg-emerald-500/20 text-emerald-100 hover:border-emerald-200/70 hover:text-white"
                    : "border border-cyan-400/40 bg-cyan-500/20 text-cyan-100 hover:border-cyan-200/60 hover:text-white"
                }`}
              >
                {isInCompareList ? "Remove from Compare" : "Add to Compare"}
              </button>
              <button
                onClick={handleExportCitation}
                className="rounded-full border border-slate-500/40 px-6 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200 transition hover:border-slate-300/60 hover:text-white"
              >
                Export Citation
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="rounded-3xl border border-cyan-400/15 bg-slate-950/70 p-8 shadow-[0_0_40px_rgba(15,60,130,0.35)]">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/75 to-slate-900/35 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-500/10">
                      <SatelliteDish className="h-5 w-5 text-cyan-200" aria-hidden />
                    </span>
                    <h2 className="text-lg font-semibold text-cyan-100">
                      Study Synopsis
                    </h2>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">
                    {study.abstract
                      ? study.abstract.replace(/^Abstract\s*/i, '').trim()
                      : "Abstract forthcoming. This NASA space biology study contributes new insights into microgravity-driven responses across biological systems."}
                  </p>
                </div>

                {/* Keywords/Subject Terms Section */}
                <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/75 to-slate-900/35 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-cyan-500/10">
                      <Dna className="h-5 w-5 text-cyan-200" aria-hidden />
                    </span>
                    <h2 className="text-lg font-semibold text-cyan-100">
                      Key Terms
                    </h2>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entities.slice(0, 10).map((entity) => (
                      <span
                        key={entity.id}
                        className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-100"
                      >
                        {entity.text}
                      </span>
                    ))}
                    {entities.length === 0 && (
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Key terms extraction in progress...
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-5 shadow-[0_25px_45px_rgba(14,165,233,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                          Evidence Sentences
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-cyan-100">
                          {evidence.length}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                        <Target className="h-5 w-5 text-cyan-200" aria-hidden />
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Key findings extracted by the BioSpace engine
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-5 shadow-[0_25px_45px_rgba(59,130,246,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                          Entity Types
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-cyan-100">
                          {uniqueEntityTypes}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                        <Atom className="h-5 w-5 text-cyan-200" aria-hidden />
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Distinct biological concepts detected
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-5 shadow-[0_25px_45px_rgba(34,211,238,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                          Document Sections
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-cyan-100">
                          {sections.length}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                        <BookMarked className="h-5 w-5 text-cyan-200" aria-hidden />
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Structured segments available for context
                    </p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 p-5 shadow-[0_25px_45px_rgba(165,105,255,0.08)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                          Reading Time
                        </p>
                        <p className="mt-2 text-3xl font-semibold text-cyan-100">
                          {readingTimeMinutes ? `${readingTimeMinutes} min` : "—"}
                        </p>
                      </div>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                        <Clock className="h-5 w-5 text-cyan-200" aria-hidden />
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Approximate review duration
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="flex h-[22rem] flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-slate-900/75 to-slate-900/30 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                          <PieChart className="h-5 w-5 text-cyan-200" aria-hidden />
                        </span>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                          Entity Signal Landscape
                        </h3>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                        {entities.length} entities
                      </span>
                    </div>
                    {entityTypeDistribution.length > 0 ? (
                      <div className="mt-4 flex-1 overflow-hidden min-h-0">
                        <ReactECharts
                          option={entityTypeChartOption}
                          theme="dark"
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-500">
                        Entity extraction not available for this study yet.
                      </p>
                    )}
                  </div>

                  <div className="flex h-[22rem] flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-slate-900/75 to-slate-900/30 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                          <BarChart3 className="h-5 w-5 text-cyan-200" aria-hidden />
                        </span>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                          Document Structure
                        </h3>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                        {sections.length} sections
                      </span>
                    </div>
                    {sectionLengthSeries.length > 0 ? (
                      <div className="mt-4 flex-1 overflow-hidden min-h-0">
                        <ReactECharts
                          option={sectionLengthChartOption}
                          theme="dark"
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-500">
                        Section analytics will appear once content is ingested.
                      </p>
                    )}
                  </div>

                  <div className="xl:col-span-2 flex h-[22rem] flex-col overflow-hidden rounded-2xl border border-amber-400/25 bg-gradient-to-br from-slate-900/75 to-amber-500/10 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10">
                          <ClipboardList className="h-5 w-5 text-amber-200" aria-hidden />
                        </span>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200">
                          Evidence Section Density
                        </h3>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-300">
                        {evidence.length} evidence sentences
                      </span>
                    </div>
                    {evidenceSectionSeries.length > 0 ? (
                      <div className="mt-4 flex-1 overflow-hidden min-h-0">
                        <ReactECharts
                          option={evidenceSectionChartOption}
                          theme="dark"
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-500">
                        Evidence sections will appear as findings are extracted.
                      </p>
                    )}
                  </div>

                  <div className="xl:col-span-2 flex h-[26rem] flex-col overflow-hidden rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-slate-900/75 to-slate-900/30 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                          <LineChart className="h-5 w-5 text-cyan-200" aria-hidden />
                        </span>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                          Evidence Trajectory
                        </h3>
                      </div>
                      <span className="text-[11px] uppercase tracking-[0.28em] text-slate-400">
                        {evidence.length} findings tracked
                      </span>
                    </div>
                    {evidenceTimelinePoints.length > 0 ? (
                      <div className="mt-4 flex-1 overflow-hidden min-h-0">
                        <ReactECharts
                          option={evidenceTrajectoryOption}
                          theme="dark"
                          className="h-full"
                        />
                      </div>
                    ) : (
                      <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-500">
                        Evidence visual will activate once sentences are
                        extracted.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <aside className="space-y-5">

                <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/75 to-slate-900/30 p-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                      <BookOpen className="h-5 w-5 text-cyan-200" aria-hidden />
                    </span>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                      Top Sections
                    </h3>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-300">
                    {sectionHighlights.length > 0 ? (
                      sectionHighlights.map((section) => (
                        <div
                          key={section.id}
                          className="rounded-xl border border-cyan-400/15 bg-slate-950/60 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10">
                              <BookMarked className="h-4 w-4 text-cyan-200" aria-hidden />
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
                                {section.section_type}
                              </p>
                              {section.title && (
                                <p className="mt-1 font-medium text-slate-100">
                                  {section.title}
                                </p>
                              )}
                              {section.content && (
                                <p className="mt-2 text-xs leading-relaxed text-slate-300 line-clamp-3">
                                  {section.content.replace(/^Abstract\s*/i, '').trim().substring(0, 200)}...
                                </p>
                              )}
                            </div>
                          </div>
                          {section.content && (
                            <div className="mt-3 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                        Section metadata pending ingestion
                      </p>
                    )}
                  </div>
                </div>

                {compareList.length > 0 && (
                  <div className="rounded-2xl border border-cyan-400/10 bg-gradient-to-br from-slate-900/75 to-slate-900/30 p-6 text-sm text-slate-300">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/15">
                        <Rocket className="h-5 w-5 text-cyan-200" aria-hidden />
                      </span>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
                        Mission Deck
                      </h3>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      {compareList.length} study
                      {compareList.length > 1 ? "ies" : ""} staged for
                      comparison.
                    </p>
                    <Link
                      href="/compare"
                      className="mt-4 inline-flex items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
                    >
                      Launch Compare
                    </Link>
                  </div>
                )}
              </aside>
            </div>
          </section>

        </main>

        <footer className="mt-12 border-t border-cyan-400/10 bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-slate-300 sm:px-6 lg:px-8">
            <div>
              <h3 className="text-base font-semibold text-cyan-100">
                🚀 BioSpace Knowledge Engine
              </h3>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                NASA space biology intelligence hub
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/explore"
                className="rounded-full border border-cyan-400/40 bg-cyan-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-200/60 hover:text-white"
              >
                Back to Search
              </Link>
              {compareList.length > 0 && (
                <Link
                  href="/compare"
                  className="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100 transition hover:border-emerald-200/60 hover:text-white"
                >
                  Compare Deck ({compareList.length})
                </Link>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
