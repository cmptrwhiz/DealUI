import { useState } from "react";
import {
  assetClasses,
  contractTypes,
  dealStrategies,
  diligenceItems,
  offerTypes
} from "../data/dealTaxonomy.js";
import { scoreDeal } from "../services/api.js";

const initialForm = {
  name: "",
  address: "",
  assetClass: "multifamily",
  dealStrategy: "long_term_rental",
  offerType: "cash",
  contractType: "purchase_sale",
  price: "",
  arv: "",
  grossRent: "",
  marketRent: "",
  units: "",
  squareFeet: "",
  occupancy: "92",
  yearBuilt: "",
  dom: "",
  taxes: "",
  insurance: "",
  repairsMaintenance: "",
  utilities: "",
  management: "",
  capexReserve: "",
  otherExpenses: "",
  leaseCount: "",
  avgLeaseMonths: "",
  leaseExpirations: "",
  securityDeposits: "",
  renovationBudget: "",
  assignmentFee: "",
  closingCosts: "",
  holdingMonths: "",
  resaleCosts: "",
  adr: "",
  shortTermOccupancy: "62",
  furnishingBudget: "",
  downPayment: "",
  interestRate: "6.5",
  ltv: "70",
  reserves: "100000",
  amortizationYears: "30",
  sellerCarryRate: "",
  sellerCarryTerm: "",
  optionFee: "",
  exchangeDeadlineDays: "",
  realisticMarketRent: "",
  priceReduced: false,
  riskFlood: false,
  riskEnvironmental: false,
  rentRollText: "",
  t12Text: "",
  rentControl: false,
  diligence: {}
};

function toNumber(value) {
  return Number(String(value).replace(/[^0-9.-]/g, ""));
}

function optionLabel(options, value) {
  return options.find((option) => option.value === value)?.label || value;
}

function Field({ label, children }) {
  return (
    <label>
      {label}
      {children}
    </label>
  );
}

