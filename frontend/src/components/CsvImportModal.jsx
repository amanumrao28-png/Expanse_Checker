import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { expenseService } from '../services/expenseService';
import { useExpenses } from '../context/ExpenseContext';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';

const CsvImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const { refreshData, showToast } = useExpenses();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewRows, setFilePreviewRows] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);

  const resetState = () => {
    setSelectedFile(null);
    setFilePreviewRows([]);
    setIsUploading(false);
    setResultSummary(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      showToast('Please select a valid .csv file', 'error');
      return;
    }

    setSelectedFile(file);
    setResultSummary(null);

    // Read first few lines for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || '';
      const lines = text.split('\n').filter((l) => l.trim().length > 0).slice(0, 5);
      const parsedRows = lines.map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
      setFilePreviewRows(parsedRows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const res = await expenseService.importExpensesCsv(selectedFile);
      setResultSummary(res);
      await refreshData();
      showToast(`Successfully imported ${res.imported_count} expenses!`, 'success');
      if (onImportComplete) onImportComplete(res);
    } catch (err) {
      console.error('Import error:', err);
      showToast(err.response?.data?.detail || 'Failed to import CSV file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Expenses from CSV"
      subtitle="Upload your bank statement or expense spreadsheet"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Upload Dropzone */}
        {!selectedFile && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 bg-slate-900/40 hover:bg-slate-900/70 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">
              Select or drop a CSV spreadsheet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Columns recognized: Description, Amount, Category, Date, Payment Method, Recurring, Notes.
            </p>
            <Button size="sm" icon={Upload} type="button">
              Choose CSV File
            </Button>
          </div>
        )}

        {/* Selected File & Preview */}
        {selectedFile && !resultSummary && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreviewRows([]);
                }}
                disabled={isUploading}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700/60 transition-colors"
              >
                Change File
              </button>
            </div>

            {/* CSV Preview Table */}
            {filePreviewRows.length > 0 && (
              <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-950/60">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Spreadsheet Preview (First few rows)
                </div>
                <div className="overflow-x-auto p-2 max-h-44 text-xs font-mono">
                  <table className="w-full text-left text-slate-300">
                    <tbody>
                      {filePreviewRows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? 'bg-slate-900/80 font-bold text-cyan-300' : 'border-t border-slate-800/60'}
                        >
                          {row.slice(0, 5).map((cell, cIdx) => (
                            <td key={cIdx} className="px-2 py-1 truncate max-w-[120px]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isUploading}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={Upload}
                loading={isUploading}
                onClick={handleImport}
                size="sm"
              >
                Start Import
              </Button>
            </div>
          </div>
        )}

        {/* Result Summary */}
        {resultSummary && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white">Import Complete!</p>
                <p className="text-xs text-slate-300 mt-1">
                  {resultSummary.message}
                </p>
              </div>
            </div>

            {resultSummary.errors && resultSummary.errors.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Warnings ({resultSummary.total_errors}):
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[11px]">
                  {resultSummary.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={handleClose} size="sm" variant="primary">
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CsvImportModal;
