param (
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Modules,

    [string]$TargetModule,

    [string]$ReferenceModule = "apps/web/app/(protected)/admin/staff",

    [string]$CustomInstruction = "Align all UI components, cards, tables, headers, and form inputs strictly with the approved client design system in reference module. Enforce uniform typography font sizes, font weights, and barrel imports throughout apps/web. DO NOT override Button, Badge, or AvatarFallback text sizes with text-xs in className - rely on built-in text-sm font-medium styling.",

    [int]$MaxRetries = 3,

    [switch]$Batch
)

$ErrorActionPreference = "Stop"

# Default Ordered Execution Pipeline for monorepo refactoring
$DefaultPipeline = @(
    "apps/web/app/(protected)/admin/residents/components",
    "apps/web/app/(protected)/admin/residents/page.tsx",
    "apps/web/app/(protected)/admin/care-plans",
    "apps/web/app/(protected)/admin/care-plans/daily-tasks",
    "apps/web/app/(protected)/admin/enquiries"
)

# Resolve Workspace Root
$RootDir = (Get-Item .).FullName
if (-not (Test-Path "$RootDir\apps\web")) {
    Write-Error "Please run this script from the care-home monorepo root directory."
}

# Resolve Target Module List
$TargetList = @()
if ($Modules -and $Modules.Count -gt 0) {
    $TargetList = $Modules
} elseif ($TargetModule) {
    $TargetList = @($TargetModule)
} else {
    Write-Host "No explicit target module specified. Loading default ordered pipeline queue." -ForegroundColor DarkCyan
    $TargetList = $DefaultPipeline
}

