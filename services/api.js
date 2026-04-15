import { diligenceItems } from "../data/dealTaxonomy.js";

const API_URL = import.meta.env.VITE_DEAL_API_URL;

function moneyNumber(value) {
  return Number(String(value ?? "").replace(/[^0-9.-]/g, "")) || 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function clampScore(score) {
  return Math.round(clamp(score, 0, 100));
}

function parseT12(text = "") {
  return text.split(/\n+/).reduce(
    (totals, rawLine) => {
      const line = rawLine.trim();
      const amount = moneyNumber(line);
      if (!line || !amount) return totals;

      const label = line.toLowerCase();
      if (/rent|income|revenue/.test(label)) totals.income += amount;
      if (/tax/.test(label)) totals.taxes += amount;
      if (/insurance/.test(label)) totals.insurance += amount;
      if (/repair|maintenance|r&m/.test(label)) totals.maintenance += amount;
      if (/utility|utilities/.test(label)) totals.utilities += amount;
      if (/manage|management/.test(label)) totals.management += amount;
      if (/expense|payroll|admin|legal|contract|other/.test(label)) totals.other += amount;

      return totals;
    },
    {
      income: 0,
      taxes: 0,
      insurance: 0,
      maintenance: 0,
      utilities: 0,
      management: 0,
      other: 0
    }
  );
}

function parseRentRoll(text = "") {
  const units = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(/,|\t/).map((part) => part.trim());
      const current = moneyNumber(parts[1] ?? parts[0]);
      const market = moneyNumber(parts[2] ?? parts[1] ?? parts[0]);
      const status = (parts[3] || "").toLowerCase();

      return {
        unit: parts[0] || `Unit ${index + 1}`,
        current,
        market,
        vacant: /vacant|down|offline/.test(status)
      };
    });

  const monthlyInPlace = units.reduce((total, unit) => total + unit.current, 0);
  const monthlyMarket = units.reduce((total, unit) => total + unit.market, 0);
  const vacantUnits = units.filter((unit) => unit.vacant).length;

  return {
    units,
    rentInPlace: monthlyInPlace * 12,
    rentMarket: monthlyMarket * 12,
    vacancy: units.length ? vacantUnits / units.length : 0
  };
}

function diligenceCoverage(diligence) {
  const complete = diligenceItems.filter((item) => diligence[item.key]);
  const missing = diligenceItems.filter((item) => !diligence[item.key]);

  return {
    complete: complete.map((item) => item.label),
    missing: missing.map((item) => item.label),
    ratio: diligenceItems.length ? complete.length / diligenceItems.length : 0
  };
}

function riskAdjustment(data) {
  let adjustment = 0;
  if (data.property.yearBuilt && data.property.yearBuilt < 1950) adjustment += 0.01;
  if (data.property.rentControl) adjustment += 0.01;
  if (data.risks.flood) adjustment += 0.015;
  if (data.risks.environmental) adjustment += 0.02;
  if (data.strategy.renovationBudget > 100000) adjustment += 0.01;

  return adjustment;
}

function riskScore(data, vacancy) {
  let score = 0;
  if (data.property.yearBuilt && data.property.yearBuilt < 1950) score += 3;
  if (data.property.rentControl) score += 3;
  if (vacancy > 0.1) score += 2;
  if (data.risks.flood) score += 5;
  if (data.risks.environmental) score += 6;
  if (data.strategy.renovationBudget > 100000) score += 3;
  return score;
}

function sellerPressure(data) {
  let pressure = 0;
  if (data.property.dom > 150) pressure += 2;
  if (data.property.dom > 250) pressure += 4;
  if (data.market.priceReduced) pressure += 3;
  return pressure;
}

function propertyTax(data) {
  const assessment = data.property.assessment || {};
  const totalAssessment =
    assessment.total || assessment.land + assessment.improvements || data.property.price;
  const taxRate = assessment.taxRate || 0.012;
  const assessedTax = totalAssessment * taxRate;

  return {
    parcelNumber: data.property.parcelNumber,
    landAssessment: assessment.land || 0,
    improvementAssessment: assessment.improvements || 0,
    totalAssessment,
    taxRate,
    assessedTax,
    annualTax: data.expenses.taxes || assessedTax
  };
}

function truthScore({ noiReported, noiReal, rentMarket, realisticMarket, expensesReported, rentInPlace, missingData }) {
  let score = 100;
  const flags = [];

  if (noiReported > noiReal * 1.2) {
    score -= 25;
    flags.push("Reported NOI is more than 20% above normalized NOI.");
  }

  if (realisticMarket && rentMarket > realisticMarket * 1.1) {
    score -= 20;
    flags.push("Market rent claim is more than 10% above realistic market input.");
  }

  if (expensesReported < rentInPlace * 0.25) {
    score -= 20;
    flags.push("Reported expenses are below 25% of in-place rent.");
  }

  if (missingData) {
    score -= 15;
    flags.push("Material diligence items are missing.");
  }

  return {
    score: clampScore(score),
    flags
  };
}

