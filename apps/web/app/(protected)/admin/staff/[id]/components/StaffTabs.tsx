"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/ui";
import { PersonalDetailsTab } from "./tabs/PersonalDetailsTab";
import { CertificationTab } from "./tabs/CertificationTab";
import { DbsHealthTab } from "./tabs/DbsHealthTab";
import { StaffProfileSidebar } from "./StaffProfileSidebar";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface StaffTabsProps {
  staff?: any;
}

const VALID_TABS = ["basic", "certifications", "dbs"];

export function StaffTabs({ staff }: StaffTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabFromUrl = searchParams.get("tab");
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "basic";

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Synchronize state if URL query parameter changes
  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col xl:flex-row gap-5 items-stretch">
      <div className="w-full xl:w-1/4 flex flex-col">
            <StaffProfileSidebar className="h-full" />
          </div>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="flex-1 min-w-0 flex flex-col space-y-6"
          >
            {/* Header Row: Tabs on Left */}
              <div className="flex items-center justify-between w-full border-b border-gray-200 overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 gap-8 rounded-none border-b-0">
                  <TabsTrigger
                    value="basic"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#3B5E57] data-[state=active]:text-[#3B5E57] rounded-none bg-transparent px-0 pb-3 text-md font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent -mb-px shadow-none"
                  >
                    Basic Information
                  </TabsTrigger>
                  <TabsTrigger
                    value="certifications"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#3B5E57] data-[state=active]:text-[#3B5E57] rounded-none bg-transparent px-0 pb-3 text-md font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent -mb-px shadow-none"
                  >
                    Skills, Trainings, &amp; Certifications
                  </TabsTrigger>
                  <TabsTrigger
                    value="dbs"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#3B5E57] data-[state=active]:text-[#3B5E57] rounded-none bg-transparent px-0 pb-3 text-md font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent -mb-px shadow-none"
                  >
                    DBS &amp; Health
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="basic"
                className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none"
              >
                <PersonalDetailsTab />
              </TabsContent>

              <TabsContent
                value="certifications"
                className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none"
              >
                <CertificationTab />
              </TabsContent>

              <TabsContent
                value="dbs"
                className="m-0 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none"
              >
                <DbsHealthTab />
              </TabsContent>
          </Tabs>
        </div>
        );
}