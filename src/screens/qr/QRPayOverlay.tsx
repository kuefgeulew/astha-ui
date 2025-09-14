// src/screens/qr/QRPayOverlay.tsx
import React from "react";
import PinModal from "../../components/PinModal";
import { parseQrPayload } from "../../services/qrPay"; // keep your QR parser
import { type Account } from "../../services/bankApi";
import ReceiptCard from "./ReceiptCard";

type Props = { onClose: () => void };

/* ----------------------------- MOCK ACCOUNTS ----------------------------- */
const MOCK_ACCOUNTS: (Account & { balance?: number })[] = [
  { id: "1074165690001", name: "Savings Account Staff (BDT)", balance: 171155.0 } as Account,
  { id: "1074165690002", name: "Current Account (BDT)", balance: 84520.75 } as Account,
  { id: "1074165690003", name: "Salary Wallet (BDT)", balance: 32450.0 } as Account,
];

export default function QRPayOverlay({ onClose }: Props) {
  const [stage, setStage] = React.useState<"scan" | "details" | "success">("scan");
  const [videoSupported, setVideoSupported] = React.useState<boolean>(false);
  const [scanError, setScanError] = React.useState<string | null>(null);

  const [merchantId, setMerchantId] = React.useState<string>("");

  // dropdown + balances (mock)
  const [accounts] = React.useState<Account[]>(MOCK_ACCOUNTS as Account[]);
  const [fromId, setFromId] = React.useState<string>(MOCK_ACCOUNTS[0].id);
  const fromBalance =
    (MOCK_ACCOUNTS.find((a) => a.id === fromId)?.balance as number | undefined) ?? null;

  const [amount, setAmount] = React.useState<string>("");
  const [note, setNote] = React.useState<string>("bKash QR");

  const [confirming, setConfirming] = React.useState(false);
  const [txId, setTxId] = React.useState<string | null>(null);

  // Round-up / Mini-Savings & Rewards
  const [showRoundup, setShowRoundup] = React.useState(false);
  const [miniTopUp, setMiniTopUp] = React.useState<number>(0);
  const [rewardPoints, setRewardPoints] = React.useState<number>(0);
  const [roundupEnabled, setRoundupEnabled] = React.useState(true); // 👈 small toggle (ON)

  // camera refs
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const detectorRef = React.useRef<any>(null);
  const rafRef = React.useRef<number | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  /* ---------------- camera + QR detection ------------------- */
  React.useEffect(() => {
    if (stage !== "scan") {
      stopCamera();
      return;
    }
    let cancelled = false;

    async function start() {
      try {
        // @ts-ignore
        const BarcodeDetector = (window as any).BarcodeDetector;
        if (BarcodeDetector) detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });

        const constraints: MediaStreamConstraints = {
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(async (err) => {
          if (err?.name === "OverconstrainedError" || err?.name === "NotFoundError") {
            return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          }
          throw err;
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setVideoSupported(true);
          setScanError(null);
          tick();
        }
      } catch (err: any) {
        setVideoSupported(false);
        const msg =
          err?.name === "NotAllowedError"
            ? "Permission blocked. Allow camera access, then press Retry."
            : err?.name === "NotFoundError"
            ? "No camera found on this device."
            : err?.message || "Camera not available";
        setScanError(msg);
      }
    }

    async function tick() {
      if (!videoRef.current) return;
      if (detectorRef.current) {
        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          const first = codes?.[0]?.rawValue as string | undefined;
          if (first) {
            const parsed = parseQrPayload(first);
            if (parsed) {
              setMerchantId(parsed.merchantId);
              stopCamera();
              setStage("details");
              return;
            }
          }
        } catch {
          /* ignore */
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function stopCamera() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  /* -------- round-up decision before asking for PIN -------- */
  // live preview for UI: based on WHOLE taka, nearest multiple of 10
  const previewMiniTopUp = React.useMemo(() => {
    const amt = Number.parseFloat(amount);
    if (!(amt > 0)) return 0;
    const whole = Math.floor(amt);
    return (10 - (whole % 10)) % 10; // 0..9
  }, [amount]);

  function handleConfirmPressed() {
    const amt = Number.parseFloat(amount);
    if (!fromId || !merchantId || !(amt > 0)) return;

    if (roundupEnabled) {
      const whole = Math.floor(amt);
      const remainderTo10 = (10 - (whole % 10)) % 10; // 0..9
      if (remainderTo10 > 0) {
        setMiniTopUp(remainderTo10);
        setShowRoundup(true); // 👈 shows the modal before PIN
        return;
      }
    }
    setMiniTopUp(0);
    setShowRoundup(false);
    setConfirming(true); // open PIN modal directly
  }

  /* ---------------- simulate payment locally (no backend) --------------- */
  async function submitPayment(pin: string) {
    setConfirming(true);
    try {
      const amt = Number.parseFloat(amount) || 0;
      setRewardPoints(Math.floor(amt / 80)); // simple mock rule
      await new Promise((r) => setTimeout(r, 500));
      setTxId("TX" + Date.now());
      setStage("success");
    } catch (e: any) {
      alert(e?.message ?? "Payment failed");
    } finally {
      setConfirming(false);
    }
  }

  /* --------------------- receipt helpers -------------------- */
  function downloadReceipt() {
    const el = document.getElementById("qr-receipt");
    if (!el) return;
    const html =
      "<!doctype html><meta charset='utf-8'><title>QR Receipt</title>" +
      document.head.innerHTML +
      "<body>" +
      el.outerHTML +
      "</body>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astha-qr-receipt-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function shareReceipt() {
    try {
      const amt = Number.parseFloat(amount) || 0;
      const text =
        `BRAC Bank Astha — Payment Success\n` +
        `Merchant: ${merchantId}\n` +
        `Amount: BDT ${amt.toFixed(2)}\n` +
        (miniTopUp > 0 ? `Mini-Savings: BDT ${miniTopUp}\n` : "") +
        `From: ${accounts.find((a) => a.id === fromId)?.name ?? fromId}\n` +
        `Reference: ${txId ?? "—"}\n` +
        `When: ${new Date().toLocaleString()}\n` +
        `Reward Points: ${rewardPoints}`;
      if (navigator.share) {
        await navigator.share({ title: "Astha QR Payment", text });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Receipt copied to clipboard.");
      }
    } catch {
      alert("Share failed.");
    }
  }

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  /* --------------------------------- UI --------------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative z-10 h-[90vh] w-[min(900px,95vw)] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-base font-semibold">Scan & Pay</h2>
          <button onClick={handleClose} className="rounded-lg border px-3 py-1.5 dark:border-neutral-700">
            Close
          </button>
        </header>

        {/* SCAN */}
        {stage === "scan" && (
          <div className="grid flex-1 grid-cols-1 gap-0 md:grid-cols-2">
            <div className="relative grid place-items-center bg-black">
              {videoSupported ? (
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              ) : (
                <div className="p-6 text-center text-white">
                  Camera unavailable
                  <br />
                  <span className="text-sm opacity-80">{scanError}</span>
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-[70%] max-h-[360px] w-[70%] max-w-[360px] rounded-xl border-4 border-white" />
              </div>
            </div>
            <div className="p-5">
              <h3 className="mb-2 font-semibold">Scan and Pay</h3>
              <p className="mb-4 text-sm text-neutral-600">
                Hold your camera on the QR code. If scanning isn’t supported, enter the merchant code manually.
              </p>

              <label className="mb-1 block text-sm">Enter Merchant Code/ID</label>
              <input
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                placeholder="01XXXXXXXXX or MERCHANT123"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700"
              />

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => merchantId.trim() && setStage("details")}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                  disabled={!merchantId.trim()}
                >
                  Continue
                </button>
                {!videoSupported && (
                  <button onClick={() => setStage("scan")} className="rounded-xl border px-4 py-2" title="Retry camera">
                    Retry camera
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DETAILS */}
        {stage === "details" && (
          <div className="flex-1 overflow-auto p-5">
            <div className="mx-auto max-w-xl space-y-4">
              <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div className="text-sm text-neutral-500">Merchant</div>
                <div className="font-semibold">{merchantId || "—"}</div>
              </div>

              <div className="space-y-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-neutral-500">
                    <span>Payment Amount (BDT)</span>
                    <label className="flex select-none items-center gap-2 text-xs text-neutral-700">
                      <input
                        type="checkbox"
                        checked={roundupEnabled}
                        onChange={(e) => setRoundupEnabled(e.target.checked)}
                      />
                      Ask to save change
                    </label>
                  </div>
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700"
                    placeholder="0.00"
                  />
                  {/* live round-up preview */}
                  {roundupEnabled && previewMiniTopUp > 0 && (
                    <div className="mt-1 text-xs text-amber-700">
                      We’ll suggest saving <b>BDT {previewMiniTopUp}</b> to your Mini-Savings jar.
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-1 text-sm text-neutral-500">Pay From</div>
                  <select
                    value={fromId}
                    onChange={(e) => setFromId(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-xs text-neutral-500">
                    Avl Bal. {fromBalance != null ? `BDT ${fromBalance.toFixed(2)}` : "—"}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-sm text-neutral-500">Select Authorization Mode</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1 dark:border-neutral-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-600" /> Card PIN
                    </span>
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-sm text-neutral-500">Note (optional)</div>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 dark:border-neutral-700"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setStage("scan")} className="rounded-lg border px-4 py-2 dark:border-neutral-700">
                    Back
                  </button>
                  <button
                    onClick={handleConfirmPressed}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                    disabled={!fromId || !merchantId || !(Number.parseFloat(amount) > 0)}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS — scrollable receipt */}
        {stage === "success" && (
          <div className="flex-1 p-5">
            <div className="mx-auto max-w-[880px] max-h-[calc(90vh-120px)] overflow-auto rounded-2xl">
              <ReceiptCard
                merchant={{
                  name: merchantId,
                  walletMask:
                    merchantId && /^\d+$/.test(merchantId)
                      ? merchantId.replace(/(\d{2})\d+(?=\d{2}$)/, "$1XXXXXXXX")
                      : undefined,
                }}
                fromAccount={accounts.find((a) => a.id === fromId)?.name ?? fromId}
                amount={Number.parseFloat(amount || "0")}
                miniTopUp={miniTopUp}
                rewardPoints={rewardPoints}
                date={new Date()}
                reference={txId ?? "—"}
                onDownload={downloadReceipt}
                onShare={shareReceipt}
                onAnother={() => {
                  setMerchantId("");
                  setAmount("");
                  setNote("bKash QR");
                  setMiniTopUp(0);
                  setRewardPoints(0);
                  setStage("scan");
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* PIN modal */}
      <PinModal open={confirming} onClose={() => setConfirming(false)} onVerify={submitPayment} />

      {/* Round-up prompt */}
      {showRoundup && (
        <div className="fixed inset-0 z-[60] grid place-items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRoundup(false)} />
          <div className="relative z-[61] w-[min(560px,92vw)] rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/10">
            <div className="text-lg font-semibold text-slate-800">Save your change?</div>
            <p className="mt-2 text-sm text-slate-600">
              We round payments to the nearest multiple of 10 (whole Taka). You’re paying{" "}
              <b>BDT {(Number.parseFloat(amount) || 0).toFixed(2)}</b>. Save the remaining{" "}
              <b>BDT {miniTopUp}</b> to your special <b>Mini-Savings</b> account?
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border px-4 py-2 text-slate-700"
                onClick={() => {
                  setMiniTopUp(0);
                  setShowRoundup(false);
                  setConfirming(true); // continue to PIN
                }}
              >
                Just pay {(Number.parseFloat(amount) || 0).toFixed(0)}
              </button>
              <button
                className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
                onClick={() => {
                  setShowRoundup(false);
                  setConfirming(true); // continue to PIN
                }}
              >
                Save BDT {miniTopUp} & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
