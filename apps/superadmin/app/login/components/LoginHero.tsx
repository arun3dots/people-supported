"use client";

import { TrendingUp, MoreHorizontal, ArrowRight, Shield } from "lucide-react";

/**
 * Decorative right-hand panel of the login screen: marketing copy plus a static
 * dashboard mockup. Purely presentational — no data or interactivity.
 */
export function LoginHero() {
  return (
    <div className="hidden lg:flex flex-col flex-1 bg-secondary relative overflow-hidden text-secondary-foreground pt-24 px-16 shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border border-primary/20 opacity-50" />
      <div className="absolute top-[-20%] right-[-5%] w-[700px] h-[700px] rounded-full border border-primary/10 opacity-50" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-50" />
      <div className="absolute top-20 right-20 w-32 h-32 bg-primary/30 rounded-full blur-2xl" />

      <div className="relative z-10 max-w-lg mb-12">
        <h2 className="text-4xl xl:text-5xl font-semibold leading-tight tracking-tight mb-4 text-white">
          Unified control for your entire platform.
        </h2>
        <p className="text-secondary-foreground/90 text-lg opacity-90">
          Log in to manage SaaS infrastructure, monitor global metrics, and
          provide real-time support.
        </p>
      </div>

      {/* Dashboard Mockup Container */}
      <div className="relative z-10 w-full flex-1 flex my-8">
        <div className="w-[120%] bg-gray-50/95 backdrop-blur-md rounded-tl-xl border border-white/20 shadow-2xl p-6 shadow-black/20 overflow-hidden transform transition-all hover:scale-[1.01] duration-500 relative">
          {/* Mock Header */}
          <div className="flex gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 shadow-sm flex-1 border border-border flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Active Tenants
                </div>
                <MoreHorizontal className="text-muted-foreground/50 h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                184
              </div>
              <div className="text-xs text-green-500 font-medium mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5%{" "}
                <span className="text-muted-foreground ml-1 font-normal">
                  from last month
                </span>
              </div>
            </div>

            <div className="bg-card rounded-lg p-4 shadow-sm flex-1 border border-border relative overflow-hidden group">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  System Latency
                </div>
                <span className="text-xs text-muted-foreground">Global</span>
              </div>
              <div className="text-2xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                24ms
              </div>
              {/* Mock simple sparkline */}
              <div className="absolute bottom-0 left-0 right-0 h-10 w-full bg-linear-to-t from-primary/10 to-transparent opacity-50" />
              <svg
                className="absolute bottom-2 left-0 w-full h-8 text-primary/40"
                preserveAspectRatio="none"
                viewBox="0 0 100 20"
              >
                <path
                  d="M0,20 C20,10 30,15 50,5 C70,-5 80,18 100,10 L100,20 Z"
                  fill="currentColor"
                  opacity="0.2"
                />
                <path
                  d="M0,20 C20,10 30,15 50,5 C70,-5 80,18 100,10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="bg-card rounded-lg p-4 shadow-sm flex-1 border border-border hidden xl:flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Active Users
                </div>
                <MoreHorizontal className="text-muted-foreground/50 h-4 w-4" />
              </div>
              <div className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                12,684
              </div>
              <div className="text-xs text-primary font-medium mt-1 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.2%{" "}
                <span className="text-muted-foreground ml-1 font-normal">
                  from last month
                </span>
              </div>
            </div>
          </div>

          {/* Mock Table / Content */}
          <div className="bg-card rounded-lg border border-border shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Audit Events
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 rounded-md transition-colors px-2 -mx-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Role Provisioning
                      </div>
                      <div className="text-xs text-muted-foreground">
                        SuperAdmin Auth #{item}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-foreground">
                    Security
                  </div>
                  <div className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    Logged
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Overlaid widget card to match design aesthetic */}
          <div className="absolute top-1/3 right-8 xl:right-16 bg-card p-6 rounded-2xl shadow-xl border border-border w-64 transform rotate-2 hover:rotate-0 transition-transform duration-300 text-card-foreground">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-foreground">
                Server Load
              </span>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                Live
              </span>
            </div>
            <div className="relative h-32 flex items-center justify-center mb-4">
              {/* Semi-circle chart mock */}
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 90 50"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="125 125"
                  strokeDashoffset="40"
                />
                <path
                  d="M 10 50 A 40 40 0 0 1 50 10"
                  fill="none"
                  stroke="currentColor"
                  className="text-primary/60"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center mt-6">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  CPU Avg
                </div>
                <div className="text-xl font-semibold text-foreground mt-1">
                  34%
                </div>
              </div>
            </div>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary font-semibold"></span>
                  Database
                </div>
                <span className="font-semibold text-foreground">42%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary/60"></span>
                  Workers
                </div>
                <span className="font-semibold text-foreground">18%</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-muted"></span>Cache
                </div>
                <span className="font-semibold text-foreground">12%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
