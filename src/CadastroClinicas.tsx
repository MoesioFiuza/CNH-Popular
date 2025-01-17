import React, { useState, useEffect } from "react";
import "./CadastroClinicas.css";

// Definição da interface RegionalData para tipar os dados de município e regional
interface RegionalData {
  municipio: string;
  regional: string;
}

// Componente funcional CadastroClinicas
const CadastroClinicas: React.FC = () => {
  const [clinicasData, setClinicasData] = useState<string[][]>([
    ["", "", "", "", "", "", ""],
  ]);
  const [regionais, setRegionais] = useState<RegionalData[]>([]);
  const [columnWidths, setColumnWidths] = useState<number[]>(
    new Array(7).fill(120)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedRegional, setSelectedRegional] = useState<string>("");

  // Função para buscar os dados das clínicas
  const fetchClinicasData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/obter-planilha?aba=Cadastro Clínicas"
      );
      if (!response.ok) {
        throw new Error("Erro ao obter dados da planilha.");
      }
      const data = await response.json();
      if (data.status === "sucesso") {
        setClinicasData(data.valores);
      }
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar os dados das regionais a partir de um CSV externo
  const fetchRegionais = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://docs.google.com/spreadsheets/d/1L1uxINmH3tK8KK1W7VAoBP11bYd4ry_pPqj7xp2ImU8/export?format=csv&gid=75694551"
      );
      const csvText = await response.text();
      const rows = csvText.split("\n").slice(1);
      const parsedData: RegionalData[] = rows.map((row) => {
        const [municipio, regional] = row.split(",");
        return { municipio: municipio.trim(), regional: regional.trim() };
      });
      setRegionais(parsedData);
    } catch (error) {
      console.error("Erro ao carregar regionais:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    rowIndex: number,
    cellIndex: number,
    value: string
  ) => {
    const newData = [...clinicasData];
    newData[rowIndex][cellIndex] = value;

    if (cellIndex === 5) {
      const selectedRegional =
        regionais.find((r) => r.municipio === value)?.regional || "";
      newData[rowIndex][6] = selectedRegional;
    }

    setClinicasData(newData);
  };

  const addNewRow = () => {
    setClinicasData([...clinicasData, ["", "", "", "", "", "", ""]]);
    setSelectedCity("");
    setSelectedRegional("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/atualizar-planilha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aba: "Cadastro Clínicas",
          valores: clinicasData,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar os dados na planilha.");
      }

      const result = await response.json();
      console.log("Dados salvos com sucesso:", result);
      alert("Cadastro salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
      alert("Erro ao salvar os dados na planilha.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResize = (index: number, e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = columnWidths[index];

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

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
    setSelectedRegional("");
  };

  const handleRegionalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegional(e.target.value);
    setSelectedCity("");
  };

  const filteredData = clinicasData.filter((row) => {
    const isRowEmpty = row.every((cell) => cell === "");
    const cityMatches = selectedCity ? row[5] === selectedCity : true;
    const regionalMatches = selectedRegional
      ? regionais.find((regional) => regional.municipio === row[5])
          ?.regional === selectedRegional
      : true;
    return cityMatches && regionalMatches;
  });

  useEffect(() => {
    const fetchData = async () => {
      await fetchClinicasData();
      await fetchRegionais();
    };

    fetchData();
  }, []);

  return (
    <div className="cadastro-clinicas-container">
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-circle"></div>
        </div>
      ) : (
        <>
          <div className="filters">
            <select value={selectedCity} onChange={handleCityChange}>
              <option value="">Filtre por Cidade</option>
              {Array.from(new Set(clinicasData.map((row) => row[5])))
                .filter(Boolean)
                .map((city, index) => (
                  <option key={index} value={city}>
                    {city}
                  </option>
                ))}
            </select>
            <select value={selectedRegional} onChange={handleRegionalChange}>
              <option value="">Filtre por Regional</option>
              {Array.from(
                new Set(regionais.map((regional) => regional.regional))
              )
                .filter(Boolean)
                .map((regional, index) => (
                  <option key={index} value={regional}>
                    {regional}
                  </option>
                ))}
            </select>
          </div>
          <div className="row-count">
            Total de Clínicas Cadastradas: {filteredData.length}
          </div>
          <table className="base-dados-table">
            <thead>
              <tr>
                {[
                  "Nome da Clínica",
                  "Endereço",
                  "Telefone",
                  "Email",
                  "CNPJ",
                  "Município",
                  "Regional",
                ].map((header, index) => (
                  <th key={index} style={{ width: columnWidths[index] + "px" }}>
                    {header}
                    <div
                      className="resizer"
                      onMouseDown={(e) => handleResize(index, e)}
                    ></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>
                      {cellIndex === 5 ? (
                        <select
                          value={cell}
                          onChange={(e) =>
                            handleInputChange(
                              rowIndex,
                              cellIndex,
                              e.target.value
                            )
                          }
                        >
                          <option value="">Selecione um município</option>
                          {regionais.map((item, index) => (
                            <option key={index} value={item.municipio}>
                              {item.municipio}
                            </option>
                          ))}
                        </select>
                      ) : cellIndex === 6 ? (
                        <input type="text" value={cell} readOnly />
                      ) : (
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) =>
                            handleInputChange(
                              rowIndex,
                              cellIndex,
                              e.target.value
                            )
                          }
                          placeholder={
                            [
                              "Nome",
                              "Endereço",
                              "Telefone",
                              "Email",
                              "CNPJ",
                              "Município",
                              "Regional",
                            ][cellIndex]
                          }
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="button-container">
            <button className="btn salvar" onClick={handleSubmit}>
              Salvar Alterações
            </button>
          </div>
          <button className="add-row-button" onClick={addNewRow}>
            +
          </button>
        </>
      )}
    </div>
  );
};

export default CadastroClinicas;