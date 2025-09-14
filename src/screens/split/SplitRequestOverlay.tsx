// src/screens/split/SplitRequestOverlay.tsx (TOP OF FILE)
import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  X,
  Users,
  UserPlus2,
  Check,
  ShieldCheck,
  Share2,
  Copy,
  Sparkles,
  Trophy,
  MessageCircle,
} from "lucide-react";

import AnimatedReceipt from "./AnimatedReceipt";
import StickerPicker from "./StickerPicker";

// ✅ pull everything from groups in one place
import {
  type Group,
  PEOPLE,
  getPerson,
  loadGroups,
  saveGroups,
  getBadges,
  getPoints,
} from "./groups";

import { applyReward, BADGE_META } from "./rewards";


// types
type Mode = "split" | "request";

type MemberShare = { id: string; amount: number; included: boolean };

const currency = (v: number) =>
  `BDT ${v.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

export default function SplitRequestOverlay({ onClose }: { onClose: () => void }) {
  // --- wizard state
  const [step, setStep] = useState<number>(0);
  const [mode, setMode] = useState<Mode>("split");

  // groups
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id || null);

  // create group
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("🎉");

  // amount & note
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // people selection (default: group or all)
  const defaultMembers = useMemo(() => {
    const base = selectedGroupId
      ? groups.find(g => g.id === selectedGroupId)?.memberIds || ["me"]
      : ["me"];
    const full = Array.from(new Set(base));
    return full;
  }, [selectedGroupId, groups]);

  const [members, setMembers] = useState<MemberShare[]>(
    defaultMembers.map(id => ({ id, amount: 0, included: true }))
  );

  // allocation
  function splitEqual(includeMe: boolean) {
    const active = members.filter(m => m.included && (includeMe ? true : m.id !== "me"));
    const per = active.length ? Math.round((amount / active.length) * 100) / 100 : 0;
    setMembers(ms =>
      ms.map(m => ({
        ...m,
        amount: m.included && (includeMe ? true : m.id !== "me") ? per : 0,
      }))
    );
  }

  function assignedTotal() {
    return members.reduce((s, m) => s + (m.included ? m.amount : 0), 0);
  }

  // deep link (fake)
  const linkId = useMemo(() => Math.random().toString(36).slice(2, 10), []);
  const deeplink = `astha://split?id=${linkId}`;

  // --- actions
  function createGroup() {
    if (!newGroupName.trim()) return;
    const ids = Array.from(new Set(members.map(m => m.id)));
    const g: Group = {
      id: "g" + Date.now(),
      name: newGroupName.trim(),
      emoji: newGroupEmoji,
      memberIds: ids,
      createdAt: Date.now(),
    };
    const next = [g, ...groups];
    setGroups(next);
    saveGroups(next);
    setSelectedGroupId(g.id);
    applyReward({ type: "CREATE_GROUP" });
  }

  function resetMembersFromGroup(groupId: string | null) {
    const ids = groupId
      ? groups.find(g => g.id === groupId)?.memberIds || ["me"]
      : ["me"];
    setMembers(ids.map(id => ({ id, included: true, amount: 0 })));
  }

  // success / stickers
  const [stickers, setStickers] = useState<string[]>([]);
  const addSticker = (s: string) => setStickers(v => [...v, s]);

  // layout helpers
  const Page = ({ children }: { children: React.ReactNode }) => (
    <div className="relative z-10 mx-auto h-[92vh] w-[min(960px,96vw)] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/10">
      {/* header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
        <button className="rounded-full p-2 hover:bg-white/10" onClick={() => (step > 0 ? setStep(s => s - 1) : onClose())}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-lg font-semibold">{mode === "split" ? "Split money" : "Request money"}</div>
        <button className="rounded-full p-2 hover:bg-white/10" onClick={onClose}><X className="h-5 w-5" /></button>
      </div>

      {/* progress dots */}
      <div className="flex items-center justify-center gap-4 bg-gradient-to-r from-blue-600 to-blue-700 pb-3 pt-1">
        {[0,1,2,3,4,5].map(i => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i<=step ? "w-8 bg-white" : "w-4 bg-white/40"}`} />
        ))}
      </div>

      <div className="h-[calc(92vh-116px)] overflow-y-auto px-5 pb-20 pt-5">{children}</div>
    </div>
  );

  /* ---------------------------- Steps ---------------------------- */

  // STEP 0: choose mode + group
  if (step === 0) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
        <Page>
          <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
              <div className="mb-2 text-sm font-semibold text-blue-900">Mode</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("split")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ${mode==="split" ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-200"}`}
                >
                  Split
                </button>
                <button
                  onClick={() => setMode("request")}
                  className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ${mode==="request" ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-slate-700 ring-slate-200"}`}
                >
                  Request
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-200">
              <div className="mb-2 text-sm font-semibold text-indigo-900">Saved groups</div>
              <div className="flex flex-wrap gap-2">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => { setSelectedGroupId(g.id); resetMembersFromGroup(g.id); }}
                    className={`rounded-xl px-3 py-2 text-sm ring-1 ${selectedGroupId===g.id ? "bg-indigo-600 text-white ring-indigo-600" : "bg-white text-slate-700 ring-slate-200"}`}
                  >
                    <span className="mr-1">{g.emoji}</span>{g.name}
                  </button>
                ))}
                {groups.length===0 && <div className="text-xs text-slate-500">No groups yet</div>}
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 md:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-900">
                <UserPlus2 className="h-4 w-4" /> Create new group
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={newGroupEmoji}
                  onChange={(e) => setNewGroupEmoji(e.target.value)}
                  className="w-16 rounded-xl border px-3 py-2 text-center text-lg"
                />
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="min-w-[240px] flex-1 rounded-xl border px-3 py-2"
                  placeholder="e.g., Weekend Travel Gang"
                />
                <button
                  onClick={createGroup}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Save group
                </button>
              </div>
              <div className="mt-3 text-xs text-emerald-900/80">Tip: members will be taken from your current selection.</div>
            </div>

            <div className="md:col-span-2">
              <div className="flex justify-end">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  // STEP 1: amount + note
  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
        <Page>
          <div className="mx-auto max-w-xl space-y-4">
            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Total amount (BDT)</div>
              <input
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                inputMode="decimal"
                className="w-full rounded-2xl border px-4 py-3 text-lg"
                placeholder="0.00"
              />
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-slate-700">Note (optional)</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3"
                placeholder={mode === "split" ? "Dinner at Banani" : "Trip reimbursement"}
              />
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="rounded-xl px-4 py-2 text-slate-700 ring-1 ring-slate-300">Back</button>
              <button onClick={() => setStep(2)} className="rounded-xl bg-blue-600 px-5 py-2 text-white">Next</button>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  // STEP 2: choose people
  if (step === 2) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
        <Page>
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Users className="h-4 w-4" /> Select people</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {PEOPLE.map(p => {
                const idx = members.findIndex(m => m.id === p.id);
                const active = idx >= 0 && members[idx].included;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const cur = [...members];
                      const found = cur.find(m => m.id === p.id);
                      if (found) found.included = !found.included;
                      else cur.push({ id: p.id, amount: 0, included: true });
                      setMembers(cur);
                    }}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${active ? "border-blue-300 bg-blue-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-lg">{p.avatar || "👤"}</div>
                      <div className="text-left">
                        <div className="text-[15px] font-semibold">{p.name}{p.id==="me" && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">You</span>}</div>
                        <div className="text-xs text-slate-500">{p.mask}</div>
                      </div>
                    </div>
                    <div className={`rounded-full px-2 py-1 text-xs ${active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{active ? "Included" : "Tap to include"}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(1)} className="rounded-xl px-4 py-2 text-slate-700 ring-1 ring-slate-300">Back</button>
              <button onClick={() => setStep(3)} className="rounded-xl bg-blue-600 px-5 py-2 text-white">Next</button>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  // STEP 3: allocation
  if (step === 3) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
        <Page>
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold">Allocate shares</div>
              <div className="flex gap-2">
                <button className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800" onClick={() => splitEqual(true)}>Equal (incl. me)</button>
                <button className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800" onClick={() => splitEqual(false)}>Equal (excl. me)</button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200">
              <div className="grid grid-cols-[1fr_140px_120px] bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                <div>Name</div><div>Share (BDT)</div><div className="text-right">Include</div>
              </div>
              <div className="max-h-[48vh] overflow-y-auto">
                {members.map((m, i) => {
                  const p = getPerson(m.id)!;
                  return (
                    <div key={p.id} className="grid grid-cols-[1fr_140px_120px] items-center border-t px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-100">{p.avatar || "👤"}</div>
                        <div>
                          <div className="text-[15px] font-semibold">{p.name}{p.id==="me" && <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">You</span>}</div>
                          <div className="text-xs text-slate-500">{p.mask}</div>
                        </div>
                      </div>
                      <input
                        value={m.amount || ""}
                        onChange={(e) => {
                          const v = Number(e.target.value) || 0;
                          setMembers(ms => ms.map((x, idx) => idx===i ? { ...x, amount: v } : x));
                        }}
                        className="h-10 w-32 rounded-xl border px-2 text-right"
                        inputMode="decimal"
                        placeholder="0"
                      />
                      <div className="text-right">
                        <button
                          onClick={() => setMembers(ms => ms.map((x, idx) => idx===i ? { ...x, included: !x.included } : x))}
                          className={`rounded-full px-3 py-1 text-sm ${m.included ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {m.included ? "Included" : "Excluded"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              Total: <b>{currency(amount)}</b> • Assigned: <b>{currency(assignedTotal())}</b>
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={() => setStep(2)} className="rounded-xl px-4 py-2 text-slate-700 ring-1 ring-slate-300">Back</button>
              <button onClick={() => setStep(4)} className="rounded-xl bg-blue-600 px-5 py-2 text-white">Review</button>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  // STEP 4: review + confirm → success
  if (step === 4) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
        <Page>
          <div className="mx-auto max-w-2xl">
            <div className="mb-3 text-sm font-semibold text-slate-700">Review</div>

            <AnimatedReceipt
              title={`${mode === "split" ? "Split" : "Request"} • ${(selectedGroupId && groups.find(g=>g.id===selectedGroupId)?.emoji) || "🤝"}`}
              subtitle={note || "—"}
              lines={members
                .filter(m => m.included)
                .map(m => ({
                  left: `${getPerson(m.id)?.name} ${m.id==="me" ? "(You)" : ""}`,
                  right: currency(m.amount),
                }))}
              totalLabel="Total"
              total={currency(amount)}
            />

            <div className="mt-4 rounded-2xl bg-indigo-50 p-3 ring-1 ring-indigo-200">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-900">
                <ShieldCheck className="h-4 w-4" /> Stickers
              </div>
              <StickerPicker onPick={addSticker} />
              {stickers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {stickers.map((s, i) => (
                    <span key={i} className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-slate-200">{s}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(deeplink);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200"
                >
                  <Copy className="h-4 w-4" /> Copy link
                </button>
                <button
                  onClick={() => {
                    const txt = makeShareText(mode, amount, note, members, deeplink, stickers);
                    const url = `https://wa.me/?text=${encodeURIComponent(txt)}`;
                    window.open(url, "_blank");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </button>
              </div>

              <button
                onClick={() => {
                  applyReward({ type: "CREATE_SPLIT" });
                  setStep(5);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow hover:bg-blue-700"
              >
                <Sparkles className="h-5 w-5" />
                {mode === "split" ? "Create split" : "Request money"}
              </button>
            </div>
          </div>
        </Page>
      </div>
    );
  }

  // STEP 5: success — confetti + badges + decorated receipt preview
  const earned = getBadges();
  const points = getPoints();
  const lines = members
    .filter(m => m.included)
    .map(m => ({
      left: `${getPerson(m.id)?.name} ${m.id==="me" ? "(You)" : ""}`,
      right: currency(m.amount),
    }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      {/* confetti */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 70 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-1.5 w-1.5 rounded-[2px]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `-10px`,
              background: i % 3 === 0 ? "#f59e0b" : i % 3 === 1 ? "#22c55e" : "#3b82f6",
              transform: `rotate(${(i * 17) % 360}deg)`,
              animation: `confettiFall ${1000 + (i % 6) * 400}ms ease-in ${i *
                30}ms both`,
            }}
          />
        ))}
      </div>

      <Page>
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-3 text-emerald-700">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100">
              <Check className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-emerald-800">Success!</div>
              <div className="text-sm text-emerald-700/90">
                {mode === "split" ? "Split created" : "Request sent"} • Deep link ready to share
              </div>
            </div>
          </div>

          <AnimatedReceipt
            title={`${mode === "split" ? "Split Created" : "Money Requested"}`}
            subtitle={note || "—"}
            lines={lines}
            totalLabel="Total"
            total={currency(amount)}
          />

          {/* stickers preview */}
          {stickers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {stickers.map((s, i) => (
                <span key={i} className="rounded-full bg-indigo-600 px-3 py-1 text-sm text-white">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* badges & points */}
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
              <div className="mb-1 flex items-center gap-2 text-blue-900">
                <Trophy className="h-5 w-5" />
                <div className="font-semibold">Badges unlocked</div>
              </div>
              {earned.length === 0 ? (
                <div className="text-sm text-slate-600">No badges yet — keep going!</div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {earned.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1 text-sm ring-1 ring-slate-200"
                    >
                      <span>{BADGE_META[b]?.emoji || "🎖️"}</span>
                      <span>{BADGE_META[b]?.label || b}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <div className="mb-1 text-amber-900">
                <div className="font-semibold">Points</div>
              </div>
              <div className="text-2xl font-extrabold text-amber-900">{points}</div>
              <div className="text-xs text-amber-900/70">Earn points for timely payments & active groups.</div>
            </div>
          </div>

          {/* actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(deeplink);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200"
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
              <button
                onClick={() => {
                  const txt = makeShareText(mode, amount, note, members, deeplink, stickers);
                  const url = `https://wa.me/?text=${encodeURIComponent(txt)}`;
                  window.open(url, "_blank");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </button>
              <button
                onClick={() => {
                  const txt = makeShareText(mode, amount, note, members, deeplink, stickers);
                  if ((navigator as any).share) {
                    (navigator as any).share({ title: "Astha Split", text: txt });
                  } else {
                    navigator.clipboard.writeText(txt);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  // reset minimal state to start fresh
                  setStep(0);
                }}
                className="rounded-xl px-4 py-2 text-slate-700 ring-1 ring-slate-300"
              >
                Create another
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </Page>
    </div>
  );
}

/* ---------------------------- helpers ---------------------------- */

function makeShareText(
  mode: "split" | "request",
  amount: number,
  note: string,
  members: MemberShare[],
  deeplink: string,
  stickers: string[]
) {
  const who = members
    .filter(m => m.included)
    .map(m => `${getPerson(m.id)?.name}: ${currency(m.amount)}`)
    .join(" · ");
  const tag = stickers.length ? `\n${stickers.join("  •  ")}` : "";
  return `${mode === "split" ? "Split created" : "Money requested"} — ${currency(amount)}
${note ? `Note: ${note}\n` : ""}${who}
Open: ${deeplink}${tag}`;
}
