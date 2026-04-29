import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolClass, Student, RMRecord, RMType, AppData, StudentStatus } from '../types';
import { getDb, saveDb } from '../lib/db';

interface ImportProps {
  onComplete: () => void;
}

export const DataImporter: React.FC<ImportProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelFile = async (file: File, header: boolean = false): Promise<any[]> => {
    const data = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    if (header) {
      return XLSX.utils.sheet_to_json(worksheet);
    } else {
      return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    }
  };

  const handleImportClasses = async (file: File) => {
    setLoading(true);
    try {
      let rows: any[][];
      
      if (file.name.endsWith('.csv')) {
        const results = await new Promise<Papa.ParseResult<string[]>>((resolve) => {
          Papa.parse(file, {
            delimiter: ";",
            encoding: "UTF-8",
            complete: (res) => resolve(res as Papa.ParseResult<string[]>),
          });
        });
        rows = results.data;
      } else {
        rows = await parseExcelFile(file, false);
      }

      // Find the header row "Codigo Turma."
      const headerIdx = rows.findIndex(row => Array.isArray(row) && row.some(cell => String(cell).includes('Codigo Turma.')));
      if (headerIdx === -1) throw new Error('Cabeçalho "Codigo Turma." não encontrado.');

      const dataRows = rows.slice(headerIdx + 1);
      const newClasses: SchoolClass[] = dataRows
        .filter(row => row.length > 7 && row[0]) // Basic validation
        .map(row => ({
          id: String(row[0]),
          year: String(row[1]),
          schoolName: String(row[4]),
          educationType: String(row[5]),
          grade: String(row[6]),
          name: String(row[7]),
          capacity: 25 // Fixed capacity as requested
        }));

      const db = getDb();
      // Merge avoiding duplicates
      const mergedClasses = [...db.classes];
      newClasses.forEach(nc => {
        const index = mergedClasses.findIndex(c => c.id === nc.id);
        if (index !== -1) mergedClasses[index] = nc;
        else mergedClasses.push(nc);
      });

      saveDb({ ...db, classes: mergedClasses });
      setMessage({ text: `${newClasses.length} turmas importadas com sucesso!`, type: 'success' });
      onComplete();
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportRM = async (file: File, type: RMType) => {
    setLoading(true);
    try {
      let rows: any[];
      
      if (file.name.endsWith('.csv')) {
        const results = await new Promise<Papa.ParseResult<any>>((resolve) => {
          Papa.parse(file, {
            delimiter: ";",
            encoding: "UTF-8",
            header: true,
            skipEmptyLines: true,
            complete: (res) => resolve(res as Papa.ParseResult<any>),
          });
        });
        rows = results.data;
      } else {
        rows = await parseExcelFile(file, true);
      }

      const newRMRecords: RMRecord[] = rows
        .filter(row => (row['NOME'] || row['Nome']) && (row['RM'] || row['Rm']))
        .map(row => ({
          id: `RM-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          rmNumber: parseInt(String(row['RM'] || row['Rm'])),
          type: type,
          studentName: String(row['NOME'] || row['Nome']).toUpperCase(),
          birthDate: String(row['DATA NASC'] || row['Data Nascimento'] || row['Nascimento'] || new Date().toLocaleDateString('pt-BR'))
        }));

      const db = getDb();
      const mergedRM = [...db.rmRegistry];
      
      newRMRecords.forEach(nr => {
        const exists = mergedRM.some(r => r.rmNumber === nr.rmNumber && r.type === nr.type);
        if (!exists) mergedRM.push(nr);
      });

      saveDb({ ...db, rmRegistry: mergedRM });
      setMessage({ text: `${newRMRecords.length} registros de RM importados com sucesso!`, type: 'success' });
      onComplete();
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="bg-indigo-600 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Upload className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">Importação Central de Dados</h2>
          <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Sincronize arquivos do sistema estadual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Classes */}
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 transition-all bg-slate-50/30 group hover:bg-indigo-50/20">
          <div className="bg-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-indigo-600 font-black shadow-sm group-hover:scale-110 transition-transform">1</div>
          <h3 className="font-black text-slate-700 mb-2 uppercase tracking-tight text-lg">Importar Turmas</h3>
          <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">Carregue o arquivo "Consulta Matrícula" para configurar a estrutura de classes.</p>
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            id="class-upload"
            onChange={(e) => e.target.files?.[0] && handleImportClasses(e.target.files[0])}
          />
          <label
            htmlFor="class-upload"
            className="inline-flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 cursor-pointer transition-all w-full justify-center font-black uppercase tracking-widest text-xs shadow-lg active:scale-95"
          >
            <FileType className="w-5 h-5" />
            Turmas (.csv / .xlsx)
          </label>
        </div>

        {/* Import RM */}
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-orange-400 transition-all bg-slate-50/30 group hover:bg-orange-50/20">
          <div className="bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-orange-600 font-black shadow-sm group-hover:scale-110 transition-transform">2</div>
          <h3 className="font-black text-slate-700 mb-2 uppercase tracking-tight text-lg">Histórico de RM</h3>
          <p className="text-xs text-slate-400 font-bold mb-2 leading-relaxed">Importe o livro de registros histórico (NOME, DATA NASC, RM).</p>
          
          <div className="grid grid-cols-2 gap-3 mt-6">
            <label
              htmlFor="rm-upload-pre"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-400 cursor-pointer transition-all text-center group"
            >
              <FileType className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Livros Pré-2018</span>
            </label>
            <label
              htmlFor="rm-upload-post"
              className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-400 cursor-pointer transition-all text-center group"
            >
              <FileType className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">Livros Pós-2018</span>
            </label>
          </div>

          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            id="rm-upload-pre"
            onChange={(e) => e.target.files?.[0] && handleImportRM(e.target.files[0], 'Pre-2018')}
          />
          <input
            type="file"
            accept=".csv, .xlsx, .xls"
            className="hidden"
            id="rm-upload-post"
            onChange={(e) => e.target.files?.[0] && handleImportRM(e.target.files[0], 'Post-2018')}
          />
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />}
          <p className="text-sm font-black uppercase tracking-tight">{message.text}</p>
        </div>
      )}
    </div>
  );
};

export const StudentImporter: React.FC<{ targetClassId: string, onComplete: () => void }> = ({ targetClassId, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelFile = async (file: File, header: boolean = false): Promise<any[]> => {
    const data = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    if (header) {
      return XLSX.utils.sheet_to_json(worksheet);
    } else {
      return XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    }
  };

  const handleImportStudents = async (file: File) => {
    const db = getDb();
    setLoading(true);
    try {
      let rows: any[][];
      
      if (file.name.endsWith('.csv')) {
        const results = await new Promise<Papa.ParseResult<string[]>>((resolve) => {
          Papa.parse(file, {
            delimiter: ";",
            encoding: "UTF-8",
            complete: (res) => resolve(res as Papa.ParseResult<string[]>),
          });
        });
        rows = results.data;
      } else {
        rows = await parseExcelFile(file, false);
      }

      // Headers: Nº;Nome do Aluno;RA;Dig. RA;UF RA;Data de Nascimento;Situação;Data Movimentação;...
      const headerIdx = rows.findIndex(row => Array.isArray(row) && (row.includes('Nº') || row[0] === 'Nº') && row.includes('Nome do Aluno'));
      if (headerIdx === -1) throw new Error('Cabeçalho "Nº / Nome do Aluno" não encontrado.');

      const dataRows = rows.slice(headerIdx + 1);
      
      const newStudents: Student[] = dataRows
        .filter(row => row[1] && row[3]) // Valid Name and RA
        .map(row => {
          const situation = String(row[7] || '').toUpperCase();
          let status: StudentStatus = 'Ativo';
          
          if (situation === 'TRAN') status = 'Transferido';
          else if (situation === 'NCOM' || situation === 'ABAND' || situation === 'DESI') status = 'Inativo';
          else if (situation === 'REMA') status = 'Remanejado';
          
          const raMerged = String(row[3] || '') + String(row[4] || '');

          return {
            id: raMerged || `GEN-${Math.random().toString(36).substr(2, 9)}`,
            ra: raMerged,
            uf: String(row[5] || 'SP'),
            name: String(row[1] || '').toUpperCase(),
            motherName: String(row[2] || '').toUpperCase(),
            birthDate: String(row[6] || ''),
            number: parseInt(String(row[0])) || 0,
            classId: targetClassId,
            status: status,
            statusDate: String(row[8]) || undefined,
            observations: situation ? `Situação Original: ${situation}` : undefined
          };
        });

      const mergedStudents = [...db.students];
      newStudents.forEach(ns => {
        const index = mergedStudents.findIndex(s => s.id === ns.id);
        if (index !== -1) mergedStudents[index] = ns;
        else mergedStudents.push(ns);
      });

      saveDb({ ...db, students: mergedStudents });
      setMessage({ text: `${newStudents.length} alunos importados com sucesso!`, type: 'success' });
      setTimeout(() => {
        setMessage(null);
        onComplete();
      }, 2000);
    } catch (err: any) {
      setMessage({ text: `Erro: ${err.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <input
        type="file"
        accept=".csv, .xlsx, .xls"
        className="hidden"
        id={`student-upload-${targetClassId}`}
        onChange={(e) => e.target.files?.[0] && handleImportStudents(e.target.files[0])}
        disabled={loading}
      />
      <label
        htmlFor={`student-upload-${targetClassId}`}
        className={`inline-flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-600 hover:text-white cursor-pointer transition-all font-black uppercase text-[9px] tracking-widest ${loading ? 'opacity-50 pointer-events-none' : 'active:scale-95'}`}
        title="Importar alunos desta turma via Planilha"
      >
        <Upload className="w-3.5 h-3.5" />
        {loading ? '...' : 'Importar Alunos'}
      </label>

      {message && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
           <div className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span className="text-[10px] font-black uppercase">{message.text}</span>
           </div>
        </div>
      )}
    </div>
  );
};

