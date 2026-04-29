import { AppData } from '../types';

const STORAGE_KEY = 'gestao_escolar_db';

const INITIAL_DATA: AppData = {
  classes: [],
  students: [],
  rmRegistry: [],
};

export const getDb = (): AppData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return INITIAL_DATA;
  try {
    const parsed = JSON.parse(data);
    return {
      ...INITIAL_DATA,
      ...parsed,
      rmRegistry: parsed.rmRegistry || []
    };
  } catch (e) {
    return INITIAL_DATA;
  }
};

export const saveDb = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearDb = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
};
