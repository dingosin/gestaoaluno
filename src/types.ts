export type StudentStatus = 'Ativo' | 'Inativo' | 'Abandono' | 'Transferido';

export interface SchoolClass {
  id: string; // Codigo Turma
  schoolName: string;
  educationType: string;
  grade: string;
  name: string; // Turma (e.g., 6° ANO A)
  capacity: number;
  year: string;
}

export interface Student {
  id: string; // RA-Dig (Composite)
  ra: string;
  digit: string;
  uf: string;
  name: string;
  birthDate: string;
  number: number; // Nº na chamada
  classId: string;
  status: StudentStatus;
  statusDate?: string;
  observations?: string;
}

export type RMType = 'Pre-2018' | 'Post-2018';

export interface RMRecord {
  id: string;
  rmNumber: number;
  type: RMType;
  studentName: string;
  ra?: string;
  birthDate: string;
}

export interface AppData {
  classes: SchoolClass[];
  students: Student[];
  rmRegistry: RMRecord[];
}
