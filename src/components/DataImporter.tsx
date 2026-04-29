import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileType, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolClass, Student, RMRecord, RMType, AppData } from '../types';
import { getDb, saveDb } from '../lib/db';

interface ImportProps {
  onComplete: () => void;
}

export const DataImporter: React.FC<ImportProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleImportClasses = (file: File) => {
    setLoading(true);
    Papa.parse(file, {
      delimiter: ";",
      encoding: "UTF-8",
      complete: (results) => {
        try {
          const rows = results.data as string[][];
          // Find the header row "Codigo Turma."
          const headerIdx = rows.findIndex(row => row.includes('Codigo Turma.'));
          if (headerIdx === -1) throw new Error('Cabeçalho "Codigo Turma." não encontrado.');

          const dataRows = rows.slice(headerIdx + 1);
          const newClasses: SchoolClass[] = dataRows
            .filter(row => row.length > 7 && row[0]) // Basic validation
            .map(row => ({
              id: row[0],
              year: row[1],
              schoolName: row[4],
              educationType: row[5],
              grade: row[6],
              name: row[7],
              capacity: parseInt(row[9]) || 0
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
      }
    });
  };

  const handleImportStudents = (file: File) => {
    // We need to know which class these students belong to
    // Typically, the file itself might not have the class ID but has "Série"
    // For this app, we'll ask the user to select the class before importing students
    // OR we can try to match by Série/Grade if unique.
    // Let's implement a "Select Class" then "Upload Students" flow in the UI.
    const db = getDb();
    if (db.classes.length === 0) {
      setMessage({ text: "Importe as turmas primeiro!", type: 'error' });
      return;
    }

    setLoading(true);
    Papa.parse(file, {
      delimiter: ";",
      encoding: "UTF-8",
      complete: (results) => {
        try {
          const rows = results.data as string[][];
          const headerIdx = rows.findIndex(row => row.includes('Nº') && row.includes('Nome do Aluno'));
          if (headerIdx === -1) throw new Error('Cabeçalho dos alunos não encontrado.');

          const dataRows = rows.slice(headerIdx + 1);
          
          // First, let's try to identify the class from the first data row's grade/series
          const firstValidRow = dataRows.find(r => r[1] && r[3]);
          if (!firstValidRow) throw new Error('Nenhum dado de aluno encontrado.');
          
          const gradeFromFile = firstValidRow[1];
          const matchingClasses = db.classes.filter(c => c.grade === gradeFromFile);
          
          if (matchingClasses.length === 0) {
              throw new Error(`Nenhuma turma encontrada para a série ${gradeFromFile}. Cadastre a turma primeiro.`);
          }

          // If multiple classes match this grade, we might need user choice.
          // For simplicity in this demo, we'll pick the first one or prompt a selection later.
          // Let's assume the user selects it. (Refactoring UI for this)
          
          const newStudents: Student[] = dataRows
            .filter(row => row[3] && row[4]) // Valid Name and RA
            .map(row => ({
              id: `${row[4]}-${row[5]}`, // RA + Dig
              ra: row[4],
              digit: row[5],
              uf: row[6],
              name: row[3],
              birthDate: row[7],
              number: parseInt(row[2]) || 0,
              classId: matchingClasses[0].id, // Defaulting to first match
              status: row[8] === 'TRAN' ? 'Transferido' : (row[8] === 'NCOM' ? 'Inativo' : 'Ativo'),
              statusDate: row[9] || undefined
            }));

          const mergedStudents = [...db.students];
          newStudents.forEach(ns => {
            const index = mergedStudents.findIndex(s => s.id === ns.id);
            if (index !== -1) mergedStudents[index] = ns;
            else mergedStudents.push(ns);
          });

          saveDb({ ...db, students: mergedStudents });
          setMessage({ text: `${newStudents.length} alunos importados para a turma ${matchingClasses[0].name}!`, type: 'success' });
          onComplete();
        } catch (err: any) {
          setMessage({ text: `Erro: ${err.message}`, type: 'error' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleImportRM = (file: File, type: RMType) => {
    setLoading(true);
    Papa.parse(file, {
      delimiter: ";",
      encoding: "UTF-8",
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as any[];
          const newRMRecords: RMRecord[] = rows
            .filter(row => row['NOME'] && row['RM'])
            .map(row => ({
              id: `RM-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              rmNumber: parseInt(row['RM']),
              type: type,
              studentName: row['NOME'].toUpperCase(),
              birthDate: row['DATA NASC'] || new Date().toLocaleDateString('pt-BR')
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
      }
    });
  };

  return (
    <div className="space-y-8 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-emerald-100 rounded-2xl">
          <Upload className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Importação Estratégica</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">Alimentação do Banco de Dados via Planilha</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Import Classes */}
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-indigo-400 transition-all bg-slate-50/30 group hover:bg-indigo-50/20">
          <div className="bg-indigo-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-indigo-600 font-black shadow-sm group-hover:scale-110 transition-transform">1</div>
          <h3 className="font-black text-slate-700 mb-2 uppercase tracking-tight text-lg">Importar Turmas</h3>
          <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">Carregue o arquivo "Consulta Matrícula" para configurar a estrutura de classes.</p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="class-upload"
            onChange={(e) => e.target.files?.[0] && handleImportClasses(e.target.files[0])}
          />
          <label
            htmlFor="class-upload"
            className="inline-flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 cursor-pointer transition-all w-full justify-center font-black uppercase tracking-widest text-xs shadow-lg active:scale-95"
          >
            <FileType className="w-5 h-5" />
            Turmas.csv
          </label>
        </div>

        {/* Import Students */}
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-emerald-400 transition-all bg-slate-50/30 group hover:bg-emerald-50/20">
          <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-emerald-600 font-black shadow-sm group-hover:scale-110 transition-transform">2</div>
          <h3 className="font-black text-slate-700 mb-2 uppercase tracking-tight text-lg">Importar Alunos</h3>
          <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">Carregue o arquivo "Relação de Alunos" para popular as turmas de base.</p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="student-upload"
            onChange={(e) => e.target.files?.[0] && handleImportStudents(e.target.files[0])}
          />
          <label
            htmlFor="student-upload"
            className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 cursor-pointer transition-all w-full justify-center font-black uppercase tracking-widest text-xs shadow-lg active:scale-95"
          >
            <FileType className="w-5 h-5" />
            Alunos.csv
          </label>
        </div>

        {/* Import RM */}
        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl hover:border-orange-400 transition-all bg-slate-50/30 group hover:bg-orange-50/20">
          <div className="bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-orange-600 font-black shadow-sm group-hover:scale-110 transition-transform">3</div>
          <h3 className="font-black text-slate-700 mb-2 uppercase tracking-tight text-lg">Histórico de RM</h3>
          <p className="text-xs text-slate-400 font-bold mb-2 leading-relaxed">Importe o livro de registros histórico (NOME, DATA NASC, RM).</p>
          
          <div className="flex gap-2 mb-4">
             <button 
               onClick={() => { const el = document.getElementById('rm-upload-pre'); if(el) el.click(); }}
               className="flex-1 py-2 bg-orange-100 text-orange-700 rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-orange-200 transition-all"
             >
               Pré-2018
             </button>
             <button 
               onClick={() => { const el = document.getElementById('rm-upload-post'); if(el) el.click(); }}
               className="flex-1 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-tighter hover:bg-emerald-200 transition-all"
             >
               Pós-2018
             </button>
          </div>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="rm-upload-pre"
            onChange={(e) => e.target.files?.[0] && handleImportRM(e.target.files[0], 'Pre-2018')}
          />
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="rm-upload-post"
            onChange={(e) => e.target.files?.[0] && handleImportRM(e.target.files[0], 'Post-2018')}
          />
        </div>
      </div>

      {message && (
        <div className={`mt-6 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 border-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : 'bg-rose-50 text-rose-900 border-rose-100'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" /> : <AlertCircle className="w-6 h-6 shrink-0 text-rose-600" />}
          <div>
             <p className="text-xs font-black uppercase tracking-widest mb-1">{message.type === 'success' ? 'Sucesso na Operação' : 'Falha na Importação'}</p>
             <p className="text-sm font-bold opacity-80">{message.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};