function classifyDeal({ discount, riskScoreValue, capRate, marketCap, upsideScore }) {
  if (discount > 0 && riskScoreValue < 5) return "VALUE BUY";
  if (riskScoreValue > 7 && discount > 0) return "DISTRESS OPPORTUNITY";
  if (capRate < marketCap && upsideScore < 0.05) return "RETAIL TRAP";
  return "MID DEAL";
}

function survivalLabel(months) {
  if (months >= 12) return "SAFE";
  if (months >= 6) return "RISK";
  return "DANGEROUS";
}

function recommendedActions({ dealType, survivalScore, truth, sellerPressureValue, discount }) {
  const actions = [];

  if (truth.score < 70) actions.push("Re-underwrite from source documents before accepting broker NOI.");
  if (survivalScore === "DANGEROUS") actions.push("Pass unless seller restructures price, debt, or carry terms.");
  if (sellerPressureValue > 3 && discount > 0) actions.push("Open with a low anchor and let time work.");
  if (dealType === "DISTRESS OPPORTUNITY") actions.push("Negotiate aggressively with environmental, flood, lease, and capex contingencies.");
  if (dealType === "RETAIL TRAP") actions.push("Do not pay for speculative upside that cannot be reached under restrictions.");
  if (!actions.length) actions.push("Monitor, validate comps, and sharpen the offer only after diligence improves.");

  return actions;
}

