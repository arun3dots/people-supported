"use client";

import React, { useState } from "react";
import { ChevronDown, Contrast, Keyboard, Sparkles } from "lucide-react";
import { Card } from "@repo/ui/components/ui/Card";

/** Custom Toggle Switch styled with standard Tailwind tokens */
function CustomSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6.5 rounded-full p-1 flex items-center transition-colors shrink-0 cursor-pointer ${checked ? "bg-[#4A706A] justify-end" : "bg-slate-400 justify-start"
        }`}
    >
      <div className="size-5 rounded-full bg-white shadow-xs transition-transform" />
    </button>
  );
}

export function ProfileAccessibilityCard() {
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(false);

  return (
    <Card className="w-full bg-surface-card-grey rounded-2xl shadow-none border-none p-5 lg:p-6 font-sans">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col gap-1 pb-4 border-b border-slate-200/60">
        <h3 className="font-semibold text-md leading-tight text-slate-900">
          Accessibility
        </h3>
        <p className="font-normal text-md text-slate-500">
          Customise your workspace experiences.
        </p>
      </div>

      {/* ==================== CONTENT GRID ==================== */}
      <div className="pt-4 grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-6">
        {/* Item 1: Text Size */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.1436 5.63077C17.1724 5.63077 15.4112 6.74123 14.6567 8.46L14.3426 9.16246L16.2708 9.95539L16.5844 9.25292C17.0099 8.28369 18.0143 7.65831 19.1436 7.65831C20.7954 7.65831 21.905 8.73231 21.905 10.3311V10.4372C20.8475 10.4645 19.5791 10.5318 18.4499 10.6606C15.8433 10.9574 14.2877 12.3328 14.2877 14.34C14.2877 15.4089 14.7045 16.3708 15.4618 17.0442C16.1728 17.6769 17.1418 18 18.1917 18C19.6671 18 20.9407 17.6617 21.905 16.9551V18H24V10.3311C24 7.60754 21.9576 5.63077 19.1436 5.63077ZM18.1917 16.0186C17.357 16.0186 16.3822 15.5645 16.3822 14.34C16.3822 13.8485 16.5648 13.5042 16.974 13.2235C17.3728 12.9503 17.9837 12.7551 18.6951 12.6743C19.7364 12.5557 20.9092 12.492 21.8983 12.4657C21.7951 14.8422 20.5802 16.0186 18.1917 16.0186ZM4.26693 12.8248H10.2669L12.284 18H14.5339L7.21912 0L0 18H2.24988L4.26693 12.8248ZM7.26693 5.202L9.47809 10.8H5.05578L7.26693 5.202Z" fill="#4A706A" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-medium text-md text-slate-900">
                Text Size
              </span>
              <span className="font-normal text-md text-slate-500">
                Adjust the size of text across the application.
              </span>
            </div>
          </div>

          <div className="h-9 bg-white border border-slate-200 rounded-xl px-3.5 flex items-center justify-between gap-2 shrink-0 cursor-pointer shadow-2xs">
            <span className="font-medium text-md text-slate-800">
              Medium
            </span>
            <ChevronDown className="size-4 text-slate-600 shrink-0" />
          </div>
        </div>

        {/* Item 2: High Contrast Mode */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.4085 20.174C5.13061 19.6226 4.01878 18.8743 3.073 17.9293C2.12722 16.9843 1.37861 15.8737 0.827167 14.5973C0.275722 13.321 0 11.9564 0 10.5035C0 9.05061 0.275722 7.68561 0.827167 6.4085C1.37783 5.13061 2.12489 4.01878 3.06833 3.073C4.01178 2.12722 5.12283 1.37861 6.4015 0.827167C7.68017 0.275722 9.04517 0 10.4965 0C11.9478 0 13.3128 0.275722 14.5915 0.827167C15.8694 1.37783 16.9812 2.12528 17.927 3.0695C18.8728 4.01372 19.6214 5.12478 20.1728 6.40267C20.7243 7.68056 21 9.04517 21 10.4965C21 11.9478 20.7247 13.3128 20.174 14.5915C19.6233 15.8702 18.8751 16.982 17.9293 17.927C16.9836 18.872 15.8729 19.6206 14.5973 20.1728C13.3218 20.7251 11.9572 21.0008 10.5035 21C9.04983 20.9992 7.68483 20.7239 6.4085 20.174ZM10.5 19.8333C13.1056 19.8333 15.3125 18.9292 17.1208 17.1208C18.9292 15.3125 19.8333 13.1056 19.8333 10.5C19.8333 9.25556 19.5953 8.06478 19.1193 6.92767C18.6433 5.79056 17.9674 4.78411 17.0917 3.90833L3.90833 17.0917C4.78333 17.9667 5.78978 18.6426 6.92767 19.1193C8.06555 19.5961 9.25633 19.8341 10.5 19.8333ZM10.815 14.763V13.7305H15.9297V14.763H10.815ZM6.46217 9.82683H7.4935V7.4935H9.82683V6.46217H7.4935V4.12883H6.46217V6.46217H4.12883V7.4935H6.46217V9.82683Z" fill="#4A706A" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-medium text-md text-slate-900">
                High Contrast Mode
              </span>
              <span className="font-normal text-md text-slate-500">
                Enhance visual differentiation across the application.
              </span>
            </div>
          </div>

          <CustomSwitch checked={highContrast} onChange={setHighContrast} />
        </div>

        {/* Item 3: Reduce Motion */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.212 0.011994C12.168 0.011994 8.832 3.10645 8.448 7.05247C7.1977 7.52286 6.12151 8.36468 5.3642 9.46469C4.6069 10.5647 4.2048 11.8701 4.212 13.2054V13.3493C1.812 13.8891 0 16.036 0 18.6027C0 21.5772 2.424 24 5.4 24C7.968 24 10.116 22.2009 10.656 19.7901H10.8C13.584 19.7901 15.996 18.087 16.956 15.5562C20.904 15.1724 24 11.8381 24 7.7961C24 3.50225 20.496 0 16.2 0L16.212 0.011994ZM5.412 21.6012C4.61635 21.6012 3.85329 21.2853 3.29068 20.723C2.72807 20.1606 2.412 19.398 2.412 18.6027C2.412 17.1994 3.384 16.024 4.692 15.6882C4.704 15.7361 4.74 15.7721 4.752 15.8081C4.884 16.1199 5.04 16.4198 5.22 16.7076C5.28 16.8036 5.328 16.8876 5.4 16.9715C5.616 17.2834 5.844 17.5712 6.108 17.8351L6.168 17.8951C6.432 18.1469 6.72 18.3748 7.02 18.5907C7.116 18.6627 7.224 18.7226 7.32 18.7826C7.584 18.9385 7.848 19.0825 8.136 19.2144C8.196 19.2384 8.256 19.2864 8.316 19.3103C8.15306 19.9604 7.77776 20.5375 7.24957 20.9503C6.72137 21.3631 6.07048 21.5879 5.4 21.5892L5.412 21.6012ZM9.876 17.3073C9.68042 17.2595 9.48804 17.1994 9.3 17.1274C8.5078 16.8255 7.82632 16.2897 7.34617 15.5912C6.86602 14.8928 6.60995 14.0648 6.612 13.2174C6.612 11.7061 7.392 10.3628 8.628 9.63119C8.628 9.65517 8.64 9.67916 8.652 9.70315C8.724 9.991 8.808 10.2789 8.916 10.5547C8.94 10.6267 8.976 10.6987 9 10.7706C9.12 11.0705 9.252 11.3583 9.408 11.6342C9.408 11.6342 9.42 11.6582 9.432 11.6702C9.588 11.934 9.756 12.1979 9.936 12.4378C9.984 12.4978 10.02 12.5577 10.068 12.6177C10.464 13.1214 10.908 13.5652 11.412 13.961C11.472 14.009 11.532 14.045 11.592 14.093C11.8472 14.2841 12.1159 14.4564 12.396 14.6087C12.672 14.7646 12.972 14.8966 13.272 15.0165C13.344 15.0405 13.416 15.0765 13.488 15.1004C13.764 15.1964 14.04 15.2924 14.328 15.3643C14.352 15.3643 14.376 15.3883 14.412 15.3883C13.512 16.8756 11.712 17.6912 9.876 17.2954V17.3073ZM16.248 13.2054H16.104C14.7095 13.1868 13.3773 12.6248 12.3911 11.6391C11.4049 10.6534 10.8426 9.32189 10.824 7.92804V7.78411C10.848 4.82159 13.26 2.42279 16.224 2.42279C19.188 2.42279 21.624 4.84558 21.624 7.82009C21.624 10.7946 19.224 13.1934 16.26 13.2174L16.248 13.2054Z" fill="#4A706A" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-medium text-md text-slate-900">
                Reduce Motion
              </span>
              <span className="font-normal text-md text-slate-500">
                Minimize UI animations and smooth transitions.
              </span>
            </div>
          </div>

          <CustomSwitch checked={reduceMotion} onChange={setReduceMotion} />
        </div>

        {/* Item 4: Keyboard Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <Keyboard className="size-5 text-[#4A706A]" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-medium text-md text-slate-900">
                Keyboard Navigation
              </span>
              <span className="font-normal text-md text-slate-500">
                Optimise tab key focus indicators.
              </span>
            </div>
          </div>

          <CustomSwitch checked={keyboardNav} onChange={setKeyboardNav} />
        </div>
      </div>
    </Card>
  );
}