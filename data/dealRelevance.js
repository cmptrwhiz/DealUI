const EXIT_STRATEGIES = new Set(["wholesale", "wholetail", "double_close", "flip"]);
const INCOME_STRATEGIES = new Set([
  "commercial",
  "long_term_rental",
  "short_term_rental",
  "creative_finance",
  "owner_carry",
  "lease_option",
  "exchange_1031"
]);

const SELLER_TERM_STRATEGIES = new Set(["creative_finance", "owner_carry", "lease_option"]);

export function getDealRelevance(strategy) {
  const isExit = EXIT_STRATEGIES.has(strategy);
  const isIncome = INCOME_STRATEGIES.has(strategy);

  return {
    isExit,
    isIncome,
    showRentRoll: isIncome,
    showT12: isIncome,
    showNOI: isIncome,
    showExitMath: isExit,
    showShortTerm: strategy === "short_term_rental",
    showSellerTerms: SELLER_TERM_STRATEGIES.has(strategy),
    showAssignment: strategy === "wholesale" || strategy === "double_close",
    showFinancing: strategy !== "wholesale"
  };
}
