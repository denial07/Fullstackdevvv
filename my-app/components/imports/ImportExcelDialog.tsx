"use client";

import * as React from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
    AlertTriangle,
    CheckCircle2,
    FileSpreadsheet,
    Loader2,
    Upload,
    X,
    ArrowDownCircle,
} from "lucide-react";

// ===== Types that mirror /api/import/inspect response =====
interface MappingProposal {
    incoming: string;
    inferredType: string;
    inferredSupport: number; // 0..1
    bestMatch: string | null;
    bestMatchType: string | null;
    nameConfidence: number; // 0..1
    typeConfidence: number; // 0..1
    autoMapped: boolean;
    needsUserDecision: boolean;
}

interface InspectResponse {
    importId: string;
    sheet: string;
    headers: string[];
    schemaStatus: "USING_EXISTING_STANDARD" | "COLD_START_WILL_LEARN" | string;
    mapping: MappingProposal[];
    duplicates: {
        autoInsert: { row: Record<string, any>; confidenceNotDuplicate?: number }[];
        review: { row: Record<string, any>; probabilityDuplicate?: number }[];
    };
}

export type ImportExcelDialogProps = {
    entity: string;
    trigger?: React.ReactNode;
    inspectUrl?: string;
    commitUrl?: string;
    onCommitted?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};

