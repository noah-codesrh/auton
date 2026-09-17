import type { ModelCurve } from "./api/curve";

/**
 * Layer 3 — presentational helpers for the yield curve.
 *
 * The curve itself (spot + front contract + listed forwards, plus basis /
 * shape metrics) is computed by the backend curve engine and fetched via
 * `lib/api/curve`. These helpers only derive chart geometry from that payload.
 */

export type { CurvePoint, CurveShape, ModelCurve } from "./api/curve";

const FALLBACK_COLOR = "#6b7280";

export function curveColor(curve: Pick<ModelCurve, "color">): string {
  return curve.color || FALLBACK_COLOR;
}

export type CurveBounds = {
  minDate: number;
  maxDate: number;
  minRate: number;
  maxRate: number;
};

/** Combined x/y extents across all curves, for charting. */
export function curveBounds(curves: ModelCurve[]): CurveBounds | null {
  const points = curves.flatMap((curve) => curve.points);
  if (points.length === 0) return null;

  const dates = points.map((p) => p.date);
  const rates = points.map((p) => p.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const pad = (maxRate - minRate) * 0.12 || maxRate * 0.1 || 0.01;

  return {
    minDate: Math.min(...dates),
    maxDate: Math.max(...dates),
    minRate: Math.max(0, minRate - pad),
    maxRate: maxRate + pad,
  };
}

/** Interpolate a curve's rate at an arbitrary date (for hover readouts). */
export function rateAtDate(curve: ModelCurve, date: number): number | null {
  const pts = curve.points;
  if (pts.length === 0) return null;
  if (date <= pts[0].date) return pts[0].rate;
  if (date >= pts[pts.length - 1].date) return pts[pts.length - 1].rate;

  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i];
    const b = pts[i + 1];
    if (date >= a.date && date <= b.date) {
      const span = b.date - a.date || 1;
      const fraction = (date - a.date) / span;
      return Math.round((a.rate + (b.rate - a.rate) * fraction) * 10000) / 10000;
    }
  }
  return pts[pts.length - 1].rate;
}
