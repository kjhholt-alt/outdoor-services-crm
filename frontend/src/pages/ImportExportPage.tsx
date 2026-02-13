import { useState, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { importExportApi, regionsApi } from '../api/client';
import { Button } from '../components/common/Button';
import { Card, CardHeader, CardContent } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { Select } from '../components/common/Input';
import type { Region } from '../types';

export function ImportExportPage() {
  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Import / Export
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Import customers from Excel/CSV or export your data
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ImportSection />
        <ExportSection />
      </div>
    </div>
    </PageTransition>
  );
}

function ImportSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{
    headers: string[];
    field_mapping: Record<string, string>;
    row_count: number;
    preview_rows: Record<string, unknown>[];
    available_fields: string[];
  } | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [duplicateAction, setDuplicateAction] = useState<'skip' | 'update' | 'create_new'>('skip');
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const previewMutation = useMutation({
    mutationFn: (file: File) => importExportApi.preview(file),
    onSuccess: (data) => {
      setPreview(data);
      setFieldMapping(data.field_mapping || {});
    },
  });

  const executeMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return importExportApi.execute(file, fieldMapping, duplicateAction);
    },
    onSuccess: (data) => {
      setImportResult(data);
      setFile(null);
      setPreview(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setImportResult(null);
      previewMutation.mutate(selectedFile);
    }
  };

  const updateMapping = (header: string, field: string) => {
    setFieldMapping((prev) => ({
      ...prev,
      [header]: field,
    }));
  };

  return (
    <Card>
      <CardHeader
        title="Import Customers"
        subtitle="Upload Excel (.xlsx) or CSV files"
      />
      <CardContent>
        <div className="space-y-4">
          {/* File Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              {file ? file.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Excel (.xlsx) or CSV files
            </p>
          </div>

          {/* Loading */}
          {previewMutation.isPending && (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-500 mt-2">Analyzing file...</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Found <strong>{preview.row_count}</strong> rows in file
                </p>
              </div>

              {/* Field Mapping */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Field Mapping
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {preview.headers.map((header) => (
                    <div
                      key={header}
                      className="flex items-center gap-4 text-sm"
                    >
                      <span className="w-1/3 text-gray-600 dark:text-gray-300 truncate">
                        {header}
                      </span>
                      <span className="text-gray-400">→</span>
                      <select
                        value={fieldMapping[header] || ''}
                        onChange={(e) => updateMapping(header, e.target.value)}
                        className="flex-1 input py-1 text-sm"
                      >
                        <option value="">Skip this field</option>
                        {preview.available_fields.map((field) => (
                          <option key={field} value={field}>
                            {field.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duplicate Handling */}
              <Select
                label="Duplicate Handling"
                value={duplicateAction}
                onChange={(e) =>
                  setDuplicateAction(e.target.value as typeof duplicateAction)
                }
                options={[
                  { value: 'skip', label: 'Skip duplicates' },
                  { value: 'update', label: 'Update existing' },
                  { value: 'create_new', label: 'Create new' },
                ]}
              />

              {/* Import Button */}
              <Button
                variant="primary"
                onClick={() => executeMutation.mutate()}
                isLoading={executeMutation.isPending}
                className="w-full"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import {preview.row_count} Records
              </Button>
            </>
          )}

          {/* Import Result */}
          {importResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Import Complete
                </span>
              </div>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <p>Created: {importResult.created}</p>
                <p>Updated: {importResult.updated}</p>
                <p>Skipped: {importResult.skipped}</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                    <p className="text-red-600">
                      Errors: {importResult.errors.length}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ExportSection() {
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [region, setRegion] = useState('');
  const [exporting, setExporting] = useState(false);

  const { data: regions } = useQuery<Region[]>({
    queryKey: ['regions'],
    queryFn: regionsApi.list,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await importExportApi.exportCustomers(
        format,
        region ? parseInt(region, 10) : undefined
      );

      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Export Customers"
        subtitle="Download customer data"
      />
      <CardContent>
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 text-center">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">
              Export your customer database
            </p>
          </div>

          <Select
            label="Format"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'xlsx' | 'csv')}
            options={[
              { value: 'xlsx', label: 'Excel (.xlsx)' },
              { value: 'csv', label: 'CSV (.csv)' },
            ]}
          />

          <Select
            label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={[
              { value: '', label: 'All Regions' },
              ...(regions?.map((r) => ({
                value: r.id.toString(),
                label: r.name,
              })) || []),
            ]}
          />

          <Button
            variant="primary"
            onClick={handleExport}
            isLoading={exporting}
            className="w-full"
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Customers
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
