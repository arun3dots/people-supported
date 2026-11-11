"use client";

export default function PackagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-800">
          Packages
        </h2>
        <p className="text-gray-500 font-medium">
          Configure and manage your service tiers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6">
        {["Light", "Standard", "Premium"].map((tier, idx) => (
          <div
            key={tier}
            className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group"
          >
            {idx === 1 && (
              <div className="absolute top-0 right-0 bg-primary text-white px-6 py-2 text-md font-semibold rounded-bl-xl">
                POPULAR
              </div>
            )}
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 tracking-tight">
              {tier}
            </h3>
            <div className="text-5xl font-semibold text-primary mb-8 tracking-tighter">
              $99
              <span className="text-lg text-gray-400 font-semibold ml-1">
                /mo
              </span>
            </div>
            <ul className="space-y-4 mb-10">
              {[1, 2, 3].map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-gray-500 font-semibold text-md"
                >
                  ✓ Feature Benefit {f}
                </li>
              ))}
            </ul>
            <button className="w-full py-3.5 bg-gray-50 text-gray-800 font-semibold rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm cursor-pointer">
              SELECT PLAN
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