# Normalize Paths
function Normalize-PathStr ([string]$p) {
    return $p.Replace("\", "/").TrimEnd("/")
}

$NormRef = Normalize-PathStr $ReferenceModule
$CurrentBranch = (git rev-parse --abbrev-ref HEAD 2>&1).Trim()
$TargetCount = $TargetList.Count

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   AGY CLOSED-LOOP UI REFACTOR ENGINE (ORDERED PIPELINE)" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Workspace Root:    $RootDir" -ForegroundColor Gray
Write-Host "  Active Git Branch: $CurrentBranch (manual commit mode)" -ForegroundColor White
Write-Host "  Reference Module:  $NormRef" -ForegroundColor White
Write-Host "  Pipeline Queue ($TargetCount target modules):" -ForegroundColor White
for ($i = 0; $i -lt $TargetList.Count; $i++) {
    $itemIndex = $i + 1
    $itemPath = Normalize-PathStr $TargetList[$i]
    Write-Host "    $itemIndex. $itemPath" -ForegroundColor DarkCyan
}
Write-Host "  Max Retry Cycles:  $MaxRetries" -ForegroundColor Gray
Write-Host "=================================================================`n" -ForegroundColor Cyan

# -----------------------------------------------------------------
# Helper: Pre-Flight Violation Scanner
# -----------------------------------------------------------------
function Scan-Violations ([string]$dirPath) {
    $violations = @()
    if (-not (Test-Path $dirPath)) { return $violations }

    $files = @()
    if ((Get-Item $dirPath) -is [System.IO.DirectoryInfo]) {
        $files = Get-ChildItem -Path $dirPath -Recurse -File | Where-Object { $_.Extension -in '.tsx', '.ts' }
    } else {
        $files = @(Get-Item $dirPath)
    }
    foreach ($file in $files) {
        $filePath = $file.FullName
        $content = [System.IO.File]::ReadAllText($filePath)
        $lines = [System.IO.File]::ReadAllLines($filePath).Length
        $relPath = Normalize-PathStr ($filePath.Replace($RootDir, "").TrimStart("\/"))

        # 1. Line count violation
        if ($lines -gt 350) {
            $violations += ('[LineCap] ' + $relPath + ' has ' + $lines + ' lines (exceeds 350 limit)')
        }

        # 2. Arbitrary Tailwind CSS classes
        if ($content -match 'text-\[\d+px\]|bg-\[#|w-\[\d+px\]|h-\[\d+px\]|rounded-\[\d+px\]|p-\[\d+px\]') {
            $violations += ('[ArbitraryCSS] ' + $relPath + ' contains arbitrary Tailwind values (e.g. text-[..px], bg-[#..])')
        }

        # 3. Direct fetch usage
        if ($content -match '\bfetch\(') {
            $violations += ('[DirectFetch] ' + $relPath + ' calls native fetch instead of makeAPICall')
        }

        # 4. Any types
        if ($content -match ':\s*any\b|\bas\s+any\b') {
            $violations += ('[ForbiddenAny] ' + $relPath + ' uses any type instead of strict typing')
        }

        # 5. Non-barrel UI imports
        if ($content -match '@repo/ui/components/ui/') {
            $violations += ('[DeepImport] ' + $relPath + ' imports from sub-path @repo/ui/components/ui/... instead of barrel @repo/ui/components/ui')
        }

        # 6. Raw HTML typography elements instead of <Text>
        if ($content -match '<h1\b|<h2\b|<h3\b|<h4\b|<p\b') {
            $violations += ('[RawHtmlTypography] ' + $relPath + ' uses raw HTML heading/paragraph tags instead of Text from @repo/ui')
        }

        # 7. Redundant text-xs override on TableHead, Buttons, Badges, AvatarFallback
        if ($content -match '<TableHead\b[^>]*\btext-xs\b|<(Button|Badge|AvatarFallback)\b[^>]*\btext-xs\b') {
            $violations += ('[TextSizeOverride] ' + $relPath + ' overrides TableHead/Button/Badge/AvatarFallback with text-xs. Rely on built-in @repo/ui responsive styling.')
        }
    }
    return $violations
}

# -----------------------------------------------------------------
# Core Function: Refactor Single Module Path
# -----------------------------------------------------------------
function Invoke-ModuleRefactor ([string]$modulePath) {
    $normModule = Normalize-PathStr $modulePath
    Write-Host "`n>>> Processing Target: $normModule" -ForegroundColor Cyan

    if (-not (Test-Path $normModule)) {
        Write-Host "Error: Path '$normModule' does not exist!" -ForegroundColor Red
        return $false
    }

    # Step 1: Pre-flight Diagnostic Scan
    Write-Host "==> [Phase 1/4] Running Pre-Flight Violation Diagnostics..." -ForegroundColor Yellow
    $initialViolations = Scan-Violations $normModule
    if ($initialViolations.Count -gt 0) {
        Write-Host "    Found $($initialViolations.Count) anti-pattern(s) to resolve:" -ForegroundColor DarkYellow
        foreach ($v in $initialViolations) {
            Write-Host "      - $v" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "    No critical syntax anti-patterns found prior to refactor." -ForegroundColor Green
    }

    # Step 2: Build Context-Rich Prompt with Component Catalog & Typography Matrix
    Write-Host "`n==> [Phase 2/4] Building High-Density Design Prompt for agy..." -ForegroundColor Yellow
    $PromptFile = [System.IO.Path]::GetTempFileName()
    $ViolationsText = if ($initialViolations.Count -gt 0) {
        "PRE-DETECTED ISSUES TO RESOLVE IN THIS DIRECTORY:`r`n" + ($initialViolations -join "`r`n")
    } else {
        "Maintain clean architecture and zero regressions."
    }

    $PromptLines = @(
        "You are the Lead Frontend Design and Refactoring Agent in this Next.js App Router monorepo.",
        "Your task is to refactor the UI module located strictly at:",
        "'$normModule'",
        "",
        "APPROVED REFERENCE STANDARDS (from '$NormRef'):",
        "- Root Page Layout: '$NormRef/page.tsx' and '$NormRef/StaffDirectory.tsx'",
        "- Card Components:  '$NormRef/[id]/components/cards/' (DbsDetailsCard, ImmunisationCard, OccupationalHealthCard)",
        "- Table Layouts:    '$NormRef/components/StaffTable.tsx' and '$NormRef/[id]/components/cards/ImmunisationCard.tsx'",
        "- Stat Cards:       '$NormRef/components/StaffStatCards.tsx' (SummaryCardsGrid & SummaryCardItem)",
        "- Filter Bar:       '$NormRef/components/StaffFilterSection.tsx'",
        "",
        "COMPLETE @repo/ui COMPONENT CATALOG (Import strictly from '@repo/ui/components/ui'):",
        "- Typography: Text",
        "- Feedback: Toast, Toaster, toast, useToast",
        "- Containers & Cards: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, SummaryCard, SummaryCardsGrid, SummaryCardItem, Separator, Sidebar, Breadcrumb, Collapsible, Accordion",
        "- Forms & Inputs: Input, Label, Textarea, CheckBox, RadioGroup, RadioGroupItem, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Switch, Slider, Toggle, MultiSelect",
        "- Pickers: Calendar, DatePicker, DateOfBirthPicker, DateTimePicker, DateRangePicker, DateSelector",
        "- Buttons & Indicators: Button, Badge, Spinner, Skeleton, Avatar, AvatarImage, AvatarFallback, AvatarBadge, Tooltip, Popover",
        "- Data Display: Table, TableHeader, TableBody, TableHead, TableRow, TableCell, Pagination, InfoField",
        "- Navigation & Modals: Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, Sheet, FlyoutSheet, AlertDialog, DropdownMenu, NavigationMenu, MenuBar, Tabs, TabsList, TabsTrigger, TabsContent, Command, Carousel",
        "- Utilities: import { cn } from '@repo/ui/lib/utils'",
        "",
        "MANDATORY TYPOGRAPHY, FONT SIZE & WEIGHT MATRIX (Match Staff Module Exactly):",
        "1. PAGE MAIN TITLE: <Text size=""xl"" weight=""bold"">Title</Text>",
        "2. PAGE SUBTITLE: <Text size=""xs"" weight=""regular"" className=""text-slate-500 mt-0.5"">Subtitle</Text>",
        "3. CARD TITLE: <Text as=""h3"" size=""sm"" weight=""medium"" className=""text-slate-900"">Card Title</Text>",
        "4. CARD SUBTITLE: <Text size=""xs"" weight=""regular"" className=""text-slate-500 mt-0.5"">Card Subtitle</Text>",
        "5. SECTION / GROUP HEADER: <Text size=""sm"" weight=""semibold"" className=""text-slate-900"">Section Header</Text>",
        "6. DIALOG / MODAL TITLE: <DialogTitle asChild><Text size=""lg"" weight=""bold"" className=""text-slate-900"">Dialog Title</Text></DialogTitle>",
        "7. STAT METRIC NUMBER: <Text size=""2xl"" weight=""bold"" className=""text-slate-900"">Metric Value</Text>",
        "8. STAT METRIC LABEL: <Text size=""xs"" weight=""medium"" className=""text-slate-600"">Metric Label</Text>",
        "9. TABLE COLUMN HEADER: <TableHead className=""whitespace-nowrap"">Header</TableHead> (DO NOT pass 'text-xs' in className; rely on built-in @repo/ui Table responsive header styling)",
        "10. TABLE CELL PRIMARY (Names, IDs, Numbers): <Text size=""sm"" weight=""medium"" className=""text-slate-900"">Value</Text>",
        "11. TABLE CELL SECONDARY (Dates, Subtext, Department): <Text size=""xs"" weight=""regular"" className=""text-slate-500"">Meta</Text>",
        "12. FORM LABELS: <Label required>Label</Label> (text-sm font-medium)",
        "13. FORM ERROR MESSAGES: <Text variant=""error"" size=""xs"">Error message</Text>",
        "14. STATUS BADGES: <Badge variant=""secondary"" state=""success|warning|danger|info|inactive"">Label</Badge> (DO NOT add 'text-xs' in className; relies on built-in text-sm font-medium)",
        "15. BUTTONS: <Button variant=""..."" size=""sm|default""> (DO NOT add 'text-xs' in className; relies on built-in text-sm font-medium)",
        "16. AVATARS: <Avatar size=""sm""><AvatarImage ... /><AvatarFallback className=""bg-slate-200 text-slate-700 font-bold"">{letter}</AvatarFallback></Avatar> (DO NOT add 'text-xs' in className)",
        "17. EMPTY STATE TITLE: <Text size=""sm"" weight=""medium"" className=""text-slate-700"">Empty Title</Text>",
        "18. EMPTY STATE SUBTITLE: <Text size=""xs"" weight=""regular"" className=""text-slate-400 mt-1 max-w-sm mx-auto"">Empty description</Text>",
        "",
        "NON-NEGOTIABLE ARCHITECTURAL RULES (AGENTS.md):",
        "1. SCOPE ISOLATION: ONLY modify/create files inside '$normModule'. NEVER edit outside this path.",
        "2. FILE SIZE CAP: No file may exceed 350 lines. If a file is > 300 lines, proactively split child cards, tables, or dialogs into separate files in a 'components/' directory.",
        "3. BARREL IMPORTS ONLY: Import exclusively from '@repo/ui/components/ui'. Never import from subpaths like '@repo/ui/components/ui/Card'.",
        "4. CARD CONTAINER STYLING: Use standard Card container: <Card className=""p-6 flex flex-col gap-6 w-full font-['Outfit',sans-serif]"">.",
        "5. ZERO ARBITRARY CSS: Replace arbitrary pixel classes (e.g. 'text-[10px]', 'w-[48px]') with standard Tailwind tokens ('text-xs', 'w-12', 'w-full', 'min-w-60').",
        "6. TOASTS: Use 'variant: ""success""' or 'variant: ""error""'. Never use 'destructive'.",
        "7. ZERO 'any': Strict TypeScript types from '@repo/schema' or local interfaces. Preserve all logic, state, and query hooks intact.",
        "",
        $ViolationsText,
        "",
        "CUSTOM OBJECTIVE:",
        $CustomInstruction
    )

    $PromptContent = $PromptLines -join "`r`n"
    [System.IO.File]::WriteAllText($PromptFile, $PromptContent)

    # Step 3: Execute agy
    Write-Host "==> [Phase 3/4] Invoking Antigravity CLI (agy)..." -ForegroundColor Yellow
    if (Get-Command agy -ErrorAction SilentlyContinue) {
        $PromptContent | agy -p
    } else {
        Write-Host "    [agy command running in current session context]" -ForegroundColor DarkGray
    }
    if (Test-Path $PromptFile) { Remove-Item $PromptFile -Force }

    # Step 4: Multi-Gate Verification & Self-Healing Loop
    Write-Host "`n==> [Phase 4/4] Executing 4-Gate Quality Verification Matrix..." -ForegroundColor Yellow
    $Attempt = 0
    $Passed = $false

    while (-not $Passed -and $Attempt -lt $MaxRetries) {
        $Attempt++
        Write-Host "--- Quality Gate Check (Attempt $Attempt of $MaxRetries) ---" -ForegroundColor DarkCyan

        # Gate 1: TypeScript Check
        Write-Host "    [Gate 1/4] TypeScript Compiler (check-types)... " -NoNewline
        $TypeCheckOutput = pnpm --filter web check-types 2>&1
        $Gate1Passed = ($LASTEXITCODE -eq 0)
        if ($Gate1Passed) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

        # Gate 2: ESLint on Target Directory
        Write-Host "    [Gate 2/4] Target ESLint Validation... " -NoNewline
        $TargetRel = $normModule.Replace("apps/web/", "").Replace("apps\web\", "").Replace("\", "/")
        $LintOutput = pnpm --filter web exec eslint "$TargetRel" --max-warnings 0 2>&1
        $Gate2Passed = ($LASTEXITCODE -eq 0)
        if ($Gate2Passed) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL" -ForegroundColor Red }

        # Gate 3: File Line Cap (<= 350 LoC)
        Write-Host "    [Gate 3/4] File Line Cap Audit (<= 350 LoC)... " -NoNewline
        $OverLimitFiles = @()
        $filesToCheck = @()
        if ((Get-Item $normModule) -is [System.IO.DirectoryInfo]) {
            $filesToCheck = Get-ChildItem -Path $normModule -Recurse -File | Where-Object { $_.Extension -in '.tsx', '.ts' }
        } else {
            $filesToCheck = @(Get-Item $normModule)
        }
        foreach ($f in $filesToCheck) {
            $lines = [System.IO.File]::ReadAllLines($f.FullName).Length
            if ($lines -gt 350) {
                $OverLimitFiles += ($f.Name + ': ' + $lines + ' lines (limit 350)')
            }
        }
        $Gate3Passed = ($OverLimitFiles.Count -eq 0)
        if ($Gate3Passed) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL ($($OverLimitFiles -join ', '))" -ForegroundColor Red }

        # Gate 4: Remaining Anti-Patterns
        Write-Host "    [Gate 4/4] Design Token and Strict CSS Policy... " -NoNewline
        $remainingViolations = Scan-Violations $normModule
        $strictCssViolations = $remainingViolations | Where-Object { $_ -notmatch '\[LineCap\]' }
        $Gate4Passed = ($strictCssViolations.Count -eq 0)
        if ($Gate4Passed) { Write-Host "PASS" -ForegroundColor Green } else { Write-Host "FAIL ($($strictCssViolations.Count) violation(s))" -ForegroundColor Red }

        if ($Gate1Passed -and $Gate2Passed -and $Gate3Passed -and $Gate4Passed) {
            $Passed = $true
            Write-Host "`n    [SUCCESS] ALL 4 QUALITY GATES PASSED CLEANLY FOR: $normModule" -ForegroundColor Green
            break
        }

        # Format Structured Error Report for agy
        if ($Attempt -lt $MaxRetries) {
            Write-Host "`n    Quality issues detected. Initiating automated self-healing cycle..." -ForegroundColor DarkYellow
            $FeedbackLines = @(
                "QUALITY GATE FAILURES in '$normModule'. Please fix these issues immediately:"
            )
            
            if (-not $Gate1Passed) {
                $FeedbackLines += ""
                $FeedbackLines += "--- [GATE 1: TYPESCRIPT COMPILER ERRORS] ---"
                $FeedbackLines += ($TypeCheckOutput -join "`r`n")
            }
            if (-not $Gate2Passed) {
                $FeedbackLines += ""
                $FeedbackLines += "--- [GATE 2: ESLINT ERRORS] ---"
                $FeedbackLines += ($LintOutput -join "`r`n")
            }
            if (-not $Gate3Passed) {
                $FeedbackLines += ""
                $FeedbackLines += "--- [GATE 3: FILE SIZE CAP EXCEEDED] ---"
                $FeedbackLines += "The following files exceed the 350-line hard cap. Split them into smaller child components:"
                $FeedbackLines += ($OverLimitFiles -join "`r`n")
            }
            if (-not $Gate4Passed) {
                $FeedbackLines += ""
                $FeedbackLines += "--- [GATE 4: CODE POLICY AND CSS TOKEN VIOLATIONS] ---"
                $FeedbackLines += ($strictCssViolations -join "`r`n")
            }

            if (Get-Command agy -ErrorAction SilentlyContinue) {
                $FeedbackFile = [System.IO.Path]::GetTempFileName()
                [System.IO.File]::WriteAllText($FeedbackFile, ($FeedbackLines -join "`r`n"))
                $FeedbackContent = [System.IO.File]::ReadAllText($FeedbackFile)
                $FeedbackContent | agy -p
                Remove-Item $FeedbackFile -Force
            } else {
                Write-Host "    [Please address the gate issues above in the current session]" -ForegroundColor Yellow
                break
            }
        }
    }

    return $Passed
}

# -----------------------------------------------------------------
# Main Workflow Execution Pipeline
# -----------------------------------------------------------------
$TotalTargets = $TargetList.Count
$SuccessCount = 0
$FailedTargets = @()

foreach ($target in $TargetList) {
    $normTarget = Normalize-PathStr $target

    if ($Batch) {
        Write-Host "==> Batch Mode: Discovering sub-routes in $normTarget..." -ForegroundColor Cyan
        $SubDirs = Get-ChildItem -Path $normTarget -Directory
        if ($SubDirs.Count -eq 0) {
            $ok = Invoke-ModuleRefactor $normTarget
            if ($ok) { $SuccessCount++ } else { $FailedTargets += $normTarget }
        } else {
            foreach ($dir in $SubDirs) {
                $ok = Invoke-ModuleRefactor $dir.FullName
                if ($ok) { $SuccessCount++ } else { $FailedTargets += (Normalize-PathStr $dir.FullName) }
            }
        }
    } else {
        $ok = Invoke-ModuleRefactor $normTarget
        if ($ok) { $SuccessCount++ } else { $FailedTargets += $normTarget }
    }
}

# Final Execution Summary
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   PIPELINE EXECUTION SUMMARY" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "  Branch:            $CurrentBranch" -ForegroundColor White
Write-Host "  Targets Processed: $TotalTargets" -ForegroundColor White
Write-Host "  Passed:            $SuccessCount" -ForegroundColor Green
if ($FailedTargets.Count -gt 0) {
    Write-Host "  Failed:            $($FailedTargets.Count) ($($FailedTargets -join ', '))" -ForegroundColor Red
} else {
    Write-Host "  All specified modules passed all 4 quality gates successfully!" -ForegroundColor Green
    Write-Host "  Working tree preserved on '$CurrentBranch' for your review & manual commit." -ForegroundColor White
}
Write-Host "=================================================================`n" -ForegroundColor Cyan
