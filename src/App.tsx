import React, { useState, useEffect } from "react";
import "./App.css";
import Login from "./Login";
import CadastroCFC from "./CadastroCFC";
import CadastroClinicas from "./CadastroClinicas";
import CadastroPostoDetran from "./CadastroPostoDetran";
import BaseDeDados from "./BaseDeDados";

interface Sheet {
  url: string;
  title: string;
}

const App: React.FC = () => {
  const sheets: Sheet[] = [
    {
      url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=1897837305",
      title: "Usuários",
    },
    {
      url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=426264755",
      title: "Cadastro CFC",
    },
    {
      url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=75694551",
      title: "Cadastro Clínicas",
    },
    {
      url: "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=1219973305",
      title: "Cadastro Posto Detran",
    },
    { url: "", title: "Base de Dados" },
  ];

  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("isLoggedIn");
    return saved === "true";
  });
  const [selectedSheet, setSelectedSheet] = useState<Sheet | null>(null);
  const [sheetData, setSheetData] = useState<string[][]>([]);
  const [sidebarClass, setSidebarClass] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("Login");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [role, setRole] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const fetchSheetData = async (range: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/obter-planilha?aba=${range}`
      );
      const result = await response.json();
      if (response.ok) {
        setSheetData(result.valores);
        setColumnWidths(new Array(result.valores[0]?.length || 0).fill(150)); // Inicializa larguras de coluna
      } else {
        alert("Erro ao obter dados da planilha: " + result.detail);
      }
    } catch (error) {
      alert("Erro ao obter dados da planilha: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveChanges = async () => {
    if (!selectedSheet) {
      alert("Selecione uma planilha primeiro!");
      return;
    }

    setIsLoading(true);
    const data = {
      aba: selectedSheet.title + "!A1",
      valores: sheetData,
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Alterações salvas com sucesso!");
      } else {
        alert("Erro ao salvar alterações: " + result.detail);
      }
    } catch (error) {
      alert("Erro ao salvar alterações: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetSelect = (sheet: Sheet | null) => {
    if (sheet) {
      setSelectedSheet(sheet);
      if (sheet.title !== "Base de Dados") {
        fetchSheetData(sheet.title + "!A1:Z100000");
      }
    }
    setSelectedPage(sheet?.title || "Login");
  };

  const addBlankRow = () => {
    if (sheetData.length > 0) {
      const blankRow = new Array(sheetData[0].length).fill("");
      setSheetData([...sheetData, blankRow]);
    } else {
      alert(
        "A planilha selecionada não contém dados iniciais para determinar o número de colunas."
      );
    }
  };

  const handleInputChange = (
    rowIndex: number,
    cellIndex: number,
    value: string
  ) => {
    const newSheetData = [...sheetData];
    newSheetData[rowIndex][cellIndex] = value;
    setSheetData(newSheetData);
  };

  const handleResize = (
    index: number,
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    const startX = e.clientX;
    const startWidth = columnWidths[index] || 150;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const updatedWidths = [...columnWidths];
      updatedWidths[index] = Math.max(newWidth, 50);
      setColumnWidths(updatedWidths);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleLoginSuccess = (userRole: string, userEmail: string) => {
    setIsLoggedIn(true);
    setRole(userRole);
    setEmail(userEmail);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("role", userRole);
    localStorage.setItem("email", userEmail);
    setSelectedPage("");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedSheet(null);
    setSheetData([]);
    setSidebarClass("");
    setRole("");
    setEmail("");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setSelectedPage("Login");
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newSheetData = [...sheetData];
    newSheetData.splice(rowIndex, 1);
    setSheetData(newSheetData);
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    const savedEmail = localStorage.getItem("email");
    if (savedRole) {
      setRole(savedRole);
    }
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>CNH Popular</h1>
        <div className="user-info">
          <div className="user-data">
            <p>{email}</p>
            <p>{role}</p>
          </div>
          {isLoggedIn && (
            <button className="logout-button" onClick={handleLogout}>
              Sair
            </button>
          )}
        </div>
      </header>

      <main className="main">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-circle"></div>
          </div>
        ) : !isLoggedIn ? (
          <Login
            onLoginSuccess={(role, email) => handleLoginSuccess(role, email)}
          />
        ) : (
          <div className="main-content">
            <div className="sidebar">
              {sheets
                .filter((sheet) => {
                  if (role === "Admin") {
                    return true;
                  } else if (role === "Nucon" || role === "Dihab") {
                    return (
                      sheet.title === "Cadastro Clínicas" ||
                      sheet.title === "Cadastro CFC" ||
                      sheet.title === "Base de Dados"
                    );
                  }
                  return false;
                })
                .map((sheet, index) => (
                  <button
                    key={index}
                    onClick={() => handleSheetSelect(sheet)}
                    className={selectedPage === sheet.title ? "selected" : ""}
                  >
                    {sheet.title}
                  </button>
                ))}
            </div>

            <div className="content">
              {selectedPage === "Usuários" && (
                <div className="usuarios">
                  <div className="button-container">
                    <button onClick={saveChanges}>Salvar alterações</button>
                  </div>
                  <table className="base-dados-table">
                    <thead>
                      <tr>
                        {sheetData[0]?.map((header, index) => (
                          <th
                            key={index}
                            style={{
                              width: columnWidths[index] || "150px",
                              position: "relative",
                            }}
                          >
                            {header}
                            <div
                              className="resizer"
                              onMouseDown={(e) => handleResize(index, e)}
                            ></div>
                          </th>
                        ))}
                        <th>Ações</th>
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
                                onChange={(e) =>
                                  handleInputChange(
                                    rowIndex + 1,
                                    cellIndex,
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                          ))}
                          <td>
                            <button
                              onClick={() => handleDeleteRow(rowIndex + 1)}
                              className="btn excluir"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="add-row-button" onClick={addBlankRow}>
                    +
                  </button>
                </div>
              )}
              {selectedPage === "Cadastro CFC" && <CadastroCFC />}
              {selectedPage === "Cadastro Clínicas" && <CadastroClinicas />}
              {selectedPage === "Cadastro Posto Detran" && (
                <CadastroPostoDetran />
              )}
              {selectedPage === "Base de Dados" && <BaseDeDados />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
