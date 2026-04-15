const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

export default function DealList({ deals, onClear }) {
  return (
    <section className="panel">
      <div className="list-header">
        <div>
          <p className="eyebrow">Saved Deals</p>
          <h2>Recent runs</h2>
        </div>
        {deals.length > 0 && (
          <button className="ghost-button" type="button" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      {deals.length === 0 ? (
        <p className="muted">Completed scores will show up here.</p>
      ) : (
        <div className="deal-list">
          {deals.map((deal, index) => (
            <article className="deal-row" key={`${deal.createdAt}-${index}`}>
              <div>
                <strong>{deal.profile?.name || `${deal.score} score`}</strong>
                <span>{deal.profile?.dealStrategyLabel || deal.decision}</span>
              </div>
              <div>
                <span>{money.format(deal.input.price)}</span>
                <span>{deal.decision} · Target {money.format(deal.offer.target)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
