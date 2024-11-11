import React, { useState } from 'react';
import './App.css';
import SheetViewer from './SheetViewer';

interface Sheet {
  url: string;
  title: string;
}

const App: React.FC = () => {
  const sheets: Sheet[] = [
    { url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=0", title: "Base Municípios" },
    { url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=372158301", title: "Base de Dados" },
    { url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=1897837305", title: "Usuários" },
    { url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=75694551", title: "Regionais" },
    { url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=898988254", title: "Fases Contratação" }
  ];

  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);

  const handleSheetSelect = (sheet: Sheet) => {
    setSelectedSheet(sheet);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CNH Popular 2023</h1>
      </header>
      <main>
        {/* Renderiza botões para selecionar cada planilha */}
        <div>
          {sheets.map((sheet, index) => (
            <button key={index} onClick={() => handleSheetSelect(sheet)}>
              {sheet.title}
            </button>
          ))}
        </div>

        {/* Renderiza o componente SheetViewer para a planilha selecionada */}
        {selectedSheet ? (
          <SheetViewer url={selectedSheet.url} title={selectedSheet.title} />
        ) : (
          <p>Selecione uma planilha para visualizar.</p>
        )}
      </main>
    </div>
  );
}

export default App;
