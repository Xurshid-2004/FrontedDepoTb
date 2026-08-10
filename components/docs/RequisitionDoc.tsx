"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";

/* ------------------------------------------------------------------
   Требование (Форма МУ №27) — autentik bosma hujjat.
   QR uchun loyihadagi `qrcode` kutubxonasidan foydalanamiz
   (tashqi qrcode.react bogʻliqligi shart emas).
------------------------------------------------------------------ */

export interface SignatureData {
  signedBy: string;
  role: string;
  signedAt: string;
  digitalSignHash: string;
  isSigned: boolean;
}

/** Bitta QR imzo bloki (bugalter, bosh xisobchi, depo boshligʻi, ishchi, ombor mudiri) */
export interface DocSig {
  role: string;      // lavozim nomi
  name: string;      // F.I.Sh.
  field: string;     // maydon raqami (06, 14, 05, 12, 11)
  signed: boolean;   // imzolanganmi
  sana?: string;
  hash?: string;
}

export interface RequisitionItem {
  id: string;
  nomenclatNumWarehouse: string;
  nomenclatNumLowValue: string;
  nameAndSize: string;
  unit: string;
  qtyRequested: number;
  qtyIssued: number;
  price: number;
  totalSum: number;
  warehouseCardNo?: string;
  accountCode?: string;
  expenseArticle?: string;
  monthsInUse?: string | number;
  depreciationSum?: number;
  wearExpireMonth?: string;
  wearExpireYear?: string;
}

export interface RequisitionHeader {
  companyName: string;
  reqNumber: string;
  toWhom: string;
  throughWhom: string;
  requestedBy: string;
  approvedBy: string;
  chiefAccountant: string;
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  issueDateMonth: string;
  issueDateYear: string;
  recipientCompanyCode: string;
  operationType: string;
  pantCode: string;
  corrAccount: string;
  corrSubAccount: string;
  priceHeader: string;
  shopCode: string;
  depreciationMethod: string;
  professionCode: string;
  recipientPersonnelNo: string;
  transferorPersonnelNo: string;
  documentUuid: string;
  verificationUrl?: string;
  issuedSignature?: SignatureData;
  receivedSignature?: SignatureData;
}

