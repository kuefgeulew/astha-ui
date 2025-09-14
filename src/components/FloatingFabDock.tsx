//app
// src/components/FloatingFabDock.tsx
import React from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  MessageCircle,
  QrCode,
  SplitSquareVertical,
  PieChart,
  Gift,
} from "lucide-react";

type Props = { hidden?: boolean };

const BTN =
  "pointer-events-auto grid h-12 w-12 place-items-center rounded-full bg-white text-black shadow-xl ring-1 ring-black/10";

function DockContent({ hidden = false }: Props) {
  const [open, setOpen] = React.useState(false);
  const [hoverId, setHoverId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fn = () => setOpen(false);
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);

  if (hidden) return null;

  // Actions (all identical color; Split/Request is black-on-white)
  const items = [
    { id: "chat", label: "Chat", icon: MessageCircle, hash: "#chatbot" },
    { id: "offers", label: "Offers", icon: Gift, hash: "#offers", badge: "For You" as const },
    { id: "qr", label: "Scan & Pay", icon: QrCode, hash: "#qrpay" },
    { id: "budget", label: "Budgets", icon: PieChart, hash: "#budget" },
    { id: "split", label: "Split / Request", icon: SplitSquareVertical, hash: "#split" },
  ] as const;

  // 360° fan geometry (centered)
  const R = 120;            // distance from center to buttons
  const LABEL_R = R + 44;   // label distance
  const delayFor = (i: number) => i * 0.03;

  return (
    <>
      {/* Dim mask inside the phone frame only */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-mask"
            className="absolute inset-0 z-[9998] bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Centered overlay relative to phone frame */}
      <div className="absolute inset-0 z-[9999] pointer-events-none">
        {/*  Only change: push the hub lower with a numeric translate-y */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 translate-y-[0px] pointer-events-none">
          <AnimatePresence>
            {open &&
              items.map((it, i) => {
                const Icon = it.icon;
                // Start at -90° (top), distribute evenly around full circle
                const theta = (-90 + (360 / items.length) * i) * (Math.PI / 180);
                const x = Math.cos(theta) * R;
                const y = Math.sin(theta) * R;
                const lx = Math.cos(theta) * LABEL_R;
                const ly = Math.sin(theta) * LABEL_R;

                return (
                  <React.Fragment key={it.id}>
                    {/* Action button */}
                    <motion.button
                      initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                      animate={{ opacity: 1, x, y, scale: 1 }}
                      exit={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 32,
                        delay: delayFor(i),
                      }}
                      onMouseEnter={() => setHoverId(it.id)}
                      onMouseLeave={() =>
                        setHoverId((h) => (h === it.id ? null : h))
                      }
                      onClick={() => {
                        window.location.hash = it.hash;
                        setOpen(false);
                      }}
                      aria-label={it.label}
                      title={it.label}
                      className={`${BTN} absolute`}
                      style={{ left: 0, top: 0 }}
                    >
                      <Icon className="h-6 w-6" />
                      {it.id === "offers" && (
                        <span className="pointer-events-none absolute -top-2 -right-2 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                          For You
                        </span>
                      )}
                    </motion.button>

                    {/* Hover label follows the same radial arc */}
                    <motion.span
                      initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                      animate={{
                        opacity: hoverId === it.id ? 1 : 0,
                        scale: hoverId === it.id ? 1 : 0.6,
                        x: lx,
                        y: ly,
                      }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-md bg-black px-2 py-1 text-xs text-white shadow"
                      style={{ left: 0, top: 0, whiteSpace: "nowrap" }}
                    >
                      {it.label}
                    </motion.span>
                  </React.Fragment>
                );
              })}
          </AnimatePresence>

          {/* Main FAB (center) */}
          <motion.button
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((s) => !s)}
            className="pointer-events-auto grid h-16 w-16 place-items-center rounded-full bg-[#1d4ed8] text-white shadow-2xl hover:brightness-110 active:scale-95"
            whileTap={{ scale: 0.95 }}
            style={{ position: "relative", left: 0, top: 0 }}
          >
            <motion.div
              initial={false}
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {open ? <X className="h-7 w-7" /> : <Plus className="h-8 w-8" />}
            </motion.div>
          </motion.button>
        </div>
      </div>
    </>
  );
}

export default function FloatingFabDock(props: Props) {
  // Portal to the phone frame so the dock is fixed at its center.
  const anchor =
    (typeof document !== "undefined" && document.getElementById("fab-anchor")) ||
    document.body;
  return ReactDOM.createPortal(<DockContent {...props} />, anchor);
}