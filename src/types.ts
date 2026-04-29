export type StudentStatus = 'Ativo' | 'Inativo' | 'Abandono' | 'Transferido' | 'Remanejado';

export interface WaitlistEntry {
  id: string;
  studentName: string;
  ra: string;
  grade: string;
  currentPeriod: string;
  targetPeriod: string;
  requestDate: string;
  status: 'Pendente' | 'Concluído' | 'Cancelado';
  observations?: string;
}

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
  id: string; // Composite ID
  ra: string; // Merged RA + Digit (e.g. 12345678X)
  uf: string;
  name: string;
  birthDate: string;
  motherName?: string;
  cpf?: string;
  rg?: string;
  susCard?: string;
  address?: string;
  phone?: string;
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
  transferWaitlist: WaitlistEntry[];
  adminPassword?: string;
}
