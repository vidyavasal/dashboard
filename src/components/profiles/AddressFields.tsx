"use client";

import { useState } from "react";
import { INDIAN_STATES } from "@/lib/india";

// Pincode-first address block. Enter the 6-digit pincode → look it up via the
// India Post API and auto-fill City / District / State. District & State are
// dropdowns (never typed); if the pincode isn't found, District/City fall back
// to manual text entry while State stays a dropdown.

const inputCls =
  "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary";
const labelCls = "block text-sm font-medium text-text-primary mb-1";

export type AddressNames = {
  address: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
};

type Defaults = Partial<Record<keyof AddressNames, string | null>>;

type PostOffice = {
  Name: string;
  District: string;
  State: string;
  Country: string;
};

export function AddressFields({
  names,
  defaults,
}: {
  names: AddressNames;
  defaults?: Defaults;
}) {
  const [pincode, setPincode] = useState(defaults?.pincode ?? "");
  const [city, setCity] = useState(defaults?.city ?? "");
  const [district, setDistrict] = useState(defaults?.district ?? "");
  const [stateName, setStateName] = useState(defaults?.state ?? "");
  const [country, setCountry] = useState(defaults?.country ?? "India");
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>(
    defaults?.district ? [defaults.district] : []
  );
  const [status, setStatus] = useState<
    "idle" | "loading" | "found" | "notfound" | "error"
  >("idle");

  // Ensure the current state value is always selectable even if it isn't in the
  // canonical list (e.g. an unusual API spelling).
  const stateOptions =
    stateName && !INDIAN_STATES.includes(stateName)
      ? [stateName, ...INDIAN_STATES]
      : INDIAN_STATES;

  async function lookup(pin: string) {
    setStatus("loading");
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : null;
      if (entry?.Status === "Success" && entry.PostOffice?.length) {
        const offices: PostOffice[] = entry.PostOffice;
        const cities = [...new Set(offices.map((o) => o.Name))];
        const districts = [...new Set(offices.map((o) => o.District))];
        setCityOptions(cities);
        setDistrictOptions(districts);
        setCity(cities[0] ?? "");
        setDistrict(districts[0] ?? "");
        setStateName(offices[0].State);
        setCountry(offices[0].Country || "India");
        setStatus("found");
      } else {
        // Not found → keep manual entry.
        setCityOptions([]);
        setDistrictOptions([]);
        setStatus("notfound");
      }
    } catch {
      setCityOptions([]);
      setDistrictOptions([]);
      setStatus("error");
    }
  }

  function onPincodeChange(v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) lookup(clean);
    else setStatus("idle");
  }

  const manualDistrict = districtOptions.length === 0;
  const manualCity = cityOptions.length === 0;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Pincode first */}
      <label className="block">
        <span className={labelCls}>
          Pincode <span className="text-red-500">*</span>
        </span>
        <input
          name={names.pincode}
          value={pincode}
          onChange={(e) => onPincodeChange(e.target.value)}
          inputMode="numeric"
          pattern="[0-9]{6}"
          title="6-digit pincode"
          placeholder="6-digit PIN"
          className={inputCls}
        />
        <span className="block text-xs mt-1 min-h-4">
          {status === "loading" && (
            <span className="text-text-secondary">Looking up…</span>
          )}
          {status === "found" && (
            <span className="text-green-600">✓ Auto-filled from pincode</span>
          )}
          {(status === "notfound" || status === "error") && (
            <span className="text-amber-600">
              Pincode not found — enter City &amp; District manually.
            </span>
          )}
        </span>
      </label>

      {/* City */}
      <label className="block">
        <span className={labelCls}>City / Area</span>
        {manualCity ? (
          <input
            name={names.city}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputCls}
          />
        ) : (
          <select
            name={names.city}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputCls}
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </label>

      {/* District — dropdown unless pincode unknown */}
      <label className="block">
        <span className={labelCls}>District</span>
        {manualDistrict ? (
          <input
            name={names.district}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={inputCls}
          />
        ) : (
          <select
            name={names.district}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className={inputCls}
          >
            {districtOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </label>

      {/* State — always a dropdown */}
      <label className="block">
        <span className={labelCls}>State</span>
        <select
          name={names.state}
          value={stateName}
          onChange={(e) => setStateName(e.target.value)}
          className={inputCls}
        >
          <option value="">Select…</option>
          {stateOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* Country */}
      <label className="block">
        <span className={labelCls}>Country</span>
        <input
          name={names.country}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className={inputCls}
        />
      </label>

      {/* Street / house address */}
      <label className="block sm:col-span-2 lg:col-span-3">
        <span className={labelCls}>Address (house / street / post)</span>
        <textarea
          name={names.address}
          rows={2}
          defaultValue={defaults?.address ?? ""}
          className={inputCls}
        />
      </label>
    </div>
  );
}
