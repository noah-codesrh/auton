/**
 * Black-76 option pricing (options on a forward / futures price).
 *
 * We price options whose underlying is the forward compute rate at a given
 * expiry, so Black-76 is the natural model: it takes the forward F directly
 * rather than a spot + carry. All premia and strikes are in USD per million
 * tokens; time is in years.
 *
 * Greeks convention:
 *   - delta:  ∂price/∂F           (per $1/M move in the forward)
 *   - gamma:  ∂²price/∂F²
 *   - vega:   ∂price/∂σ per +1 vol point (i.e. per +1%, already /100)
 *   - theta:  1-day time decay (price change as expiry shortens by one day)
 */

const SQRT_2PI = Math.sqrt(2 * Math.PI);
const DAY_IN_YEARS = 1 / 365;

/** Standard normal PDF. */
function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / SQRT_2PI;
}

/** Error function (Abramowitz & Stegun 7.1.26). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Standard normal CDF. */
export function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export type OptionType = "call" | "put";

export type OptionPrices = {
  call: number;
  put: number;
};

/** Undiscounted-forward Black-76 call & put premia. */
export function black76Price(
  forward: number,
  strike: number,
  years: number,
  vol: number,
  rate: number,
): OptionPrices {
  const df = Math.exp(-rate * years);

  // Degenerate inputs collapse to discounted intrinsic value.
  if (years <= 0 || vol <= 0 || forward <= 0 || strike <= 0) {
    return {
      call: Math.max(0, forward - strike) * df,
      put: Math.max(0, strike - forward) * df,
    };
  }

  const sqrtT = Math.sqrt(years);
  const d1 = (Math.log(forward / strike) + 0.5 * vol * vol * years) / (vol * sqrtT);
  const d2 = d1 - vol * sqrtT;

  const call = df * (forward * normCdf(d1) - strike * normCdf(d2));
  const put = df * (strike * normCdf(-d2) - forward * normCdf(-d1));

  return { call: Math.max(0, call), put: Math.max(0, put) };
}

export type Greeks = {
  price: number;
  delta: number;
  gamma: number;
  /** Per +1 vol point (per +1%). */
  vega: number;
  /** 1-day decay (typically negative for long options). */
  theta: number;
};

/**
 * Full Greeks for one option type. Delta/gamma/vega are closed-form; theta is a
 * one-day finite difference (robust and free of sign-convention pitfalls).
 */
export function black76Greeks(
  type: OptionType,
  forward: number,
  strike: number,
  years: number,
  vol: number,
  rate: number,
): Greeks {
  const priceNow = black76Price(forward, strike, years, vol, rate)[type];

  if (years <= 0 || vol <= 0 || forward <= 0 || strike <= 0) {
    return { price: priceNow, delta: 0, gamma: 0, vega: 0, theta: 0 };
  }

  const df = Math.exp(-rate * years);
  const sqrtT = Math.sqrt(years);
  const d1 = (Math.log(forward / strike) + 0.5 * vol * vol * years) / (vol * sqrtT);
  const pdfD1 = normPdf(d1);

  const delta = type === "call" ? df * normCdf(d1) : -df * normCdf(-d1);

  const gamma = (df * pdfD1) / (forward * vol * sqrtT);

  // Vega is identical for calls and puts; scale to a +1% vol move.
  const vega = (forward * df * pdfD1 * sqrtT) / 100;

  // One-day theta via finite difference on shrinking time to expiry.
  const yearsNext = Math.max(0, years - DAY_IN_YEARS);
  const priceNext = black76Price(forward, strike, yearsNext, vol, rate)[type];
  const theta = priceNext - priceNow;

  return {
    price: priceNow,
    delta,
    gamma,
    vega,
    theta,
  };
}
