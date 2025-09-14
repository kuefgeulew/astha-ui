import React, { useMemo, useState } from "react";

/**
 * Eduflex — Review & Pay checkout (mobile-friendly)
 * (Layout-only revamp: opens in a wide popup; logic unchanged)
 */

type Category = "UNIVERSITY_APPS" | "ONLINE_LEARNING" | "PROFESSIONAL_EXAMS";
type Action = "DIRECT_2X" | "EMI_3MO";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const ONLINE_PLATFORMS = [
  "Coursera",
  "Udemy",
  "edX",
  "Udacity",
  "LinkedIn Learning",
  "Skillshare",
  "DataCamp",
  "Codecademy",
  "Khan Academy",
  "FutureLearn",
  "Other",
] as const;

const EXAMS = [
  "GRE",
  "GMAT",
  "TOEFL",
  "IELTS",
  "SAT",
  "ACT",
  "ACCA",
  "CFA",
  "PMP",
  "Other",
] as const;

function classNames(...xs: Array<string | false | undefined>): string {
  return xs.filter(Boolean).join(" ");
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value ?? "—"}</span>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

function EmiSummary({ amount }: { amount: number }) {
  const schedule = useMemo(() => {
    const months = 3;
    const monthlyFeePct = 0; // set >0 if your policy needs a fee
    const perMonth = (amount * (1 + monthlyFeePct)) / months;
    return Array.from({ length: months }, (_, i) => ({
      installment: i + 1,
      amount: perMonth,
    }));
  }, [amount]);

  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="font-medium text-blue-900">EMI Plan (3 months)</div>
      <div className="mt-2 grid gap-2">
        {schedule.map((row) => (
          <div
            key={row.installment}
            className="flex items-center justify-between text-sm text-blue-900/90"
          >
            <span>Installment {row.installment}</span>
            <span className="font-medium">{USD.format(row.amount)}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-blue-900/80">
        No fees shown. Configure a monthly fee/interest in code if required.
      </p>
    </div>
  );
}

export default function EduflexScreen({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<Category>("UNIVERSITY_APPS");
  const [platform, setPlatform] = useState<(typeof ONLINE_PLATFORMS)[number] | "">("");
  const [exam, setExam] = useState<(typeof EXAMS)[number] | "">("");
  const [amount, setAmount] = useState<string>("");
  const [actionTaken, setActionTaken] = useState<Action | null>(null);

  // Review & Pay extras
  const [promoCode, setPromoCode] = useState<string>("");
  const [saveFavorite, setSaveFavorite] = useState<boolean>(true);
  const [emailReceipt, setEmailReceipt] = useState<boolean>(true);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [paid, setPaid] = useState<boolean>(false);
  const [txnId, setTxnId] = useState<string>("");

  // Derived
  const amountNum = useMemo(() => Number(amount), [amount]);
  const amountValid = useMemo(() => amountNum > 0 && amountNum <= 300, [amountNum]);

  const amountError = useMemo(() => {
    if (!amount) return "";
    if (!(amountNum > 0)) return "Enter a valid amount";
    if (amountNum > 300) return "Payment can't be greater than 300 USD";
    return "";
  }, [amount, amountNum]);

  const needsPlatform = category === "ONLINE_LEARNING";
  const needsExam = category === "PROFESSIONAL_EXAMS";

  const formReady = useMemo(() => {
    if (!amountValid) return false;
    if (needsPlatform && !platform) return false;
    if (needsExam && !exam) return false;
    return true;
  }, [amountValid, needsPlatform, platform, needsExam, exam]);

  const allowedActions: Action[] = useMemo(() => {
    if (!formReady) return [];
    if (amountNum <= 150) return ["DIRECT_2X"];
    return ["DIRECT_2X", "EMI_3MO"];
  }, [formReady, amountNum]);

  // Promo: EDU10 → 10% off
  const discountPct = useMemo(
    () => (promoCode.trim().toUpperCase() === "EDU10" ? 0.1 : 0),
    [promoCode]
  );
  const grossAmount = Math.max(0, amountNum);
  const discount = grossAmount * discountPct;
  const netAmount = Math.max(0, grossAmount - discount);
  const rewardPoints = useMemo(() => Math.floor(netAmount) * 2, [netAmount]);

  function resetAfterChange() {
    setActionTaken(null);
    setPromoCode("");
    setPaid(false);
    setTxnId("");
  }

  function handleAction(a: Action) {
    setActionTaken(a);
    setPaid(false);
    setTxnId("");
  }

  function handlePay() {
    if (!formReady || !actionTaken) return;
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      setPaid(true);
      setTxnId(`EDU-${Date.now().toString().slice(-6)}`);
    }, 1100);
  }

  /**
   * ===== Layout-only changes below =====
   * - Render as a WIDE POPUP overlay (escapes the narrow phone frame).
   * - Roomy content area with responsive two-column grid on large widths.
   */
  return (
    <div className="fixed inset-0 z-[80] bg-black/60 p-3">
      <div className="relative mx-auto h-[92vh] w-[min(1000px,96vw)] overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-5 py-3 backdrop-blur">
          <div className="text-base font-semibold text-slate-800">Eduflex Checkout</div>
          <button
            onClick={onBack}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200"
            title="Close"
          >
            Close
          </button>
        </div>

        {/* Scrollable body */}
        <div className="h-[calc(92vh-52px)] overflow-y-auto px-5 pb-8 pt-4">
          {/* Intro card */}
          <div className="mb-4 rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-600">
              Pay for university applications, online learning, or professional exams with
              smart rewards & EMI.
            </p>
          </div>

          {/* Main grid — single column on small, roomy two-column when wide */}
          <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            {/* Left: form */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="space-y-5">
                {/* Category */}
                <section>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(
                      [
                        {
                          id: "UNIVERSITY_APPS",
                          label: "University Applications",
                          desc: "Application fees",
                        },
                        {
                          id: "ONLINE_LEARNING",
                          label: "Online Learning",
                          desc: "Coursera, Udemy, etc.",
                        },
                        {
                          id: "PROFESSIONAL_EXAMS",
                          label: "Professional Exams",
                          desc: "GRE, GMAT, ACCA…",
                        },
                      ] as Array<{ id: Category; label: string; desc: string }>
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setCategory(opt.id);
                          setPlatform("");
                          setExam("");
                          resetAfterChange();
                        }}
                        className={classNames(
                          "rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2",
                          category === opt.id
                            ? "border-blue-600 bg-blue-50 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </section>

                {/* Platform / Exam */}
                {category === "ONLINE_LEARNING" && (
                  <section>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Platform
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => {
                        setPlatform(
                          e.target.value as (typeof ONLINE_PLATFORMS)[number]
                        );
                        resetAfterChange();
                      }}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Select a platform…</option>
                      {ONLINE_PLATFORMS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </section>
                )}

                {category === "PROFESSIONAL_EXAMS" && (
                  <section>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Exam
                    </label>
                    <select
                      value={exam}
                      onChange={(e) => {
                        setExam(e.target.value as (typeof EXAMS)[number]);
                        resetAfterChange();
                      }}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Select an exam…</option>
                      {EXAMS.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </section>
                )}

                {/* Amount */}
                <section>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Amount (USD)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      placeholder="e.g., 125"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      className="w-40 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value.replace(/[^0-9.]/g, ""));
                        resetAfterChange();
                      }}
                    />
                    <Pill>Max 300 USD</Pill>
                    {amountNum > 0 && (
                      <span className="text-sm text-gray-600">
                        {USD.format(Math.min(amountNum, 300))}
                      </span>
                    )}
                  </div>
                  {!!amountError && (
                    <p className="mt-2 text-sm text-red-600">{amountError}</p>
                  )}
                </section>

                {/* Action selection */}
                <section>
                  <div className="mb-2 text-sm text-gray-600">Options</div>
                  <div className="flex flex-wrap gap-3">
                    {(["DIRECT_2X", "EMI_3MO"] as Action[]).map((a) => {
                      const enabled = allowedActions.includes(a);
                      const label =
                        a === "DIRECT_2X"
                          ? "Direct Pay (2× points)"
                          : "EMI (3 months)";
                      return (
                        <button
                          key={a}
                          type="button"
                          disabled={!enabled}
                          onClick={() => handleAction(a)}
                          className={classNames(
                            "rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2",
                            enabled
                              ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200"
                              : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {formReady && amountNum <= 150 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Amounts ≤ 150 USD are eligible for Direct Pay only (2× reward
                      points).
                    </p>
                  )}
                </section>

                {/* Review & Pay */}
                {formReady && actionTaken && (
                  <section className="rounded-2xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold">Review & Pay</h4>
                      <Pill>
                        {actionTaken === "DIRECT_2X"
                          ? "Direct Pay (2× points)"
                          : "EMI (3 months)"}
                      </Pill>
                    </div>

                    {/* Promo */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <input
                        placeholder="Promo code (e.g., EDU10) — optional"
                        className="min-w-[220px] flex-1 rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      {!!discountPct && (
                        <span className="text-sm text-green-700">
                          Applied: {Math.round(discountPct * 100)}% off (−
                          {USD.format(discount)})
                        </span>
                      )}
                    </div>

                    {/* Toggles */}
                    <div className="mb-4 flex flex-col gap-2">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={saveFavorite}
                          onChange={(e) => setSaveFavorite(e.target.checked)}
                        />
                        Save this as a favorite payee
                      </label>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="accent-blue-600"
                          checked={emailReceipt}
                          onChange={(e) => setEmailReceipt(e.target.checked)}
                        />
                        Email me the receipt
                      </label>
                    </div>

                    {/* Amounts */}
                    <div className="rounded-xl bg-gray-50 p-3 text-sm">
                      <div className="flex justify-between">
                        <span>Amount</span>
                        <span>{USD.format(grossAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span>
                          {discount ? "−" + USD.format(discount) : "—"}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between font-medium">
                        <span>Total to pay</span>
                        <span>{USD.format(netAmount)}</span>
                      </div>
                    </div>

                    {/* Pay */}
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handlePay}
                        disabled={isPaying || paid}
                        className={classNames(
                          "rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2",
                          isPaying || paid
                            ? "cursor-not-allowed border-gray-200 bg-gray-200 text-gray-500"
                            : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200"
                        )}
                      >
                        {isPaying ? "Processing…" : paid ? "Paid" : "Pay Now"}
                      </button>
                      <span className="text-xs text-gray-500">
                        Tip: avoid DCC — pay in USD when prompted for best FX.
                      </span>
                    </div>

                    {/* Success */}
                    {paid && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="font-medium text-emerald-900">
                          Payment Successful
                        </div>
                        <div className="mt-1 text-sm text-emerald-900/90">
                          {actionTaken === "DIRECT_2X" ? (
                            <>
                              You paid <strong>{USD.format(netAmount)}</strong> and
                              earned <strong>{rewardPoints}</strong> reward points.
                            </>
                          ) : (
                            <>
                              Your EMI plan has been created for a total of{" "}
                              <strong>{USD.format(netAmount)}</strong>.
                            </>
                          )}{" "}
                          {emailReceipt && "A receipt has been emailed. "}
                          {saveFavorite && "Payee saved to Favorites."}
                        </div>
                        <div className="mt-1 text-xs text-emerald-900/80">
                          Txn ID: {txnId}
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">Summary</h3>
              <div className="mt-2">
                <InfoRow
                  label="Category"
                  value={
                    category === "UNIVERSITY_APPS"
                      ? "University Applications"
                      : category === "ONLINE_LEARNING"
                      ? "Online Learning"
                      : "Professional Exams"
                  }
                />
                {needsPlatform && <InfoRow label="Platform" value={platform || "—"} />}
                {needsExam && <InfoRow label="Exam" value={exam || "—"} />}
                <InfoRow
                  label="Amount"
                  value={amount ? USD.format(Math.min(amountNum, 300)) : "—"}
                />
                <InfoRow
                  label="Promo"
                  value={
                    discountPct ? `EDU10 (${Math.round(discountPct * 100)}% off)` : "—"
                  }
                />
                <InfoRow
                  label="Eligibility"
                  value={
                    amountValid
                      ? amountNum <= 150
                        ? "Direct Pay (2× points)"
                        : "Direct Pay (2×) or EMI (3 months)"
                      : "Incomplete"
                  }
                />
                {actionTaken && (
                  <InfoRow
                    label="Chosen Option"
                    value={
                      actionTaken === "DIRECT_2X"
                        ? "Direct Pay (2×)"
                        : "EMI (3 months)"
                    }
                  />
                )}
              </div>

              {actionTaken === "DIRECT_2X" && (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="font-medium text-green-900">Direct Pay Preview</div>
                  <div className="mt-1 text-sm text-green-900/80">
                    You will earn approximately <strong>{rewardPoints}</strong> points
                    on {USD.format(netAmount)}.
                  </div>
                </div>
              )}

              {actionTaken === "EMI_3MO" && amountValid && (
                <EmiSummary amount={netAmount} />
              )}

              {!actionTaken && (
                <p className="mt-4 text-xs text-gray-500">
                  EMI is available for payments above 150 USD up to 300 USD. For
                  smaller amounts, use Direct Pay to get 2× reward points.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
