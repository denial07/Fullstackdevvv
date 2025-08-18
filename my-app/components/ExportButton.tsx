"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToXlsx } from "@/lib/export-excel";

// If you're not using TanStack Table, just pass an array of objects via `rows`.
type Props = {
    rows: Record<string, unknown>[];         // e.g. table data (visible/filtered/etc.)
    fileName?: string;
    sheetName?: string;
    headerOrder?: string[];                  // optional: control column order
};

export default function ExportButton({ rows, fileName, sheetName, headerOrder }: Props) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={() => exportToXlsx(rows, { fileName, sheetName, headerOrder })}
        >
            <Download className="h-4 w-4 mr-2" /> Export
        </Button>
    );
}
