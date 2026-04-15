const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const percent = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 2
});

function formatMoney(value) {
  return money.format(Number.isFinite(value) ? value : 0);
}

function formatPercent(value) {
  return percent.format(Number.isFinite(value) ? value : 0);
}

function formatNumber(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString() : "0";
}

function Metric({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TextList({ title, items, empty }) {
  return (
    <div className="inspection-list">
      <h3>{title}</h3>
      {items.length ? (
        <ul>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </div>
  );
}

export default function DealCard({ deal }) {
  return (
    <section className="panel deal-card">
      <div className="score-header">
        <div>
          <p className="eyebrow">Underwriting Engine</p>
          <h2>{deal.score}</h2>
          <p className={`decision decision-${deal.decision.toLowerCase()}`}>
            {deal.decision}
          </p>
        </div>
        <div className="deal-tags">
          <span>{deal.dealType}</span>
          <span>Truth {deal.truthScore}</span>
          <span>Risk {deal.riskScore}</span>
          <span>{deal.survivalScore}</span>
        </div>
      </div>

      <dl className="metric-grid score-grid">
        <Metric label="Deal Score" value={deal.score} />
        <Metric label="Deal Type" value={deal.dealType} />
        <Metric label="Truth Score" value={deal.truthScore} />
        <Metric label="Risk Score" value={deal.riskScore} />
        <Metric label="Survival Score" value={deal.survivalScore} />
        <Metric label="Offer Strategy" value={deal.strategy.label} />
        <Metric label="Equity Created" value={formatMoney(deal.equityCreated)} />
        <Metric label="Seller Pressure" value={deal.strategy.sellerPressure} />
      </dl>

      <div className="offer-strip">
        <div>
          <span>Anchor</span>
          <strong>{formatMoney(deal.offer.anchor)}</strong>
        </div>
        <div>
          <span>Target</span>
          <strong>{formatMoney(deal.offer.target)}</strong>
        </div>
        <div>
          <span>Max</span>
          <strong>{formatMoney(deal.offer.max)}</strong>
        </div>
      </div>

      <div className="inspection-grid">
        <div className="inspection-list">
          <h3>Perceived vs real</h3>
          <dl className="mini-grid">
            <Metric label="Reported NOI" value={formatMoney(deal.metrics.perceivedNoi)} />
            <Metric label="Real NOI" value={formatMoney(deal.metrics.realNoi)} />
            <Metric label="Stressed NOI" value={formatMoney(deal.metrics.stressedNoi)} />
            <Metric label="Reported expenses" value={formatMoney(deal.metrics.expensesReported)} />
            <Metric label="Normalized expenses" value={formatMoney(deal.metrics.normalizedExpenses)} />
            <Metric label="Truth delta" value={formatMoney(deal.metrics.perceivedNoi - deal.metrics.realNoi)} />
          </dl>
        </div>

        <div className="inspection-list">
          <h3>Downside first</h3>
          <dl className="mini-grid">
            <Metric label="Cash flow" value={formatMoney(deal.metrics.cashFlow)} />
            <Metric label="Burn rate" value={formatMoney(deal.metrics.burnRate)} />
            <Metric label="Survival months" value={deal.metrics.survivalMonths >= 999 ? "999+" : formatNumber(deal.metrics.survivalMonths)} />
            <Metric label="Debt service" value={formatMoney(deal.metrics.debtService)} />
            <Metric label="Market cap" value={formatPercent(deal.metrics.marketCap)} />
            <Metric label="Discount" value={formatMoney(deal.metrics.discount)} />
          </dl>
        </div>
      </div>

      <div className="inspection-grid">
        <div className="inspection-list">
          <h3>Rent roll</h3>
          <dl className="mini-grid">
            <Metric label="In-place rent" value={formatMoney(deal.metrics.rentInPlace)} />
            <Metric label="Market rent" value={formatMoney(deal.metrics.rentMarket)} />
            <Metric label="Realistic rent" value={formatMoney(deal.metrics.rentRealistic)} />
            <Metric label="Rent gap" value={formatMoney(deal.metrics.rentGap)} />
            <Metric label="Upside score" value={formatPercent(deal.metrics.upsideScore)} />
            <Metric label="Units parsed" value={deal.rentRoll.unitAnalysis.length} />
          </dl>
        </div>

        <div className="inspection-list">
          <h3>Valuation</h3>
          <dl className="mini-grid">
            <Metric label="Value" value={formatMoney(deal.metrics.value)} />
            <Metric label="Basis" value={formatMoney(deal.metrics.basis)} />
            <Metric label="Cap rate" value={formatPercent(deal.metrics.capRate)} />
            <Metric label="DSCR" value={`${deal.metrics.dscr.toFixed(2)}x`} />
            <Metric label="Loan" value={formatMoney(deal.metrics.loan)} />
            <Metric label="Expense ratio" value={formatPercent(deal.metrics.expenseRatio)} />
          </dl>
        </div>
      </div>

      <div className="inspection-grid">
        <div className="inspection-list">
          <h3>Property taxes</h3>
          <dl className="mini-grid">
            <Metric label="Parcel" value={deal.metrics.taxDetail.parcelNumber || "Not entered"} />
            <Metric label="Land assessment" value={formatMoney(deal.metrics.taxDetail.landAssessment)} />
            <Metric label="Improvements" value={formatMoney(deal.metrics.taxDetail.improvementAssessment)} />
            <Metric label="Total assessment" value={formatMoney(deal.metrics.taxDetail.totalAssessment)} />
            <Metric label="Tax rate" value={formatPercent(deal.metrics.taxDetail.taxRate)} />
            <Metric label="Annual tax" value={formatMoney(deal.metrics.taxDetail.annualTax)} />
          </dl>
        </div>

        <div className="inspection-list">
          <h3>Assessment signal</h3>
          <dl className="mini-grid">
            <Metric label="Assessed tax" value={formatMoney(deal.metrics.taxDetail.assessedTax)} />
            <Metric label="Tax in NOI" value={formatMoney(deal.metrics.tax)} />
            <Metric label="Assessment / price" value={formatPercent(deal.property.price ? deal.metrics.taxDetail.totalAssessment / deal.property.price : 0)} />
            <Metric label="Improvements share" value={formatPercent(deal.metrics.taxDetail.totalAssessment ? deal.metrics.taxDetail.improvementAssessment / deal.metrics.taxDetail.totalAssessment : 0)} />
          </dl>
        </div>
      </div>

      <div className="inspection-grid">
        <TextList
          title="Misinformation flags"
          items={deal.review.misinformation}
          empty="No broker/seller bias detected from current inputs."
        />
        <TextList
          title="Action plan"
          items={deal.review.actions}
          empty="No action plan generated yet."
        />
      </div>

      <div className="inspection-grid">
        <TextList
          title="Risks"
          items={deal.review.risks}
          empty="No major risks detected from entered fields."
        />
        <TextList
          title="Upside"
          items={deal.review.opportunities}
          empty="Add more deal context to surface upside."
        />
      </div>

      <div className="inspection-list">
        <h3>Diligence coverage</h3>
        <div className="coverage-bar" aria-label="Diligence coverage">
          <span style={{ width: `${deal.diligence.ratio * 100}%` }} />
        </div>
        <p className="muted">
          {deal.diligence.complete.length} of{" "}
          {deal.diligence.complete.length + deal.diligence.missing.length} files checked.
        </p>
        {deal.diligence.missing.length > 0 && (
          <p className="missing-files">Missing: {deal.diligence.missing.join(", ")}</p>
        )}
      </div>
    </section>
  );
}