export default function ImportExcelDialog({
    entity,
    trigger,
    inspectUrl = "/api/import-2/inspect",
    commitUrl = "/api/import-2/commit",
    onCommitted,
    open: controlledOpen,
    onOpenChange,
}: ImportExcelDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;

    // UI state
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [dryRun, setDryRun] = useState(true);
    const [isInspecting, setIsInspecting] = useState(false);
    const [inspect, setInspect] = useState<InspectResponse | null>(null);
    const [mappingEdits, setMappingEdits] = useState<Record<string, string>>({});
    const [dupDecisions, setDupDecisions] = useState<Record<number, "insert" | "skip">>({});
    const [adoptAsStandard, setAdoptAsStandard] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);

    const ambiguousCount = useMemo(
        () => (inspect?.mapping || []).filter((m) => m.needsUserDecision).length,
        [inspect]
    );

    // dirty if we have results or user edited anything
    const isDirty =
        !!inspect ||
        Object.keys(mappingEdits).length > 0 ||
        Object.keys(dupDecisions).length > 0;

    const [confirmExitOpen, setConfirmExitOpen] = useState(false);

    const resetDialog = () => {
        setExcelFile(null);
        setInspect(null);
        setMappingEdits({});
        setDupDecisions({});
        setAdoptAsStandard(false);
        setIsInspecting(false);
        setIsCommitting(false);
    };

    function handleOpenChange(next: boolean) {
        if (!next) {
            if (isDirty && ambiguousCount > 0) {
                setConfirmExitOpen(true);
                return;
            }
            resetDialog();
            setOpen(false);
            return;
        }
        setOpen(true);
    }

    function scrollToFirstAmbiguous() {
        const el = document.querySelector('tr[data-ambiguous="true"]');
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    async function handleRunInspect() {
        if (!excelFile) return;
        setIsInspecting(true);
        try {
            const fd = new FormData();
            fd.append("file", excelFile);
            fd.append("entity", entity);
            fd.append("dryRun", String(dryRun));

            const res = await fetch(inspectUrl, { method: "POST", body: fd });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error(`[inspect] ${res.status} ${res.statusText}`, text);
                throw new Error(`Inspect failed (${res.status})`);
            }

            const data: InspectResponse = await res.json();
            setInspect(data);

            // Prime mapping edits with suggestions or identity
            const edits: Record<string, string> = {};
            data.mapping.forEach((m) => {
                const incoming = m.incoming.toLowerCase();
                edits[incoming] = (m.autoMapped && m.bestMatch) || m.bestMatch || incoming;
            });
            setMappingEdits(edits);
            setAdoptAsStandard(data.schemaStatus === "COLD_START_WILL_LEARN");
        } catch (e) {
            console.error(e);
        } finally {
            setIsInspecting(false);
        }
    }

    async function handleCommitImport() {
        if (!excelFile) return;
        setIsCommitting(true);
        try {
            const mappingPayload = Object.entries(mappingEdits).map(([incoming, mapTo]) => ({ incoming, mapTo }));
            const dupPayload = Object.entries(dupDecisions).map(([rowIndex, action]) => ({ rowIndex: Number(rowIndex), action }));

            const fd = new FormData();
            fd.append("file", excelFile);
            fd.append("entity", entity);
            fd.append("mapping", JSON.stringify(mappingPayload));
            fd.append("duplicates", JSON.stringify(dupPayload));
            fd.append("adoptAsStandard", String(adoptAsStandard));

            const res = await fetch(commitUrl, { method: "POST", body: fd });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error(`[commit] ${res.status} ${res.statusText}`, text);
                throw new Error("Commit failed");
            }
            await res.json();

            onCommitted?.();
            resetDialog();
            setOpen(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCommitting(false);
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button variant="secondary" size="sm">
                            <Upload className="h-4 w-4 mr-2" /> Import Excel
                        </Button>
                    )}
                </DialogTrigger>

                {/* Custom content with sticky header/body/footer */}
                <DialogContent className="max-w-5xl p-0">
                    {/* Sticky header */}
                    <div className="sticky top-0 z-10 border-b bg-white px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            <div>
                                <h2 className="text-base font-semibold">Import {entity}s from Excel</h2>
                                <p className="text-xs text-muted-foreground">
                                    Analyze columns, confirm mappings (≥95%), and review duplicates.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {inspect && ambiguousCount > 0 && (
                                <Button variant="outline" size="sm" onClick={scrollToFirstAmbiguous}>
                                    <ArrowDownCircle className="h-4 w-4 mr-1" /> Jump to unresolved
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Close"
                                onClick={() => handleOpenChange(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable body */}
                    <div className="px-6 py-4 max-h-[70vh] overflow-y-auto overscroll-contain">
                        {/* File chooser + options */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <Input type="file" accept=".xlsx,.xls" onChange={(e) => setExcelFile(e.target.files?.[0] || null)} />
                            <div className="flex items-center gap-2">
                                <Switch id="dryrun" checked={dryRun} onCheckedChange={setDryRun} />
                                <Label htmlFor="dryrun">Dry run</Label>
                            </div>
                            <Button onClick={handleRunInspect} disabled={!excelFile || isInspecting}>
                                {isInspecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <SearchIcon />}
                                {isInspecting ? "Analyzing..." : "Analyze file"}
                            </Button>
                        </div>

                        {/* Results */}
                        {inspect && (
                            <Tabs defaultValue="mapping" className="w-full mt-4">
                                <TabsList>
                                    <TabsTrigger value="mapping">
                                        Mapping {ambiguousCount ? <Badge variant="secondary" className="ml-1">{ambiguousCount}</Badge> : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="duplicates">
                                        Duplicates {inspect.duplicates.review.length ? <Badge variant="secondary" className="ml-1">{inspect.duplicates.review.length}</Badge> : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="summary">Summary</TabsTrigger>
                                </TabsList>

                                {/* Mapping Tab */}
                                <TabsContent value="mapping" className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span>Schema:</span>
                                        {inspect.schemaStatus === "COLD_START_WILL_LEARN" ? (
                                            <Badge variant="outline" className="border-amber-300 text-amber-700">No active standard</Badge>
                                        ) : (
                                            <Badge variant="outline" className="border-emerald-300 text-emerald-700">Using existing standard</Badge>
                                        )}
                                        {inspect.schemaStatus === "COLD_START_WILL_LEARN" && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <Switch id="adopt" checked={adoptAsStandard} onCheckedChange={setAdoptAsStandard} />
                                                <Label htmlFor="adopt">Adopt this file as new standard</Label>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-white z-[1]">
                                                <TableRow>
                                                    <TableHead>Incoming Column</TableHead>
                                                    <TableHead>Suggested Map To</TableHead>
                                                    <TableHead className="hidden md:table-cell">Name Conf.</TableHead>
                                                    <TableHead className="hidden md:table-cell">Type Conf.</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {inspect.mapping.map((m) => {
                                                    const key = m.incoming.toLowerCase();
                                                    const namePct = Math.round(m.nameConfidence * 100);
                                                    const typePct = Math.round(m.typeConfidence * 100);
                                                    const needs = m.needsUserDecision;
                                                    return (
                                                        <TableRow key={m.incoming} data-ambiguous={needs ? "true" : "false"}>
                                                            <TableCell className="font-medium">{m.incoming}</TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={mappingEdits[key] ?? ""}
                                                                    onChange={(e) => setMappingEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                                                                    placeholder={m.bestMatch || m.incoming}
                                                                />
                                                                <p className="text-[11px] text-muted-foreground mt-1">Suggested: {m.bestMatch || "(none)"}</p>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                <ConfidenceBadge value={namePct} threshold={95} />
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                <ConfidenceBadge value={typePct} threshold={95} />
                                                            </TableCell>
                                                            <TableCell>
                                                                {needs ? (
                                                                    <Badge variant="destructive" className="flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3" /> Needs confirm
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                                        <CheckCircle2 className="h-3 w-3" /> Auto
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>

                                {/* Duplicates Tab */}
                                <TabsContent value="duplicates" className="space-y-3">
                                    <div className="rounded-md border overflow-hidden">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-white z-[1]">
                                                <TableRow>
                                                    <TableHead className="w-32">Decision</TableHead>
                                                    <TableHead>Row Preview</TableHead>
                                                    <TableHead className="w-40">Prob. Duplicate</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {inspect.duplicates.review.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                                                            No uncertain duplicates detected.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {inspect.duplicates.review.map((d, idx) => {
                                                    const prob = Math.round((d.probabilityDuplicate || 0) * 100);
                                                    const action = dupDecisions[idx] || "insert";
                                                    return (
                                                        <TableRow key={idx}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant={action === "insert" ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => setDupDecisions((p) => ({ ...p, [idx]: "insert" }))}
                                                                    >
                                                                        Insert
                                                                    </Button>
                                                                    <Button
                                                                        type="button"
                                                                        variant={action === "skip" ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => setDupDecisions((p) => ({ ...p, [idx]: "skip" }))}
                                                                    >
                                                                        Skip
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-xs max-w-[48rem] truncate">
                                                                    {Object.entries(d.row).slice(0, 8).map(([k, v]) => (
                                                                        <span key={k} className="mr-3">
                                                                            <span className="text-muted-foreground">{k}:</span> {String(v)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <ConfidenceBadge value={prob} threshold={50} inverse />
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {inspect.duplicates.autoInsert.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            {inspect.duplicates.autoInsert.length} rows will be auto-inserted (≥90% confidence NOT duplicate).
                                        </p>
                                    )}
                                </TabsContent>

                                {/* Summary Tab */}
                                <TabsContent value="summary" className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>Sheet:</span>
                                        <Badge variant="outline">{inspect.sheet}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Headers detected:</span>
                                        <span className="text-muted-foreground">{inspect.headers.join(", ")}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Ambiguous mappings:</span>
                                        <Badge variant={ambiguousCount ? "destructive" : "secondary"}>{ambiguousCount}</Badge>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>

                    {/* Sticky footer */}
                    <div className="sticky bottom-0 z-10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t px-6 py-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Auto-map only when both name and type confidence ≥95%.
                        </span>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleOpenChange(false)}>
                                Exit
                            </Button>
                            <Button onClick={handleCommitImport} disabled={!inspect || isCommitting || ambiguousCount > 0}>
                                {isCommitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                {ambiguousCount > 0 ? `Resolve ${ambiguousCount} mappings` : "Commit Import"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm-on-exit using Dialog (no alert-dialog dependency) */}
            <Dialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Discard import changes?</DialogTitle>
                        <DialogDescription>
                            You still have unresolved items or unsaved decisions. If you exit now, these changes will be lost.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmExitOpen(false)}>
                            Keep editing
                        </Button>
                        <Button
                            onClick={() => {
                                resetDialog();
                                setConfirmExitOpen(false);
                                setOpen(false);
                            }}
                        >
                            Discard & Exit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ConfidenceBadge({ value, threshold, inverse = false }: { value: number; threshold: number; inverse?: boolean }) {
    const good = inverse ? value <= threshold : value >= threshold;
    const color = good ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800";
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${color}`}>{value}%</span>;
}

function SearchIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 mr-2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
}