function scoreLocally(data) {
  const t12 = parseT12(data.ingestion.t12Text);
  const unitRoll = parseRentRoll(data.ingestion.rentRollText);
  const diligence = diligenceCoverage(data.diligence);
  const rentInPlace = unitRoll.rentInPlace || data.rentRoll.grossRent || t12.income;
  const rentMarket = unitRoll.rentMarket || data.rentRoll.marketRent || rentInPlace;
  const realisticMarket = data.market.realisticMarketRent || rentMarket;
  const expensesReported =
    data.expenses.reported || data.expenses.totalReported || t12.taxes + t12.insurance + t12.maintenance + t12.utilities + t12.management + t12.other;
  const noiReported = rentInPlace - expensesReported;
  const vacancy = unitRoll.units.length ? unitRoll.vacancy : data.property.vacancy;
  const rentRealistic = data.property.rentControl ? rentInPlace * 1.03 : Math.min(rentMarket, realisticMarket || rentMarket);
  const rentGap = rentMarket - rentInPlace;
  const upsideScore = rentMarket ? rentGap / rentMarket : 0;
  const taxDetail = propertyTax(data);
  const tax = taxDetail.annualTax;
  const insurance = data.expenses.insurance || Math.max(8000, rentInPlace * 0.08);
  const maintenance = data.expenses.repairsMaintenance || rentInPlace * 0.1;
  const otherExpenses = data.expenses.utilities + data.expenses.management + data.expenses.capexReserve + data.expenses.otherExpenses;
  const noiReal = rentInPlace - (tax + insurance + maintenance + otherExpenses);
  const noiStressed = noiReal * 0.8;
  const marketCap = 0.06 + riskAdjustment(data);
  const value = marketCap ? noiReal / marketCap : 0;
  const discount = value - data.property.price;
  const discountRatio = data.property.price ? discount / data.property.price : 0;
  const loan = data.property.price * data.strategy.ltv;
  const debtService = loan * data.strategy.interestRate;
  const cashFlow = noiReal - debtService;
  const burnRate = cashFlow < 0 ? Math.abs(cashFlow) : 0;
  const survivalMonths = burnRate ? data.strategy.reserves / burnRate : 999;
  const survivalScore = survivalLabel(survivalMonths);
  const missingData = diligence.ratio < 0.7;
  const truth = truthScore({
    noiReported,
    noiReal,
    rentMarket,
    realisticMarket,
    expensesReported,
    rentInPlace,
    missingData
  });
  const riskScoreValue = riskScore(data, vacancy);
  const sellerPressureValue = sellerPressure(data);
  const capRate = data.property.price ? noiReal / data.property.price : 0;
  const dealType = classifyDeal({
    discount,
    riskScoreValue,
    capRate,
    marketCap,
    upsideScore
  });
  const basis = data.property.price + data.strategy.renovationBudget;
  const equityCreated = value - basis;
  const overPriced = equityCreated < 0;

  let score = 0;
  if (survivalMonths > 12) score += 30;
  else if (survivalMonths > 6) score += 15;
  if (noiReal > 0) score += 20;
  if (discount > 0) score += Math.min(20, discountRatio * 20);
  score += truth.score * 0.15;
  score -= riskScoreValue * 2;
  if (overPriced) score = Math.min(score, 35);
  score = clampScore(score);

  const anchorMultiplier = sellerPressureValue > 3 ? 0.57 : 0.6;
  const offer = {
    anchor: Math.max(0, Math.round(value * anchorMultiplier)),
    target: Math.max(0, Math.round(value * 0.7)),
    max: Math.max(0, Math.round(value * 0.8))
  };
  const strategy =
    sellerPressureValue > 3 && discount > 0
      ? "LOWBALL_AND_WAIT"
      : survivalScore === "DANGEROUS"
        ? "PASS_OR_RESTRUCTURE"
        : dealType === "DISTRESS OPPORTUNITY"
          ? "AGGRESSIVE_NEGOTIATION"
          : "MONITOR";
  const decision = score >= 75 ? "BUY" : score >= 55 ? "REVIEW" : "PASS";

  const metrics = {
    perceivedNoi: noiReported,
    realNoi: noiReal,
    stressedNoi: noiStressed,
    rentInPlace,
    rentMarket,
    rentRealistic,
    rentGap,
    upsideScore,
    tax,
    taxDetail,
    insurance,
    maintenance,
    expensesReported,
    normalizedExpenses: tax + insurance + maintenance + otherExpenses,
    marketCap,
    value,
    discount,
    discountRatio,
    basis,
    equityCreated,
    loan,
    debtService,
    cashFlow,
    burnRate,
    survivalMonths,
    capRate,
    expenseRatio: rentInPlace ? (tax + insurance + maintenance + otherExpenses) / rentInPlace : 0,
    cashOnCash: data.strategy.reserves ? cashFlow / data.strategy.reserves : 0,
    cashInvested: data.strategy.reserves,
    dscr: debtService ? noiReal / debtService : 0
  };
  const risks = [];
  if (data.property.yearBuilt && data.property.yearBuilt < 1950) risks.push("Pre-1950 building age adds systems and code risk.");
  if (data.property.rentControl) risks.push("Rent control limits conversion of perceived upside into real rent.");
  if (vacancy > 0.1) risks.push("Vacancy exceeds 10%; stress lease-up assumptions.");
  if (data.risks.flood) risks.push("Flood exposure needs insurance and lender confirmation.");
  if (data.risks.environmental) risks.push("Environmental risk needs a contingency and specialist review.");
  if (data.strategy.renovationBudget > 100000) risks.push("Capex load can erase discount if scope expands.");
  if (truth.flags.length) risks.push(...truth.flags);

  const opportunities = [];
  if (rentGap > 0 && !data.property.rentControl) opportunities.push("Market rent gap can become real upside if comps are verified.");
  if (sellerPressureValue > 3) opportunities.push("Seller pressure is elevated from DOM or price reductions.");
  if (discount > 0) opportunities.push("Normalized value is above ask after downside expenses.");

  return {
    score,
    decision,
    deal_type: dealType,
    dealType,
    truth_score: truth.score,
    truthScore: truth.score,
    risk_score: riskScoreValue,
    riskScore: riskScoreValue,
    survival_score: survivalScore,
    survivalScore,
    equity_created: Math.round(equityCreated),
    equityCreated,
    offer,
    offer_strategy: strategy,
    offerStrategy: strategy,
    actions: recommendedActions({
      dealType,
      survivalScore,
      truth,
      sellerPressureValue,
      discount
    }),
    createdAt: new Date().toISOString(),
    profile: {
      ...data.profile,
      dealStrategyLabel: dealType,
      assetClassLabel: data.profile.assetClassLabel,
      offerTypeLabel: data.profile.offerTypeLabel,
      contractTypeLabel: data.profile.contractTypeLabel
    },
    input: {
      price: data.property.price,
      grossRent: rentInPlace,
      expenses: expensesReported
    },
    property: data.property,
    rentRoll: {
      ...data.rentRoll,
      grossRent: rentInPlace,
      marketRent: rentMarket,
      unitAnalysis: unitRoll.units
    },
    diligence,
    metrics,
    strategyMath: {
      sellerPressure: sellerPressureValue,
      overPriced,
      capex: data.strategy.renovationBudget,
      realisticMarket
    },
    strategy: {
      label: strategy,
      sellerPressure: sellerPressureValue,
      projectCost: basis,
      spread: value ? equityCreated / value : 0,
      wholesaleSpread: data.strategy.assignmentFee
        ? data.strategy.assignmentFee / Math.max(data.property.price, 1)
        : 0
    },
    review: {
      risks,
      opportunities,
      misinformation: truth.flags,
      actions: recommendedActions({
        dealType,
        survivalScore,
        truth,
        sellerPressureValue,
        discount
      })
    }
  };
}

export async function scoreDeal(data) {
  if (!API_URL) {
    return scoreLocally(data);
  }

  const response = await fetch(`${API_URL.replace(/\/$/, "")}/score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error("The scoring service returned an error.");
  }

  return response.json();
}
