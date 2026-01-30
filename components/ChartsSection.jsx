"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

function formatMoney(n) {
  return Number(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toTitleCase(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** Month names for display (January → December) */
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Extract month number (1–12) from DD-MM-YYYY */
function getMonthNumber(dateStr) {
  const parts = String(dateStr).trim().split("-");
  if (parts.length !== 3) return null;
  const month = parseInt(parts[1], 10);
  return month >= 1 && month <= 12 ? month : null;
}

const CHART_COLORS = [
  "#0f766e",
  "#0369a1",
  "#7c3aed",
  "#b45309",
  "#be123c",
  "#4f46e5",
  "#059669",
  "#dc2626",
];

export default function ChartsSection({ rows = [] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sales Over Time: monthly aggregation (month-only, ignore year). Group by month 1–12, sum revenue, order Jan→Dec.
  const byMonth = {};
  for (let i = 1; i <= 12; i++) byMonth[i] = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const monthNum = getMonthNumber(row.date);
    if (monthNum != null) {
      byMonth[monthNum] = (byMonth[monthNum] || 0) + (row.revenue ?? 0);
    }
  }
  const salesOverTimeData = [];
  for (let m = 1; m <= 12; m++) {
    salesOverTimeData.push({
      monthNum: m,
      monthName: MONTH_NAMES[m - 1],
      revenue: byMonth[m] || 0,
    });
  }

  // Total Sales by Product: group by product, sum revenue, sort desc, top 8
  const byProduct = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const p = row.product || "";
    const rev = row.revenue ?? 0;
    byProduct[p] = (byProduct[p] || 0) + rev;
  }
  const salesByProductData = Object.entries(byProduct)
    .map(([product, revenue]) => ({ product, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Sales by Category: group by category, sum revenue; display Title Case
  const byCategory = {};
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const cat = toTitleCase(row.category || "");
    const rev = row.revenue ?? 0;
    byCategory[cat] = (byCategory[cat] || 0) + rev;
  }
  const salesByCategoryData = Object.entries(byCategory).map(
    ([name, revenue]) => ({ name, revenue })
  );

  const monthlyTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { monthName, revenue } = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
        <p className="text-sm font-medium text-slate-700">{monthName}</p>
        <p className="text-sm text-slate-900">Revenue: ${formatMoney(revenue)}</p>
      </div>
    );
  };

  const barTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { product, revenue } = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
        <p className="text-sm font-medium text-slate-700">{product}</p>
        <p className="text-sm text-slate-900">Total revenue: ${formatMoney(revenue)}</p>
      </div>
    );
  };

  const pieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, revenue } = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
        <p className="text-sm font-medium text-slate-700">{name}</p>
        <p className="text-sm text-slate-900">Total revenue: ${formatMoney(revenue)}</p>
      </div>
    );
  };

  if (!mounted) {
    return (
      <section className="mt-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Sales Over Time (by month)</h3>
            <div className="h-[280px] min-h-[280px] w-full min-w-0 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Total Sales by Product (Top 8)</h3>
            <div className="h-[280px] min-h-[280px] w-full min-w-0 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Sales by Category</h3>
            <div className="h-[280px] min-h-[280px] w-full min-w-0 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      {/* Row 1: Line chart + Bar chart (desktop) / stacked (mobile) */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Sales Over Time (by month)
          </h3>
          <div className="h-[280px] min-h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={280}>
              <AreaChart
                data={salesOverTimeData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip content={monthlyTooltip} cursor={{ stroke: "#94a3b8" }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#0f766e"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  dot={{ fill: "#0f766e", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#0d9488", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Total Sales by Product (Top 8)
          </h3>
          <div className="h-[280px] min-h-[280px] w-full min-w-0">
            {salesByProductData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <BarChart
                  data={salesByProductData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
                  <YAxis
                    type="category"
                    dataKey="product"
                    width={76}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) =>
                      v.length > 14 ? `${v.slice(0, 12)}…` : v
                    }
                  />
                  <Tooltip content={barTooltip} cursor={{ fill: "#f1f5f9" }} />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#0369a1"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                    activeBar={{ fill: "#0284c7", stroke: "#fff", strokeWidth: 1 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                No product data to display
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Pie chart (full width / centered) */}
      <div className="mt-4">
        <div className="mx-auto max-w-2xl rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Sales by Category
          </h3>
          <div className="h-[280px] min-h-[280px] w-full min-w-0">
            {salesByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={280}>
                <PieChart>
                  <Pie
                    data={salesByCategoryData}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name }) => (name.length > 12 ? `${name.slice(0, 10)}…` : name)}
                    labelLine={{ stroke: "#64748b" }}
                  >
                    {salesByCategoryData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={pieTooltip} />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => (value.length > 14 ? `${value.slice(0, 12)}…` : value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                No category data to display
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
