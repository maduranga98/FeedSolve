import { onCLS, onINP, onFCP, onLCP, onTTFB } from "web-vitals";

interface WebVitalsMetrics {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
}

const vitalsThresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 600, needsImprovement: 1200 },
};

function getRating(
  metric: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const thresholds = vitalsThresholds[metric as keyof typeof vitalsThresholds];
  if (!thresholds) return "poor";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needs-improvement";
  return "poor";
}

export function initPerformanceMonitoring() {
  if (typeof window === "undefined") return;

  // Track Cumulative Layout Shift
  onCLS((metric) => {
    const vitals: WebVitalsMetrics = {
      name: "CLS",
      value: metric.value,
      rating: getRating("CLS", metric.value),
    };
    reportVitals(vitals);
  });

  // Track Interaction to Next Paint
  onINP((metric) => {
    const vitals: WebVitalsMetrics = {
      name: "INP",
      value: metric.value,
      rating: getRating("INP", metric.value),
    };
    reportVitals(vitals);
  });

  // Track First Contentful Paint
  onFCP((metric) => {
    const vitals: WebVitalsMetrics = {
      name: "FCP",
      value: metric.value,
      rating: getRating("FCP", metric.value),
    };
    reportVitals(vitals);
  });

  // Track Largest Contentful Paint
  onLCP((metric) => {
    const vitals: WebVitalsMetrics = {
      name: "LCP",
      value: metric.value,
      rating: getRating("LCP", metric.value),
    };
    reportVitals(vitals);
  });

  // Track Time to First Byte
  onTTFB((metric) => {
    const vitals: WebVitalsMetrics = {
      name: "TTFB",
      value: metric.value,
      rating: getRating("TTFB", metric.value),
    };
    reportVitals(vitals);
  });
}

function reportVitals(vitals: WebVitalsMetrics) {
  if (import.meta.env.MODE === "development") {
    console.log(
      `[${vitals.name}] ${vitals.value.toFixed(2)}ms (${vitals.rating})`,
    );
  }

  if (window.__VITALS_DATA__ === undefined) {
    window.__VITALS_DATA__ = [];
  }
  window.__VITALS_DATA__.push(vitals);
}

declare global {
  interface Window {
    __VITALS_DATA__?: unknown[];
  }
}
