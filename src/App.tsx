import React, { useState, useEffect } from 'react';
import './App.css';

interface Sheet {
  url: string;
  title: string;
}

const App: React.FC = () => {
  const sheets: Sheet[] = [
    { url: ": "Base Municípios" },
    { url: "", title: "Base de Dados" },
    { url: "", title: "Usuários" },
    { url: "", title: "Regionais" },
    { url: "", title: "Fases Contratação" }
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
        setSheetData(result.valores);
      } else {
        alert("Erro ao obter dados da planilha: " + result.detail);
      }
    } catch (error) {
      if (error instanceof Error) {
        alert("Erro ao obter dados da planilha: " + error.message);
      } else {
        alert("Erro desconhecido ao obter dados da planilha");
      }
    }
  };

  const handleSheetSelect = (sheet: Sheet) => {
    setSelectedSheet(sheet);
  };

  const addBlankRow = () => {
    // Adiciona uma linha em branco baseada no número de colunas da primeira linha existente
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
            <button key={index} onClick={() => handleSheetSelect(sheet)}>
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
              <tbody>
                {sheetData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleInputChange(rowIndex, cellIndex, e.target.value)}
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
