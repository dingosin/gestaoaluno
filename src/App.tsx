import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  School, 
  ArrowRightLeft, 
  ClipboardList, 
  Database, 
  Search, 
  UserPlus, 
  MoreVertical,
  LogOut,
  ChevronRight,
  TrendingDown,
  LayoutDashboard,
  Hash,
  BookOpen,
  Calendar,
  Filter,
  Printer,
  Shield,
  FileText,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { getDb, saveDb } from './lib/db';
import { AppData, Student, SchoolClass, StudentStatus, RMType, RMRecord } from './types';
import { DataImporter } from './components/DataImporter';
import { generateAttendanceDocx, generateVacancyDocx } from './lib/docxGenerator';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'classes' | 'students' | 'transfers' | 'import' | 'registry' | 'reports' | 'management';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [db, setDb] = useState<AppData>(getDb());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refresh data from local storage
  const refreshData = () => {
    setDb(getDb());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filteredStudents = useMemo(() => {
    // Only show Active or Transferred students in the main view
    let result = db.students.filter(s => s.status === 'Ativo' || s.status === 'Transferido');
    
    if (selectedClassId !== 'all') {
      result = result.filter(s => s.classId === selectedClassId);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.ra.includes(term)
      );
    }
    return result;
  }, [db.students, selectedClassId, searchTerm]);

  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    const newDb = { ...db };
    const studentIdx = newDb.students.findIndex(s => s.id === studentId);
    if (studentIdx !== -1) {
      const student = newDb.students[studentIdx];
      
      // If deactivating, reset number
      const updatedNumber = (newStatus === 'Inativo' || newStatus === 'Abandono') ? 999 : student.number;

      newDb.students[studentIdx] = { 
        ...student, 
        status: newStatus,
        number: updatedNumber,
        statusDate: new Date().toLocaleDateString('pt-BR')
      };
      
      saveDb(newDb);
      setDb(newDb);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'classes', label: 'Turmas / Classes', icon: School },
    { id: 'students', label: 'Alunos', icon: Users },
    { id: 'transfers', label: 'Transferências', icon: ArrowRightLeft },
    { id: 'reports', label: 'Relatórios / Ofícios', icon: BookOpen },
    { id: 'registry', label: 'Livro de RM', icon: Hash },
    { id: 'management', label: 'Gerenciamento', icon: Shield },
    { id: 'import', label: 'Importar Planilha', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-indigo-700 flex flex-col md:h-screen p-6 shrink-0 no-print">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-lg">
            <School className="text-indigo-900 w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-white uppercase italic leading-tight">EduGestão</h1>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl text-sm font-semibold transition-all",
                  isActive 
                    ? "bg-white/10 text-white shadow-sm" 
                    : "text-indigo-100 hover:bg-white/5"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full transition-all shrink-0", isActive ? "bg-yellow-400" : "bg-transparent")} />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-indigo-600 bg-indigo-800 rounded-2xl p-4">
          <p className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-2">STATUS DO SISTEMA</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-200">Turmas</span>
              <span className="text-[10px] font-bold text-white">{db.classes.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-200">Alunos</span>
              <span className="text-[10px] font-bold text-white">{db.students.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-200">RM Registrados</span>
              <span className="text-[10px] font-bold text-white">{db.rmRegistry.length}</span>
            </div>
            <div className="pt-2 flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
               <span className="text-[10px] text-emerald-400 font-bold uppercase">Banco Ativo</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm shrink-0 no-print">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-slate-500 font-medium italic">Bem-vindo ao painel administrativo escolar</p>
          </div>
          <div className="hidden md:flex gap-4">
             <button 
                onClick={() => setActiveTab('import')}
                className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-md transition-all flex items-center gap-2 text-sm"
             >
               <Database className="w-4 h-4" />
               Importar Excel
             </button>
             <button 
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all text-sm"
                onClick={() => setIsModalOpen(true)}
             >
               + Novo Aluno
             </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {activeTab === 'dashboard' && <DashboardView db={db} />}
                {activeTab === 'classes' && <ClassesView db={db} />}
                {activeTab === 'students' && (
                  <StudentsView 
                    db={db} 
                    filteredStudents={filteredStudents}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedClassId={selectedClassId}
                    setSelectedClassId={setSelectedClassId}
                    onStatusChange={handleStatusChange}
                    setDb={setDb}
                  />
                )}
                {activeTab === 'import' && <DataImporter onComplete={refreshData} />}
                {activeTab === 'reports' && <ReportsView db={db} />}
                {activeTab === 'transfers' && <TransfersView db={db} setDb={setDb} />}
                {activeTab === 'registry' && <RegistryView db={db} setDb={setDb} />}
                {activeTab === 'management' && <ManagementView db={db} setDb={setDb} />}
              </motion.div>
            </AnimatePresence>

            {/* Modal for New Student */}
            {isModalOpen && (
              <NewStudentModal 
                db={db} 
                onClose={() => setIsModalOpen(false)} 
                onSave={(newDb) => {
                  saveDb(newDb);
                  setDb(newDb);
                  setIsModalOpen(false);
                }} 
              />
            )}
          </div>
        </div>

        {/* Footer Context */}
        <footer className="h-12 px-8 bg-indigo-900 text-indigo-200 text-[10px] flex items-center justify-between border-t border-indigo-800 shrink-0 no-print font-medium">
          <div className="flex gap-4 items-center">
            <span>Última atualização: <strong>{new Date().toLocaleTimeString()}</strong></span>
            <span className="text-indigo-400">|</span>
            <span>Versão 2.4.0</span>
          </div>
          <div className="flex gap-4 items-center uppercase tracking-widest font-black">
            <span className="text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              Sincronizado
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

// VIEW COMPONENTS

function DashboardView({ db }: { db: AppData }) {
  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Alunos" 
          value={db.students.length} 
          icon={Users} 
          borderColor="border-indigo-500"
        />
        <StatCard 
          label="Turmas Ativas" 
          value={db.classes.length} 
          icon={School} 
          borderColor="border-orange-500" 
        />
        <StatCard 
          label="Alunos Ativos" 
          value={db.students.filter(s => s.status === 'Ativo').length} 
          icon={TrendingDown} 
          borderColor="border-emerald-500" 
        />
        <StatCard 
          label="Transferências / Baixas" 
          value={db.students.filter(s => s.status !== 'Ativo').length} 
          icon={ArrowRightLeft} 
          borderColor="border-pink-500" 
        />
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-black text-slate-700 uppercase tracking-tight">Turmas / Classes Recentes</h2>
           <button 
              onClick={() => {}}
              className="px-4 py-2 bg-yellow-400 text-indigo-900 rounded-lg font-black text-xs shadow hover:bg-yellow-500 uppercase tracking-widest"
           >
             Gerenciar Todas
           </button>
        </div>
        
        {db.classes.length === 0 ? (
          <div className="p-12 text-center">
             <School className="w-12 h-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-medium italic underline decoration-slate-200 underline-offset-4 cursor-pointer" onClick={() => window.location.hash = '#import'}>
               Importe uma planilha Excel para começar
             </p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {db.classes.slice(0, 4).map(c => {
               const count = db.students.filter(s => s.classId === c.id).length;
               return (
                 <div key={c.id} className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-indigo-300 transition-all vibrancy-hover shadow-sm flex flex-col justify-between h-40 group">
                   <div>
                     <p className="text-[10px] font-black text-indigo-600 uppercase mb-1 tracking-widest">{c.year}</p>
                     <p className="text-base font-black text-slate-800 tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors uppercase">{c.name}</p>
                     <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{c.grade}</p>
                   </div>
                   <div className="flex items-center justify-between mt-4">
                     <span className="text-[10px] bg-slate-100 text-slate-600 font-black px-2 py-1 rounded-lg uppercase">
                       {count} / {c.capacity} Vagas
                     </span>
                     <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-all translate-x-0 group-hover:translate-x-1" />
                   </div>
                 </div>
               );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, borderColor }: any) {
  return (
    <div className={cn("bg-white p-6 rounded-2xl border-b-8 shadow-sm transition-all hover:scale-[1.02] flex flex-col gap-1", borderColor)}>
      <p className="text-xs text-slate-500 font-black uppercase tracking-tighter">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p>
        <Icon className="w-6 h-6 text-slate-200" />
      </div>
    </div>
  );
}

function ClassesView({ db }: { db: AppData }) {
  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100">
           <h2 className="font-black text-slate-700 uppercase tracking-tight">Relação de Turmas Registradas</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Código / Série</th>
              <th className="px-6 py-4 text-center">Turma</th>
              <th className="px-6 py-4">Ocupação</th>
              <th className="px-6 py-4">Ano Letivo</th>
              <th className="px-6 py-4 text-right">Escola</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {db.classes.map(c => {
              const studentCount = db.students.filter(s => s.classId === c.id).length;
              const isFull = studentCount >= c.capacity;
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono text-[10px] text-indigo-500 font-black group-hover:text-indigo-700">{c.id}</p>
                    <p className="text-xs text-slate-500 font-bold uppercase">{c.grade}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="font-black text-slate-800 uppercase tracking-tight">{c.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                             className={cn("h-full transition-all", isFull ? "bg-rose-500" : "bg-emerald-500")}
                             style={{ width: `${Math.min((studentCount / c.capacity) * 100, 100)}%` }}
                          />
                       </div>
                       <span className={cn(
                         "text-[10px] font-black px-2 py-0.5 rounded-lg",
                         isFull ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                       )}>
                         {studentCount} / {c.capacity}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-400 italic">{c.year}</td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-xs font-bold text-slate-600 truncate max-w-[150px] ml-auto uppercase">{c.schoolName}</p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {db.classes.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-medium italic underline" onClick={() => window.location.hash = '#import'}>
            Nenhuma turma encontrada. Importe os dados.
          </div>
        )}
      </div>
    </div>
  );
}

function StudentsView({ 
  db, 
  filteredStudents, 
  searchTerm, 
  setSearchTerm, 
  selectedClassId, 
  setSelectedClassId,
  onStatusChange,
  setDb
}: any) {
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Initialize local state when source data changes
    const sorted = [...filteredStudents].sort((a, b) => a.number - b.number);
    setLocalStudents(sorted);
    setHasChanges(false);
  }, [filteredStudents, selectedClassId]);

  const handleReorder = (newOrder: Student[]) => {
    const updated = newOrder.map((s, idx) => ({ ...s, number: idx + 1 }));
    setLocalStudents(updated);
    setHasChanges(true);
  };

  const handleManualNumber = (id: string, newVal: string) => {
    const newNum = parseInt(newVal);
    if (isNaN(newNum) || newNum < 1 || newNum > localStudents.length) return;

    const oldIndex = localStudents.findIndex(s => s.id === id);
    if (oldIndex === -1) return;

    const newIndex = newNum - 1;
    const items = [...localStudents];
    const [movedItem] = items.splice(oldIndex, 1);
    items.splice(newIndex, 0, movedItem);

    const reordered = items.map((s, idx) => ({ ...s, number: idx + 1 }));
    setLocalStudents(reordered);
    setHasChanges(true);
  };

  const saveChanges = () => {
    const newDb = { ...db };
    const updatedStudents = [...newDb.students];
    
    localStudents.forEach(ls => {
      const idx = updatedStudents.findIndex(s => s.id === ls.id);
      if (idx !== -1) {
        updatedStudents[idx] = ls;
      }
    });

    newDb.students = updatedStudents;
    saveDb(newDb);
    setDb(newDb);
    setHasChanges(false);
  };

  const isReorderEnabled = selectedClassId !== 'all' && !searchTerm;

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 md:items-center">
         <div className="flex-1 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
           <input 
             type="text" 
             placeholder="Pesquisar por Nome ou RA..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-300 outline-none transition-all"
           />
         </div>
         <select 
           value={selectedClassId}
           onChange={(e) => setSelectedClassId(e.target.value)}
           className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300"
         >
           <option value="all">Filtro: Todas as Turmas</option>
           {db.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
         </select>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">RA & Nº Chamada</th>
                <th className="px-6 py-4">Nome do Aluno</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Turma</th>
                <th className="px-6 py-4 text-right">Gerenciar</th>
              </tr>
            </thead>
            <Reorder.Group 
              as="tbody" 
              axis="y" 
              values={localStudents} 
              onReorder={handleReorder} 
              className="divide-y divide-slate-100"
            >
              {localStudents.map((s) => {
                const studentClass = db.classes.find(c => c.id === s.classId);
                return (
                  <Reorder.Item 
                    key={s.id} 
                    value={s} 
                    as="tr"
                    dragListener={isReorderEnabled}
                    className={cn(
                      "hover:bg-indigo-50/30 transition-colors group",
                      isReorderEnabled && "cursor-grab active:cursor-grabbing"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {isReorderEnabled && <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />}
                        <div>
                          <p className="font-mono text-[10px] text-indigo-600 font-black group-hover:text-indigo-800">{s.ra}-{s.digit}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Nº</span>
                            <input 
                              type="number"
                              value={s.number}
                              onChange={(e) => handleManualNumber(s.id, e.target.value)}
                              disabled={!isReorderEnabled}
                              className="w-10 px-1 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] font-black text-center focus:outline-indigo-500 disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-indigo-900 transition-colors">{s.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">{s.birthDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.status} date={s.statusDate} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 uppercase">{studentClass?.name || 'A definir'}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{studentClass?.grade}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <select 
                          className="text-[10px] font-black uppercase px-2 py-1.5 border-none rounded-xl bg-slate-100 text-slate-600 hover:bg-white hover:shadow-sm transition-all focus:ring-2 ring-indigo-200 outline-none cursor-pointer"
                          value={s.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as StudentStatus;
                            // Update local state first to prevent "return to old state" glitch
                            setLocalStudents(prev => prev.map(ls => ls.id === s.id ? { ...ls, status: newStatus } : ls));
                            onStatusChange(s.id, newStatus);
                          }}
                        >
                          <option value="Ativo"> Ativo</option>
                          <option value="Inativo"> Inativo</option>
                          <option value="Abandono"> Abandono</option>
                          <option value="Transferido"> Transferido</option>
                        </select>
                      </div>
                    </td>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          </table>
          {localStudents.length === 0 && (
            <div className="p-20 text-center">
               <Users className="w-12 h-12 text-slate-100 mx-auto mb-4" />
               <p className="text-slate-400 font-bold text-sm tracking-widest uppercase italic">Nenhum resultado encontrado...</p>
            </div>
          )}
        </div>
        
        {hasChanges && (
          <div className="p-6 bg-indigo-50 border-t border-indigo-100 flex justify-center sticky bottom-0 z-20">
            <button 
              onClick={saveChanges}
              className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 shadow-xl transition-all flex items-center gap-2 transform active:scale-95"
            >
              <Database className="w-4 h-4" />
              Aplicar Alterações de Ordem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status, date }: { status: StudentStatus, date?: string }) {
  const styles = {
    Ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Inativo: "bg-slate-100 text-slate-700 border-slate-200",
    Abandono: "bg-orange-100 text-orange-700 border-orange-200",
    Transferido: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shadow-sm", styles[status])}>
        {status}
      </span>
      {date && status !== 'Ativo' && <p className="text-[8px] text-slate-400 font-bold italic">Desde: {date}</p>}
    </div>
  );
}

function AttendanceView({ db }: { db: AppData }) {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = [2024, 2025, 2026, 2027];

  const daysInMonth = useMemo(() => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sun (0) and Sat (6)
        days.push(date.getDate());
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [month, year]);

  const toggleClass = (id: string) => {
    setSelectedClassIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedClassIds.length === db.classes.length) setSelectedClassIds([]);
    else setSelectedClassIds(db.classes.map(c => c.id));
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 no-print space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic flex items-center gap-3">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
              Lista de Chamada Inteligente
            </h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Configuração de relatórios e impressão em massa</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={month} 
              onChange={e => setMonth(parseInt(e.target.value))}
              className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select 
              value={year} 
              onChange={e => setYear(parseInt(e.target.value))}
              className="px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleção de Turmas ({selectedClassIds.length})</h3>
              <button onClick={selectAll} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">
                {selectedClassIds.length === db.classes.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </button>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {db.classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => toggleClass(c.id)}
                  className={cn(
                    "p-3 rounded-2xl border text-[10px] font-black uppercase tracking-tighter transition-all",
                    selectedClassIds.includes(c.id) 
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-md scale-[1.02]" 
                      : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
                  )}
                >
                  {c.name}
                </button>
              ))}
           </div>
        </div>

        <div className="border-t border-slate-100 pt-6 text-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Relatórios ({selectedClassIds.length} turmas selecionadas)</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {selectedClassIds.length > 0 && (
                <button 
                  onClick={async () => {
                    for (const id of selectedClassIds) {
                      const cls = db.classes.find(c => c.id === id)!;
                      const students = db.students
                        .filter(s => s.classId === id && (s.status === 'Ativo' || s.status === 'Transferido'))
                        .sort((a, b) => a.number - b.number);
                      await generateAttendanceDocx(cls, students, daysInMonth, months[month], year);
                    }
                  }}
                  className="px-10 py-4 bg-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                >
                  <FileText className="w-5 h-5" />
                  Exportar Turmas para Word (.docx)
                </button>
              )}
            </div>
        </div>
      </header>

      {/* Printable Area */}
      <div className="attendance-print-container">
        {selectedClassIds.map(id => {
          const cls = db.classes.find(c => c.id === id)!;
          // Include active and transferred students
          const students = db.students
            .filter(s => s.classId === id && (s.status === 'Ativo' || s.status === 'Transferido'))
            .sort((a, b) => a.number - b.number);

          return (
            <div key={id} className="attendance-page bg-white p-6 shadow-xl mb-10 print:m-0 print:shadow-none print:p-4 print:page-break-after-always">
              {/* Header Layout based on Excel attachment */}
              <div className="border-[1.5px] border-slate-900 grid grid-cols-[50px_1fr_1fr] mb-[-1.5px]">
                <div className="p-2 border-r border-slate-900 text-[10px] font-black text-center flex items-center justify-center italic">Nº</div>
                <div className="p-2 border-r border-slate-900 text-[12px] font-black text-center uppercase tracking-tighter flex items-center justify-center bg-slate-50">
                   {cls.name}
                </div>
                <div className="p-2 text-[12px] font-black text-center flex items-center justify-center lowercase tracking-tighter bg-slate-50">
                   {months[month].substring(0,3).toLowerCase()}/{year.toString().substring(2)}
                </div>
              </div>

              {/* Data Grid */}
              <div className="attendance-grid-container overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse border-[1.5px] border-slate-900">
                  <thead>
                    <tr>
                      <th className="w-[40px] border border-slate-900 p-1 text-[8px] font-black bg-slate-50 uppercase tracking-tighter"></th>
                      <th className="w-1/2 border border-slate-900 p-1 text-[8px] font-black bg-slate-50 uppercase tracking-tighter">Nome do Aluno</th>
                      {daysInMonth.map(d => (
                        <th key={d} className="border border-slate-900 p-0 text-[8px] font-black bg-slate-50 w-[20px] text-center">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="h-7">
                        <td className={cn("border border-slate-900 p-0 text-[10px] font-black text-center italic", s.status === 'Transferido' && "text-rose-600")}>{s.number}</td>
                        <td className={cn(
                          "border border-slate-900 px-2 py-0 text-[9px] font-black uppercase truncate whitespace-nowrap overflow-hidden max-w-[200px]",
                          s.status === 'Transferido' && "text-rose-600"
                        )}>{s.name}</td>
                        {daysInMonth.map(d => (
                          <td key={d} className="border border-slate-900 p-0 w-[20px]"></td>
                        ))}
                      </tr>
                    ))}
                    {/* Fill empty rows to 25 if needed for layout consistency */}
                    {Array.from({ length: Math.max(0, 25 - students.length) }).map((_, i) => (
                      <tr key={`empty-${i}`} className="h-7">
                        <td className="border border-slate-900"></td>
                        <td className="border border-slate-900"></td>
                        {daysInMonth.map(d => (
                          <td key={d} className="border border-slate-900 p-0 w-[20px]"></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {selectedClassIds.length === 0 && (
        <div className="bg-white p-20 rounded-3xl text-center border-2 border-dashed border-slate-200 no-print">
           <ClipboardList className="w-16 h-16 text-slate-100 mx-auto mb-6" />
           <p className="text-slate-400 font-black uppercase tracking-widest italic text-xs">Selecione uma ou mais turmas para gerar as listas.</p>
        </div>
      )}
    </div>
  );
}

const TransfersView = ({ db, setDb }: { db: AppData, setDb: (d: AppData) => void }) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');

  const selectedStudent = db.students.find(s => s.id === selectedStudentId);

  const handleTransfer = () => {
    if (!selectedStudentId || !targetClassId) return;

    const newDb = { ...db };
    const studentIdx = newDb.students.findIndex(s => s.id === selectedStudentId);
    if (studentIdx !== -1) {
      newDb.students[studentIdx] = { 
        ...newDb.students[studentIdx], 
        classId: targetClassId,
        observations: (newDb.students[studentIdx].observations || '') + `\nTransferido em ${new Date().toLocaleDateString('pt-BR')}`
      };
      saveDb(newDb);
      setDb(newDb);
      setSelectedStudentId('');
      setTargetClassId('');
      alert('Transferência realizada com sucesso!');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 max-w-2xl mx-auto overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="text-center mb-8">
           <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Manejo de Alunos</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Transferências e Relocação</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Aluno Alvo</label>
            <select 
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-bold text-slate-700 transition-all shadow-sm"
            >
              <option value="">Selecione para transferir...</option>
              {db.students.filter(s => s.status === 'Ativo').sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                <option key={s.id} value={s.id}>{s.name} (RA: {s.ra}-{s.digit})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-center flex-col items-center gap-3">
            <div className={cn(
              "p-4 rounded-full transition-all duration-500",
              selectedStudent ? "bg-indigo-600 text-white shadow-lg rotate-0" : "bg-slate-100 text-slate-300 rotate-180"
            )}>
               <ArrowRightLeft className="w-8 h-8" />
            </div>
            {selectedStudent && (
              <div className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                 <School className="w-3 h-3" />
                 Atual: {db.classes.find(c => c.id === selectedStudent.classId)?.name}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Destino Final</label>
            <select 
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-bold text-slate-700 transition-all shadow-sm"
            >
              <option value="">Selecione a nova turma...</option>
              {db.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <button 
            onClick={handleTransfer}
            disabled={!selectedStudentId || !targetClassId}
            className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-200 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl uppercase tracking-[0.2em] text-sm mt-4"
          >
            Efetuar Transferência
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportsView({ db }: { db: AppData }) {
  const [reportType, setReportType] = useState<'vacancies' | 'attendance' | null>(null);
  const [oficioNumber, setOficioNumber] = useState('');

  const vacancyData = useMemo(() => {
    const grades = Array.from(new Set(db.classes.map(c => c.grade))).sort();
    return grades.map(grade => {
      const classesInGrade = db.classes.filter(c => c.grade === grade);
      const activeStudentsInGrade = db.students.filter(s => {
        const cls = db.classes.find(c => c.id === s.classId);
        return cls?.grade === grade && s.status === 'Ativo';
      });

      const totalCapacity = classesInGrade.length * 25;
      const totalVacancies = Math.max(0, totalCapacity - activeStudentsInGrade.length);

      return {
        grade,
        vacancies: totalVacancies
      };
    });
  }, [db.classes, db.students]);

  const currentDateDay = new Date().getDate().toString().padStart(2, '0');
  const currentDateMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
  const currentDateYear = new Date().getFullYear();

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <button 
          onClick={() => setReportType('vacancies')}
          className={cn(
            "p-8 bg-white rounded-[2.5rem] border transition-all group flex flex-col items-center gap-4",
            reportType === 'vacancies' ? "border-indigo-600 shadow-xl" : "border-slate-200 shadow-sm hover:shadow-lg"
          )}
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <School className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Central de Vagas</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Informar saldo à Secretaria da Educação</p>
          </div>
        </button>

        <button 
          onClick={() => setReportType('attendance')}
          className={cn(
            "p-8 bg-white rounded-[2.5rem] border transition-all group flex flex-col items-center gap-4",
            reportType === 'attendance' ? "border-indigo-600 shadow-xl" : "border-slate-200 shadow-sm hover:shadow-lg"
          )}
        >
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
            <ClipboardList className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Diário / Chamada</h3>
            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">Gerar listas de frequência por turma</p>
          </div>
        </button>
      </div>

      {reportType === 'attendance' && <AttendanceView db={db} />}

      {reportType === 'vacancies' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm no-print">
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="flex-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Número do Ofício</label>
                 <input 
                   type="text"
                   placeholder="Ex: 201/2026"
                   value={oficioNumber}
                   onChange={e => setOficioNumber(e.target.value)}
                   className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-300 outline-none"
                 />
               </div>
               <button 
                 onClick={() => generateVacancyDocx(oficioNumber, vacancyData, currentDateDay, currentDateMonth, currentDateYear)}
                 disabled={!oficioNumber}
                 className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all flex items-center gap-3"
               >
                 <FileText className="w-5 h-5" />
                 Exportar para Word (.docx)
               </button>
            </div>
          </div>

          <div className="bg-white p-[1.5cm] shadow-2xl rounded-sm border border-slate-200 max-w-[21cm] mx-auto print:shadow-none print:border-none print:m-0 print:w-full print:p-0 font-serif">
            {/* Real Header Layout */}
            <div className="flex flex-col items-center mb-10 text-[#2c3e50]">
              <div className="w-24 h-24 mb-6 relative">
                 <div className="absolute inset-0 bg-slate-50 rounded-full flex items-center justify-center opacity-20">
                   <Shield className="w-16 h-16 text-indigo-900" />
                 </div>
                 {/* This represents the municipality logo from user image */}
                 <div className="w-full h-full border-2 border-indigo-900/10 rounded-full flex items-center justify-center">
                    <School className="w-12 h-12 text-indigo-900" />
                 </div>
              </div>
              <h1 className="text-2xl font-bold tracking-[0.05em] text-center leading-tight">MUNICÍPIO TEODORO SAMPAIO</h1>
              <h2 className="text-lg font-bold tracking-[0.05em] text-center leading-tight">SECRETARIA MUNICIPAL DE EDUCAÇÃO</h2>
              <h3 className="text-base font-bold tracking-[0.05em] text-center leading-tight">EMEF PEDRO CAMINOTO</h3>
            </div>

            <div className="flex justify-end mb-16">
              <p className="text-base font-medium">Teodoro Sampaio, {currentDateDay} de {currentDateMonth} de {currentDateYear}.</p>
            </div>

            <div className="space-y-8 text-black leading-relaxed px-4">
              <div>
                <p className="font-bold text-lg">OFÍCIO INTERNO Nº {oficioNumber || '___/____'}</p>
              </div>

              <div className="space-y-4">
                <p className="font-bold whitespace-pre-wrap">Teodoro Sampaio, {currentDateDay} de {currentDateMonth} de {currentDateYear}.</p>
                <div className="space-y-1">
                   <p className="font-bold">Para: SEDUC</p>
                   <p className="font-bold">Assunto: Central de Vagas</p>
                </div>
              </div>

              <p className="font-bold mt-10">Prezados,</p>

              <p className="font-medium text-justify">
                Sirvo-me do presente para encaminhar as vagas da Unidade Escolar:
              </p>

              <table className="w-full border border-black border-collapse mt-6">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-black px-6 py-2 font-bold uppercase text-center w-1/2">SÉRIE</th>
                    <th className="border border-black px-6 py-2 font-bold uppercase text-center w-1/2">QUANTIDADE DE VAGAS</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {vacancyData.sort((a,b) => a.grade.localeCompare(b.grade)).map((v, i) => (
                    <tr key={i}>
                      <td className="border border-black px-6 py-3 text-center">{v.grade}</td>
                      <td className="border border-black px-6 py-3 text-center">{v.vacancies.toString().padStart(2, '0')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-32 flex flex-col items-center">
                 <div className="w-80 border-t border-black mb-1"></div>
                 <p className="font-bold text-center">Daiane Cristina de Oliveira Navarro</p>
                 <p className="text-sm font-medium text-center">Coordenadora Pedagógica</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function RegistryView({ db, setDb }: { db: AppData, setDb: (d: AppData) => void }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<RMType | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const filtered = useMemo(() => {
    return db.rmRegistry
      .filter(r => {
        const matchesSearch = r.studentName.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === 'all' || r.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => b.rmNumber - a.rmNumber);
  }, [db.rmRegistry, search, filterType]);

  const handleStartEdit = (record: RMRecord) => {
    setEditingId(record.id);
    setEditValue(record.rmNumber.toString());
  };

  const handleSaveEdit = (record: RMRecord) => {
    const newNum = parseInt(editValue);
    if (isNaN(newNum)) return setEditingId(null);

    const newDb = { ...db, rmRegistry: [...db.rmRegistry] };
    const idx = newDb.rmRegistry.findIndex(r => r.id === record.id);
    if (idx !== -1) {
      newDb.rmRegistry[idx] = { ...newDb.rmRegistry[idx], rmNumber: newNum };
      saveDb(newDb);
      setDb(newDb);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center no-print">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar por nome no RM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-300 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setFilterType('all')}
            className={cn("flex-1 md:flex-none px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'all' ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilterType('Pre-2018')}
            className={cn("flex-1 md:flex-none px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'Pre-2018' ? "bg-orange-50 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
          >
            Antigos (Pré-2018)
          </button>
          <button 
            onClick={() => setFilterType('Post-2018')}
            className={cn("flex-1 md:flex-none px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all", filterType === 'Post-2018' ? "bg-emerald-600 text-white shadow-lg" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
          >
            Novos (Pós-2018)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center no-print">
          <h2 className="font-black text-slate-700 uppercase tracking-tight">Livro de Registro de Matrícula (RM)</h2>
          <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full uppercase">
            {filtered.length} Registros Encontrados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">RM Nº</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Nome do Aluno</th>
                <th className="px-6 py-4 text-right">Data de Nasc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    {editingId === r.id ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          value={editValue} 
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(r)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit(r)}
                          autoFocus
                          className="w-20 px-2 py-1 bg-white border border-indigo-300 rounded font-black text-slate-800 italic"
                        />
                      </div>
                    ) : (
                      <span 
                        onClick={() => handleStartEdit(r)}
                        className="text-xl font-black text-slate-800 tracking-tighter italic cursor-pointer hover:text-indigo-600 transition-colors"
                      >
                        #{r.rmNumber}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-1 rounded-lg border shadow-sm",
                      r.type === 'Pre-2018' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {r.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black uppercase text-slate-700">{r.studentName}</td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-400">{r.birthDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-20 text-center">
              <Hash className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Nenhum registro encontrado no livro de RM...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NewStudentModal({ db, onClose, onSave }: { db: AppData, onClose: () => void, onSave: (d: AppData) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    ra: '',
    digit: '',
    uf: 'SP',
    birthDate: '',
    classId: '',
    number: '',
    assignRM: false,
    rmType: 'Post-2018' as RMType
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.classId) return alert('Favor preencher o nome e selecionar a turma.');

    const newDb = { ...db, students: [...db.students], rmRegistry: [...db.rmRegistry] };
    const studentId = formData.ra ? `${formData.ra}-${formData.digit}` : `TEMP-${Date.now()}`;
    
    if (formData.ra && newDb.students.some(s => s.id === studentId)) {
      return alert('Este RA já está cadastrado no sistema.');
    }

    const newStudent: Student = {
      id: studentId,
      name: formData.name,
      ra: formData.ra,
      digit: formData.digit,
      uf: formData.uf,
      birthDate: formData.birthDate,
      classId: formData.classId,
      number: parseInt(formData.number) || 0,
      status: 'Ativo',
    };

    newDb.students.push(newStudent);

    if (formData.assignRM) {
      const type = formData.rmType;
      const typeRms = newDb.rmRegistry.filter(r => r.type === type);
      const nextNum = typeRms.length > 0
        ? Math.max(...typeRms.map(r => r.rmNumber)) + 1
        : 1;

      newDb.rmRegistry.push({
        id: `RM-${Date.now()}`,
        rmNumber: nextNum,
        type: type,
        studentName: formData.name,
        ra: formData.ra ? `${formData.ra}-${formData.digit}` : undefined,
        birthDate: formData.birthDate || new Date().toLocaleDateString('pt-BR')
      });
    }

    onSave(newDb);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-slate-200"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6">
          <div className="flex justify-between items-center mb-4">
             <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic leading-none">Nova Matrícula</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Cadastro manual de aluno</p>
             </div>
             <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
               <LogOut className="w-6 h-6" />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome Completo</label>
              <input 
                required
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-bold text-slate-700"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">RA / Dig / UF</label>
              <div className="flex gap-2">
                <input 
                  placeholder="RA"
                  className="flex-1 px-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-sm"
                  value={formData.ra}
                  onChange={e => setFormData({...formData, ra: e.target.value})}
                />
                <input 
                  placeholder="X"
                  maxLength={1}
                  className="w-12 px-2 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-center"
                  value={formData.digit}
                  onChange={e => setFormData({...formData, digit: e.target.value.toUpperCase()})}
                />
                <input 
                  placeholder="SP"
                  maxLength={2}
                  className="w-16 px-2 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-mono text-center"
                  value={formData.uf}
                  onChange={e => setFormData({...formData, uf: e.target.value.toUpperCase()})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Turma Alvo</label>
              <select 
                required
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-300 font-bold text-slate-700"
                value={formData.classId}
                onChange={e => setFormData({...formData, classId: e.target.value})}
              >
                <option value="">Selecionar Turma...</option>
                {db.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight flex items-center gap-2">
                     <Hash className="w-4 h-4 text-indigo-500" />
                     Atribuir Número de RM?
                   </h3>
                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">Gerar número sequencial no livro de registros</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, assignRM: !formData.assignRM})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative outline-none",
                    formData.assignRM ? "bg-indigo-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", formData.assignRM ? "left-7" : "left-1")} />
                </button>
             </div>

             {formData.assignRM && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, rmType: 'Pre-2018'})}
                     className={cn("p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all", formData.rmType === 'Pre-2018' ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}
                   >
                     Antigo (Pré-2018)
                   </button>
                   <button 
                     type="button"
                     onClick={() => setFormData({...formData, rmType: 'Post-2018'})}
                     className={cn("p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all", formData.rmType === 'Post-2018' ? "bg-emerald-50 border-emerald-500 text-emerald-600 border-emerald-200 shadow-sm" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50")}
                   >
                     Novo (Pós-2018)
                   </button>
                </div>
             )}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-200 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black shadow-xl transition-all active:scale-95"
            >
              Confirmar Cadastro
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function ManagementView({ db, setDb }: { db: AppData, setDb: (d: AppData) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const inactiveStudents = useMemo(() => {
    let result = db.students.filter(s => s.status === 'Inativo' || s.status === 'Abandono');
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(term) || s.ra.includes(term));
    }
    return result;
  }, [db.students, searchTerm]);

  const reactivateStudent = (id: string) => {
    const newDb = { ...db, students: [...db.students] };
    const idx = newDb.students.findIndex(s => s.id === id);
    if (idx !== -1) {
      newDb.students[idx] = { 
        ...newDb.students[idx], 
        status: 'Ativo',
        statusDate: undefined
      };
      saveDb(newDb);
      setDb(newDb);
    }
  };

  const deleteStudent = (id: string) => {
    if (!confirm('Deseja realmente apagar este aluno permanentemente? Esta ação não pode ser desfeita.')) return;
    const newDb = { ...db };
    newDb.students = newDb.students.filter(s => s.id !== id);
    saveDb(newDb);
    setDb(newDb);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic mb-4 text-center md:text-left">Gerenciamento Administrativo</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Pesquisar inativos por Nome ou RA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-100 border-b border-slate-200">
           <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alunos Inativos / Abandono</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Nome do Aluno</th>
                <th className="px-6 py-4">Status / Data</th>
                <th className="px-6 py-4 text-right">Ações de Gerenciamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inactiveStudents.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{s.name}</p>
                    <p className="font-mono text-[10px] text-indigo-400 font-bold">{s.ra}-{s.digit} {s.uf}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border w-fit shadow-sm",
                        s.status === 'Inativo' ? "bg-slate-100 text-slate-600 border-slate-200" : "bg-orange-100 text-orange-600 border-orange-200"
                      )}>
                        {s.status}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold italic mt-1">Sinalizado em: {s.statusDate || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => reactivateStudent(s.id)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Reativar
                      </button>
                      <button 
                        onClick={() => deleteStudent(s.id)}
                        className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase hover:bg-rose-600 transition-all flex items-center gap-2 shadow-lg shadow-rose-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Excluir Aluno
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {inactiveStudents.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Shield className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em] italic">O banco de dados de inativos está vazio.</p>
          </div>
        )}
      </div>
    </div>
  );
}