/** qrcode → SVG (mijoz tomonida) */
function QrSvg({ value, size = 48 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(value, { type: "svg", margin: 0, width: size, errorCorrectionLevel: "M" })
      .then(setSvg)
      .catch(() => {});
  }, [value, size]);
  return (
    <span
      style={{ width: size, height: size, display: "inline-block" }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export function RequisitionDoc({ header, items, signatures = [] }: { header: RequisitionHeader; items: RequisitionItem[]; signatures?: DocSig[] }) {
  const minRows = 8;
  const paddedItems: RequisitionItem[] = [...items];
  while (paddedItems.length < minRows) {
    paddedItems.push({
      id: `empty-${paddedItems.length}`,
      nomenclatNumWarehouse: "",
      nomenclatNumLowValue: "",
      nameAndSize: "",
      unit: "",
      qtyRequested: 0,
      qtyIssued: 0,
      price: 0,
      totalSum: 0,
    });
  }

  const qrPayload = JSON.stringify({
    docUuid: header.documentUuid,
    docNo: header.reqNumber,
    company: header.companyName,
    verifyUrl: header.verificationUrl || `/verify/${header.documentUuid}`,
  });

  return (
    <div className="mx-auto w-full max-w-[1100px] bg-white p-6 font-serif text-[11px] leading-tight text-black print:m-0 print:w-full print:max-w-none print:p-0">
      {/* YUQORI QISM */}
      <div className="mb-1 flex items-start justify-between">
        <div className="flex items-center gap-2 rounded border border-dashed border-gray-400 p-1.5">
          <QrSvg value={qrPayload} size={54} />
          <div className="font-sans text-[8px]">
            <div className="font-bold text-blue-900">ЭЛЕКТРОН ДОКУМЕНТ</div>
            <div>ID: <span className="font-mono">{header.documentUuid.slice(0, 8)}...</span></div>
            <div className="text-gray-500">Сканируйте для проверки</div>
          </div>
        </div>
        <div className="text-right text-[10px]">
          <div>Форма МУ№27 &nbsp;&nbsp;&nbsp; <span className="border border-black px-2 py-0.5 font-mono font-bold">0303011</span></div>
          <div className="mt-0.5">Утверждена в 1979 г.</div>
        </div>
      </div>

      {/* REKVIZITLAR */}
      <div className="mb-2 grid grid-cols-12 gap-2">
        <div className="col-span-6 space-y-1">
          <div className="flex items-end">
            <span className="w-28 text-slate-600">___________________</span>
            <span className="flex-1 border-b border-black px-1 font-bold">{header.companyName}</span>
          </div>
          <div className="-mt-1 text-center text-[9px] text-gray-500">(предприятие)</div>
          <div className="flex items-end pt-1">
            <span className="w-20">Кому</span>
            <span className="flex-1 border-b border-black px-1">{header.toWhom}</span>
          </div>
          <div className="-mt-1 text-center text-[9px] text-gray-500">(ф.и.о.) (должность)</div>
          <div className="flex items-end"><span className="w-20">Через кого</span><span className="flex-1 border-b border-black px-1">{header.throughWhom}</span></div>
          <div className="flex items-end"><span className="w-20">Затребовал</span><span className="flex-1 border-b border-black px-1">{header.requestedBy}</span></div>
          <div className="flex items-end"><span className="w-20">Разрешил</span><span className="flex-1 border-b border-black px-1">{header.approvedBy}</span></div>
          <div className="flex items-end"><span className="w-28">Гл. (ст.) бухгалтер</span><span className="flex-1 border-b border-black px-1">{header.chiefAccountant}</span></div>
        </div>

        <div className="col-span-6 flex flex-col justify-between">
          <div className="pt-2 text-center">
            <h1 className="text-base font-bold tracking-wider">
              ТРЕБОВАНИЕ № <span className="border-b-2 border-black px-4">{header.reqNumber}</span>
            </h1>
            <p className="mt-1 font-semibold">на выдачу спецодежды, инвентаря и инструмента</p>
            <div className="mt-2 text-xs">
              « <span className="px-1 font-bold underline">{header.dateDay || "___"}</span> »
              <span className="px-2 font-bold underline">{header.dateMonth || "________________"}</span>
              20<span className="px-1 font-bold underline">{header.dateYear || "__"}</span> г.
            </div>
          </div>

          <table className="mt-2 w-full border-collapse border border-black text-center text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th colSpan={2} className="border border-black p-0.5">Дата выдачи</th>
                <th rowSpan={2} className="border border-black p-0.5">Код предпр. получателя</th>
                <th rowSpan={2} className="border border-black p-0.5">Вид опер.</th>
                <th rowSpan={2} className="border border-black p-0.5">Кладовая</th>
                <th colSpan={2} className="border border-black p-0.5">Корресп. счет</th>
                <th rowSpan={2} className="border border-black p-0.5">Цена</th>
                <th rowSpan={2} className="border border-black p-0.5">Участок</th>
                <th rowSpan={2} className="border border-black p-0.5">Способ погаш.</th>
                <th rowSpan={2} className="border border-black p-0.5">Код проф.</th>
                <th colSpan={2} className="border border-black p-0.5">Табельный №</th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black p-0.5">мес.</th>
                <th className="border border-black p-0.5">год</th>
                <th className="border border-black p-0.5">счет</th>
                <th className="border border-black p-0.5">шифр</th>
                <th className="border border-black p-0.5">получ.</th>
                <th className="border border-black p-0.5">перед.</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">{header.issueDateMonth}</td>
                <td className="border border-black p-1">{header.issueDateYear}</td>
                <td className="border border-black p-1">{header.recipientCompanyCode}</td>
                <td className="border border-black p-1">{header.operationType}</td>
                <td className="border border-black p-1">{header.pantCode}</td>
                <td className="border border-black p-1">{header.corrAccount}</td>
                <td className="border border-black p-1">{header.corrSubAccount}</td>
                <td className="border border-black p-1">{header.priceHeader}</td>
                <td className="border border-black p-1">{header.shopCode}</td>
                <td className="border border-black p-1">{header.depreciationMethod}</td>
                <td className="border border-black p-1">{header.professionCode}</td>
                <td className="border border-black p-1">{header.recipientPersonnelNo}</td>
                <td className="border border-black p-1">{header.transferorPersonnelNo}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ASOSIY JADVAL */}
      <table className="mt-3 w-full border-collapse border border-black text-center text-[10px]">
        <thead>
          <tr className="bg-gray-50 font-medium">
            <th colSpan={2} className="border border-black p-1">Номенклатурный номер</th>
            <th rowSpan={2} className="w-1/4 border border-black p-1">Наименование, сорт, размер</th>
            <th rowSpan={2} className="border border-black p-1">Ед. изм.</th>
            <th colSpan={2} className="border border-black p-1">Количество</th>
            <th rowSpan={2} className="border border-black p-1">Цена</th>
            <th rowSpan={2} className="border border-black p-1">Сумма</th>
            <th rowSpan={2} className="border border-black p-1 text-[8px]">№№ по картотеке</th>
            <th colSpan={2} className="border border-black p-1">Шифр затрат</th>
            <th rowSpan={2} className="border border-black p-1 text-[8px]">Мес. в экспл.</th>
            <th rowSpan={2} className="border border-black p-1">Сумма износа</th>
            <th colSpan={2} className="border border-black p-1 text-[8px]">Дата оконч. носки</th>
          </tr>
          <tr className="bg-gray-50 text-[9px]">
            <th className="border border-black p-1">на складе</th>
            <th className="border border-black p-1">малоц. в экспл.</th>
            <th className="border border-black p-1">затреб.</th>
            <th className="border border-black p-1">отпущ.</th>
            <th className="border border-black p-1">счет</th>
            <th className="border border-black p-1">статья</th>
            <th className="border border-black p-1">мес.</th>
            <th className="border border-black p-1">год</th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((item, idx) => (
            <tr key={item.id || idx} className="h-6">
              <td className="border border-black px-1 text-center font-mono">{item.nomenclatNumWarehouse}</td>
              <td className="border border-black px-1 text-center font-mono">{item.nomenclatNumLowValue}</td>
              <td className="border border-black px-1 text-left">{item.nameAndSize}</td>
              <td className="border border-black px-1">{item.unit}</td>
              <td className="border border-black px-1 font-mono">{item.qtyRequested || ""}</td>
              <td className="border border-black px-1 font-mono">{item.qtyIssued || ""}</td>
              <td className="border border-black px-1 text-right font-mono">{item.price ? item.price.toFixed(2) : ""}</td>
              <td className="border border-black px-1 text-right font-mono">{item.totalSum ? item.totalSum.toFixed(2) : ""}</td>
              <td className="border border-black px-1">{item.warehouseCardNo}</td>
              <td className="border border-black px-1">{item.accountCode}</td>
              <td className="border border-black px-1">{item.expenseArticle}</td>
              <td className="border border-black px-1">{item.monthsInUse}</td>
              <td className="border border-black px-1 text-right font-mono">{item.depreciationSum ? item.depreciationSum.toFixed(2) : ""}</td>
              <td className="border border-black px-1">{item.wearExpireMonth}</td>
              <td className="border border-black px-1">{item.wearExpireYear}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ELEKTRON QR IMZOLAR — 5 kishi (bugalter, bosh xisobchi, depo boshligʻi, ishchi, ombor mudiri) */}
      <div className="mt-6 grid grid-cols-5 gap-2 pt-2">
        {signatures.map((s, i) => (
          <div
            key={i}
            className={`flex flex-col items-center rounded border p-1.5 text-center ${
              s.signed ? "border-emerald-700 bg-emerald-50/40" : "border-gray-300 bg-gray-50/40"
            }`}
          >
            <div className={`text-[7.5px] font-bold ${s.signed ? "text-emerald-800" : "text-gray-400"}`}>
              {s.signed ? "✔ ЭЦП / E-IMZO" : "imzo kutilmoqda"}
            </div>
            <div className="mt-1 h-[46px]">
              {s.signed ? (
                <QrSvg
                  value={JSON.stringify({ doc: header.reqNumber, field: s.field, role: s.role, by: s.name, hash: s.hash })}
                  size={46}
                />
              ) : (
                <div className="grid h-[46px] w-[46px] place-items-center text-[16px] text-gray-300">◻</div>
              )}
            </div>
            <div className="mt-1 text-[7.5px] font-semibold leading-tight text-gray-800">{s.role}</div>
            <div className="text-[7.5px] leading-tight text-gray-600">{s.signed ? s.name : "—"}</div>
            <div className="text-[6.5px] text-gray-400">maydon {s.field}{s.sana ? ` · ${s.sana}` : ""}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center font-sans text-[8px] text-gray-400">
        Ushbu hujjat elektron raqamli imzo (ЭЦП) bilan imzolangan va qonunchilikka koʻra yuridik kuchga ega.
      </div>
    </div>
  );
}
