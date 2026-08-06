"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Locomotive from "./Locomotive";
import PinPad from "./PinPad";
import { TouchRipple } from "./Fx";
import { useStore } from "@/lib/store";

type Mode = "login" | "register";
type Stage = "form" | "pin";

const EASE = [0.76, 0, 0.24, 1] as const;

export default function LoginCard({ onAuthed }: { onAuthed: () => void }) {
  const { login } = useStore();
  const [mode, setMode] = useState<Mode>("login");
  const [stage, setStage] = useState<Stage>("form");
  const [tabel, setTabel] = useState("");
  const [fio, setFio] = useState("");
  const [blind, setBlind] = useState(false);
  const [err, setErr] = useState("");

  const canSubmit =
    stage === "form" && tabel.trim().length >= 3 && (mode === "login" || fio.trim().length >= 3);

  const submit = () => {
    const w = login(tabel);
    if (!w) {
      setErr("Bunday tabel raqami kadrlar bazasida topilmadi");
      return;
    }
    setErr("");
    setStage("pin");
  };

  return (
    <TouchRipple className="relative w-full max-w-[980px] rounded-[28px]">
      <div className="glass-strong relative w-full overflow-hidden rounded-[28px]">
        {/* diagonal koʻk panel — login/registratsiya almashganda sirg'aladi */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 hidden w-[62%] md:block"
          animate={{ left: mode === "login" ? "48%" : "-10%" }}
          transition={{ duration: 0.85, ease: EASE }}
        >
          <div
            className="h-full w-full overflow-hidden"
            style={{
              clipPath:
                mode === "login"
                  ? "polygon(18% 0, 100% 0, 100% 100%, 0 100%)"
                  : "polygon(0 0, 100% 0, 82% 100%, 0 100%)",
            }}
          >
            <img
              src="/ichi.jpg"
              alt=""
              className="animate-kenburns h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(28,92,158,.92)_0%,rgba(35,120,190,.86)_45%,rgba(74,159,216,.8)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,.42),transparent_58%)]" />
          </div>
        </motion.div>

        <div className="relative grid min-h-[520px] md:grid-cols-2">
          {/* CHAP: forma */}
          <motion.div
            className="order-2 flex flex-col justify-center px-7 py-10 md:order-1 md:px-12"
            animate={{ x: mode === "login" ? 0 : "100%", opacity: 1 }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            <AnimatePresence mode="wait">
              {stage === "form" ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-sky-700">
                    TCH-6 · Buxoro lokomotiv deposi
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {mode === "login" ? "Tizimga kirish" : "Roʻyxatdan oʻtish"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500">
                    {mode === "login"
                      ? "Tabel raqamingizni kiriting"
                      : "Tabel raqami va F.I.Sh. kadrlar bazasi bilan solishtiriladi"}
                  </p>

                  <div className="mt-8 space-y-4">
                    <Field
                      label="Tabel raqami"
                      value={tabel}
                      onChange={setTabel}
                      placeholder="masalan: 10427"
                      inputMode="numeric"
                    />
                    <AnimatePresence>
                      {mode === "register" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Field
                            label="F.I.Sh."
                            value={fio}
                            onChange={setFio}
                            placeholder="Abduvaliyev Ohun Olimjon oʻgʻli"
                            onFocusChange={setBlind}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={submit}
                    className="group relative mt-8 flex h-12 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#1b6fe0] to-[#38bdf8] font-semibold text-slate-900 transition disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <span className="relative z-10">
                      {mode === "login" ? "Davom etish" : "Yuborish"}
                    </span>
                    <span className="absolute inset-0 translate-y-full bg-slate-200 transition-transform duration-300 group-hover:translate-y-0" />
                  </button>

                  {err && (
                    <p className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-600">
                      {err}
                    </p>
                  )}

                  <p className="mt-6 text-center text-[13px] text-slate-500">
                    {mode === "login" ? "Hisobingiz yoʻqmi? " : "Hisobingiz bormi? "}
                    <button
                      type="button"
                      onClick={() => setMode(mode === "login" ? "register" : "login")}
                      className="font-semibold text-sky-700 underline-offset-4 hover:underline"
                    >
                      {mode === "login" ? "Roʻyxatdan oʻtish" : "Kirish"}
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="pin"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  onFocus={() => setBlind(true)}
                >
                  <PinPad onDone={onAuthed} />
                  <button
                    type="button"
                    onClick={() => {
                      setStage("form");
                      setBlind(false);
                    }}
                    className="mt-8 block w-full text-center text-[12px] text-slate-500 hover:text-sky-700"
                  >
                    ← Orqaga
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* OʻNG: mascot */}
          <motion.div
            className="order-1 flex flex-col items-center justify-center px-7 py-10 md:order-2"
            animate={{ x: mode === "login" ? 0 : "-100%" }}
            transition={{ duration: 0.85, ease: EASE }}
          >
            <Locomotive blind={blind || stage === "pin"} size={220} />
            <p className="mt-6 max-w-[280px] text-center text-lg font-semibold text-white">
              {stage === "pin"
                ? "Faralar oʻchdi — kodingizni koʻrmayapman"
                : mode === "login"
                ? "Xush kelibsiz!"
                : "Yangi ishchimisiz?"}
            </p>
            <p className="mt-2 max-w-[300px] text-center text-[13px] text-white/80">
              {stage === "pin"
                ? "PIN faqat sizning qurilmangizda saqlanadi"
                : "Texnika xavfsizligi va omborxona — bitta tizimda"}
            </p>
          </motion.div>
        </div>
      </div>
    </TouchRipple>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  onFocusChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  onFocusChange?: (v: boolean) => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <div
        className={`relative rounded-xl border bg-white transition-all duration-300 ${
          focus ? "border-sky-500 shadow-[0_0_0_4px_rgba(56,189,248,.12)]" : "border-slate-200"
        }`}
      >
        <input
          value={value}
          inputMode={inputMode}
          placeholder={placeholder}
          onFocus={() => {
            setFocus(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setFocus(false);
            onFocusChange?.(false);
          }}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full bg-transparent px-4 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
        />
        <span
          className={`absolute inset-x-3 bottom-0 h-px origin-left bg-gradient-to-r from-sky-400 to-transparent transition-transform duration-500 ${
            focus ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </div>
    </label>
  );
}