export default function DealForm({ onResult }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    const value =
      event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateDiligence = (key) => (event) => {
    setForm((current) => ({
      ...current,
      diligence: {
        ...current.diligence,
        [key]: event.target.checked
      }
    }));
  };

  const buildPayload = () => ({
    profile: {
      name: form.name || "Untitled deal",
      address: form.address,
      assetClass: form.assetClass,
      assetClassLabel: optionLabel(assetClasses, form.assetClass),
      dealStrategy: form.dealStrategy,
      dealStrategyLabel: optionLabel(dealStrategies, form.dealStrategy),
      offerType: form.offerType,
      offerTypeLabel: optionLabel(offerTypes, form.offerType),
      contractType: form.contractType,
      contractTypeLabel: optionLabel(contractTypes, form.contractType)
    },
    property: {
      price: toNumber(form.price),
      arv: toNumber(form.arv),
      units: toNumber(form.units),
      squareFeet: toNumber(form.squareFeet),
      occupancy: toNumber(form.occupancy) / 100,
      vacancy: Math.max(0, 1 - toNumber(form.occupancy) / 100),
      yearBuilt: toNumber(form.yearBuilt),
      dom: toNumber(form.dom),
      rentControl: form.rentControl
    },
    rentRoll: {
      grossRent: toNumber(form.grossRent),
      marketRent: toNumber(form.marketRent),
      leaseCount: toNumber(form.leaseCount),
      avgLeaseMonths: toNumber(form.avgLeaseMonths),
      leaseExpirations: toNumber(form.leaseExpirations),
      securityDeposits: toNumber(form.securityDeposits)
    },
    expenses: {
      taxes: toNumber(form.taxes),
      insurance: toNumber(form.insurance),
      repairsMaintenance: toNumber(form.repairsMaintenance),
      utilities: toNumber(form.utilities),
      management: toNumber(form.management),
      capexReserve: toNumber(form.capexReserve),
      otherExpenses: toNumber(form.otherExpenses),
      reported: toNumber(form.otherExpenses) + toNumber(form.taxes) + toNumber(form.insurance) + toNumber(form.repairsMaintenance) + toNumber(form.utilities) + toNumber(form.management) + toNumber(form.capexReserve)
    },
    strategy: {
      renovationBudget: toNumber(form.renovationBudget),
      assignmentFee: toNumber(form.assignmentFee),
      closingCosts: toNumber(form.closingCosts),
      holdingMonths: toNumber(form.holdingMonths),
      resaleCosts: toNumber(form.resaleCosts),
      adr: toNumber(form.adr),
      shortTermOccupancy: toNumber(form.shortTermOccupancy) / 100,
      furnishingBudget: toNumber(form.furnishingBudget),
      downPayment: toNumber(form.downPayment),
      interestRate: toNumber(form.interestRate) / 100,
      ltv: toNumber(form.ltv) / 100,
      reserves: toNumber(form.reserves),
      amortizationYears: toNumber(form.amortizationYears),
      sellerCarryRate: toNumber(form.sellerCarryRate) / 100,
      sellerCarryTerm: toNumber(form.sellerCarryTerm),
      optionFee: toNumber(form.optionFee),
      exchangeDeadlineDays: toNumber(form.exchangeDeadlineDays)
    },
    market: {
      realisticMarketRent: toNumber(form.realisticMarketRent),
      priceReduced: form.priceReduced
    },
    risks: {
      flood: form.riskFlood,
      environmental: form.riskEnvironmental
    },
    ingestion: {
      rentRollText: form.rentRollText,
      t12Text: form.t12Text
    },
    diligence: form.diligence
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const payload = buildPayload();
    if (!payload.property.price) {
      setError("Purchase price is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await scoreDeal(payload);
      onResult(result);
    } catch (caughtError) {
      setError(caughtError.message || "Unable to score this deal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="panel deal-form" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Underwrite Deal</p>
        <h2>Deal room intake</h2>
      </div>

      <section className="form-section">
        <h3>Deal profile</h3>
        <Field label="Deal name">
          <input value={form.name} onChange={updateField("name")} placeholder="Pearl Street 12-unit" />
        </Field>
        <Field label="Address / market">
          <input value={form.address} onChange={updateField("address")} placeholder="Honolulu, HI" />
        </Field>
        <div className="field-grid two">
          <Field label="Asset class">
            <select value={form.assetClass} onChange={updateField("assetClass")}>
              {assetClasses.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Deal strategy">
            <select value={form.dealStrategy} onChange={updateField("dealStrategy")}>
              {dealStrategies.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Offer type">
            <select value={form.offerType} onChange={updateField("offerType")}>
              {offerTypes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Contract type">
            <select value={form.contractType} onChange={updateField("contractType")}>
              {contractTypes.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="form-section">
        <h3>Property and pricing</h3>
        <div className="field-grid three">
          <Field label="Purchase price">
            <input inputMode="decimal" value={form.price} onChange={updateField("price")} placeholder="850000" />
          </Field>
          <Field label="ARV / exit value">
            <input inputMode="decimal" value={form.arv} onChange={updateField("arv")} placeholder="1100000" />
          </Field>
          <Field label="Days on market">
            <input inputMode="decimal" value={form.dom} onChange={updateField("dom")} placeholder="120" />
          </Field>
          <Field label="Units">
            <input inputMode="decimal" value={form.units} onChange={updateField("units")} placeholder="12" />
          </Field>
          <Field label="Square feet">
            <input inputMode="decimal" value={form.squareFeet} onChange={updateField("squareFeet")} placeholder="9600" />
          </Field>
          <Field label="Year built">
            <input inputMode="decimal" value={form.yearBuilt} onChange={updateField("yearBuilt")} placeholder="1978" />
          </Field>
        </div>
        <label className="check-row">
          <input type="checkbox" checked={form.rentControl} onChange={updateField("rentControl")} />
          Rent control or material lease restriction
        </label>
        <label className="check-row">
          <input type="checkbox" checked={form.priceReduced} onChange={updateField("priceReduced")} />
          Price has been reduced
        </label>
      </section>

      <section className="form-section">
        <h3>Rent roll and leases</h3>
        <div className="field-grid three">
          <Field label="Annual current rent">
            <input inputMode="decimal" value={form.grossRent} onChange={updateField("grossRent")} placeholder="108000" />
          </Field>
          <Field label="Annual market rent">
            <input inputMode="decimal" value={form.marketRent} onChange={updateField("marketRent")} placeholder="124000" />
          </Field>
          <Field label="Realistic market rent">
            <input inputMode="decimal" value={form.realisticMarketRent} onChange={updateField("realisticMarketRent")} placeholder="118000" />
          </Field>
          <Field label="Occupancy %">
            <input inputMode="decimal" value={form.occupancy} onChange={updateField("occupancy")} placeholder="92" />
          </Field>
          <Field label="Lease count">
            <input inputMode="decimal" value={form.leaseCount} onChange={updateField("leaseCount")} placeholder="10" />
          </Field>
          <Field label="Average lease months left">
            <input inputMode="decimal" value={form.avgLeaseMonths} onChange={updateField("avgLeaseMonths")} placeholder="8" />
          </Field>
          <Field label="Expiring in 90 days">
            <input inputMode="decimal" value={form.leaseExpirations} onChange={updateField("leaseExpirations")} placeholder="2" />
          </Field>
        </div>
        <Field label="Unit rent roll paste">
          <textarea
            value={form.rentRollText}
            onChange={updateField("rentRollText")}
            placeholder={"Unit 1, 1200, 1450, occupied\nUnit 2, 0, 1500, vacant"}
          />
        </Field>
      </section>

      <section className="form-section">
        <h3>Expenses and statements</h3>
        <div className="field-grid three">
          <Field label="Taxes">
            <input inputMode="decimal" value={form.taxes} onChange={updateField("taxes")} placeholder="11000" />
          </Field>
          <Field label="Insurance">
            <input inputMode="decimal" value={form.insurance} onChange={updateField("insurance")} placeholder="7200" />
          </Field>
          <Field label="Repairs / maintenance">
            <input inputMode="decimal" value={form.repairsMaintenance} onChange={updateField("repairsMaintenance")} placeholder="9600" />
          </Field>
          <Field label="Utilities">
            <input inputMode="decimal" value={form.utilities} onChange={updateField("utilities")} placeholder="5400" />
          </Field>
          <Field label="Management">
            <input inputMode="decimal" value={form.management} onChange={updateField("management")} placeholder="6500" />
          </Field>
          <Field label="Capex reserve">
            <input inputMode="decimal" value={form.capexReserve} onChange={updateField("capexReserve")} placeholder="6000" />
          </Field>
          <Field label="Other expenses">
            <input inputMode="decimal" value={form.otherExpenses} onChange={updateField("otherExpenses")} placeholder="2500" />
          </Field>
          <Field label="Security deposits">
            <input inputMode="decimal" value={form.securityDeposits} onChange={updateField("securityDeposits")} placeholder="12000" />
          </Field>
        </div>
        <Field label="T12 paste">
          <textarea
            value={form.t12Text}
            onChange={updateField("t12Text")}
            placeholder={"Rental income 100000\nTaxes 18000\nInsurance 12000\nRepairs 10000\nUtilities 6000"}
          />
        </Field>
      </section>

      <section className="form-section">
        <h3>Strategy levers</h3>
        <div className="field-grid three">
          <Field label="Renovation budget">
            <input inputMode="decimal" value={form.renovationBudget} onChange={updateField("renovationBudget")} placeholder="85000" />
          </Field>
          <Field label="Assignment fee">
            <input inputMode="decimal" value={form.assignmentFee} onChange={updateField("assignmentFee")} placeholder="25000" />
          </Field>
          <Field label="Closing costs">
            <input inputMode="decimal" value={form.closingCosts} onChange={updateField("closingCosts")} placeholder="18000" />
          </Field>
          <Field label="Holding months">
            <input inputMode="decimal" value={form.holdingMonths} onChange={updateField("holdingMonths")} placeholder="6" />
          </Field>
          <Field label="Resale costs">
            <input inputMode="decimal" value={form.resaleCosts} onChange={updateField("resaleCosts")} placeholder="55000" />
          </Field>
          <Field label="STR ADR">
            <input inputMode="decimal" value={form.adr} onChange={updateField("adr")} placeholder="225" />
          </Field>
          <Field label="STR occupancy %">
            <input inputMode="decimal" value={form.shortTermOccupancy} onChange={updateField("shortTermOccupancy")} placeholder="62" />
          </Field>
          <Field label="Furnishing budget">
            <input inputMode="decimal" value={form.furnishingBudget} onChange={updateField("furnishingBudget")} placeholder="35000" />
          </Field>
          <Field label="Down payment">
            <input inputMode="decimal" value={form.downPayment} onChange={updateField("downPayment")} placeholder="170000" />
          </Field>
          <Field label="Interest rate %">
            <input inputMode="decimal" value={form.interestRate} onChange={updateField("interestRate")} placeholder="6.5" />
          </Field>
          <Field label="LTV %">
            <input inputMode="decimal" value={form.ltv} onChange={updateField("ltv")} placeholder="70" />
          </Field>
          <Field label="Reserves">
            <input inputMode="decimal" value={form.reserves} onChange={updateField("reserves")} placeholder="100000" />
          </Field>
          <Field label="Amortization years">
            <input inputMode="decimal" value={form.amortizationYears} onChange={updateField("amortizationYears")} placeholder="30" />
          </Field>
          <Field label="Seller carry rate %">
            <input inputMode="decimal" value={form.sellerCarryRate} onChange={updateField("sellerCarryRate")} placeholder="4.5" />
          </Field>
          <Field label="Seller carry term months">
            <input inputMode="decimal" value={form.sellerCarryTerm} onChange={updateField("sellerCarryTerm")} placeholder="60" />
          </Field>
          <Field label="Option fee">
            <input inputMode="decimal" value={form.optionFee} onChange={updateField("optionFee")} placeholder="10000" />
          </Field>
          <Field label="1031 deadline days left">
            <input inputMode="decimal" value={form.exchangeDeadlineDays} onChange={updateField("exchangeDeadlineDays")} placeholder="35" />
          </Field>
        </div>
        <div className="check-grid">
          <label className="check-row">
            <input type="checkbox" checked={form.riskFlood} onChange={updateField("riskFlood")} />
            Flood risk
          </label>
          <label className="check-row">
            <input type="checkbox" checked={form.riskEnvironmental} onChange={updateField("riskEnvironmental")} />
            Environmental risk
          </label>
        </div>
      </section>

      <section className="form-section">
        <h3>Diligence files</h3>
        <div className="check-grid">
          {diligenceItems.map((item) => (
            <label className="check-row" key={item.key}>
              <input
                type="checkbox"
                checked={Boolean(form.diligence[item.key])}
                onChange={updateDiligence(item.key)}
              />
              {item.label}
            </label>
          ))}
        </div>
      </section>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Scoring..." : "Inspect Deal"}
      </button>
    </form>
  );
}
