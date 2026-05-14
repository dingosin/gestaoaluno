import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableCell, 
  TableRow, 
  WidthType, 
  AlignmentType, 
  TextRun, 
  BorderStyle,
  VerticalAlign,
  Header,
  SectionType,
  PageOrientation
} from 'docx';
import { saveAs } from 'file-saver';
import { SchoolClass, Student } from '../types';

export const generateAttendanceDocx = async (
  cls: SchoolClass, 
  students: Student[], 
  days: number[], 
  monthName: string, 
  year: number
) => {
  const tableHeader = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "Nº", alignment: AlignmentType.CENTER, style: "HeaderStyle" })],
        width: { size: 567, type: WidthType.DXA }, // 1cm
      }),
      new TableCell({
        children: [new Paragraph({ text: "Nome do Aluno", alignment: AlignmentType.CENTER, style: "HeaderStyle" })],
        width: { size: 6354, type: WidthType.DXA }, // remaining
      }),
      ...days.map(d => new TableCell({
        children: [new Paragraph({ text: d.toString(), alignment: AlignmentType.CENTER, style: "HeaderStyle" })],
        width: { size: 227, type: WidthType.DXA }, // 0.4cm
      }))
    ],
  });

  const studentRows = students.map(s => {
    const isSpecial = s.status !== 'Ativo';
    const textColor = isSpecial ? "e11d48" : "000000"; // rose-600

    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ 
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: s.number.toString(), color: textColor, italics: true })]
          })],
          width: { size: 567, type: WidthType.DXA },
        }),
        new TableCell({
          children: [new Paragraph({ 
            children: [new TextRun({ text: s.name.toUpperCase(), color: textColor, bold: true })]
          })],
          width: { size: 6354, type: WidthType.DXA },
        }),
        ...days.map(() => new TableCell({ 
          children: [],
          width: { size: 227, type: WidthType.DXA },
        }))
      ],
    });
  });

  // Add empty rows up to 25
  const emptyRowsCount = Math.max(0, 25 - students.length);
  const emptyRows = Array.from({ length: emptyRowsCount }).map(() => {
    return new TableRow({
      children: [
        new TableCell({ 
          children: [],
          width: { size: 567, type: WidthType.DXA },
        }),
        new TableCell({ 
          children: [],
          width: { size: 6354, type: WidthType.DXA },
        }),
        ...days.map(() => new TableCell({ 
          children: [],
          width: { size: 227, type: WidthType.DXA },
        }))
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeader, ...studentRows, ...emptyRows],
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.LANDSCAPE,
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${cls.name} - ${monthName}/${year}`,
                  bold: true,
                  size: 24,
                }),
              ],
            }),
          ],
        }),
      },
      children: [table],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lista_de_Chamada_${cls.name}_${monthName}.docx`);
};

export const generateVacancyDocx = async (
  oficioNumber: string,
  vacancyData: { grade: string, vacancies: number }[],
  currentDateDay: string,
  currentDateMonth: string,
  currentDateYear: number
) => {
  const tableHeader = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "SÉRIE", bold: true })]
        })],
        shading: { fill: "f8fafc" },
      }),
      new TableCell({
        children: [new Paragraph({ 
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "QUANTIDADE DE VAGAS", bold: true })]
        })],
        shading: { fill: "f8fafc" },
      }),
    ],
  });

  const dataRows = vacancyData.map(v => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ text: v.grade.toUpperCase(), alignment: AlignmentType.CENTER })],
        }),
        new TableCell({
          children: [new Paragraph({ 
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: v.vacancies.toString().padStart(2, '0'), bold: true })]
          })],
        }),
      ],
    });
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [tableHeader, ...dataRows],
  });

  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "MUNICÍPIO TEODORO SAMPAIO", bold: true, size: 28 }),
            new TextRun({ break: 1, text: "SECRETARIA MUNICIPAL DE EDUCAÇÃO", bold: true, size: 24 }),
            new TextRun({ break: 1, text: "EMEF PEDRO CAMINOTO", bold: true, size: 20 }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: `Teodoro Sampaio, ${currentDateDay} de ${currentDateMonth} de ${currentDateYear}.` }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Paragraph({
          children: [
            new TextRun({ text: `OFÍCIO INTERNO Nº ${oficioNumber}`, bold: true, size: 24 }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),
        new Paragraph({
          children: [
            new TextRun({ text: "Para: SEDUC", bold: true }),
            new TextRun({ break: 1, text: "Assunto: Central de Vagas", bold: true }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 400 } }),
        new Paragraph({
          children: [
            new TextRun({ text: "Prezados,", bold: true }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Sirvo-me do presente para encaminhar as vagas da Unidade Escolar:", break: 1 }),
          ],
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),
        table,
        new Paragraph({ text: "", spacing: { after: 1200 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "_________________________________________" }),
            new TextRun({ break: 1, text: "Daiane Cristina de Oliveira Navarro", bold: true }),
            new TextRun({ break: 1, text: "Coordenadora Pedagógica" }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `OficioVagas_${oficioNumber.replace('/', '_')}.docx`);
};
