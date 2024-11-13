import React, { useState, useEffect } from 'react';
import './App.css';

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
  const [sheetData, setSheetData] = useState<string[][]>([]);

  useEffect(() => {
    if (selectedSheet) {
      fetchSheetData(selectedSheet.title + "!A1:Z1000");
    }
  }, [selectedSheet]);

  const fetchSheetData = async (range: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/obter-planilha?aba=${range}`);
      const result = await response.json();
      if (response.ok) {
        const valores = result.valores;

        if (selectedSheet?.title === "Base Municípios") {
          const header = valores[0];
          const grupoIndex = header.indexOf("GRUPO");

          // Remove a coluna "GRUPO" existente, se houver, e adiciona calculada
          if (grupoIndex > -1) {
            header.splice(grupoIndex, 1);
            for (let i = 1; i < valores.length; i++) {
              valores[i].splice(grupoIndex, 1);
            }
          }

          const updatedData = valores.map((row: string[], index: number) => {
            if (index === 0) {
              return [...row, "GRUPO"];
            } else {
              const grupo = calculateGroup(row);
              return [...row, grupo];
            }
          });
          setSheetData(updatedData);
        } else {
          setSheetData(valores); 
        }
      } else {
        alert("Erro ao obter dados da planilha: " + result.detail);
      }
    } catch (error) {
      alert("Erro ao obter dados da planilha: " + error);
    }
  };

  const calculateGroup = (row: string[]): string => {
    const cfc = row[2];
    const clinica = row[3];
    const postoDetran = row[4];

    if (cfc === "S" && clinica === "S" && postoDetran === "S") {
      return "GRUPO 1";
    } else if (cfc === "N" && clinica === "N" && postoDetran === "N") {
      return "GRUPO 3";
    } else {
      return "GRUPO 2";
    }
  };

  const handleSheetSelect = (sheet: Sheet) => {
    setSelectedSheet(sheet);
  };

  const addBlankRow = () => {
    if (sheetData.length > 0) {
      const blankRow = new Array(sheetData[0].length).fill("");
      setSheetData([...sheetData, blankRow]);
    } else {
      alert("A planilha selecionada não contém dados iniciais para determinar o número de colunas.");
    }
  };

  const handleInputChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newSheetData = [...sheetData];
    newSheetData[rowIndex][cellIndex] = value;

    // Atualiza o grupo com base nos valores das colunas CFC, CLÍNICA e POSTO DETRAN
    if (cellIndex === 2 || cellIndex === 3 || cellIndex === 4) {
      const cfc = newSheetData[rowIndex][2];
      const clinica = newSheetData[rowIndex][3];
      const postoDetran = newSheetData[rowIndex][4];

      if (cfc === "S" && clinica === "S" && postoDetran === "S") {
        newSheetData[rowIndex][5] = "GRUPO 1";
      } else if (cfc === "N" && clinica === "N" && postoDetran === "N") {
        newSheetData[rowIndex][5] = "GRUPO 3";
      } else {
        newSheetData[rowIndex][5] = "GRUPO 2";
      }
    }

    setSheetData(newSheetData);
  };

  const saveChanges = async () => {
    if (!selectedSheet) {
      alert("Selecione uma planilha primeiro!");
      return;
    }

    const data = {
      aba: selectedSheet.title + "!A1",
      valores: sheetData
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/atualizar-planilha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (response.ok) {
        alert("Alterações salvas com sucesso!");
      } else {
        alert("Erro ao salvar alterações: " + result.detail);
      }
    } catch (error) {
      if (error instanceof Error) {
        alert("Erro ao salvar alterações: " + error.message);
      } else {
        alert("Erro desconhecido ao salvar alterações");
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>CNH Popular</h1>
      </header>
      <main>
        {/* Botões para selecionar cada planilha */}
        <div className="button-container">
          {sheets.map((sheet, index) => (
            <button
              key={index}
              onClick={() => handleSheetSelect(sheet)}
              style={{
                backgroundColor: selectedSheet?.title === sheet.title ? "#387c5c" : "",
                color: selectedSheet?.title === sheet.title ? "white" : "",
              }}
            >
              {sheet.title}
            </button>
          ))}
          <button onClick={saveChanges}>Salvar alterações</button>
        </div>

        {/* Botão para adicionar linha em branco */}
        <div className="add-blank-field-container">
          <button onClick={addBlankRow}>Adicionar Linha em Branco</button>
        </div>

        {/* Renderiza os dados da planilha */}
        <div className="sheet-data-container">
          {sheetData.length > 0 ? (
            <table>
              <thead>
                <tr>
                  {sheetData[0].map((header, index) => (
                    <th key={index}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleInputChange(rowIndex + 1, cellIndex, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Selecione uma planilha para visualizar.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
